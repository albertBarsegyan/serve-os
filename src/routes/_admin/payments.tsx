import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminPaymentsPage } from '#/pages/admin/payments/ui/admin-payments-page'
import { StaffPermission } from '#/shared/lib/permissions/index.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_admin/payments')({
  component: AdminPaymentsPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
  beforeLoad: ({ context }) => {
    const user = context.authUser
    if (user?.type === 'staff') {
      const canAccess =
        user.permissions.includes(StaffPermission.PAYMENT_TAKE) ||
        user.permissions.includes(StaffPermission.REPORTS_VIEW)
      if (!canAccess) throw redirect({ to: '/dashboard' })
    }
  },
})
