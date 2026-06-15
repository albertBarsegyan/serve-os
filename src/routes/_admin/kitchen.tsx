import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminKitchenPage } from '#/pages/admin/kitchen/ui/admin-kitchen-page'
import { BusinessFeature, StaffPermission } from '#/shared/libs/permissions/index.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_admin/kitchen')({
  component: AdminKitchenPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
  beforeLoad: ({ context }) => {
    const user = context.authUser
    if (user?.type === 'staff') {
      if (!user.business.features.includes(BusinessFeature.KDS)) {
        throw redirect({ to: '/dashboard' })
      }
      if (!user.permissions.includes(StaffPermission.KITCHEN_VIEW)) {
        throw redirect({ to: '/dashboard' })
      }
    }
  },
})
