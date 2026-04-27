import { createFileRoute } from '@tanstack/react-router'
import { AdminOrdersPage } from '#/pages/admin/orders/ui/admin-orders-page'

export const Route = createFileRoute('/admin/orders')({
	component: AdminOrdersPage,
})
