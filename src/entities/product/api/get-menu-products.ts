import type { Product } from '#/entities/product/model/types'
import { customerApi } from '#/shared/api/customer/customer-api'

export async function getMenuProducts(tenantId: string): Promise<Product[]> {
  return await customerApi.getMenuProducts(tenantId)
}
