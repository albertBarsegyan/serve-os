import { mapApiOrder } from '#/entities/order/lib/map-api-order'
import type { Order } from '#/entities/order/model/types'
import { clientApiInstance } from '#/shared/api/client-instance'
import type { ApiOrder } from '#/shared/api/dto'

export async function fetchActiveKitchenOrders(tenantId: string): Promise<Order[]> {
  const raw = await clientApiInstance
    .get('kitchen/active-orders')
    .json<ApiOrder[] | { data?: ApiOrder[] }>()
  const list = Array.isArray(raw) ? raw : (raw.data ?? [])
  return list.map((o) => mapApiOrder(o, tenantId))
}
