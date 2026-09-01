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
  JOIN_DISPLAY: 'join-display',
  JOIN_MENU: 'join-menu',
  LEAVE_SESSION: 'leave-session',
  LEAVE_BUSINESS: 'leave-business',
  LEAVE_KITCHEN: 'leave-kitchen',
  LEAVE_DISPLAY: 'leave-display',
  LEAVE_MENU: 'leave-menu',
  CALL_WAITER: 'call-waiter',
} as const

// ── Server → Client ───────────────────────────────────────────────────────────

export const SERVER_EVENTS = {
  // Legacy reconnect-sync event (join-session handler only)
  ORDER_STATUS_CHANGED: 'order:status-changed',
  ORDER_PENDING_CONFIRMATION: 'order-pending-confirmation',
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
  ORDER_PAYMENT_FAILED: 'order:payment-failed',
  ORDER_REFUNDED: 'order:refunded',
  // Venue TV display feed (sanitized — no PII/payment fields, see DisplayOrderPayload)
  DISPLAY_ORDER_UPDATED: 'display:order-updated',
  DISPLAY_ORDER_REMOVED: 'display:order-removed',
  // Menu feed — lightweight "refetch" signal, not a full product payload
  MENU_AVAILABILITY_CHANGED: 'menu:availability-changed',
} as const

// ── Payload types ─────────────────────────────────────────────────────────────

export interface OrderStatusChangedPayload {
  orderId: string
  status: string
  customerStatus: string
  // DELIVERED and CLOSED both map to customerStatus 'served' — use paymentStatus to tell
  // "served, awaiting payment" and "paid, all done" apart on resync.
  paymentStatus: string
  previousStatus: string | null
  tableId: string | null
  tableName: string | null
  sessionToken: string | null
  updatedAt: string
  actor: { type: string; id: string; role?: string }
  tipAmount: number
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
  tableNumber: number | null
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

/** Emitted for order:payment-failed */
export interface PaymentFailedPayload extends OrderEventPayload {
  reason: string
}

/** Emitted for order:refunded */
export interface OrderRefundedPayload extends OrderEventPayload {
  refundId: string
}

// ── Venue TV display payload types ────────────────────────────────────────────
// Deliberately narrow — a display token is unauthenticated, so the backend never
// includes customer name, totals, payment info, or staff identities in these.

export type DisplayOrderBucket = 'PREPARING' | 'READY'

export interface DisplayOrderItemPayload {
  name: string
  quantity: number
}

export interface DisplayOrderPayload {
  orderId: string
  tableNumber: number | null
  status: DisplayOrderBucket
  items: DisplayOrderItemPayload[]
  updatedAt: string
}

export interface DisplayOrderRemovedPayload {
  orderId: string
}

/**
 * A product's isAvailable flag changed — lightweight signal, not a full product payload,
 * so the client just refetches the public menu rather than patching a single cached item.
 */
export interface MenuAvailabilityChangedPayload {
  businessId: string
  productId: string
  isAvailable: boolean
}

/** Ack shape returned by the join-display/join-session/join-kitchen/join-business/join-menu handlers. */
export interface JoinAck {
  event: 'joined' | 'error'
  data: string
}
