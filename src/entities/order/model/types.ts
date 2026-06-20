/** Matches backend OrderStatus enum exactly. */
export type OrderStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'IN_KITCHEN'
  | 'READY'
  | 'DELIVERED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'PAYMENT_FAILED'
  | 'REFUNDED'

export interface OrderLine {
  productId: string
  name?: string
  quantity: number
  price?: number
}

export interface Order {
  id: string
  tenantId: string
  table: string
  total: number
  status: OrderStatus
  createdAt: string
  items: OrderLine[]
}
