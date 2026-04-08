import type { Order, OrderStatus } from '#/entities/order/model/types'

interface OrderTableProps {
  orders: Order[]
  onStatusChange: (orderId: string, status: OrderStatus) => Promise<void>
}

const nextStatusByCurrent: Record<OrderStatus, OrderStatus> = {
  new: 'in_progress',
  in_progress: 'ready',
  ready: 'completed',
  completed: 'completed',
}

export function OrderTable({ orders, onStatusChange }: OrderTableProps) {
  if (orders.length === 0) {
    return <p className="text-sm text-[var(--sea-ink-soft)]">No active orders.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[rgba(23,58,64,0.12)]">
            <th className="py-2">Order</th>
            <th className="py-2">Table</th>
            <th className="py-2">Total</th>
            <th className="py-2">Status</th>
            <th className="py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-[rgba(23,58,64,0.08)]">
              <td className="py-2">{order.id}</td>
              <td className="py-2">{order.table}</td>
              <td className="py-2">${order.total}</td>
              <td className="py-2">{order.status}</td>
              <td className="py-2">
                <button
                  type="button"
                  className="rounded-md bg-[var(--lagoon-deep)] px-3 py-1.5 text-xs font-semibold text-white"
                  disabled={order.status === 'completed'}
                  onClick={() =>
                    onStatusChange(order.id, nextStatusByCurrent[order.status])
                  }
                >
                  Advance
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
