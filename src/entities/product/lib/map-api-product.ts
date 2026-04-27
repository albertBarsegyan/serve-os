import type { Product } from '#/entities/product/model/types'
import type { ApiProduct } from '#/shared/api/dto'

function categoryLabel(
	businessId: string,
	p: ApiProduct,
	categoryNameHint?: string,
): string {
	if (categoryNameHint) {
		return categoryNameHint
	}
	if (typeof p.category === 'string') {
		return p.category
	}
	if (p.category && typeof p.category === 'object' && p.category.name) {
		return p.category.name
	}
	if (p.categoryId) {
		return p.categoryId
	}
	return 'general'
}

export function mapApiProduct(
	p: ApiProduct,
	tenantId: string,
	categoryNameHint?: string,
): Product {
	const available = p.isAvailable ?? p.available ?? true
	return {
		id: p.id,
		tenantId,
		name: p.name,
		price: Number(p.price),
		category: categoryLabel(tenantId, p, categoryNameHint),
		available,
	}
}
