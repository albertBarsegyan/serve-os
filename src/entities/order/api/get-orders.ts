import type { Order } from '#/entities/order/model/types'
import { adminApi } from '#/shared/api/admin/admin-api'

export async function getOrders(tenantId: string): Promise<Order[]> {
  return await adminApi.getOrders(tenantId)
}
