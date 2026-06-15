import { redirect } from '@tanstack/react-router'
import { getRequest } from '@tanstack/react-start/server'
import ky, { type BeforeErrorState, isHTTPError, type Options, type ResponsePromise } from 'ky'
import { logger } from '#/shared/libs/logger.server.ts'

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
