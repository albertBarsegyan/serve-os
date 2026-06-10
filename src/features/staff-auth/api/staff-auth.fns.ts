import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { serverApiInstance } from '#/shared/api/server-instance.ts'
import { forwardCookies } from '#/shared/libs/utils/cookie.utils.ts'
import type {
  SlugStaffLoginRequest,
  StaffLoginResponse,
  StaffRosterResponse,
} from './staff-auth.types.ts'

const rosterInput = z.object({ slug: z.string().min(1) })
const loginInput = z.object({
  slug: z.string().min(1),
  identifier: z.string().min(1),
  secret: z.string().min(1),
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
    const response = await serverApiInstance<StaffLoginResponse>('auth/staff/login', {
      method: 'POST',
      json: req,
    })
    forwardCookies(response)
    return response.json()
  })
