import { createServerFn } from '@tanstack/react-start'
import type { BusinessResponse } from '#/features/business/api/business-domain.ts'
import { createBusinessRequestSchema } from '#/features/business/lib/schemas/business-form.schema.ts'
import { serverApiInstance } from '#/shared/api/server-instance.ts'
import { forwardCookies } from '#/shared/libs/utils/cookie.utils.ts'

export const createBusinessServerFn = createServerFn({ method: 'POST' })
  .inputValidator(createBusinessRequestSchema)
  .handler(async ({ data }): Promise<BusinessResponse> => {
    const request = await serverApiInstance<BusinessResponse>('business', {
      method: 'POST',
      json: data,
    })

    forwardCookies(request)

    return request.json()
  })

