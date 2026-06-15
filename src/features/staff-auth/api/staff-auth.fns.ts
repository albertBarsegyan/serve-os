import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { serverApiInstance } from '#/shared/api/server-instance.ts'
import { forwardCookies } from '#/shared/libs/utils/cookie.utils.ts'
import type {
  SlugStaffLoginRequest,
  StaffLoginResponse,
  StaffLookupRequest,
  StaffLookupResult,
  StaffPinLoginRequest,
  StaffPinLoginResponse,
  StaffRosterResponse,
} from './staff-auth.types.ts'

const rosterInput = z.object({ slug: z.string().min(1) })
const loginInput = z.object({
  slug: z.string().min(1),
  identifier: z.string().min(1),
  secret: z.string().min(1),
})
const lookupInput = z.object({
  employeeId: z.string().min(1),
  businessId: z.string().min(1),
})
const pinLoginInput = z.object({
  staffId: z.string().min(1),
  pin: z.string().length(4),
  businessId: z.string().min(1),
})

export const getStaffRosterFn = createServerFn({ method: 'GET' })
  .inputValidator(rosterInput)
  .handler(({ data }): Promise<StaffRosterResponse> => {
    return serverApiInstance<StaffRosterResponse>('auth/staff/roster', {
      searchParams: { slug: data.slug },
    }).json()
  })

export const loginStaffBySlugFn = createServerFn({ method: 'POST' })
  .inputValidator(loginInput)
  .handler(async ({ data }): Promise<StaffLoginResponse> => {
    const req: SlugStaffLoginRequest = {
      slug: data.slug,
      identifier: data.identifier,
      secret: data.secret,
    }
    const response = await serverApiInstance('auth/staff/login', {
      method: 'POST',
      json: req,
      throwHttpErrors: false,
    })
    if (!response.ok) {
      let message = 'Authentication failed'
      try {
        const body: unknown = await response.json()
        if (typeof body === 'object' && body !== null && 'message' in body && typeof (body as { message: unknown }).message === 'string') {
          message = (body as { message: string }).message
        }
      } catch {}
      throw new Error(message)
    }
    forwardCookies(response)
    return response.json() as Promise<StaffLoginResponse>
  })

export const lookupStaffFn = createServerFn({ method: 'POST' })
  .inputValidator(lookupInput)
  .handler(({ data }): Promise<StaffLookupResult> => {
    const req: StaffLookupRequest = { employeeId: data.employeeId, businessId: data.businessId }
    return serverApiInstance<StaffLookupResult>('auth/staff/lookup', {
      method: 'POST',
      json: req,
    }).json()
  })

export const pinLoginStaffFn = createServerFn({ method: 'POST' })
  .inputValidator(pinLoginInput)
  .handler(async ({ data }): Promise<StaffPinLoginResponse> => {
    const req: StaffPinLoginRequest = {
      staffId: data.staffId,
      pin: data.pin,
      businessId: data.businessId,
    }
    const response = await serverApiInstance('auth/staff/pin', {
      method: 'POST',
      json: req,
      throwHttpErrors: false,
    })
    if (!response.ok) {
      let message = 'Authentication failed'
      try {
        const body: unknown = await response.json()
        if (typeof body === 'object' && body !== null && 'message' in body && typeof (body as { message: unknown }).message === 'string') {
          message = (body as { message: string }).message
        }
      } catch {}
      throw new Error(message)
    }
    forwardCookies(response)
    return response.json() as Promise<StaffPinLoginResponse>
  })
