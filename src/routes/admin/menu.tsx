import { createFileRoute } from '@tanstack/react-router'
import { AdminMenuPage } from '#/pages/admin/menu/ui/admin-menu-page'

export const Route = createFileRoute('/admin/menu')({
  component: AdminMenuPage,
})
