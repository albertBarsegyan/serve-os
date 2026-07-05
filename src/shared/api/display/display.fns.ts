import { createServerFn } from '@tanstack/react-start'
import type {
  CreateDisplayRequest,
  DisplaySummaryResponse,
  DisplayWithUrlResponse,
} from '#/features/display/api/display.types.ts'
import { serverApiInstance } from '#/shared/api/server-instance.ts'
import { forwardCookies } from '#/shared/libs/utils/cookie.server'

/**
 * Create a venue TV display for a business — returns the one-time access URL
 * (the raw token, embedded in `url`, is never shown again after this response).
 */
export const createDisplayServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { businessId: string; payload: CreateDisplayRequest }) => data)
  .handler(async ({ data }): Promise<DisplayWithUrlResponse> => {
    const request = await serverApiInstance<DisplayWithUrlResponse>(
      `business/${data.businessId}/displays`,
      { method: 'POST', json: data.payload },
    )
    forwardCookies(request)
    return request.json()
  })

/**
 * List displays for a business — id/name/createdAt/revoked status only.
 */
export const listDisplaysServerFn = createServerFn({
  method: 'GET',
})
  .inputValidator((data: { businessId: string }) => data)
  .handler(async ({ data }): Promise<DisplaySummaryResponse[]> => {
    const request = await serverApiInstance<DisplaySummaryResponse[]>(
      `business/${data.businessId}/displays`,
      { method: 'GET' },
    )
    forwardCookies(request)
    return request.json()
  })

/**
 * Rotate a display's token — returns a new one-time access URL and invalidates the old one.
 */
export const regenerateDisplayServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { businessId: string; id: string }) => data)
  .handler(async ({ data }): Promise<DisplayWithUrlResponse> => {
    const request = await serverApiInstance<DisplayWithUrlResponse>(
      `business/${data.businessId}/displays/${data.id}/regenerate`,
      { method: 'POST' },
    )
    forwardCookies(request)
    return request.json()
  })

/**
 * Revoke a display — its token stops working immediately.
 */
export const revokeDisplayServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { businessId: string; id: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const request = await serverApiInstance(`business/${data.businessId}/displays/${data.id}`, {
      method: 'DELETE',
    })
    forwardCookies(request)
  })
