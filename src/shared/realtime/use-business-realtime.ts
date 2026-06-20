import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { platformQueryKeys } from '#/features/platform/lib/constants/platform-query-keys'
import {
  CLIENT_EVENTS,
  type OrderPendingConfirmationPayload,
  type OrderStatusChangedPayload,
  SERVER_EVENTS,
} from './events'
import { connectSocket, getSocket } from './socket'

/**
 * Joins `business:<businessId>` and `kitchen:<businessId>` Socket.IO rooms and
 * keeps the TanStack Query cache in sync for all admin order/kitchen views.
 *
 * Must only be mounted in a client component (useEffect guards SSR).
 */
export function useBusinessRealtime(businessId: string): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (typeof window === 'undefined' || !businessId) return

    const socket = getSocket()

    function join() {
      socket.emit(CLIENT_EVENTS.JOIN_BUSINESS, businessId)
      socket.emit(CLIENT_EVENTS.JOIN_KITCHEN, businessId)
    }

    function onStatusChanged(payload: OrderStatusChangedPayload) {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.kitchenOrders() })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.orders() })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.orderById(payload.orderId),
      })
    }

    function onPendingConfirmation(_payload: OrderPendingConfirmationPayload) {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.orders() })
    }

    socket.on('connect', join)
    socket.on(SERVER_EVENTS.ORDER_STATUS_CHANGED, onStatusChanged)
    socket.on(SERVER_EVENTS.ORDER_PENDING_CONFIRMATION, onPendingConfirmation)

    if (socket.connected) {
      join()
    } else {
      connectSocket()
    }

    return () => {
      socket.off('connect', join)
      socket.off(SERVER_EVENTS.ORDER_STATUS_CHANGED, onStatusChanged)
      socket.off(SERVER_EVENTS.ORDER_PENDING_CONFIRMATION, onPendingConfirmation)
    }
  }, [businessId, queryClient])
}
