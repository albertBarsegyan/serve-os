import type { Product } from '#/entities/product/model/types'
import { fetchMenuProducts } from '#/shared/api/customer/customer-api'

export async function getMenuProducts(tenantId: string): Promise<Product[]> {
	return fetchMenuProducts(tenantId)
}
