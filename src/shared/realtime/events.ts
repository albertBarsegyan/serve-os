/**
 * Realtime event names and payload types — kept in sync with
 * serve-os-backend/src/modules/kitchen/kitchen.gateway.ts.
 * Never add business logic here; only type definitions.
 */

// ── Client → Server ───────────────────────────────────────────────────────────

export const CLIENT_EVENTS = {
  JOIN_SESSION: 'join-session',
  JOIN_BUSINESS: 'join-business',
  JOIN_KITCHEN: 'join-kitchen',
  CALL_WAITER: 'call-waiter',
} as const

// ── Server → Client ───────────────────────────────────────────────────────────

export const SERVER_EVENTS = {
  // Legacy reconnect-sync event (join-session handler only)
  ORDER_STATUS_CHANGED: 'order:status-changed',
  ORDER_PENDING_CONFIRMATION: 'order-pending-confirmation',
  PAYMENT_RECORDED: 'payment-recorded',
  SPLIT_UPDATED: 'split-updated',
  SESSION_CLOSED: 'session-closed',
  // Per-transition lifecycle events (Parts 2-3)
  ORDER_CREATED: 'order:created',
  ORDER_CONFIRMED: 'order:confirmed',
  ORDER_PREPARING: 'order:preparing',
  ORDER_READY: 'order:ready',
  ORDER_SERVED: 'order:served',
  ORDER_CANCELLED: 'order:cancelled',
  ORDER_CALL_WAITER: 'order:call-waiter',
  ORDER_PAYMENT_OPEN: 'order:payment-open',
  ORDER_PAID: 'order:paid',
} as const

// ── Payload types ─────────────────────────────────────────────────────────────

export interface OrderStatusChangedPayload {
  orderId: string
  status: string
  previousStatus: string | null
  tableId: string | null
  tableName: string | null
  sessionToken: string | null
  paymentStatus?: string | null
  updatedAt: string
  actor: { type: string; id: string; role?: string }
}

export interface OrderPendingConfirmationPayload {
  orderId: string
  tableId: string | null
  sessionToken: string | null
  items: Array<{
    productId: string
    name: string
    quantity: number
    unitPrice: number
  }>
}

export interface PaymentRecordedPayload {
  orderId: string
  paymentId: string
  method: string
  amount: number
  status: string
}

export interface SplitUpdatedPayload {
  orderId: string
  totalAmount: number
  paidAmount: number
  remaining: number
  allocations: Array<{ orderItemId: string; quantity: number; amount: number }>
}

export interface SessionClosedPayload {
  sessionId: string
}

// ── New lifecycle payload types ───────────────────────────────────────────────

/** Emitted for order:created / confirmed / preparing / ready / served / cancelled */
export interface OrderEventPayload {
  orderId: string
  businessId: string
  tableId: string | null
  sessionToken: string | null
  status: string
  customerStatus: string
  playSound: boolean
  at: string
}

export interface CallWaiterPayload {
  businessId: string
  tableId: string | null
  sessionToken: string
  at: string
}

export interface PaymentOpenPayload {
  orderId: string
  businessId: string
  tableId: string | null
  amount: number
  paymentId: string
  at: string
}

export interface OrderPaidPayload {
  orderId: string
  businessId: string
  paymentId: string
  customerStatus: string
  at: string
}
