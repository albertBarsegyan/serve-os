import type { Order } from '#/entities/order/model/types'
import { fetchOrdersForBusiness } from '#/shared/api/admin/admin-api'

export async function getOrders(tenantId: string): Promise<Order[]> {
  return await fetchOrdersForBusiness(tenantId)
}
