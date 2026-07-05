import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminDisplaysPage } from '#/pages/admin/displays/ui/admin-displays-page'
import { StaffRole } from '#/shared/libs/permissions/index.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_admin/displays')({
  component: AdminDisplaysPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
  beforeLoad: ({ context }) => {
    const user = context.authUser
    if (user?.type === 'staff' && user.role !== StaffRole.MANAGER) {
      throw redirect({ to: '/dashboard' })
    }
  },
})
