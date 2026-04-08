import { useState } from 'react'
import { updateOrderStatus } from '#/features/order/update-order-status/model/update-order-status'
import { OrderTable } from '#/widgets/admin/order-table/ui/order-table'
import type { Order, OrderStatus } from '#/entities/order/model/types'

interface AdminOrdersPageProps {
  tenantId: string
  initialOrders: Order[]
}

export function AdminOrdersPage({ tenantId, initialOrders }: AdminOrdersPageProps) {
  const [orders, setOrders] = useState(initialOrders)

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    const updated = await updateOrderStatus(tenantId, orderId, status)
    if (!updated) {
      return
    }

    setOrders((previous) =>
      previous.map((order) => (order.id === updated.id ? updated : order)),
    )
  }

  return (
    <main className="page-wrap px-4 py-10">
      <section className="island-shell rounded-2xl p-6">
        <p className="island-kicker mb-2">Admin App</p>
        <h1 className="mb-2 text-3xl font-bold text-[var(--sea-ink)]">Orders</h1>
        <p className="mb-5 text-sm text-[var(--sea-ink-soft)]">
          Tenant: <strong>{tenantId}</strong>
        </p>
        <OrderTable orders={orders} onStatusChange={handleStatusChange} />
      </section>
    </main>
  )
}
