import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminTablesPage } from '#/pages/admin/tables/ui/admin-tables-page'
import { BusinessFeature, StaffPermission } from '#/shared/lib/permissions/index.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_admin/tables')({
  component: AdminTablesPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
  beforeLoad: ({ context }) => {
    const user = context.authUser
    if (user?.type === 'staff') {
      if (!user.business.features.includes(BusinessFeature.TABLES)) {
        throw redirect({ to: '/dashboard' })
      }
      if (!user.permissions.includes(StaffPermission.TABLE_VIEW)) {
        throw redirect({ to: '/dashboard' })
      }
    }
  },
})
