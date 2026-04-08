import { simulateRequest } from '#/shared/api/base'
import type { Product } from '#/entities/product/model/types'

const menuByTenant: Record<string, Product[]> = {
  'tenant-alpha': [
    {
      id: 'p-1',
      tenantId: 'tenant-alpha',
      name: 'Margherita',
      price: 12,
      category: 'pizza',
      available: true,
    },
    {
      id: 'p-2',
      tenantId: 'tenant-alpha',
      name: 'Sparkling Water',
      price: 4,
      category: 'drink',
      available: true,
    },
  ],
}

export const customerApi = {
  async getMenuProducts(tenantId: string): Promise<Product[]> {
    await simulateRequest<Product[]>({
      client: 'customer',
      endpoint: '/api/customer/menu',
      tenantId,
    })
    return menuByTenant[tenantId] ?? []
  },
}
