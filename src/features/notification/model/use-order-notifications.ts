import type { QueryClient } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import type { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { platformQueryKeys } from '#/features/platform/lib/constants/platform-query-keys'
import { m } from '#/paraglide/messages'
import {
  type CallWaiterPayload,
  CLIENT_EVENTS,
  type OrderEventPayload,
  type OrderPaidPayload,
  type OrderPendingConfirmationPayload,
  type OrderRefundedPayload,
  type OrderStatusChangedPayload,
  type OrderTipUpdatedPayload,
  type PaymentFailedPayload,
  type PaymentOpenPayload,
  SERVER_EVENTS,
  type SessionClosedPayload,
  type SessionLifecyclePayload,
  type SessionOpenedPayload,
  type WaiterAcknowledgedPayload,
} from '#/shared/realtime/events'
import { getSocket } from '#/shared/realtime/socket'
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
  'order:payment-failed': (p: PaymentFailedPayload) => void
  'order:refunded': (p: OrderRefundedPayload) => void
  'order:waiter-acknowledged': (p: WaiterAcknowledgedPayload) => void
  'order:tip-updated': (p: OrderTipUpdatedPayload) => void
  'session:opened': (p: SessionOpenedPayload) => void
  'session:joined': (p: SessionLifecyclePayload) => void
  'session:split': (p: SessionLifecyclePayload) => void
  'session-closed': (p: SessionClosedPayload) => void
  /** Resync-only: fired once right after join (incl. reconnect) with the session's active order. */
  'order:status-changed': (p: OrderStatusChangedPayload) => void
  /** ON_PREMISE guest order sitting in CREATED, awaiting staff confirmation before it can be cooked. */
  'order-pending-confirmation': (p: OrderPendingConfirmationPayload) => void
}>

export interface UseOrderNotificationsOptions {
  room: 'kitchen' | 'business' | 'session'
  id: string
  handlers?: OrderNotificationHandlers
  /**
   * Predicate for "did this client itself just mutate this order via REST?" — the
   * backend broadcasts lifecycle events to the whole room including the actor's own
   * socket, so without this the actor sees their own action's toast/sound a second
   * time when the broadcast echoes back. Cache invalidation and custom `handlers`
   * still run regardless; only the default toast/sound is suppressed.
   */
  isSelfMutated?: (orderId: string) => boolean
  /**
   * Predicate for "is this event relevant enough to alert on?" — every guest at a
   * table shares one session/room, so without this every guest's phone plays a sound
   * for every other guest's order too. Only gates the default toast/sound; cache
   * invalidation and custom `handlers` still run regardless. Defaults to always-true
   * (kitchen/business rooms have no such concept — staff should hear about every
   * order in their room).
   */
  shouldNotify?: (orderId: string) => boolean
}

// Client-only module (guarded by `typeof window` below) — safe to resolve messages eagerly here.
const TOAST_MESSAGES: Record<string, string> = {
  [SERVER_EVENTS.ORDER_CREATED]: m.notification_order_created(),
  [SERVER_EVENTS.ORDER_CONFIRMED]: m.notification_order_confirmed(),
  [SERVER_EVENTS.ORDER_PREPARING]: m.notification_order_preparing(),
  [SERVER_EVENTS.ORDER_READY]: m.notification_order_ready(),
  [SERVER_EVENTS.ORDER_SERVED]: m.notification_order_served(),
  [SERVER_EVENTS.ORDER_CANCELLED]: m.notification_order_cancelled(),
  [SERVER_EVENTS.ORDER_CALL_WAITER]: m.notification_order_call_waiter(),
  [SERVER_EVENTS.ORDER_PAYMENT_OPEN]: m.notification_order_payment_open(),
  [SERVER_EVENTS.ORDER_PAID]: m.notification_order_paid(),
  [SERVER_EVENTS.ORDER_PAYMENT_FAILED]: m.notification_order_payment_failed(),
  [SERVER_EVENTS.ORDER_REFUNDED]: m.notification_order_refunded(),
  [SERVER_EVENTS.ORDER_PENDING_CONFIRMATION]: m.notification_order_pending_confirmation(),
}

/**
 * Wires a socket's order-lifecycle events to the shared TanStack Query cache and toasts.
 * Pulled out of the hook body (pure function, no React) so it can be unit-tested directly
 * against a fake socket + real QueryClient without rendering a component.
 */
