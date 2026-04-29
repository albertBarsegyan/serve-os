import { createFileRoute } from '@tanstack/react-router'
import { ErrorBoundary } from '#/shared/ui/ErrorBoundary'
import { AdminTablesPage } from '#/pages/admin/tables/ui/admin-tables-page'

export const Route = createFileRoute('/admin/tables')({
  component: AdminTablesPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})
