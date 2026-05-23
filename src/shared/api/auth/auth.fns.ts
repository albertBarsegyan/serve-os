import { createServerFn } from '@tanstack/react-start'

import type { AuthenticatedUser } from '#/features/auth/api/auth.types.ts'
import { signInSchema } from '#/features/auth/lib/schemas/sign-in-form.schema.ts'
import { signUpRequestSchema } from '#/features/auth/lib/schemas/sign-up.schema.ts'
import { serverApiInstance } from '#/shared/api/server-instance.ts'
import { forwardCookies } from '#/shared/libs/utils/cookie.utils.ts'

export const getAuthUserServerFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ user: AuthenticatedUser | null }> => {
    try {
      const response = await serverApiInstance<AuthenticatedUser>('auth/me')

      forwardCookies(response)

      return await response.json()
    } catch {
      return { user: null }
    }
  },
)

export const signInServerFn = createServerFn({ method: 'POST' })
  .inputValidator(signInSchema)
  .handler(async ({ data }): Promise<{ user: AuthenticatedUser }> => {
    const request = await serverApiInstance<AuthenticatedUser>('auth/login', {
      method: 'POST',
      json: data,
    })

    forwardCookies(request)

    return request.json()
  })

export const signUpServerFn = createServerFn({ method: 'POST' })
  .inputValidator(signUpRequestSchema)
  .handler(async ({ data }): Promise<Promise<{ user: AuthenticatedUser }>> => {
    const request = await serverApiInstance<AuthenticatedUser>('auth/register', {
      method: 'POST',
      json: data,
    })

    forwardCookies(request)

    return request.json()
  })

export const logoutServerFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<string | null> => {
    const request = await serverApiInstance<string>('auth/logout', { method: 'POST' })

    forwardCookies(request)

    return request.json()
  },
)
