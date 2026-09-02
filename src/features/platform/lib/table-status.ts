import {
  Check,
  CheckCircle2,
  ChefHat,
  CreditCard,
  type LucideIcon,
  Sparkles,
  Utensils,
} from 'lucide-react'
import type { Order, OrderStatus, Payment } from '#/features/platform/api/platform.types.ts'
import { m } from '#/paraglide/messages'

// Shared status-derivation contract for the admin Tables and Orders pages — the backend's
// OrderStatus enum is the source of truth; this module is the single place that collapses it
// into the synthetic table-card status both pages read, so the two can never independently
// drift on what a given order/session state means.

export type TableStatus =
  | 'free'
  | 'new'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'payment'
  | 'paid'

// Every order status a session can be actively working through — CLOSED is included so a
// just-settled order still has a representative "paid" card instead of falling back to
// 'free'. CANCELLED/PAYMENT_FAILED/REFUNDED are deliberately excluded: none of them keep a
// session "active" on their own account (see pickActiveOrder below).
export const ACTIVE_ORDER_STATUSES = new Set<OrderStatus>([
  'CREATED',
  'CONFIRMED',
  'IN_KITCHEN',
  'READY',
  'DELIVERED',
  'CLOSED',
])

/** Picks a session's own representative order — the most recently created order still in an
 * active status. Returns null when every order on the session is terminal (CANCELLED,
 * PAYMENT_FAILED, REFUNDED) — callers must treat that the same as "no orders at all" for any
 * stuck/force-close logic, since a session in that state can never produce a new activeOrder
 * on its own. */
export function pickActiveOrder(orders: Order[]): Order | null {
  const active = orders.filter((o) => ACTIVE_ORDER_STATUSES.has(o.status))
  if (active.length === 0) return null
  return [...active].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0]
}

export function deriveStatus(order: Order | null, pendingPayment: Payment | null): TableStatus {
  if (!order) return 'free'
  switch (order.status) {
    case 'CREATED':
      return 'new'
    case 'CONFIRMED':
      return 'confirmed'
    case 'IN_KITCHEN':
      return 'preparing'
    case 'READY':
      return 'ready'
    case 'DELIVERED':
      if (order.paymentStatus === 'PAID') return 'paid'
      return pendingPayment ? 'payment' : 'served'
    case 'CLOSED':
      return 'paid'
    default:
      return 'free'
  }
}

type StatusConfig = {
  label: string
  description: string
  icon: LucideIcon
  nextLabel: string
  pulse: boolean
}

export function getStatusConfig(status: TableStatus): StatusConfig {
  switch (status) {
    case 'free':
      return {
        label: m.admin_tables_status_free_label(),
        description: m.admin_tables_status_free_description(),
        icon: Utensils,
        nextLabel: m.admin_tables_status_free_next(),
        pulse: false,
      }
    case 'new':
      return {
        label: m.admin_tables_status_new_label(),
        description: m.admin_tables_status_new_description(),
        icon: Sparkles,
        nextLabel: m.admin_tables_status_new_next(),
        pulse: false,
      }
    case 'confirmed':
      return {
        label: m.admin_tables_status_confirmed_label(),
        description: m.admin_tables_status_confirmed_description(),
        icon: Check,
        nextLabel: m.admin_tables_status_confirmed_next(),
        pulse: false,
      }
    case 'preparing':
      return {
        label: m.admin_tables_status_preparing_label(),
        description: m.admin_tables_status_preparing_description(),
        icon: ChefHat,
        nextLabel: m.admin_tables_status_preparing_next(),
        pulse: false,
      }
    case 'ready':
      return {
        label: m.admin_tables_status_ready_label(),
        description: m.admin_tables_status_ready_description(),
        icon: CheckCircle2,
        nextLabel: m.admin_tables_status_ready_next(),
        pulse: true,
      }
    case 'served':
      return {
        label: m.admin_tables_status_served_label(),
        description: m.admin_tables_status_served_description(),
        icon: Utensils,
        nextLabel: m.admin_tables_status_served_next(),
        pulse: false,
      }
    case 'payment':
      return {
        label: m.admin_tables_status_payment_label(),
        description: m.admin_tables_status_payment_description(),
        icon: CreditCard,
        nextLabel: m.admin_tables_status_payment_next(),
        pulse: true,
      }
    case 'paid':
      return {
        label: m.admin_tables_status_paid_label(),
        description: m.admin_tables_status_paid_description(),
        icon: CheckCircle2,
        nextLabel: m.admin_tables_status_paid_next(),
        pulse: false,
      }
  }
}

