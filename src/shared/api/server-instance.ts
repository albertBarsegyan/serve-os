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

export function serverApiInstance<T>(path: string, init: Options = {}): ResponsePromise<T> {
  const request = getRequest()
  const cookieHeader = request?.headers.get('cookie') ?? ''

  const serverInstance = ky.create({
    prefix: API_URL,
    credentials: 'include',
    hooks: {
      beforeRequest: [
        ({ request: req }) => {
          if (cookieHeader) req.headers.set('cookie', cookieHeader)
        },
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
          if (!isHTTPError(error)) {
            logger.error({ method: req.method, url: req.url, err: error.message }, '✗ api error')
          }
          return error
        },
      ],
    },
  })

  return serverInstance(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
}
