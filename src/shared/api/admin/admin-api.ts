import { mapApiOrder } from '#/entities/order/lib/map-api-order'
import type { Order, OrderStatus } from '#/entities/order/model/types'
import { clientApiInstance } from '#/shared/api/client-instance'
import type { ApiOrder } from '#/shared/api/dto'

export async function fetchOrdersForBusiness(_tenantId: string): Promise<Order[]> {
  const raw = await clientApiInstance.get('orders').json<ApiOrder[] | { data?: ApiOrder[] }>()
  const list = Array.isArray(raw) ? raw : (raw.data ?? [])
  return list.map((o) => mapApiOrder(o, _tenantId))
}

export async function updateOrderStatus(
  _tenantId: string,
  orderId: string,
  status: OrderStatus,
): Promise<Order> {
  const updated = await clientApiInstance
    .patch(`orders/${orderId}/status`, { json: { status } })
    .json<ApiOrder>()
  return mapApiOrder(updated, _tenantId)
}
