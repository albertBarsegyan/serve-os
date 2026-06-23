import { setCookie } from '@tanstack/react-start/server'
import { parseSetCookie } from './cookie.utils'

export function forwardCookies(response: Response): void {
  for (const raw of response.headers.getSetCookie()) {
    const { name, value, opts } = parseSetCookie(raw)
    setCookie(name, value, {
      path: opts.path as string,
      domain: opts.domain as string,
      httpOnly: opts.httponly === true,
      secure: opts.secure === true,
      sameSite: opts.samesite as 'lax' | 'strict' | 'none',
      maxAge: opts['max-age'] ? Number(opts['max-age']) : undefined,
      expires: opts.expires ? new Date(opts.expires as string) : undefined,
    })
  }
}
