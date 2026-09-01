import { isRedirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

import type { AuthenticatedUser } from '#/features/auth/api/auth.types.ts'
import { signInSchema } from '#/features/auth/lib/schemas/sign-in-form.schema.ts'
import { signUpRequestSchema } from '#/features/auth/lib/schemas/sign-up.schema.ts'
import { serverApiInstance } from '#/shared/api/server-instance.ts'
import { forwardCookies } from '#/shared/libs/utils/cookie.server'

const AUTH_COOKIES = ['access_token', 'staff_access_token', 'refresh_token']

function hasAuthCookie(): boolean {
  const cookies = getRequest()?.headers.get('cookie') ?? ''
  return cookies
    .split(';')
    .some((c) => AUTH_COOKIES.some((name) => c.trim().startsWith(`${name}=`)))
}

export const getAuthUserServerFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ user: AuthenticatedUser | null }> => {
    if (!hasAuthCookie()) return { user: null }

    try {
      const response = await serverApiInstance<AuthenticatedUser>('auth/me')

      forwardCookies(response)

      return await response.json()
    } catch (error) {
      // A thrown redirect (server-instance's unrecoverable-401 handler) must
      // propagate to the router, not be swallowed into a false "logged out"
      // result — otherwise TanStack Query caches { user: null } as a *successful*
      // response for staleTime, masking the redirect and sticking around even
      // after the user is re-authenticated via a separate (client-side) refresh.
      if (isRedirect(error)) throw error
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
    await serverApiInstance('auth/business', { method: 'DELETE' })
      .then(forwardCookies)
      .catch(() => {})

    const request = await serverApiInstance<string>('auth/logout', { method: 'POST' })

    forwardCookies(request)

    return request.json()
  },
)
