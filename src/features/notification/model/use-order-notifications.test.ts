import { QueryClient } from '@tanstack/react-query'
import type { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { platformQueryKeys } from '#/features/platform/lib/constants/platform-query-keys'
import { subscribeOrderNotifications } from './use-order-notifications'

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}))

// Minimal fake socket.io-client Socket: just enough of the on/off/emit/connected surface
// that subscribeOrderNotifications touches.
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
    // Real socket.io connects asynchronously and fires 'connect' later; not needed for these tests.
  }

  // Test helper: simulate the server pushing an event down to this client.
  serverEmit(event: string, payload?: unknown) {
    for (const handler of [...(this.listeners.get(event) ?? [])]) handler(payload)
  }

  // Test helper: simulate the server acking the most recent emit of `event` (e.g.
  // join-kitchen) — mirrors how the gateway's join handlers return {event, data}.
  ackLastEmit(event: string, ack: unknown) {
    const entry = [...this.emitted].reverse().find((e) => e.event === event)
    const callback = entry?.args[entry.args.length - 1]
    if (typeof callback === 'function') callback(ack)
  }
}

describe('subscribeOrderNotifications', () => {
  let queryClient: QueryClient
  let socket: FakeSocket
  let unsubscribe: () => void

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    socket = new FakeSocket()
    vi.clearAllMocks()
  })

  afterEach(() => {
    unsubscribe?.()
    queryClient.clear()
  })

  it('invalidates the orders list, detail, and kitchen-orders queries on a lifecycle event', () => {
    const listKey = platformQueryKeys.orders('business-1')
    const detailKey = platformQueryKeys.orderById('business-1', 'order-1')
    const kitchenKey = platformQueryKeys.kitchenOrders('business-1')

    queryClient.setQueryData(listKey, [{ id: 'order-1', status: 'CONFIRMED' }])
    queryClient.setQueryData(detailKey, { id: 'order-1', status: 'CONFIRMED' })
    queryClient.setQueryData(kitchenKey, [{ id: 'order-1', status: 'CONFIRMED' }])

    unsubscribe = subscribeOrderNotifications(
      socket as unknown as Socket,
      queryClient,
      'business',
      'business-1',
      () => undefined,
    )

    // Reconnect-resync already invalidated everything on join; clear that so the
    // assertion below is specifically about the lifecycle event, not the join resync.
    for (const q of queryClient.getQueryCache().getAll()) q.setState({ isInvalidated: false })

    socket.serverEmit('order:preparing', {
      orderId: 'order-1',
      businessId: 'business-1',
      tableId: null,
      sessionToken: null,
      status: 'IN_KITCHEN',
      customerStatus: 'preparing',
      playSound: false,
      at: new Date().toISOString(),
    })

    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(kitchenKey)?.isInvalidated).toBe(true)
  })

  it('resyncs (invalidates) on join/reconnect for kitchen/business rooms, not just on new events', () => {
    const listKey = platformQueryKeys.orders('business-1')
    queryClient.setQueryData(listKey, [{ id: 'order-1', status: 'CONFIRMED' }])
    socket.connected = true

    unsubscribe = subscribeOrderNotifications(
      socket as unknown as Socket,
      queryClient,
      'kitchen',
      'business-1',
      () => undefined,
    )

    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true)
  })

  it('routes the resync payload to the order:status-changed handler for the session room', () => {
    const received: unknown[] = []

    unsubscribe = subscribeOrderNotifications(
      socket as unknown as Socket,
      queryClient,
      'session',
      'session-token-1',
      () => ({ 'order:status-changed': (p) => received.push(p) }),
    )

    socket.serverEmit('order:status-changed', {
      orderId: 'order-1',
      status: 'READY',
      customerStatus: 'ready',
      previousStatus: null,
      tableId: 'table-1',
      tableName: '4',
      sessionToken: 'session-token-1',
      updatedAt: new Date().toISOString(),
      actor: { type: 'system', id: 'system' },
    })

    expect(received).toHaveLength(1)
    expect(received[0]).toMatchObject({ orderId: 'order-1', customerStatus: 'ready' })
  })

  it('invalidates orders and payments queries on order:payment-failed', () => {
    const ordersKey = platformQueryKeys.orders('business-1')
    const paymentsKey = platformQueryKeys.payments('business-1')
    const received: unknown[] = []

    queryClient.setQueryData(ordersKey, [])
    queryClient.setQueryData(paymentsKey, [])

    unsubscribe = subscribeOrderNotifications(
      socket as unknown as Socket,
      queryClient,
      'business',
      'business-1',
      () => ({ 'order:payment-failed': (p) => received.push(p) }),
    )
    for (const q of queryClient.getQueryCache().getAll()) q.setState({ isInvalidated: false })

    socket.serverEmit('order:payment-failed', {
      orderId: 'order-1',
      businessId: 'business-1',
      tableId: null,
      sessionToken: null,
      status: 'PAYMENT_FAILED',
      customerStatus: 'payment_failed',
      playSound: false,
      at: new Date().toISOString(),
      reason: 'card declined',
    })

    expect(queryClient.getQueryState(ordersKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(paymentsKey)?.isInvalidated).toBe(true)
    expect(received).toHaveLength(1)
    expect(received[0]).toMatchObject({ orderId: 'order-1', reason: 'card declined' })
  })

  it('invalidates orders and payments queries on order:refunded', () => {
    const ordersKey = platformQueryKeys.orders('business-1')
    const paymentsKey = platformQueryKeys.payments('business-1')
    const received: unknown[] = []

    queryClient.setQueryData(ordersKey, [])
    queryClient.setQueryData(paymentsKey, [])

    unsubscribe = subscribeOrderNotifications(
      socket as unknown as Socket,
      queryClient,
      'business',
      'business-1',
      () => ({ 'order:refunded': (p) => received.push(p) }),
    )
    for (const q of queryClient.getQueryCache().getAll()) q.setState({ isInvalidated: false })

    socket.serverEmit('order:refunded', {
      orderId: 'order-1',
      businessId: 'business-1',
      tableId: null,
      sessionToken: null,
      status: 'REFUNDED',
      customerStatus: 'refunded',
      playSound: false,
      at: new Date().toISOString(),
      refundId: 'refund-123',
    })

    expect(queryClient.getQueryState(ordersKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(paymentsKey)?.isInvalidated).toBe(true)
    expect(received).toHaveLength(1)
    expect(received[0]).toMatchObject({ orderId: 'order-1', refundId: 'refund-123' })
  })

  it('invalidates activeSessions on session:opened and session-closed', () => {
    const activeSessionsKey = platformQueryKeys.activeSessions('business-1')
    queryClient.setQueryData(activeSessionsKey, [])

    unsubscribe = subscribeOrderNotifications(
      socket as unknown as Socket,
      queryClient,
      'business',
      'business-1',
      () => undefined,
    )
    for (const q of queryClient.getQueryCache().getAll()) q.setState({ isInvalidated: false })

    socket.serverEmit('session:opened', {
      sessionId: 'session-1',
      businessId: 'business-1',
      tableId: 'table-1',
      source: 'guest',
      at: new Date().toISOString(),
    })
    expect(queryClient.getQueryState(activeSessionsKey)?.isInvalidated).toBe(true)

    queryClient.getQueryCache().getAll()[0]?.setState({ isInvalidated: false })
    socket.serverEmit('session-closed', { sessionId: 'session-1' })
    expect(queryClient.getQueryState(activeSessionsKey)?.isInvalidated).toBe(true)
  })

  it('invalidates activeSessions and forwards the payload on order:waiter-acknowledged', () => {
    const activeSessionsKey = platformQueryKeys.activeSessions('business-1')
    queryClient.setQueryData(activeSessionsKey, [])
    const received: unknown[] = []

    unsubscribe = subscribeOrderNotifications(
      socket as unknown as Socket,
      queryClient,
      'business',
      'business-1',
      () => ({ 'order:waiter-acknowledged': (p) => received.push(p) }),
    )
    for (const q of queryClient.getQueryCache().getAll()) q.setState({ isInvalidated: false })

    socket.serverEmit('order:waiter-acknowledged', {
      sessionId: 'session-1',
      businessId: 'business-1',
      tableId: 'table-1',
      at: new Date().toISOString(),
    })

    expect(queryClient.getQueryState(activeSessionsKey)?.isInvalidated).toBe(true)
    expect(received).toHaveLength(1)
    expect(received[0]).toMatchObject({ sessionId: 'session-1' })
  })

  it('toasts once (not on every retry) when a business/kitchen join is rejected', () => {
    socket.connected = true

    unsubscribe = subscribeOrderNotifications(
      socket as unknown as Socket,
      queryClient,
      'business',
      'business-1',
      () => undefined,
    )

    socket.ackLastEmit('join-business', { event: 'error', data: 'Unauthorized' })
    socket.ackLastEmit('join-business', { event: 'error', data: 'Unauthorized' })

    expect(toast.error).toHaveBeenCalledTimes(1)
  })

  it('does not toast on a rejected session-room join, and routes to a custom onJoinError', () => {
    socket.connected = true
    const received: string[] = []

    unsubscribe = subscribeOrderNotifications(
      socket as unknown as Socket,
      queryClient,
      'session',
      'token-1',
      () => undefined,
      undefined,
      undefined,
      () => (message) => received.push(message),
    )

    socket.ackLastEmit('join-session', { event: 'error', data: 'Unauthorized' })

    expect(toast.error).not.toHaveBeenCalled()
    expect(received).toEqual(['Unauthorized'])
  })

  it('unsubscribes all listeners on cleanup', () => {
    unsubscribe = subscribeOrderNotifications(
      socket as unknown as Socket,
      queryClient,
      'business',
      'business-1',
      () => undefined,
    )

    unsubscribe()

    const listKey = platformQueryKeys.orders('business-1')
    queryClient.setQueryData(listKey, [{ id: 'order-1', status: 'CONFIRMED' }])
    for (const q of queryClient.getQueryCache().getAll()) q.setState({ isInvalidated: false })

    socket.serverEmit('order:preparing', { orderId: 'order-1', playSound: false })

    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(false)
  })
})
