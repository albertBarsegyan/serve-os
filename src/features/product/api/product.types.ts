export const servicePeriods = ['all_day', 'breakfast', 'lunch', 'dinner'] as const
export type ServicePeriod = (typeof servicePeriods)[number]

// Matches backend DietaryFlag enum exactly
export const dietaryFlags = ['vegan', 'vegetarian', 'gluten_free', 'dairy_free'] as const
export type DietaryFlag = (typeof dietaryFlags)[number]

// Matches backend Allergen enum exactly
export const allergens = ['nuts', 'soy', 'milk', 'eggs', 'fish', 'shellfish', 'wheat'] as const
export type Allergen = (typeof allergens)[number]

export interface CreateProductVariantDto {
  name: string
  price: number
  sku?: string | null
  isAvailable?: boolean
  sortOrder?: number
}

export interface CreateProductRequest {
  categoryId: string
  name: string
  description?: string | null
  basePrice: number
  compareAtPrice?: number | null
  slug?: string | null
  sku?: string | null
  prepTimeMinutes?: number
  availablePeriod?: ServicePeriod
  sortOrder?: number
  isFeatured?: boolean
  dietaryFlags?: DietaryFlag[]
  allergens?: Allergen[]
  imageUrls?: string[]
  variants?: CreateProductVariantDto[]
}

// Note: backend UpdateProductDto = Partial<CreateProductDto> which does NOT include isAvailable.
// isAvailable updates are not supported by the current backend PATCH endpoint.
export type UpdateProductRequest = Partial<CreateProductRequest>

export interface ProductVariantResponse {
  id: string
  productId: string
  name: string
  price: number
  sku?: string | null
  isAvailable: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ProductModifierOption {
  id: string
  groupId: string
  name: string
  priceAdjustment: number
  position: number
  isActive: boolean
}

export interface ProductModifierGroup {
  id: string
  businessId: string
  name: string
  selectionType: 'SINGLE' | 'MULTIPLE'
  isRequired: boolean
  minSelections: number
  maxSelections: number | null
  position: number
  isActive: boolean
  modifiers: ProductModifierOption[]
}

export interface ProductResponse {
  id: string
  businessId: string
  categoryId: string
  name: string
  description?: string | null
  // Stored as 'price' column in DB (mapped from 'basePrice' in CreateProductDto)
  price: number
  compareAtPrice?: number | null
  slug: string
  sku?: string | null
  imageUrl?: string | null
  imageUrls: string[]
  isAvailable: boolean
  prepTimeMinutes: number
  availablePeriod: ServicePeriod
  sortOrder: number
  isFeatured: boolean
  dietaryFlags: string[]
  allergens: string[]
  totalOrderCount: number
  averageRating: number
  variants: ProductVariantResponse[]
  modifierGroups?: ProductModifierGroup[]
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}
