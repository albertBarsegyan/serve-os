import { createFileRoute } from '@tanstack/react-router'
import { ErrorBoundary } from '#/shared/ui/ErrorBoundary'
import { AdminMenuPage } from '#/pages/admin/menu/ui/admin-menu-page'

export const Route = createFileRoute('/admin/menu')({
  component: AdminMenuPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})
