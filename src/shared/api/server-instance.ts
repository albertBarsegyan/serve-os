import { getRequest } from '@tanstack/react-start/server'
import ky, { type Options, type ResponsePromise } from 'ky'

const API_URL = process.env.API_BASE_URL

export function serverApiInstance<T>(path: string, init: Options = {}): ResponsePromise<T> {
  const request = getRequest()
  const cookieHeader = request?.headers.get('cookie') ?? ''

  const serverInstance = ky.create({
    prefix: API_URL,
    credentials: 'include',
    hooks: {
      beforeRequest: [
        (ctx) => {
          if (cookieHeader) ctx.request.headers.set('cookie', cookieHeader)
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
