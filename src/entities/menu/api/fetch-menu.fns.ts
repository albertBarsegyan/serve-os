import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { CustomerCategory } from '#/shared/api/customer/menu.types'
import { serverApiInstance } from '#/shared/api/server-instance'

export const fetchMenuServerFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ businessId: z.string() }))
  .handler(async ({ data }): Promise<CustomerCategory[]> => {
    return await serverApiInstance<CustomerCategory[]>('menu/customer', {
      searchParams: { businessId: data.businessId },
    }).json()
  })
