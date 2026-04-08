import type { Order, OrderStatus } from '#/entities/order/model/types'
import { adminApi } from '#/shared/api/admin/admin-api'

export async function updateOrderStatus(
  tenantId: string,
  orderId: string,
  status: OrderStatus,
): Promise<Order | null> {
  return await adminApi.updateOrderStatus(tenantId, orderId, status)
}
