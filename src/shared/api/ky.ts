import { getRequest } from '@tanstack/react-start/server'
import ky from 'ky'

const isServer = typeof document === 'undefined'
const prefix = import.meta.env.VITE_API_BASE_URL

export const api = ky.create({
  prefix,
  timeout: 30_000,
  credentials: 'include',
  hooks: {
    beforeRequest: [
      (state) => {
        if (isServer) {
          const req = getRequest()
          const cookie = req?.headers.get('cookie')

          if (cookie) {
            state.request.headers.set('cookie', cookie)
          }
        }
      },
    ],
  },
})
