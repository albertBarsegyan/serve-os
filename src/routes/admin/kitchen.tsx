import { createFileRoute } from '@tanstack/react-router'
import { ErrorBoundary } from '#/shared/ui/ErrorBoundary'
import { AdminKitchenPage } from '#/pages/admin/kitchen/ui/admin-kitchen-page'

export const Route = createFileRoute('/admin/kitchen')({
  component: AdminKitchenPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})
