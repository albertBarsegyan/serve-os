import { createFileRoute } from '@tanstack/react-router'
import { ErrorBoundary } from '#/shared/ui/ErrorBoundary'
import { AdminStaffPage } from '#/pages/admin/staff/ui/admin-staff-page'

export const Route = createFileRoute('/admin/staff')({
  component: AdminStaffPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})
