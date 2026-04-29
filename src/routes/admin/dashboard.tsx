import { createFileRoute } from '@tanstack/react-router'
import { ErrorBoundary } from '#/shared/ui/ErrorBoundary'
import { AdminDashboardPage } from '#/pages/admin/dashboard/ui/dashboard-page'

export const Route = createFileRoute('/admin/dashboard')({
  component: AdminDashboardPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})
