import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminStaffPage } from '#/pages/admin/staff/ui/admin-staff-page'
import { StaffPermission } from '#/shared/lib/permissions/index.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_admin/staff')({
  component: AdminStaffPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
  beforeLoad: ({ context }) => {
    const user = context.authUser
    if (user?.type === 'staff' && !user.permissions.includes(StaffPermission.STAFF_MANAGE)) {
      throw redirect({ to: '/dashboard' })
    }
  },
})
