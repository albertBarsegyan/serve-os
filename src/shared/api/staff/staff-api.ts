import { mapApiOrder } from '#/entities/order/lib/map-api-order'
import type { Order } from '#/entities/order/model/types'
import type { ApiOrder } from '#/shared/api/dto'
import { api } from '#/shared/api/ky'

export async function fetchActiveKitchenOrders(tenantId: string): Promise<Order[]> {
	const raw = await api
		.get('kitchen/active-orders')
		.json<ApiOrder[] | { data?: ApiOrder[] }>()
	const list = Array.isArray(raw) ? raw : raw.data ?? []
	return list.map((o) => mapApiOrder(o, tenantId))
}
