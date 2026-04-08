export type OrderStatus = 'new' | 'in_progress' | 'ready' | 'completed'

export interface Order {
  id: string
  tenantId: string
  table: string
  total: number
  status: OrderStatus
  createdAt: string
}
