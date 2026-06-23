import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { getCookieValue } from '#/shared/libs/utils/cookie.utils'

export const getActiveBusinessId = createServerFn().handler((): string | null => {
  const request = getRequest()
  const cookie = request.headers.get('cookie') ?? ''
  return getCookieValue({ cookieData: cookie, cookieName: 'business_id' })
})
