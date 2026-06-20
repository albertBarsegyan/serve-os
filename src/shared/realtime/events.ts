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
} as const

// ── Server → Client ───────────────────────────────────────────────────────────

export const SERVER_EVENTS = {
  ORDER_STATUS_CHANGED: 'order:status-changed',
  ORDER_PENDING_CONFIRMATION: 'order-pending-confirmation',
  PAYMENT_RECORDED: 'payment-recorded',
  SPLIT_UPDATED: 'split-updated',
  SESSION_CLOSED: 'session-closed',
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
