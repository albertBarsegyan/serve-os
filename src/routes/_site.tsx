import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Nav, SiteFooter } from '#/pages/site/landing/ui/landing-page'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_site')({
  component: SiteLayout,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})

function SiteLayout() {
  return (
    <>
      <Nav />
      <Outlet />
      <SiteFooter />
    </>
  )
}
