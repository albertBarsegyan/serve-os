import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { platformQueryKeys } from '#/features/platform/lib/constants/platform-query-keys'
import {
  type CallWaiterPayload,
  CLIENT_EVENTS,
  type OrderEventPayload,
  type OrderPaidPayload,
  type PaymentOpenPayload,
  SERVER_EVENTS,
} from '#/shared/realtime/events'
import { connectSocket, getSocket } from '#/shared/realtime/socket'
import { playNotificationSound } from '../lib/play-sound'

export type OrderNotificationHandlers = Partial<{
  'order:created': (p: OrderEventPayload) => void
  'order:confirmed': (p: OrderEventPayload) => void
  'order:preparing': (p: OrderEventPayload) => void
  'order:ready': (p: OrderEventPayload) => void
  'order:served': (p: OrderEventPayload) => void
  'order:cancelled': (p: OrderEventPayload) => void
  'order:call-waiter': (p: CallWaiterPayload) => void
  'order:payment-open': (p: PaymentOpenPayload) => void
  'order:paid': (p: OrderPaidPayload) => void
}>

export interface UseOrderNotificationsOptions {
  room: 'kitchen' | 'business' | 'session'
  id: string
  handlers?: OrderNotificationHandlers
}

const TOAST_MESSAGES: Record<string, string> = {
  [SERVER_EVENTS.ORDER_CREATED]: 'New order received',
  [SERVER_EVENTS.ORDER_CONFIRMED]: 'Order confirmed',
  [SERVER_EVENTS.ORDER_PREPARING]: 'Kitchen is preparing the order',
  [SERVER_EVENTS.ORDER_READY]: 'Order is ready!',
  [SERVER_EVENTS.ORDER_SERVED]: 'Order served',
  [SERVER_EVENTS.ORDER_CANCELLED]: 'Order was cancelled',
  [SERVER_EVENTS.ORDER_CALL_WAITER]: 'Table needs a waiter',
  [SERVER_EVENTS.ORDER_PAYMENT_OPEN]: 'Payment due',
  [SERVER_EVENTS.ORDER_PAID]: 'Payment confirmed',
}

export function useOrderNotifications({ room, id, handlers }: UseOrderNotificationsOptions): void {
  const queryClient = useQueryClient()

  // Keep handlers in a ref so the effect never needs to re-run when they change
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (typeof window === 'undefined' || !id) return

    const socket = getSocket()

    function join() {
      if (room === 'kitchen') {
        socket.emit(CLIENT_EVENTS.JOIN_KITCHEN, id)
      } else if (room === 'business') {
        socket.emit(CLIENT_EVENTS.JOIN_BUSINESS, id)
      } else {
        socket.emit(CLIENT_EVENTS.JOIN_SESSION, id)
      }
    }

    function invalidateOrders(orderId?: string) {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.orders() })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.kitchenOrders() })
      if (orderId) {
        void queryClient.invalidateQueries({ queryKey: platformQueryKeys.orderById(orderId) })
      }
    }

    function handleLifecycleEvent(eventName: string, payload: OrderEventPayload) {
      if (payload.playSound) playNotificationSound()
      toast.info(TOAST_MESSAGES[eventName] ?? eventName, { position: 'top-right' })
      invalidateOrders(payload.orderId)
    }

    const onCreated = (p: OrderEventPayload) => {
      handleLifecycleEvent(SERVER_EVENTS.ORDER_CREATED, p)
      handlersRef.current?.['order:created']?.(p)
    }
    const onConfirmed = (p: OrderEventPayload) => {
      handleLifecycleEvent(SERVER_EVENTS.ORDER_CONFIRMED, p)
      handlersRef.current?.['order:confirmed']?.(p)
    }
    const onPreparing = (p: OrderEventPayload) => {
      handleLifecycleEvent(SERVER_EVENTS.ORDER_PREPARING, p)
      handlersRef.current?.['order:preparing']?.(p)
    }
    const onReady = (p: OrderEventPayload) => {
      handleLifecycleEvent(SERVER_EVENTS.ORDER_READY, p)
      handlersRef.current?.['order:ready']?.(p)
    }
    const onServed = (p: OrderEventPayload) => {
      handleLifecycleEvent(SERVER_EVENTS.ORDER_SERVED, p)
      handlersRef.current?.['order:served']?.(p)
    }
    const onCancelled = (p: OrderEventPayload) => {
      handleLifecycleEvent(SERVER_EVENTS.ORDER_CANCELLED, p)
      handlersRef.current?.['order:cancelled']?.(p)
    }
    const onCallWaiter = (p: CallWaiterPayload) => {
      playNotificationSound()
      const hint = p.tableId ? ` (table ${p.tableId})` : ''
      toast.warning(`${TOAST_MESSAGES[SERVER_EVENTS.ORDER_CALL_WAITER]}${hint}`, {
        position: 'top-right',
      })
      handlersRef.current?.['order:call-waiter']?.(p)
    }
    const onPaymentOpen = (p: PaymentOpenPayload) => {
      playNotificationSound()
      toast.info(TOAST_MESSAGES[SERVER_EVENTS.ORDER_PAYMENT_OPEN], { position: 'top-right' })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.orders() })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.payments() })
      if (p.orderId) {
        void queryClient.invalidateQueries({ queryKey: platformQueryKeys.orderById(p.orderId) })
      }
      handlersRef.current?.['order:payment-open']?.(p)
    }
    const onPaid = (p: OrderPaidPayload) => {
      toast.success(TOAST_MESSAGES[SERVER_EVENTS.ORDER_PAID], { position: 'top-right' })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.orders() })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.payments() })
      if (p.orderId) {
        void queryClient.invalidateQueries({ queryKey: platformQueryKeys.orderById(p.orderId) })
      }
      handlersRef.current?.['order:paid']?.(p)
    }

    socket.on('connect', join)
    socket.on(SERVER_EVENTS.ORDER_CREATED, onCreated)
    socket.on(SERVER_EVENTS.ORDER_CONFIRMED, onConfirmed)
    socket.on(SERVER_EVENTS.ORDER_PREPARING, onPreparing)
    socket.on(SERVER_EVENTS.ORDER_READY, onReady)
    socket.on(SERVER_EVENTS.ORDER_SERVED, onServed)
    socket.on(SERVER_EVENTS.ORDER_CANCELLED, onCancelled)
    socket.on(SERVER_EVENTS.ORDER_CALL_WAITER, onCallWaiter)
    socket.on(SERVER_EVENTS.ORDER_PAYMENT_OPEN, onPaymentOpen)
    socket.on(SERVER_EVENTS.ORDER_PAID, onPaid)

    if (socket.connected) {
      join()
    } else {
      connectSocket()
    }

    return () => {
      socket.off('connect', join)
      socket.off(SERVER_EVENTS.ORDER_CREATED, onCreated)
      socket.off(SERVER_EVENTS.ORDER_CONFIRMED, onConfirmed)
      socket.off(SERVER_EVENTS.ORDER_PREPARING, onPreparing)
      socket.off(SERVER_EVENTS.ORDER_READY, onReady)
      socket.off(SERVER_EVENTS.ORDER_SERVED, onServed)
      socket.off(SERVER_EVENTS.ORDER_CANCELLED, onCancelled)
      socket.off(SERVER_EVENTS.ORDER_CALL_WAITER, onCallWaiter)
      socket.off(SERVER_EVENTS.ORDER_PAYMENT_OPEN, onPaymentOpen)
      socket.off(SERVER_EVENTS.ORDER_PAID, onPaid)
    }
  }, [room, id, queryClient])
}
