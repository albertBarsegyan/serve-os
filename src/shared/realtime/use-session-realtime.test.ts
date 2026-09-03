// @vitest-environment jsdom
import { QueryClient } from '@tanstack/react-query'
import type { Socket } from 'socket.io-client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { subscribeOrderNotifications } from '#/features/notification/model/use-order-notifications'
import { subscribeSessionRealtime } from './use-session-realtime'

// Minimal fake socket.io-client Socket: just enough of the on/off/emit/connected surface
// that subscribeSessionRealtime touches.
class FakeSocket {
  connected = false
  emitted: Array<{ event: string; args: unknown[] }> = []
  private listeners = new Map<string, Set<(...args: unknown[]) => void>>()

  on(event: string, handler: (...args: unknown[]) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)?.add(handler)
  }

  off(event: string, handler: (...args: unknown[]) => void) {
    this.listeners.get(event)?.delete(handler)
  }

  emit(event: string, ...args: unknown[]) {
    this.emitted.push({ event, args })
  }

  connect() {
    // Real socket.io connects asynchronously and fires 'connect' later; not needed here.
  }

  // Test helper: simulate the server pushing an event down to this client.
  serverEmit(event: string, payload?: unknown) {
    for (const handler of [...(this.listeners.get(event) ?? [])]) handler(payload)
  }

  // Test helper: simulate the server acking the most recent emit of `event` (e.g.
  // join-session) — mirrors how the gateway's join handlers return {event, data}.
  ackLastEmit(event: string, ack: unknown) {
    const entry = [...this.emitted].reverse().find((e) => e.event === event)
    const callback = entry?.args[entry.args.length - 1]
    if (typeof callback === 'function') callback(ack)
  }
}

describe('subscribeSessionRealtime', () => {
  let queryClient: QueryClient
  let socket: FakeSocket
  let unsubscribe: () => void

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    socket = new FakeSocket()
    localStorage.clear()
  })

  afterEach(() => {
    unsubscribe?.()
    queryClient.clear()
  })

  it('joins the session room on connect and leaves it on cleanup', () => {
    socket.connected = true

    unsubscribe = subscribeSessionRealtime(socket as unknown as Socket, queryClient, 'token-1')

    expect(socket.emitted.some((e) => e.event === 'join-session' && e.args[0] === 'token-1')).toBe(
      true,
    )

    unsubscribe()

    expect(socket.emitted).toContainEqual({ event: 'leave-session', args: ['token-1'] })
  })

  it('invalidates order and session queries when another device changes order status', () => {
    const orderKey = ['order', 'order-1']
    const sessionKey = ['session', 'token-1']
    queryClient.setQueryData(orderKey, { status: 'CONFIRMED' })
    queryClient.setQueryData(sessionKey, { session: { sessionToken: 'token-1' } })

    unsubscribe = subscribeSessionRealtime(socket as unknown as Socket, queryClient, 'token-1')

    socket.serverEmit('order:status-changed', {
      orderId: 'order-1',
      status: 'READY',
      customerStatus: 'ready',
      previousStatus: 'IN_KITCHEN',
      tableId: 'table-1',
      tableName: '4',
      sessionToken: 'token-1',
      updatedAt: new Date().toISOString(),
      actor: { type: 'system', id: 'system' },
    })

    expect(queryClient.getQueryState(orderKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(sessionKey)?.isInvalidated).toBe(true)
  })

  it('invalidates the session query, clears the stored token, and leaves the room on session-closed', () => {
    const sessionKey = ['session', 'token-1']
    queryClient.setQueryData(sessionKey, { session: { sessionToken: 'token-1' } })
    localStorage.setItem('customer_session_token', 'token-1')

    unsubscribe = subscribeSessionRealtime(socket as unknown as Socket, queryClient, 'token-1')

    socket.serverEmit('session-closed', { sessionId: 'session-1' })

    expect(queryClient.getQueryState(sessionKey)?.isInvalidated).toBe(true)
    expect(localStorage.getItem('customer_session_token')).toBeNull()
    expect(socket.emitted).toContainEqual({ event: 'leave-session', args: ['token-1'] })
  })

  it('clears the stored token and resyncs when join-session is rejected (stale/invalid token)', () => {
    const sessionKey = ['session', 'token-1']
    queryClient.setQueryData(sessionKey, { session: { sessionToken: 'token-1' } })
    localStorage.setItem('customer_session_token', 'token-1')
    socket.connected = true

    unsubscribe = subscribeSessionRealtime(socket as unknown as Socket, queryClient, 'token-1')
    socket.ackLastEmit('join-session', { event: 'error', data: 'Unauthorized' })

    expect(queryClient.getQueryState(sessionKey)?.isInvalidated).toBe(true)
    expect(localStorage.getItem('customer_session_token')).toBeNull()
  })

  it('does not clear a different device/session token stored locally', () => {
    localStorage.setItem('customer_session_token', 'some-other-token')

    unsubscribe = subscribeSessionRealtime(socket as unknown as Socket, queryClient, 'token-1')
    socket.serverEmit('session-closed', { sessionId: 'session-1' })

    expect(localStorage.getItem('customer_session_token')).toBe('some-other-token')
  })

  it('does not evict a sibling subscriber sharing the same socket+room when one unmounts', () => {
    // Mirrors the real customer menu page: useSessionRealtime (page shell) and
    // useOrderNotifications({ room: 'session' }) (a nested order-detail view) both
    // join `session:<token>` on the same underlying socket.
    socket.connected = true

    const unsubscribeShell = subscribeSessionRealtime(
      socket as unknown as Socket,
      queryClient,
      'token-1',
    )
    const unsubscribeDetail = subscribeOrderNotifications(
      socket as unknown as Socket,
      queryClient,
      'session',
      'token-1',
      () => undefined,
    )
    unsubscribe = () => {
      unsubscribeDetail()
      unsubscribeShell()
    }

    socket.emitted = []
    // The nested view unmounts (e.g. guest taps "back to menu") while the page shell
    // is still mounted — it must not kick the shell's socket out of the room.
    unsubscribeDetail()

    expect(socket.emitted).not.toContainEqual({ event: 'leave-session', args: ['token-1'] })

    // The still-mounted shell keeps receiving session-room broadcasts.
    const orderKey = ['order', 'order-1']
    queryClient.setQueryData(orderKey, { status: 'CONFIRMED' })
    socket.serverEmit('order:status-changed', {
      orderId: 'order-1',
      status: 'READY',
      customerStatus: 'ready',
      previousStatus: 'IN_KITCHEN',
      tableId: 'table-1',
      tableName: '4',
      sessionToken: 'token-1',
      updatedAt: new Date().toISOString(),
      actor: { type: 'system', id: 'system' },
    })
    expect(queryClient.getQueryState(orderKey)?.isInvalidated).toBe(true)

    // Only once the shell itself unmounts does the room actually get left.
    unsubscribeShell()
    expect(socket.emitted).toContainEqual({ event: 'leave-session', args: ['token-1'] })
  })

  it('unsubscribes all listeners on cleanup', () => {
    const sessionKey = ['session', 'token-1']

    unsubscribe = subscribeSessionRealtime(socket as unknown as Socket, queryClient, 'token-1')
    unsubscribe()

    queryClient.setQueryData(sessionKey, { session: null })
    for (const q of queryClient.getQueryCache().getAll()) q.setState({ isInvalidated: false })

    socket.serverEmit('session-closed', { sessionId: 'session-1' })

    expect(queryClient.getQueryState(sessionKey)?.isInvalidated).toBe(false)
  })
})
