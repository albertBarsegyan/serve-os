import { queryOptions } from '@tanstack/react-query'
import { fetchMenuProducts } from '#/shared/api/customer/customer-api'

export const menuQueryKeys = {
	all: ['menu'] as const,
	byBusiness: (businessId: string) => [...menuQueryKeys.all, businessId] as const,
}

export function menuProductsQueryOptions(businessId: string) {
	return queryOptions({
		queryKey: menuQueryKeys.byBusiness(businessId),
		queryFn: () => fetchMenuProducts(businessId),
		enabled: Boolean(businessId),
	})
}
