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

export function formatItemLines(order: Order): string[] {
  if (!order.items.length) return ['(no line items)']
  return order.items.map((item) => {
    const name = item.product?.name ?? item.productId.slice(0, 8)
    return `${name} x${item.quantity}`
  })
}

export const columns: { title: string; key: Column; icon: typeof AlertCircle; color: string }[] = [
  { title: 'Queue', key: 'queue', icon: AlertCircle, color: 'text-amber-500' },
  { title: 'Preparing', key: 'preparing', icon: ChefHat, color: 'text-blue-500' },
  { title: 'Ready', key: 'ready', icon: CheckCircle2, color: 'text-emerald-500' },
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
