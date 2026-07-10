import { createServerFn } from '@tanstack/react-start'
import type { ScanSessionResponse } from '#/features/platform/api/platform.types.ts'
import { serverApiInstance } from '#/shared/api/server-instance.ts'
import { forwardCookies } from '#/shared/libs/utils/cookie.server'

export const resumeSessionServerFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ScanSessionResponse> => {
    const response = await serverApiInstance<ScanSessionResponse>('sessions/resume')
    forwardCookies(response)
    return response.json()
  },
)
