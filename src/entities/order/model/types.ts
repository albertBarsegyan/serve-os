/** Aligned with backend order lifecycle. */
export type OrderStatus =
	| 'PENDING'
	| 'CONFIRMED'
	| 'PREPARING'
	| 'READY'
	| 'DELIVERED'
	| 'CLOSED'
	| 'CANCELLED'

export interface OrderLine {
	productId: string
	name?: string
	quantity: number
	price?: number
}

export interface Order {
	id: string
	tenantId: string
	table: string
	total: number
	status: OrderStatus
	createdAt: string
	items: OrderLine[]
}
