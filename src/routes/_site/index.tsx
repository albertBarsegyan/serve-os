import { createFileRoute, redirect } from '@tanstack/react-router'
import { getPostAuthDestination } from '#/features/business/lib/utils/business-routing.ts'
import { LandingPage } from '#/pages/landing/landing/ui/landing-page'
import { getSelectedBusinessId } from '#/shared/api/business/business.fns.ts'
import { adminRoutePathname } from '#/shared/libs/constants/route-pathname/admin.ts'
import { sharedRoutePathname } from '#/shared/libs/constants/route-pathname/shared.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_site/')({
  component: LandingPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
  beforeLoad: async ({ location, context }) => {
    if (location.pathname === sharedRoutePathname.HOME && context.authUser) {
      const hasSelectedBusiness = await getSelectedBusinessId()

      throw redirect({
        to: hasSelectedBusiness
          ? adminRoutePathname.DASHBOARD
          : getPostAuthDestination(context.authUser),
      })
    }
  },
})
