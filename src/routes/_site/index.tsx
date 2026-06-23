import { createFileRoute, redirect } from '@tanstack/react-router'
import { getRequest } from '@tanstack/react-start/server'
import { getPostAuthDestination } from '#/features/business/lib/utils/business-routing.ts'
import { LandingPage } from '#/pages/landing/landing/ui/landing-page'
import { sharedRoutePathname } from '#/shared/libs/constants/route-pathname/shared.ts'
import { getCookieValue } from '#/shared/libs/utils/cookie.utils.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_site/')({
  component: LandingPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
  beforeLoad: ({ location, context }) => {
    const cookieData = getRequest()?.headers.get('cookie') ?? ''

    const selectedBusinessId = getCookieValue({ cookieName: 'business_id', cookieData })

    if (selectedBusinessId) throw redirect({ to: '/dashboard' })

    if (location.pathname === sharedRoutePathname.HOME && context.authUser)
      throw redirect({ to: getPostAuthDestination(context.authUser) })
  },
})
