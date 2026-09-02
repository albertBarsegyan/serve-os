import { createServerFn } from '@tanstack/react-start'
import { isHTTPError } from 'ky'
import { z } from 'zod'
import type { ScanSessionResponse } from '#/features/platform/api/platform.types'
import { serverApiInstance } from '#/shared/api/server-instance'
import { forwardCookies } from '#/shared/libs/utils/cookie.server'

const getSessionCurrentInput = z.object({ token: z.string().optional() })

// Accepts the session token explicitly (as the resume path already does) instead of
// relying solely on the request's cookie header — on a guest's very first scan, the
// cookie set by createSessionServerFn earlier in the same SSR pass isn't visible to
// this call yet (it's only queued on the outgoing response), so without the header
// fallback this would incorrectly resolve to "no session" on every first load.
export const getSessionCurrentServerFn = createServerFn({ method: 'GET' })
  .inputValidator(getSessionCurrentInput)
  .handler(async ({ data }): Promise<{ session: ScanSessionResponse | null }> => {
    try {
      const response = await serverApiInstance<ScanSessionResponse>('sessions/current', {
        headers: data.token ? { 'x-session-token': data.token } : {},
      })
      forwardCookies(response)
      return { session: await response.json() }
    } catch (error) {
      // Only a confirmed "no session" (404 — missing/expired/invalid token, see
      // TableSessionsService.resumeByToken) means there really is no session. Any
      // other failure (network blip, timeout, 5xx) must not be read as "closed" —
      // rethrow so the query surfaces as an error/retry instead of the guest seeing
      // a false SessionClosedView.
      if (isHTTPError(error) && error.response.status === 404) {
        return { session: null }
      }
      throw error
    }
  })
