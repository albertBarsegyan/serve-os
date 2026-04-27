import type { Order, OrderStatus } from '#/entities/order/model/types'

interface OrderTableProps {
	orders: Order[]
	onStatusChange: (orderId: string, status: OrderStatus) => Promise<void>
}

const nextStatusByCurrent: Partial<Record<OrderStatus, OrderStatus>> = {
	PENDING: 'CONFIRMED',
	CONFIRMED: 'PREPARING',
	PREPARING: 'READY',
	READY: 'DELIVERED',
	DELIVERED: 'CLOSED',
}

const terminal: OrderStatus[] = ['CLOSED', 'CANCELLED']

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
							<td className="py-2">${order.total.toFixed(2)}</td>
							<td className="py-2">{order.status}</td>
							<td className="py-2">
								<button
									type="button"
									className="rounded-md bg-[var(--lagoon-deep)] px-3 py-1.5 text-xs font-semibold text-white"
									disabled={terminal.includes(order.status) || !nextStatusByCurrent[order.status]}
									onClick={async () => {
										const next = nextStatusByCurrent[order.status]
										if (next) {
											await onStatusChange(order.id, next)
										}
									}}
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
