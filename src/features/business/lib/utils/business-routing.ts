import type { AuthenticatedUser } from '#/features/auth/api/auth.types.ts'

export function getPostAuthDestination(authUser: Pick<AuthenticatedUser, 'businessId'> | null | undefined) {
  return authUser?.businessId ? '/dashboard' : '/setup'
}


