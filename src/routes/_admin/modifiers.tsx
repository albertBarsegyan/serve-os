import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminModifiersPage } from '#/pages/admin/modifiers/ui/admin-modifiers-page'
import { StaffPermission } from '#/shared/libs/permissions/index.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_admin/modifiers')({
  component: AdminModifiersPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
  beforeLoad: ({ context }) => {
    const user = context.authUser
    if (user?.type === 'staff' && !user.permissions.includes(StaffPermission.MENU_EDIT)) {
      throw redirect({ to: '/dashboard' })
    }
  },
})
