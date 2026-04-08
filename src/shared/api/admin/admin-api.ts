import { simulateRequest } from '#/shared/api/base'
import type { Order, OrderStatus } from '#/entities/order/model/types'

const ordersByTenant: Record<string, Order[]> = {
  'tenant-alpha': [
    {
      id: 'o-1001',
      tenantId: 'tenant-alpha',
      table: 'A1',
      total: 24,
      status: 'new',
      createdAt: '2026-03-30T10:00:00.000Z',
    },
    {
      id: 'o-1002',
      tenantId: 'tenant-alpha',
      table: 'B3',
      total: 18,
      status: 'in_progress',
      createdAt: '2026-03-30T10:05:00.000Z',
    },
  ],
}

export const adminApi = {
  async getOrders(tenantId: string): Promise<Order[]> {
    await simulateRequest<Order[]>({
      client: 'admin',
      endpoint: '/api/admin/orders',
      tenantId,
    })
    return ordersByTenant[tenantId] ?? []
  },

  async updateOrderStatus(
    tenantId: string,
    orderId: string,
    status: OrderStatus,
  ): Promise<Order | null> {
    await simulateRequest<Order>({
      client: 'admin',
      endpoint: `/api/admin/orders/${orderId}/status`,
      tenantId,
    })

    const orders = ordersByTenant[tenantId]
    if (!orders) {
      return null
    }

    const index = orders.findIndex((order) => order.id === orderId)
    if (index === -1) {
      return null
    }

    const updated = { ...orders[index], status }
    orders[index] = updated
    return updated
  },
}
