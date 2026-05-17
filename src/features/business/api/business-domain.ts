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
  workingHours?: unknown
  features?: BusinessFeature[]
}

export interface BusinessResponse {
  id: string
  name: string
  type: BusinessType
  features: BusinessFeature[]
  location: string
  currency: string
  workingHours?: unknown
  isActive: boolean
  createdAt: string
  updatedAt: string
  ownerId: string
  owner?: unknown
}

export const businessTypeLabels: Record<BusinessType, string> = {
  RESTAURANT: 'Restaurant',
  CAFE: 'Cafe',
  BAR: 'Bar',
  PUB: 'Pub',
  BAKERY: 'Bakery',
  FAST_FOOD: 'Fast Food',
  FOOD_TRUCK: 'Food Truck',
  PIZZERIA: 'Pizzeria',
  STEAKHOUSE: 'Steakhouse',
  SEAFOOD_RESTAURANT: 'Seafood Restaurant',
  SUSHI_BAR: 'Sushi Bar',
  BUFFET: 'Buffet',
  ICE_CREAM_SHOP: 'Ice Cream Shop',
  JUICE_BAR: 'Juice Bar',
  COFFEE_SHOP: 'Coffee Shop',
  TEA_HOUSE: 'Tea House',
  WINE_BAR: 'Wine Bar',
  COCKTAIL_BAR: 'Cocktail Bar',
  BREWERY: 'Brewery',
  NIGHTCLUB: 'Nightclub',
  HOTEL: 'Hotel',
  HOSTEL: 'Hostel',
  RESORT: 'Resort',
  MOTEL: 'Motel',
  GUEST_HOUSE: 'Guest House',
  APARTMENT_HOTEL: 'Apartment Hotel',
  CASINO: 'Casino',
  LOUNGE: 'Lounge',
  KARAOKE: 'Karaoke',
  CINEMA: 'Cinema',
  EVENT_VENUE: 'Event Venue',
  CATERING: 'Catering',
  BANQUET_HALL: 'Banquet Hall',
  PRIVATE_CLUB: 'Private Club',
  OTHER: 'Other',
}

export const businessFeatureLabels: Record<BusinessFeature, string> = {
  TABLES: 'Tables',
  QR_ORDERING: 'QR Ordering',
  DELIVERY: 'Delivery',
  TAKEAWAY: 'Takeaway',
  DINE_IN: 'Dine In',
  KITCHEN: 'Kitchen',
  KDS: 'Kitchen Display Screen (KDS)',
  RESERVATIONS: 'Reservations',
  ROOM_BOOKING: 'Room Booking',
  BAR_MENU: 'Bar Menu',
  ALCOHOL_SERVICE: 'Alcohol Service',
  ONLINE_PAYMENT: 'Online Payment',
  CASH_PAYMENT: 'Cash Payment',
  POS_PAYMENT: 'POS Payment',
  STAFF_MANAGEMENT: 'Staff Management',
  INVENTORY: 'Inventory',
  EVENTS: 'Events',
  MEMBERSHIP: 'Membership',
  MULTI_BRANCH: 'Multi Branch',
}

