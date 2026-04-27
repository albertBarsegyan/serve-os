import type { Order, OrderStatus } from '#/entities/order/model/types'
import { updateOrderStatus as patchOrder } from '#/shared/api/admin/admin-api'

export async function updateOrderStatus(
	tenantId: string,
	orderId: string,
	status: OrderStatus,
): Promise<Order> {
	return patchOrder(tenantId, orderId, status)
}
