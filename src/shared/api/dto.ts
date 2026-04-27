/** Raw API shapes; field names can differ per backend build — mappers are defensive. */
export interface ApiProduct {
	id: string
	name: string
	price: number
	isAvailable?: boolean
	available?: boolean
	categoryId?: string
	category?: { name?: string; id?: string } | string
}

export interface ApiCategory {
	id: string
	name: string
	products?: ApiProduct[]
}

export interface ApiOrderItem {
	productId: string
	quantity: number
	product?: { name?: string; price?: number }
	name?: string
	unitPrice?: number
	price?: number
}

export interface ApiOrder {
	id: string
	businessId?: string
	tableId?: string
	table?: { label?: string; name?: string; number?: string } | string
	tableLabel?: string
	status: string
	total?: number
	totalAmount?: number
	amount?: number
	createdAt: string
	orderItems?: ApiOrderItem[]
	items?: ApiOrderItem[]
}

export interface LoginRequestBody {
	email: string
	password: string
}

export interface LoginResponseBody {
	access_token: string
	user: {
		id: string
		email: string
		businessId?: string
		name?: string
	}
}

export interface CreateOrderItemBody {
	productId: string
	quantity: number
}

export interface CreateOrderBody {
	tableId: string
	sessionToken?: string
	items: CreateOrderItemBody[]
}

export interface CreatePaymentBody {
	orderId: string
	method: 'CASH' | 'POS' | 'ONLINE'
}

export interface TableScanResponse {
	businessId: string
	tableId: string
	sessionToken?: string
}
