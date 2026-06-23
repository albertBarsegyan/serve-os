import {createServerFn} from '@tanstack/react-start'
import {getRequest} from '@tanstack/react-start/server'
import {z} from 'zod'
import type {
    BusinessPaymentMethodResponse,
    BusinessResponse,
    CreateBusinessRequest,
    UpdateBusinessRequest,
    UpsertPaymentMethodRequest,
} from '#/features/business/api/business.types.ts'
import {createBusinessRequestSchema} from '#/features/business/lib/schemas/create-business-form.schema.ts'
import {updateBusinessRequestSchema} from '#/features/business/lib/schemas/update-business-form.schema.ts'
import {serverApiInstance} from '#/shared/api/server-instance.ts'
import {forwardCookies, getCookieValue} from '#/shared/libs/utils/cookie.utils.ts'

const selectBusinessRequestSchema = z.string().uuid()

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
  })

/**
 * Select active business
 */
export const selectBusinessServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator(selectBusinessRequestSchema)
  .handler(async ({ data }): Promise<void> => {
    const response = await serverApiInstance('auth/business', {
      method: 'POST',
      json: { businessId: data },
    })

    forwardCookies(response)
  })

/**
 * Clear active business
 */

export const clearBusinessServerFn = createServerFn({
  method: 'POST',
}).handler(async (): Promise<void> => {
  const response = await serverApiInstance('auth/business', {
    method: 'DELETE',
  })

  forwardCookies(response)
})

/**
 * List payment methods for a business
 */
export const listPaymentMethodsServerFn = createServerFn({
  method: 'GET',
})
  .inputValidator((data: { businessId: string }) => data)
  .handler(async ({ data }): Promise<BusinessPaymentMethodResponse[]> => {
    const request = await serverApiInstance<BusinessPaymentMethodResponse[]>(
      `business/${data.businessId}/payment-methods`,
      { method: 'GET' },
    )
    forwardCookies(request)
    return request.json()
  })

/**
 * Upsert a payment method configuration
 */
export const upsertPaymentMethodServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { businessId: string; payload: UpsertPaymentMethodRequest }) => data)
  .handler(async ({ data }): Promise<BusinessPaymentMethodResponse> => {
    const request = await serverApiInstance<BusinessPaymentMethodResponse>(
      `business/${data.businessId}/payment-methods`,
      { method: 'PUT', json: data.payload },
    )
    forwardCookies(request)
    return request.json()
  })

/**
 * Delete a payment method configuration
 */
export const deletePaymentMethodServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { businessId: string; methodId: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const request = await serverApiInstance(
      `business/${data.businessId}/payment-methods/${data.methodId}`,
      { method: 'DELETE' },
    )
    forwardCookies(request)
  })

export const getSelectedBusinessId = createServerFn().handler(() => {
  const request = getRequest()
  const cookie = request.headers.get('cookie') ?? ''

  return getCookieValue({ cookieData: cookie, cookieName: 'business_id' })
})
