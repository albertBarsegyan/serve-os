export interface CustomerModifierOption {
  id: string
  name: string
  priceAdjustment: number
  position: number
  isActive: boolean
}

export interface CustomerModifierGroup {
  id: string
  name: string
  selectionType: 'SINGLE' | 'MULTIPLE'
  isRequired: boolean
  minSelections: number
  maxSelections: number | null
  modifiers: CustomerModifierOption[]
}

export interface CustomerProduct {
  id: string
  name: string
  description: string | null
  price: number
  compareAtPrice: number | null
  imageUrl: string | null
  imageUrls: string[]
  isAvailable: boolean
  prepTimeMinutes: number
  dietaryFlags: string[]
  allergens: string[]
  modifierGroups: CustomerModifierGroup[]
}

export interface CustomerCategory {
  id: string
  name: string
  imageUrl?: string | null
  sortOrder: number
  products: CustomerProduct[]
}
