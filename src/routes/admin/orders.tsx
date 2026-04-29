import { createFileRoute } from '@tanstack/react-router'
import { ErrorBoundary } from '#/shared/ui/ErrorBoundary'
import { AdminOrdersPage } from '#/pages/admin/orders/ui/admin-orders-page'

export const Route = createFileRoute('/admin/orders')({
  component: AdminOrdersPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})
