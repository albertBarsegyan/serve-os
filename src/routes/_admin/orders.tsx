import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminOrdersPage } from '#/pages/admin/orders/ui/admin-orders-page'
import { StaffPermission } from '#/shared/libs/permissions/index.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_admin/orders')({
  component: AdminOrdersPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
  beforeLoad: ({ context }) => {
    const user = context.authUser
    if (user?.type === 'staff' && !user.permissions.includes(StaffPermission.ORDER_VIEW)) {
      throw redirect({ to: '/kitchen' })
    }
  },
})