export const businessFeaturePresets: Record<BusinessType, BusinessFeature[]> = {
  RESTAURANT: [
    'TABLES',
    'QR_ORDERING',
    'KITCHEN',
    'KDS',
    'DINE_IN',
    'TAKEAWAY',
    'CASH_PAYMENT',
    'POS_PAYMENT',
  ],
  CAFE: ['TABLES', 'QR_ORDERING', 'CASH_PAYMENT', 'POS_PAYMENT', 'DINE_IN'],
  BAR: ['TABLES', 'BAR_MENU', 'ALCOHOL_SERVICE', 'POS_PAYMENT'],
  PUB: ['TABLES', 'BAR_MENU', 'ALCOHOL_SERVICE', 'POS_PAYMENT'],
  BAKERY: ['TAKEAWAY', 'CASH_PAYMENT', 'POS_PAYMENT'],
  FAST_FOOD: ['QR_ORDERING', 'TAKEAWAY', 'DINE_IN', 'CASH_PAYMENT', 'POS_PAYMENT'],
  FOOD_TRUCK: ['QR_ORDERING', 'TAKEAWAY', 'CASH_PAYMENT', 'POS_PAYMENT'],
  PIZZERIA: ['TABLES', 'QR_ORDERING', 'KITCHEN', 'TAKEAWAY', 'CASH_PAYMENT', 'POS_PAYMENT'],
  STEAKHOUSE: ['TABLES', 'QR_ORDERING', 'KITCHEN', 'DINE_IN', 'POS_PAYMENT'],
  SEAFOOD_RESTAURANT: ['TABLES', 'QR_ORDERING', 'KITCHEN', 'DINE_IN', 'POS_PAYMENT'],
  SUSHI_BAR: ['TABLES', 'QR_ORDERING', 'KITCHEN', 'DINE_IN', 'POS_PAYMENT'],
  BUFFET: ['TABLES', 'QR_ORDERING', 'DINE_IN', 'CASH_PAYMENT', 'POS_PAYMENT'],
  ICE_CREAM_SHOP: ['QR_ORDERING', 'TAKEAWAY', 'CASH_PAYMENT', 'POS_PAYMENT'],
  JUICE_BAR: ['QR_ORDERING', 'TAKEAWAY', 'CASH_PAYMENT', 'POS_PAYMENT'],
  COFFEE_SHOP: ['TABLES', 'QR_ORDERING', 'CASH_PAYMENT', 'POS_PAYMENT', 'DINE_IN'],
  TEA_HOUSE: ['TABLES', 'QR_ORDERING', 'CASH_PAYMENT', 'POS_PAYMENT', 'DINE_IN'],
  WINE_BAR: ['TABLES', 'BAR_MENU', 'ALCOHOL_SERVICE', 'POS_PAYMENT'],
  COCKTAIL_BAR: ['TABLES', 'BAR_MENU', 'ALCOHOL_SERVICE', 'POS_PAYMENT'],
  BREWERY: ['TABLES', 'BAR_MENU', 'ALCOHOL_SERVICE', 'POS_PAYMENT'],
  NIGHTCLUB: ['TABLES', 'BAR_MENU', 'ALCOHOL_SERVICE', 'POS_PAYMENT'],
  HOTEL: ['ROOM_BOOKING', 'ONLINE_PAYMENT', 'STAFF_MANAGEMENT'],
  HOSTEL: ['ROOM_BOOKING', 'ONLINE_PAYMENT', 'STAFF_MANAGEMENT'],
  RESORT: ['ROOM_BOOKING', 'ONLINE_PAYMENT', 'STAFF_MANAGEMENT'],
  MOTEL: ['ROOM_BOOKING', 'ONLINE_PAYMENT', 'STAFF_MANAGEMENT'],
  GUEST_HOUSE: ['ROOM_BOOKING', 'ONLINE_PAYMENT', 'STAFF_MANAGEMENT'],
  APARTMENT_HOTEL: ['ROOM_BOOKING', 'ONLINE_PAYMENT', 'STAFF_MANAGEMENT'],
  CASINO: ['TABLES', 'POS_PAYMENT', 'STAFF_MANAGEMENT', 'EVENTS'],
  LOUNGE: ['TABLES', 'BAR_MENU', 'ALCOHOL_SERVICE', 'POS_PAYMENT'],
  KARAOKE: ['TABLES', 'POS_PAYMENT', 'EVENTS'],
  CINEMA: ['RESERVATIONS', 'POS_PAYMENT', 'STAFF_MANAGEMENT'],
  EVENT_VENUE: ['EVENTS', 'ONLINE_PAYMENT', 'STAFF_MANAGEMENT'],
  CATERING: ['KITCHEN', 'STAFF_MANAGEMENT', 'DELIVERY', 'POS_PAYMENT'],
  BANQUET_HALL: ['EVENTS', 'RESERVATIONS', 'STAFF_MANAGEMENT', 'POS_PAYMENT'],
  PRIVATE_CLUB: ['MEMBERSHIP', 'STAFF_MANAGEMENT', 'POS_PAYMENT'],
  OTHER: [],
}
