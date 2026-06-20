import { createServerFn } from '@tanstack/react-start'
import type { ScanSessionResponse } from '#/features/platform/api/platform.types'
import { serverApiInstance } from '#/shared/api/server-instance'
import { forwardCookies } from '#/shared/libs/utils/cookie.utils'

export const getSessionCurrentServerFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ session: ScanSessionResponse | null }> => {
    try {
      const response = await serverApiInstance<ScanSessionResponse>('sessions/current')
      forwardCookies(response)
      return { session: await response.json() }
    } catch {
      return { session: null }
    }
  },
)
