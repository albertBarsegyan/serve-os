import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminBusinessesPage } from '#/pages/admin/businesses/ui/businesses-page'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_admin/businesses')({
  component: AdminBusinessesPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
  beforeLoad: ({ context }) => {
    if (context.authUser?.type !== 'owner') throw redirect({ to: '/dashboard' })
  },
})
