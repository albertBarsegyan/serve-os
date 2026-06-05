import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { ScanSessionResponse } from '#/features/platform/api/platform.types.ts'
import { serverApiInstance } from '#/shared/api/server-instance.ts'

const scanSessionInput = z.object({ qrCode: z.string().uuid() })

export const scanSessionServerFn = createServerFn({ method: 'POST' })
  .inputValidator(scanSessionInput)
  .handler(({ data }): Promise<ScanSessionResponse> => {
    return serverApiInstance<ScanSessionResponse>('sessions/scan', {
      method: 'POST',
      json: { qrCode: data.qrCode },
    }).json()
  })
