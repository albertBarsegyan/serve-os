import { createFileRoute } from '@tanstack/react-router'
import { getTenantId } from '#/app/tenant/get-tenant-id'
import { getOrders } from '#/entities/order/api/get-orders'
import { AdminOrdersPage } from '#/pages/admin/orders/ui/admin-orders-page'

interface AdminOrdersLoaderData {
  tenantId: string
  orders: Awaited<ReturnType<typeof getOrders>>
}

export const Route = createFileRoute('/admin/orders')({
  loader: async (): Promise<AdminOrdersLoaderData> => {
    const tenantId = getTenantId()
    const orders = await getOrders(tenantId)

    return {
      tenantId,
      orders,
    }
  },
  component: AdminOrdersRoute,
})

function AdminOrdersRoute() {
  const data = Route.useLoaderData()
  return <AdminOrdersPage tenantId={data.tenantId} initialOrders={data.orders} />
}
