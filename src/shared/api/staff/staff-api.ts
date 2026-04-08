import { simulateRequest } from '#/shared/api/base'
import type { Order } from '#/entities/order/model/types'

export const staffApi = {
  async getKitchenQueue(tenantId: string): Promise<Order[]> {
    await simulateRequest<Order[]>({
      client: 'staff',
      endpoint: '/api/staff/kitchen-queue',
      tenantId,
    })
    return []
  },
}
