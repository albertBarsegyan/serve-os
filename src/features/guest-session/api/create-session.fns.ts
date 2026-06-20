import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { ScanSessionResponse } from '#/features/platform/api/platform.types'
import { serverApiInstance } from '#/shared/api/server-instance'
import { forwardCookies } from '#/shared/libs/utils/cookie.utils'

const createSessionInput = z.object({ qrCode: z.string().uuid() })

/**
 * Creates or rejoins a guest table session. Sets the httpOnly session cookie
 * during SSR so the customer never needs to log in. Call from a route loader.
 */
export const createSessionServerFn = createServerFn({ method: 'POST' })
  .inputValidator(createSessionInput)
  .handler(async ({ data }): Promise<ScanSessionResponse> => {
    const response = await serverApiInstance<ScanSessionResponse>('sessions', {
      method: 'POST',
      json: { qrCode: data.qrCode },
    })
    forwardCookies(response)
    return response.json()
  })
