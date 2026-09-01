import ky, { type AfterResponseState, type BeforeErrorState, isHTTPError } from 'ky'
import { authQueryKey } from '#/features/auth/lib/constants/auth-query-keys.ts'
import { getQueryContext } from '#/integrations/tanstack-query/root-provider'
import { deLocalizeHref, localizeHref } from '#/paraglide/runtime'

function extractBackendError({ error }: BeforeErrorState) {
  if (isHTTPError(error)) {
    if (typeof error.data === 'object' && error.data !== null && 'message' in error.data) {
      error.message = String(error.data.message)
    }
  }

  return error
}

// Marks a request as already retried once after a refresh, so a 401 on the retry
// itself (e.g. the refreshed token still lacks access to this resource) falls
// through to the sign-in redirect instead of recursing into another refresh.
const RETRIED_AFTER_REFRESH_HEADER = 'x-retried-after-refresh'

let refreshPromise: Promise<Response> | null = null

// Singleton so concurrent 401s share one /auth/refresh call — without it, N parallel
// failures would each start a new refresh; only one succeeds while the rest force sign-out.
function refreshToken(): Promise<Response> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      // Native fetch has no default timeout — without this, a hung refresh call
      // never resolves or rejects, so every 401 awaiting the shared refreshPromise
      // freezes indefinitely instead of falling through to the sign-out redirect.
      signal: AbortSignal.timeout(10_000),
    }).finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

async function handleUnauthorized({ request, response }: AfterResponseState) {
  if (response.status === 401 && !request.headers.has(RETRIED_AFTER_REFRESH_HEADER)) {
    // De-localize first — locale-prefixed routes (e.g. `/hy/customer/...`) would
    // otherwise slip past this check and trigger an owner/staff refresh-and-redirect
    // for guest customers or on the sign-in page itself.
    const pathname = deLocalizeHref(window.location.pathname)
    if (!(pathname.startsWith('/auth') || pathname.startsWith('/customer'))) {
      try {
        const refreshResponse = await refreshToken()
        if (refreshResponse.ok) {
          // The ME query may have been cached as { user: null } from an earlier,
          // unrelated failure (e.g. an SSR call that hit this same 401 before this
          // refresh happened) — that cache entry won't naturally refetch for up to
          // its 5-minute staleTime. Now that we know the session is actually valid
          // again, invalidate it so the UI reflects the real auth state.
          getQueryContext().queryClient.invalidateQueries({ queryKey: [authQueryKey.ME] })

          // Replay the original request now that the refresh cookie has landed.
          // afterResponse is the correct hook for this — returning a Response here
          // replaces the 401 with the retried result; beforeError cannot do this
          // because ky only accepts Error instances from that hook.
          // Must go through clientApiInstance (not bare `ky`) so the retry keeps
          // this instance's timeout, error-message extraction, and — critically —
          // this same afterResponse hook in case the retry itself still 401s.
          return clientApiInstance(request, {
            headers: { [RETRIED_AFTER_REFRESH_HEADER]: '1' },
          })
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
