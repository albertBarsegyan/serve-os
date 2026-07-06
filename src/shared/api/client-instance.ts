import ky, { type AfterResponseState, type BeforeErrorState, isHTTPError } from 'ky'
import { getQueryContext } from '#/integrations/tanstack-query/root-provider'
import { localizeHref } from '#/paraglide/runtime'

function extractBackendError({ error }: BeforeErrorState) {
  if (isHTTPError(error)) {
    if (typeof error.data === 'object' && error.data !== null && 'message' in error.data) {
      error.message = String(error.data.message)
    }
  }

  return error
}

let refreshPromise: Promise<Response> | null = null

// Singleton so concurrent 401s share one /auth/refresh call — without it, N parallel
// failures would each start a new refresh; only one succeeds while the rest force sign-out.
function refreshToken(): Promise<Response> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

async function handleUnauthorized({ request, response }: AfterResponseState) {
  if (response.status === 401) {
    const { pathname } = window.location
    if (!(pathname.startsWith('/auth') || pathname.startsWith('/customer'))) {
      try {
        const refreshResponse = await refreshToken()
        if (refreshResponse.ok) {
          // Replay the original request now that the refresh cookie has landed.
          // afterResponse is the correct hook for this — returning a Response here
          // replaces the 401 with the retried result; beforeError cannot do this
          // because ky only accepts Error instances from that hook.
          return ky(request)
        }
      } catch {
        // Network error during refresh — fall through to sign-in redirect
      }
      const { queryClient } = getQueryContext()
      await queryClient.cancelQueries()
      queryClient.clear()
      // Raw path is unprefixed; localizeHref re-adds the current locale segment
      // (e.g. /hy) before this hard navigation bypasses the router's rewrite.
      window.location.href = localizeHref('/auth/sign-in')
    }
  }
}

export const clientApiInstance = ky.create({
  prefix: import.meta.env.VITE_API_BASE_URL,
  timeout: 30_000,
  credentials: 'include',
  hooks: {
    beforeError: [extractBackendError],
    afterResponse: [handleUnauthorized],
  },
})
