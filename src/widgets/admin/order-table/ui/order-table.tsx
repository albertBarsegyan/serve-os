import type { Order, OrderStatus } from '#/entities/order/model/types'
import { m } from '#/paraglide/messages'
import { useActiveBusiness } from '#/shared/libs/hooks/use-active-business.ts'
import { formatPrice } from '#/shared/libs/utils/price.utils'

interface OrderTableProps {
  orders: Order[]
  onStatusChange: (orderId: string, status: OrderStatus) => Promise<void>
}

const nextStatusByCurrent: Partial<Record<OrderStatus, OrderStatus>> = {
  CREATED: 'CONFIRMED',
  CONFIRMED: 'IN_KITCHEN',
  IN_KITCHEN: 'READY',
  READY: 'DELIVERED',
  DELIVERED: 'CLOSED',
}

const terminal: OrderStatus[] = ['CLOSED', 'CANCELLED', 'PAYMENT_FAILED', 'REFUNDED']

export function OrderTable({ orders, onStatusChange }: OrderTableProps) {
  const currency = useActiveBusiness()?.currency ?? 'USD'

  if (orders.length === 0) {
    return <p className='text-sm text-[var(--sea-ink-soft)]'>{m.widget_order_table_empty()}</p>
  }

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full text-left text-sm'>
        <thead>
          <tr className='border-b border-[rgba(23,58,64,0.12)]'>
            <th className='py-2'>{m.admin_waiter_col_order()}</th>
            <th className='py-2'>{m.admin_orders_table_head_table()}</th>
            <th className='py-2'>{m.admin_orders_table_head_total()}</th>
            <th className='py-2'>{m.admin_orders_table_head_status()}</th>
            <th className='py-2'>{m.admin_waiter_col_action()}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className='border-b border-[rgba(23,58,64,0.08)]'>
              <td className='py-2'>{order.id}</td>
              <td className='py-2'>{order.table}</td>
              <td className='py-2'>{formatPrice(order.total, currency)}</td>
              <td className='py-2'>{order.status}</td>
              <td className='py-2'>
                <button
                  type='button'
                  className='rounded-md bg-[var(--lagoon-deep)] px-3 py-1.5 text-xs font-semibold text-white'
                  disabled={terminal.includes(order.status) || !nextStatusByCurrent[order.status]}
                  onClick={async () => {
                    const next = nextStatusByCurrent[order.status]
                    if (next) {
                      await onStatusChange(order.id, next)
                    }
                  }}
                >
                  {m.widget_order_table_advance()}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
