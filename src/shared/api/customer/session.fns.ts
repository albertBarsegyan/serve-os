import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { ScanSessionResponse } from '#/features/platform/api/platform.types.ts'
import { serverApiInstance } from '#/shared/api/server-instance.ts'
import { forwardCookies } from '#/shared/libs/utils/cookie.server'

const scanSessionInput = z.object({ qrCode: z.string().uuid() })

export const scanSessionServerFn = createServerFn({ method: 'POST' })
  .inputValidator(scanSessionInput)
  .handler(async ({ data }): Promise<ScanSessionResponse> => {
    const response = await serverApiInstance<ScanSessionResponse>('sessions/scan', {
      method: 'POST',
      json: { qrCode: data.qrCode },
    })
    forwardCookies(response)
    return response.json()
  })

export const resumeSessionServerFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ScanSessionResponse> => {
    const response = await serverApiInstance<ScanSessionResponse>('sessions/resume')
    forwardCookies(response)
    return response.json()
  },
)
