export const businessTypes = [
  'RESTAURANT',
  'CAFE',
  'BAR',
  'PUB',
  'BAKERY',
  'FAST_FOOD',
  'FOOD_TRUCK',
  'PIZZERIA',
  'STEAKHOUSE',
  'SEAFOOD_RESTAURANT',
  'SUSHI_BAR',
  'BUFFET',
  'ICE_CREAM_SHOP',
  'JUICE_BAR',
  'COFFEE_SHOP',
  'TEA_HOUSE',
  'WINE_BAR',
  'COCKTAIL_BAR',
  'BREWERY',
  'NIGHTCLUB',
  'HOTEL',
  'HOSTEL',
  'RESORT',
  'MOTEL',
  'GUEST_HOUSE',
  'APARTMENT_HOTEL',
  'CASINO',
  'LOUNGE',
  'KARAOKE',
  'CINEMA',
  'EVENT_VENUE',
  'CATERING',
  'BANQUET_HALL',
  'PRIVATE_CLUB',
  'OTHER',
] as const

export type BusinessType = (typeof businessTypes)[number]

export const businessFeatures = [
  'TABLES',
  'QR_ORDERING',
  'DELIVERY',
  'TAKEAWAY',
  'DINE_IN',
  'KITCHEN',
  'KDS',
  'RESERVATIONS',
  'ROOM_BOOKING',
  'BAR_MENU',
  'ALCOHOL_SERVICE',
  'ONLINE_PAYMENT',
  'CASH_PAYMENT',
  'POS_PAYMENT',
  'STAFF_MANAGEMENT',
  'INVENTORY',
  'EVENTS',
  'MEMBERSHIP',
  'MULTI_BRANCH',
] as const

export type BusinessFeature = (typeof businessFeatures)[number]

export interface CreateBusinessRequest {
  name: string
  type: BusinessType
  location: string
  currency: string
  workingHours?: string
  features?: BusinessFeature[]
}

export interface UpdateBusinessRequest {
  name?: string
  type?: BusinessType
  location?: string
  currency?: string
  workingHours?: string
  isActive?: boolean
  features?: BusinessFeature[]
}

export interface BusinessResponse {
  id: string
  name: string
  type: BusinessType
  features: BusinessFeature[]
  location: string
  currency: string
  workingHours?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  ownerId: string
}
