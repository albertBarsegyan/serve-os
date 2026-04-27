import { queryOptions } from '@tanstack/react-query'
import { fetchOrdersForBusiness } from '#/shared/api/admin/admin-api'
import { fetchActiveKitchenOrders } from '#/shared/api/staff/staff-api'

export const orderQueryKeys = {
	all: ['orders'] as const,
	business: (tenantId: string) => [...orderQueryKeys.all, tenantId] as const,
	kitchen: (tenantId: string) => [...orderQueryKeys.all, 'kitchen', tenantId] as const,
}

export function ordersQueryOptions(tenantId: string) {
	return queryOptions({
		queryKey: orderQueryKeys.business(tenantId),
		queryFn: () => fetchOrdersForBusiness(tenantId),
		enabled: Boolean(tenantId),
	})
}

export function kitchenOrdersQueryOptions(tenantId: string) {
	return queryOptions({
		queryKey: orderQueryKeys.kitchen(tenantId),
		queryFn: () => fetchActiveKitchenOrders(tenantId),
		enabled: Boolean(tenantId),
	})
}
