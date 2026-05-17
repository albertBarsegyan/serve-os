import { redirect } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import type { AuthenticatedUser } from '#/features/auth/api/auth.types.ts'
import { serverApiInstance } from '#/shared/api/server-instance.ts'

const authMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    const authUser = await serverApiInstance<AuthenticatedUser>('/auth/me')
    return await next({ context: { authUser } })
  } catch {
    throw redirect({ to: '/auth/sign-in', statusCode: 302 })
  }
})

export { authMiddleware }
