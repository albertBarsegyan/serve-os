import type { AuthenticatedUser } from '#/features/auth/api/auth.types.ts'
import { adminRoutePathname } from '#/shared/libs/constants/route-pathname/admin.ts'

export function getPostAuthDestination(user: AuthenticatedUser) {
  if (user.type === 'staff') return adminRoutePathname.DASHBOARD
  return user.hasBusiness ? adminRoutePathname.SELECT_BUSINESS : adminRoutePathname.SETUP_BUSINESS
}
