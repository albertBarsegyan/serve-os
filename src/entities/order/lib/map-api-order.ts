import type { Order, OrderLine, OrderStatus } from '#/entities/order/model/types'
import type { ApiOrder, ApiOrderItem } from '#/shared/api/dto'

const STATUS_SET = new Set<string>([
	'PENDING',
	'CONFIRMED',
	'PREPARING',
	'READY',
	'DELIVERED',
	'CLOSED',
	'CANCELLED',
])

function toStatus(raw: string): OrderStatus {
	const upper = raw.toUpperCase()
	if (STATUS_SET.has(upper)) {
		return upper as OrderStatus
	}
	return 'PENDING'
}

function tableLabel(o: ApiOrder): string {
	if (o.tableLabel) {
		return o.tableLabel
	}
	if (typeof o.table === 'string') {
		return o.table
	}
	if (o.table && typeof o.table === 'object') {
		return o.table.label ?? o.table.name ?? o.table.number ?? '—'
	}
	if (o.tableId) {
		return o.tableId.slice(0, 8)
	}
	return '—'
}

function lineItems(items: ApiOrderItem[] | undefined): OrderLine[] {
	if (!items?.length) {
		return []
	}
	return items.map((row) => ({
		productId: row.productId,
		name: row.product?.name ?? row.name,
		quantity: row.quantity,
		price: row.unitPrice ?? row.price ?? row.product?.price,
	}))
}

function pickItems(o: ApiOrder): ApiOrderItem[] {
	return o.orderItems ?? o.items ?? []
}

export function mapApiOrder(o: ApiOrder, tenantId: string): Order {
	const items = lineItems(pickItems(o))
	const totalFromLines = items.reduce(
		(sum, l) => sum + (l.price ?? 0) * l.quantity,
		0,
	)
	const total = o.total ?? o.totalAmount ?? o.amount ?? totalFromLines

	return {
		id: o.id,
		tenantId: o.businessId ?? tenantId,
		table: tableLabel(o),
		total: Number(total) || 0,
		status: toStatus(o.status),
		createdAt: o.createdAt,
		items,
	}
}
