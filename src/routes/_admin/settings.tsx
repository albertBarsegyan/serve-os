import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminSettingsPage } from '#/pages/admin/settings/ui/admin-settings-page'
import { StaffPermission } from '#/shared/libs/permissions/index.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_admin/settings')({
  component: AdminSettingsPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
  beforeLoad: ({ context }) => {
    const user = context.authUser
    if (user?.type === 'staff' && !user.permissions.includes(StaffPermission.BUSINESS_SETTINGS)) {
      throw redirect({ to: '/dashboard' })
    }
  },
})
