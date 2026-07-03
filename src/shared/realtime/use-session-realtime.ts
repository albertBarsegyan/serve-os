import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  CLIENT_EVENTS,
  type OrderStatusChangedPayload,
  type PaymentRecordedPayload,
  SERVER_EVENTS,
  type SessionClosedPayload,
} from './events'
import { connectSocket, getSocket } from './socket'

/**
 * Joins the `session:<token>` Socket.IO room and keeps the TanStack Query cache
 * in sync for the customer-facing order/session/split queries.
 *
 * Must only be mounted in a client component (useEffect guards SSR).
 */
export function useSessionRealtime(token: string): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (globalThis.window === undefined || !token) return

    const socket = getSocket()

    function join() {
      socket.emit(CLIENT_EVENTS.JOIN_SESSION, token)
    }

    function leave() {
      socket.emit(CLIENT_EVENTS.LEAVE_SESSION, token)
    }

    function onStatusChanged(payload: OrderStatusChangedPayload) {
      void queryClient.invalidateQueries({ queryKey: ['order', payload.orderId] })
      void queryClient.invalidateQueries({ queryKey: ['session', token] })
    }

    function onPaymentRecorded(payload: PaymentRecordedPayload) {
      void queryClient.invalidateQueries({ queryKey: ['order', payload.orderId] })
    }

    function onSessionClosed(_payload: SessionClosedPayload) {
      void queryClient.invalidateQueries({ queryKey: ['session', token] })
      // Table session has ended (e.g. the order was fully paid) — drop the stored
      // credential so a stale/closed token never gets reused for a future visit.
      if (localStorage.getItem('customer_session_token') === token) {
        localStorage.removeItem('customer_session_token')
      }
    }

    socket.on('connect', join)
    socket.on(SERVER_EVENTS.ORDER_STATUS_CHANGED, onStatusChanged)
    socket.on(SERVER_EVENTS.PAYMENT_RECORDED, onPaymentRecorded)
    socket.on(SERVER_EVENTS.SESSION_CLOSED, onSessionClosed)

    if (socket.connected) {
      join()
    } else {
      connectSocket()
    }

    return () => {
      leave()
      socket.off('connect', join)
      socket.off(SERVER_EVENTS.ORDER_STATUS_CHANGED, onStatusChanged)
      socket.off(SERVER_EVENTS.PAYMENT_RECORDED, onPaymentRecorded)
      socket.off(SERVER_EVENTS.SESSION_CLOSED, onSessionClosed)
    }
  }, [token, queryClient])
}
