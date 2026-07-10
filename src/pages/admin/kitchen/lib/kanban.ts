import { AlertCircle, CheckCircle2, ChefHat } from 'lucide-react'
import type {
  Order,
  OrderStatus,
  UpdateOrderStatusRequest,
} from '#/features/platform/api/platform.types.ts'

export type Column = 'queue' | 'preparing' | 'ready'

export type AdvanceStatus = UpdateOrderStatusRequest['status']

// Kitchen endpoint returns CONFIRMED, IN_KITCHEN, READY orders only
const KITCHEN_ACTIVE_STATUSES: OrderStatus[] = ['CONFIRMED', 'IN_KITCHEN', 'READY']

export function orderColumn(status: OrderStatus): Column {
  if (status === 'CONFIRMED') return 'queue'
  if (status === 'IN_KITCHEN') return 'preparing'
  if (status === 'READY') return 'ready'
  return 'queue'
}

export interface OrderLine {
  key: string
  name: string
  quantity: number
  notes?: string
}

export function getOrderLines(order: Order): OrderLine[] {
  return order.items.map((item) => ({
    key: item.id,
    name: item.product?.name ?? item.productId.slice(0, 8),
    quantity: item.quantity,
    notes: item.notes,
  }))
}

// Step colors tell a progression story: gray (not started) -> red (actively
// cooking, urgent) -> green (done). Each shade has a light/dark variant so the
// board reads the same in both themes.
export const COLUMN_THEME: Record<
  Column,
  {
    icon: typeof AlertCircle
    iconColor: string
    headerBg: string
    headerText: string
    badge: string
    cardAccent: string
    noteBg: string
    noteText: string
  }
> = {
  queue: {
    icon: AlertCircle,
    iconColor: 'text-slate-500 dark:text-slate-400',
    headerBg: 'bg-slate-100 dark:bg-slate-800/60',
    headerText: 'text-slate-700 dark:text-slate-300',
    badge: 'border-transparent bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    cardAccent: 'border-l-slate-400 dark:border-l-slate-500',
    noteBg: 'bg-slate-50 dark:bg-slate-800/50',
    noteText: 'text-slate-700 dark:text-slate-300',
  },
  preparing: {
    icon: ChefHat,
    iconColor: 'text-red-500 dark:text-red-400',
    headerBg: 'bg-red-50 dark:bg-red-950/40',
    headerText: 'text-red-700 dark:text-red-300',
    badge: 'border-transparent bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300',
    cardAccent: 'border-l-red-500 dark:border-l-red-400',
    noteBg: 'bg-red-50 dark:bg-red-950/30',
    noteText: 'text-red-700 dark:text-red-300',
  },
  ready: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    headerBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    headerText: 'text-emerald-700 dark:text-emerald-300',
    badge:
      'border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
    cardAccent: 'border-l-emerald-500 dark:border-l-emerald-400',
    noteBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    noteText: 'text-emerald-700 dark:text-emerald-300',
  },
}

export const columns: { title: string; key: Column }[] = [
  { title: 'Queue', key: 'queue' },
  { title: 'Preparing', key: 'preparing' },
  { title: 'Ready', key: 'ready' },
]

export const COLUMN_KEYS = new Set<Column>(columns.map((col) => col.key))

// Forward-only transitions the board allows via drag-and-drop, mirroring the action buttons.
// `ready` has no target column because "Served" (DELIVERED) removes the order from the
// board entirely instead of moving it to a fourth column.
export const FORWARD_TRANSITIONS: Record<Column, { to: Column; status: AdvanceStatus } | null> = {
  queue: { to: 'preparing', status: 'IN_KITCHEN' },
  preparing: { to: 'ready', status: 'READY' },
  ready: null,
}

export type GroupedOrders = Record<Column, Order[]>

export function groupOrdersByColumn(orders: Order[]): GroupedOrders {
  const groups: GroupedOrders = { queue: [], preparing: [], ready: [] }
  for (const order of orders) {
    if (!KITCHEN_ACTIVE_STATUSES.includes(order.status)) continue
    groups[orderColumn(order.status)].push(order)
  }
  return groups
}
