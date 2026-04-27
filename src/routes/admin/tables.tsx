import { createFileRoute } from '@tanstack/react-router'
import { AdminTablesPage } from '#/pages/admin/tables/ui/admin-tables-page'

export const Route = createFileRoute('/admin/tables')({
  component: AdminTablesPage,
})
