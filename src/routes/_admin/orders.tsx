import { createFileRoute } from '@tanstack/react-router'
import { AdminOrdersPage } from '#/pages/admin/orders/ui/admin-orders-page'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_admin/orders')({
  component: AdminOrdersPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})
