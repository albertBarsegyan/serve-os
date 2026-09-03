import type { QueryClient } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { Socket } from 'socket.io-client'
import { getLocalStorageItem, removeLocalStorageItem } from '#/shared/libs/utils/storage.utils'
import { type OrderStatusChangedPayload, SERVER_EVENTS, type SessionClosedPayload } from './events'
import { getSocket, joinRoom } from './socket'

/**
 * Joins the `session:<token>` Socket.IO room and keeps the TanStack Query cache
 * in sync for the customer-facing order/session/split queries.
 *
 * Pulled out of the hook body (pure function, no React) so it can be unit-tested directly
 * against a fake socket + real QueryClient without rendering a component.
 */
export function subscribeSessionRealtime(
  socket: Socket,
  queryClient: QueryClient,
  token: string,
): () => void {
  // Drops a token this browser now knows is dead (closed session, or the join itself
  // was rejected) so it never gets reused for a future visit, and resyncs the
  // session query so the UI reflects that rather than looking falsely up to date.
  function invalidateAndForgetToken() {
    void queryClient.invalidateQueries({ queryKey: ['session', token] })
    if (getLocalStorageItem('customer_session_token') === token) {
      removeLocalStorageItem('customer_session_token')
    }
  }

  // join-session is rejected when the token is stale/invalid/expired — without this,
  // that rejection reached no one and the guest's browser just sat there believing
  // it was subscribed while silently receiving nothing, forever.
  function onJoinError() {
    invalidateAndForgetToken()
    releaseRoom()
  }

  // Reference-counted: other hooks (e.g. useOrderNotifications({ room: 'session' }))
  // may join the same session room on this same socket, so releasing here only
  // actually leaves once every such subscriber has released.
  const releaseRoom = joinRoom(socket, 'session', token, onJoinError)

  function onStatusChanged(payload: OrderStatusChangedPayload) {
    void queryClient.invalidateQueries({ queryKey: ['order', payload.orderId] })
    void queryClient.invalidateQueries({ queryKey: ['session', token] })
  }

  function onSessionClosed(_payload: SessionClosedPayload) {
    invalidateAndForgetToken()
    // No reason to stay a member of a room the backend has already torn down — but
    // only actually leaves once every other subscriber sharing this socket also has.
    releaseRoom()
  }

  socket.on(SERVER_EVENTS.ORDER_STATUS_CHANGED, onStatusChanged)
  socket.on(SERVER_EVENTS.SESSION_CLOSED, onSessionClosed)

  if (!socket.connected) socket.connect()

  return () => {
    releaseRoom()
    socket.off(SERVER_EVENTS.ORDER_STATUS_CHANGED, onStatusChanged)
    socket.off(SERVER_EVENTS.SESSION_CLOSED, onSessionClosed)
  }
}

/**
 * Must only be mounted in a client component (useEffect guards SSR).
 */
export function useSessionRealtime(token: string): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (globalThis.window === undefined || !token) return

    const socket = getSocket()
    return subscribeSessionRealtime(socket, queryClient, token)
  }, [token, queryClient])
}
