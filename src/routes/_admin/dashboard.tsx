import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminDashboardPage } from '#/pages/admin/dashboard/ui/dashboard-page'
import { StaffRole } from '#/shared/libs/permissions/index.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_admin/dashboard')({
  component: AdminDashboardPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
  beforeLoad: ({ context }) => {
    const user = context.authUser

    if (user?.type === 'staff' && user.role === StaffRole.KITCHEN) {
      throw redirect({ to: '/kitchen' })
    }
  },
})
