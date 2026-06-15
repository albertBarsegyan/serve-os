import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminMenuPage } from '#/pages/admin/menu/ui/admin-menu-page'
import { StaffPermission } from '#/shared/libs/permissions/index.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_admin/menu')({
  component: AdminMenuPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
  beforeLoad: ({ context }) => {
    const user = context.authUser
    if (user?.type === 'staff' && !user.permissions.includes(StaffPermission.MENU_VIEW)) {
      throw redirect({ to: '/dashboard' })
    }
  },
})
