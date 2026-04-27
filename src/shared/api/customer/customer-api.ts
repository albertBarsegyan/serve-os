import type { Product } from '#/entities/product/model/types'
import { mapApiProduct } from '#/entities/product/lib/map-api-product'
import type {
	ApiCategory,
	ApiOrder,
	ApiProduct,
	CreateOrderBody,
	CreatePaymentBody,
	TableScanResponse,
} from '#/shared/api/dto'
import { api } from '#/shared/api/ky'
import { mapApiOrder } from '#/entities/order/lib/map-api-order'
import type { Order } from '#/entities/order/model/types'

function guestParams(businessId: string) {
	return { businessId }
}

/**
 * Fetches the public menu. Pass `businessId` from the QR / table scan flow.
 * Tries `GET /menu/products` first, then `GET /menu/categories` (flattened).
 */
export async function fetchMenuProducts(businessId: string): Promise<Product[]> {
	const params = guestParams(businessId)
	const tenantId = businessId

	const tryProducts = await api
		.get('menu/products', { searchParams: params })
		.json<ApiProduct[] | { data?: ApiProduct[] }>()
		.catch(() => null)

	if (Array.isArray(tryProducts)) {
		return tryProducts.map((p) => mapApiProduct(p, tenantId))
	}
	if (tryProducts && 'data' in tryProducts && Array.isArray(tryProducts.data)) {
		return tryProducts.data.map((p) => mapApiProduct(p, tenantId))
	}

	const categories = await api
		.get('menu/categories', { searchParams: params })
		.json<ApiCategory[] | { data?: ApiCategory[] }>()

	const list = Array.isArray(categories) ? categories : categories.data ?? []
	return list.flatMap((cat) =>
		(cat.products ?? []).map((p) => mapApiProduct(p, tenantId, cat.name)),
	)
}

export async function createOrder(
	businessId: string,
	body: CreateOrderBody,
): Promise<Order> {
	const created = await api
		.post('orders', {
			searchParams: guestParams(businessId),
			json: body,
		})
		.json<ApiOrder>()
	return mapApiOrder(created, businessId)
}

export async function createPayment(
	businessId: string,
	body: CreatePaymentBody,
): Promise<unknown> {
	return api
		.post('payments', {
			searchParams: guestParams(businessId),
			json: body,
		})
		.json()
}

export async function scanTable(qrCode: string): Promise<TableScanResponse> {
	return api.get(`tables/scan/${encodeURIComponent(qrCode)}`).json()
}
