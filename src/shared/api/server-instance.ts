import { redirect } from '@tanstack/react-router'
import { getRequest } from '@tanstack/react-start/server'
import ky, {
  type AfterResponseState,
  type BeforeErrorState,
  isHTTPError,
  type Options,
  type ResponsePromise,
} from 'ky'
import { logger } from '#/shared/libs/logger.server.ts'
import { forwardCookies } from '#/shared/libs/utils/cookie.server'
import { parseSetCookie } from '#/shared/libs/utils/cookie.utils'

const API_URL = process.env.API_BASE_URL

const reqTimings = new WeakMap<object, number>()

function extractBackendError({ error }: BeforeErrorState) {
  if (isHTTPError(error)) {
    if (typeof error.data === 'object' && error.data !== null && 'message' in error.data) {
      error.message = String(error.data.message)
    }
  }

  return error
}

// Replaces the named cookie's value (or appends it) rather than concatenating,
// so a retried request never ends up with two `access_token=` pairs in one header.
function withUpdatedCookie(cookieHeader: string, name: string, value: string): string {
  const remaining = cookieHeader.split('; ').filter((pair) => pair && !pair.startsWith(`${name}=`))
  remaining.push(`${name}=${value}`)
  return remaining.join('; ')
}

// Marks a request as already retried once after a refresh, so a 401 on the retry
// itself (e.g. the refreshed token still lacks access to this resource) falls
// through to the sign-in redirect instead of recursing into another refresh.
const RETRIED_AFTER_REFRESH_HEADER = 'x-retried-after-refresh'

// SSR mirror of the client's silent-refresh-and-retry: without this, any 401 during
// SSR (hard refresh, typed URL, new tab) redirected straight to sign-in even when a
// valid refresh_token cookie could have silently re-authenticated the request.
// No cross-request promise sharing here (unlike the client) — this handler runs
// per-request on a shared server process, so dedup would risk leaking one user's
// refreshed cookies into another user's response.
async function handleUnauthorized({ request, response }: AfterResponseState) {
  if (response.status !== 401) return undefined
  if (request.headers.has(RETRIED_AFTER_REFRESH_HEADER)) return undefined

  const cookieHeader = getRequest()?.headers.get('cookie') ?? ''
  if (!cookieHeader) return undefined

  try {
    const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { cookie: cookieHeader },
      signal: AbortSignal.timeout(10_000),
    })

    if (!refreshResponse.ok) return undefined

    forwardCookies(refreshResponse)

    const newAccessToken = refreshResponse.headers
      .getSetCookie()
      .map(parseSetCookie)
      .find(({ name }) => name === 'access_token')?.value

    const retryCookieHeader = newAccessToken
      ? withUpdatedCookie(cookieHeader, 'access_token', newAccessToken)
      : cookieHeader

    // Must go through baseInstance (not bare `fetch`) so the retry keeps this
    // instance's logging and — critically — this same afterResponse hook in
    // case the retry itself still 401s.
    return baseInstance(request, {
      headers: { cookie: retryCookieHeader, [RETRIED_AFTER_REFRESH_HEADER]: '1' },
    })
  } catch {
    // Network error or timeout during refresh — fall through to the 401,
    // which beforeError below turns into a sign-in redirect.
    return undefined
  }
}

const baseInstance = ky.create({
  prefix: API_URL,
  credentials: 'include',
  hooks: {
    beforeRequest: [
      ({ request: req }) => {
        reqTimings.set(req, Date.now())
        logger.info({ method: req.method, url: req.url }, '→ api')
      },
    ],
    afterResponse: [
      ({ request: req, response: res }) => {
        const start = reqTimings.get(req)
        const ms = start === undefined ? undefined : Date.now() - start
        reqTimings.delete(req)

        const level = res.status >= 500 ? 'error' : res.status >= 400 ? 'warn' : 'info'
        logger[level]({ method: req.method, url: res.url, status: res.status, ms }, '← api')
      },
      handleUnauthorized,
    ],
    beforeError: [
      extractBackendError,
      ({ request: req, error }) => {
        if (isHTTPError(error) && error.response.status === 401) {
          // SSR has no window — redirect via TanStack Router so the framework
          // handles it rather than propagating a raw 401 to the route loader
          throw redirect({ to: '/auth/sign-in' })
        }
        if (!isHTTPError(error)) {
          logger.error({ method: req.method, url: req.url, err: error.message }, '✗ api error')
        }
        return error
      },
    ],
  },
})

export function serverApiInstance<T>(path: string, init: Options = {}): ResponsePromise<T> {
  const cookieHeader = getRequest()?.headers.get('cookie') ?? ''

  return baseInstance(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...init.headers,
    },
  }) as ResponsePromise<T>
}
