import { createMiddleware, createStart } from '@tanstack/react-start'
import { paraglideMiddleware } from '#/paraglide/server'

// Resolves the request locale (from the URL, cookie, or Accept-Language header)
// and exposes it via AsyncLocalStorage so `getLocale()` is correct during SSR.
const localeMiddleware = createMiddleware({ type: 'request' }).server(({ request, next }) =>
  paraglideMiddleware(request, () => next()),
)

export const startInstance = createStart(() => ({
  requestMiddleware: [localeMiddleware],
}))
