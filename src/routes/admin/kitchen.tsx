import { createFileRoute } from '@tanstack/react-router'
import { AdminKitchenPage } from '#/pages/admin/kitchen/ui/admin-kitchen-page'

export const Route = createFileRoute('/admin/kitchen')({
  component: AdminKitchenPage,
})