export function subscribeOrderNotifications(
  socket: Socket,
  queryClient: QueryClient,
  room: UseOrderNotificationsOptions['room'],
  id: string,
  getHandlers: () => OrderNotificationHandlers | undefined,
  getIsSelfMutated?: () => ((orderId: string) => boolean) | undefined,
  getShouldNotify?: () => ((orderId: string) => boolean) | undefined,
): () => void {
  function isSelfMutated(orderId: string): boolean {
    return getIsSelfMutated?.()?.(orderId) ?? false
  }

  function shouldNotify(orderId: string): boolean {
    return getShouldNotify?.()?.(orderId) ?? true
  }

  function invalidateOrders() {
    void queryClient.invalidateQueries({ queryKey: platformQueryKeys.ordersRoot() })
    void queryClient.invalidateQueries({ queryKey: platformQueryKeys.kitchenOrders() })
  }

  function join() {
    if (room === 'kitchen') {
      socket.emit(CLIENT_EVENTS.JOIN_KITCHEN, id)
    } else if (room === 'business') {
      socket.emit(CLIENT_EVENTS.JOIN_BUSINESS, id)
    } else {
      socket.emit(CLIENT_EVENTS.JOIN_SESSION, id)
    }
    // A (re)connect may have missed broadcasts entirely while disconnected — resync
    // the order lists rather than trusting no transitions happened in the gap.
    // The session room gets its own resync via the order:status-changed handler below.
    if (room !== 'session') invalidateOrders()
  }

  // Runs on unmount and whenever `room`/`id` changes (e.g. an owner switching their active
  // business) — without this the socket stays a member of the old room forever, since it's a
  // page-lifetime singleton, and keeps receiving another tenant's live order/payment feed.
  function leave() {
    if (room === 'kitchen') {
      socket.emit(CLIENT_EVENTS.LEAVE_KITCHEN, id)
    } else if (room === 'business') {
      socket.emit(CLIENT_EVENTS.LEAVE_BUSINESS, id)
    } else {
      socket.emit(CLIENT_EVENTS.LEAVE_SESSION, id)
    }
  }

  function handleLifecycleEvent(eventName: string, payload: OrderEventPayload) {
    if (!isSelfMutated(payload.orderId) && shouldNotify(payload.orderId)) {
      if (payload.playSound) playNotificationSound()
      toast.info(TOAST_MESSAGES[eventName] ?? eventName, { position: 'top-right' })
    }
    invalidateOrders()
  }

  const onCreated = (p: OrderEventPayload) => {
    handleLifecycleEvent(SERVER_EVENTS.ORDER_CREATED, p)
    getHandlers()?.['order:created']?.(p)
  }
  const onConfirmed = (p: OrderEventPayload) => {
    handleLifecycleEvent(SERVER_EVENTS.ORDER_CONFIRMED, p)
    getHandlers()?.['order:confirmed']?.(p)
  }
  const onPreparing = (p: OrderEventPayload) => {
    handleLifecycleEvent(SERVER_EVENTS.ORDER_PREPARING, p)
    getHandlers()?.['order:preparing']?.(p)
  }
  const onReady = (p: OrderEventPayload) => {
    handleLifecycleEvent(SERVER_EVENTS.ORDER_READY, p)
    getHandlers()?.['order:ready']?.(p)
  }
  const onServed = (p: OrderEventPayload) => {
    handleLifecycleEvent(SERVER_EVENTS.ORDER_SERVED, p)
    getHandlers()?.['order:served']?.(p)
  }
  const onCancelled = (p: OrderEventPayload) => {
    handleLifecycleEvent(SERVER_EVENTS.ORDER_CANCELLED, p)
    getHandlers()?.['order:cancelled']?.(p)
  }
  const onCallWaiter = (p: CallWaiterPayload) => {
    playNotificationSound()
    const hint = p.tableId ? ` (table ${p.tableNumber})` : ''
    toast.warning(`${TOAST_MESSAGES[SERVER_EVENTS.ORDER_CALL_WAITER]}${hint}`, {
      position: 'top-right',
    })
    // waiterCallActive is persisted on the session row (TableSessionsService), not carried
    // in this payload — refetch so every open Tables page picks up the flag, not just the
    // one that happened to also be tracking it via a separate local state.
    invalidateActiveSessions()
    getHandlers()?.['order:call-waiter']?.(p)
  }
  const onPaymentOpen = (p: PaymentOpenPayload) => {
    if (!isSelfMutated(p.orderId) && shouldNotify(p.orderId)) {
      playNotificationSound()
      toast.info(TOAST_MESSAGES[SERVER_EVENTS.ORDER_PAYMENT_OPEN], { position: 'top-right' })
    }
    void queryClient.invalidateQueries({ queryKey: platformQueryKeys.ordersRoot() })
    void queryClient.invalidateQueries({ queryKey: platformQueryKeys.paymentsRoot() })
    getHandlers()?.['order:payment-open']?.(p)
  }
  const onPaid = (p: OrderPaidPayload) => {
    if (!isSelfMutated(p.orderId) && shouldNotify(p.orderId)) {
      toast.success(TOAST_MESSAGES[SERVER_EVENTS.ORDER_PAID], { position: 'top-right' })
    }
    void queryClient.invalidateQueries({ queryKey: platformQueryKeys.ordersRoot() })
    void queryClient.invalidateQueries({ queryKey: platformQueryKeys.paymentsRoot() })
    // Payment settlement synchronously auto-closes the table session server-side
    // (TableSessionsService.refreshLifecycle), so the table's currentSessionId is now
    // stale — without this, admin-table.tsx keeps showing "Close table" for a session
    // the backend already closed, and clicking it 404s with "Active session not found".
    void queryClient.invalidateQueries({ queryKey: platformQueryKeys.tablesRoot() })
    getHandlers()?.['order:paid']?.(p)
  }
  const onPaymentFailed = (p: PaymentFailedPayload) => {
    if (!isSelfMutated(p.orderId) && shouldNotify(p.orderId)) {
      if (p.playSound) playNotificationSound()
      toast.error(TOAST_MESSAGES[SERVER_EVENTS.ORDER_PAYMENT_FAILED], { position: 'top-right' })
    }
    invalidateOrders()
    void queryClient.invalidateQueries({ queryKey: platformQueryKeys.paymentsRoot() })
    getHandlers()?.['order:payment-failed']?.(p)
  }
  const onRefunded = (p: OrderRefundedPayload) => {
    if (!isSelfMutated(p.orderId) && shouldNotify(p.orderId)) {
      toast.info(TOAST_MESSAGES[SERVER_EVENTS.ORDER_REFUNDED], { position: 'top-right' })
    }
    invalidateOrders()
    void queryClient.invalidateQueries({ queryKey: platformQueryKeys.paymentsRoot() })
    getHandlers()?.['order:refunded']?.(p)
  }
  const onStatusChanged = (p: OrderStatusChangedPayload) => {
    getHandlers()?.['order:status-changed']?.(p)
  }
  // Session lifecycle (opened/joined/split/closed) and the waiter-call flag are both read
  // off the same activeSessions query that feeds admin-table.tsx's SessionCard list — a
  // session created by a guest QR scan, or closed by a payment settling elsewhere, is
  // otherwise invisible to an already-open Tables page until it happens to refetch on its
  // own (see platformQueryKeys.activeSessionsRoot).
  function invalidateActiveSessions() {
    void queryClient.invalidateQueries({ queryKey: platformQueryKeys.activeSessionsRoot() })
  }
  const onSessionOpened = (p: SessionOpenedPayload) => {
    invalidateActiveSessions()
    getHandlers()?.['session:opened']?.(p)
  }
  const onSessionJoined = (p: SessionLifecyclePayload) => {
    invalidateActiveSessions()
    getHandlers()?.['session:joined']?.(p)
  }
  const onSessionSplit = (p: SessionLifecyclePayload) => {
    invalidateActiveSessions()
    getHandlers()?.['session:split']?.(p)
  }
  const onSessionClosed = (p: SessionClosedPayload) => {
    invalidateActiveSessions()
    void queryClient.invalidateQueries({ queryKey: platformQueryKeys.tablesRoot() })
    getHandlers()?.['session-closed']?.(p)
  }
  const onWaiterAcknowledged = (p: WaiterAcknowledgedPayload) => {
    invalidateActiveSessions()
    getHandlers()?.['order:waiter-acknowledged']?.(p)
  }
  const onTipUpdated = (p: OrderTipUpdatedPayload) => {
    invalidateOrders()
    getHandlers()?.['order:tip-updated']?.(p)
  }
  // order:created already fired for this same order (ON_PREMISE guest orders emit both) — this
  // is the dedicated "needs your action" signal on top of that, so it always toasts/sounds
  // regardless of isSelfMutated, same as order:call-waiter.
  const onPendingConfirmation = (p: OrderPendingConfirmationPayload) => {
    playNotificationSound()
    toast.warning(TOAST_MESSAGES[SERVER_EVENTS.ORDER_PENDING_CONFIRMATION], {
      position: 'top-right',
    })
    invalidateOrders()
    getHandlers()?.['order-pending-confirmation']?.(p)
  }

  socket.on('connect', join)
  socket.on(SERVER_EVENTS.ORDER_STATUS_CHANGED, onStatusChanged)
  socket.on(SERVER_EVENTS.ORDER_PENDING_CONFIRMATION, onPendingConfirmation)
  socket.on(SERVER_EVENTS.ORDER_CREATED, onCreated)
  socket.on(SERVER_EVENTS.ORDER_CONFIRMED, onConfirmed)
  socket.on(SERVER_EVENTS.ORDER_PREPARING, onPreparing)
  socket.on(SERVER_EVENTS.ORDER_READY, onReady)
  socket.on(SERVER_EVENTS.ORDER_SERVED, onServed)
  socket.on(SERVER_EVENTS.ORDER_CANCELLED, onCancelled)
  socket.on(SERVER_EVENTS.ORDER_CALL_WAITER, onCallWaiter)
  socket.on(SERVER_EVENTS.ORDER_PAYMENT_OPEN, onPaymentOpen)
  socket.on(SERVER_EVENTS.ORDER_PAID, onPaid)
  socket.on(SERVER_EVENTS.ORDER_PAYMENT_FAILED, onPaymentFailed)
  socket.on(SERVER_EVENTS.ORDER_REFUNDED, onRefunded)
  socket.on(SERVER_EVENTS.ORDER_WAITER_ACKNOWLEDGED, onWaiterAcknowledged)
  socket.on(SERVER_EVENTS.ORDER_TIP_UPDATED, onTipUpdated)
  socket.on(SERVER_EVENTS.SESSION_OPENED, onSessionOpened)
  socket.on(SERVER_EVENTS.SESSION_JOINED, onSessionJoined)
  socket.on(SERVER_EVENTS.SESSION_SPLIT, onSessionSplit)
  socket.on(SERVER_EVENTS.SESSION_CLOSED, onSessionClosed)

  if (socket.connected) {
    join()
  } else {
    socket.connect()
  }

  return () => {
    leave()
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
    socket.off(SERVER_EVENTS.ORDER_PAYMENT_FAILED, onPaymentFailed)
    socket.off(SERVER_EVENTS.ORDER_REFUNDED, onRefunded)
    socket.off(SERVER_EVENTS.ORDER_STATUS_CHANGED, onStatusChanged)
    socket.off(SERVER_EVENTS.ORDER_PENDING_CONFIRMATION, onPendingConfirmation)
    socket.off(SERVER_EVENTS.ORDER_WAITER_ACKNOWLEDGED, onWaiterAcknowledged)
    socket.off(SERVER_EVENTS.ORDER_TIP_UPDATED, onTipUpdated)
    socket.off(SERVER_EVENTS.SESSION_OPENED, onSessionOpened)
    socket.off(SERVER_EVENTS.SESSION_JOINED, onSessionJoined)
    socket.off(SERVER_EVENTS.SESSION_SPLIT, onSessionSplit)
    socket.off(SERVER_EVENTS.SESSION_CLOSED, onSessionClosed)
  }
}

export function useOrderNotifications({
  room,
  id,
  handlers,
  isSelfMutated,
  shouldNotify,
}: UseOrderNotificationsOptions): void {
  const queryClient = useQueryClient()

  // Keep handlers/isSelfMutated/shouldNotify in refs so the effect never needs to
  // re-run when they change
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers
  const isSelfMutatedRef = useRef(isSelfMutated)
  isSelfMutatedRef.current = isSelfMutated
  const shouldNotifyRef = useRef(shouldNotify)
  shouldNotifyRef.current = shouldNotify

  useEffect(() => {
    if (typeof window === 'undefined' || !id) return

    const socket = getSocket()
    return subscribeOrderNotifications(
      socket,
      queryClient,
      room,
      id,
      () => handlersRef.current,
      () => isSelfMutatedRef.current,
      () => shouldNotifyRef.current,
    )
  }, [room, id, queryClient])
}
