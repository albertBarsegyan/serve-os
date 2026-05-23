import type { AuthenticatedUser } from '#/features/auth/api/auth.types.ts'

export function getPostAuthDestination(
  authUser: Pick<AuthenticatedUser, 'hasBusiness'> | null | undefined,
) {
  return authUser?.hasBusiness ? '/dashboard' : '/setup'
}
