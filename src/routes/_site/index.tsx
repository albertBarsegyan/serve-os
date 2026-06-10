import { createFileRoute, redirect } from '@tanstack/react-router'
import { getPostAuthDestination } from '#/features/business/lib/utils/business-routing.ts'
import { LandingPage } from '#/pages/site/landing/ui/landing-page'
import { sharedRoutePathname } from '#/shared/libs/constants/route-pathname/shared.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_site/')({
  component: LandingPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
  beforeLoad: ({ location, context }) => {
    if (location.pathname === sharedRoutePathname.HOME && context.authUser)
      throw redirect({ to: getPostAuthDestination(context.authUser) })
  },
})
