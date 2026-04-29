import ky from 'ky'

export const api = ky.create({
  prefix: import.meta.env.VITE_API_BASE_URL,
  timeout: 30_000,
  credentials: 'include',
  hooks: {
    beforeRequest: [
      ({ request, options: { context } }) => {
        if (typeof window === 'undefined') {
          const cookie = context?.cookie as string
          if (cookie) request.headers.set('cookie', cookie)
        }
      },
    ],
  },
})
