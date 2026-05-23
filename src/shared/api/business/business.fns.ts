import { createServerFn } from '@tanstack/react-start'
import type {
  BusinessResponse,
  CreateBusinessRequest,
  UpdateBusinessRequest,
} from '#/features/business/api/business.types.ts'
import { createBusinessRequestSchema } from '#/features/business/lib/schemas/create-business-form.schema.ts'
import { updateBusinessRequestSchema } from '#/features/business/lib/schemas/update-business-form.schema.ts'
import { serverApiInstance } from '#/shared/api/server-instance.ts'
import { forwardCookies } from '#/shared/libs/utils/cookie.utils.ts'

/**
 * Create business
 */
export const createBusinessServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator(createBusinessRequestSchema)
  .handler(async ({ data }: { data: CreateBusinessRequest }): Promise<BusinessResponse> => {
    const request = await serverApiInstance<BusinessResponse>('business', {
      method: 'POST',
      json: data,
    })

    forwardCookies(request)

    return request.json()
  })

/**
 * List user businesses
 */
export const listBusinessesServerFn = createServerFn({
  method: 'GET',
}).handler(async (): Promise<BusinessResponse[]> => {
  const request = await serverApiInstance<BusinessResponse[]>('business', {
    method: 'GET',
  })

  forwardCookies(request)

  return await request.json()
})

/**
 * Get business by id
 */
export const getBusinessServerFn = createServerFn({
  method: 'GET',
})
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<BusinessResponse> => {
    const request = await serverApiInstance<BusinessResponse>(`business/${data.id}`, {
      method: 'GET',
    })

    forwardCookies(request)

    return await request.json()
  })

/**
 * Update business
 */

export const updateBusinessServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator(updateBusinessRequestSchema)
  .handler(
    async ({
      data,
    }: {
      data: {
        id: string
        payload: UpdateBusinessRequest
      }
    }): Promise<BusinessResponse> => {
      const request = await serverApiInstance<BusinessResponse>(`business/${data.id}`, {
        method: 'PATCH',
        json: data.payload,
      })

      forwardCookies(request)

      return await request.json()
    },
  )

/**
 * Delete business
 */
export const deleteBusinessServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const request = await serverApiInstance(`business/${data.id}`, {
      method: 'DELETE',
    })

    forwardCookies(request)

    if (!request.ok) {
      throw new Error('Failed to delete business')
    }
  })