// ── Tone maps (literal Tailwind classes — no dynamic construction) ─────────────

export const TONE_BADGE: Record<TableStatus, string> = {
  free: 'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-900/50 dark:text-slate-200 dark:border-slate-700',
  new: 'bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-700',
  confirmed:
    'bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700',
  preparing:
    'bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700',
  ready:
    'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700',
  served:
    'bg-teal-100 text-teal-800 border border-teal-200 dark:bg-teal-900/40 dark:text-teal-200 dark:border-teal-700',
  payment:
    'bg-orange-100 text-orange-900 border border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700',
  paid: 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-700',
}

export const TONE_DOT: Record<TableStatus, string> = {
  free: 'bg-slate-500',
  new: 'bg-sky-500',
  confirmed: 'bg-indigo-500',
  preparing: 'bg-amber-500',
  ready: 'bg-emerald-500',
  served: 'bg-teal-500',
  payment: 'bg-orange-500',
  paid: 'bg-green-500',
}

export const TONE_HERO: Record<TableStatus, string> = {
  free: 'bg-slate-50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-800',
  new: 'bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800',
  confirmed: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800',
  preparing: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
  ready: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
  served: 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800',
  payment: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
  paid: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
}

export const TONE_ICON: Record<TableStatus, string> = {
  free: 'text-slate-600 dark:text-slate-400',
  new: 'text-sky-600 dark:text-sky-400',
  confirmed: 'text-indigo-600 dark:text-indigo-400',
  preparing: 'text-amber-600 dark:text-amber-400',
  ready: 'text-emerald-600 dark:text-emerald-400',
  served: 'text-teal-600 dark:text-teal-400',
  payment: 'text-orange-600 dark:text-orange-400',
  paid: 'text-green-600 dark:text-green-400',
}

export const TONE_BUTTON: Record<TableStatus, string> = {
  free: 'bg-slate-600 hover:bg-slate-700 text-white',
  new: 'bg-sky-600 hover:bg-sky-700 text-white',
  confirmed: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  preparing: 'bg-amber-600 hover:bg-amber-700 text-white',
  ready: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  served: 'bg-teal-600 hover:bg-teal-700 text-white',
  payment: 'bg-orange-600 hover:bg-orange-700 text-white',
  paid: 'bg-green-600 hover:bg-green-700 text-white',
}

export const TONE_STEPPER: Record<TableStatus, string> = {
  free: 'bg-slate-500',
  new: 'bg-sky-500',
  confirmed: 'bg-indigo-500',
  ready: 'bg-emerald-500',
  preparing: 'bg-amber-500',
  served: 'bg-teal-500',
  payment: 'bg-orange-500',
  paid: 'bg-green-500',
}

export const LIFECYCLE: TableStatus[] = [
  'free',
  'new',
  'confirmed',
  'preparing',
  'ready',
  'served',
  'payment',
  'paid',
]

// Rank of how much a status still needs attention (0 = most urgent). Used to pick which
// session's status represents the whole table on the collapsed grid card — a table with
// one session mid-order and another already paid should read as "mid-order," not "paid."
export const URGENCY_RANK: Record<TableStatus, number> = {
  new: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  served: 4,
  payment: 5,
  paid: 6,
  free: 7,
}
