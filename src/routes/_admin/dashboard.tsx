import { createFileRoute } from '@tanstack/react-router'
import { AdminDashboardPage } from '#/pages/admin/dashboard/ui/dashboard-page'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_admin/dashboard')({
  component: AdminDashboardPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})
