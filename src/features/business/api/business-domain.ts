export enum BusinessType {
  RESTAURANT = 'RESTAURANT',
  CAFE = 'CAFE',
  BAR = 'BAR',
  FAST_FOOD = 'FAST_FOOD',
  FOOD_TRUCK = 'FOOD_TRUCK',
  HOTEL = 'HOTEL',
  EVENT_VENUE = 'EVENT_VENUE',
  OTHER = 'OTHER',
}

export enum BusinessFeature {
  // Order types
  ORDER_DINE_IN = 'order_dine_in',
  ORDER_TAKEAWAY = 'order_takeaway',
  ORDER_DELIVERY = 'order_delivery',

  // Operational
  TABLES = 'tables',
  QR_ORDERING = 'qr_ordering',
  KITCHEN = 'kitchen',
  KDS = 'kds',

  // Addons
  ALLERGEN_LABELS = 'allergen_labels',
  HAPPY_HOUR = 'happy_hour',
  TIPS = 'tips',
  SPLIT_BILL = 'split_bill',
}

export const businessTypeLabels: Record<BusinessType, string> = {
  RESTAURANT: 'Restaurant',
  CAFE: 'Cafe',
  BAR: 'Bar',
  FAST_FOOD: 'Fast Food',
  FOOD_TRUCK: 'Food Truck',
  HOTEL: 'Hotel',
  EVENT_VENUE: 'Event Venue',
  OTHER: 'Other',
}

export const businessFeatureLabels: Record<BusinessFeature, string> = {
  [BusinessFeature.ORDER_DINE_IN]: 'Dine-In Orders',
  [BusinessFeature.ORDER_TAKEAWAY]: 'Takeaway Orders',
  [BusinessFeature.ORDER_DELIVERY]: 'Delivery Orders',
  [BusinessFeature.TABLES]: 'Table Management',
  [BusinessFeature.QR_ORDERING]: 'QR Code Ordering',
  [BusinessFeature.KITCHEN]: 'Kitchen Operations',
  [BusinessFeature.KDS]: 'Kitchen Display System (KDS)',
  [BusinessFeature.ALLERGEN_LABELS]: 'Allergen Information',
  [BusinessFeature.HAPPY_HOUR]: 'Happy Hour Management',
  [BusinessFeature.TIPS]: 'Tips & Gratuity',
  [BusinessFeature.SPLIT_BILL]: 'Split Bill',
}

export const FEATURE_PRESETS: Record<BusinessType, BusinessFeature[]> = {
  [BusinessType.RESTAURANT]: [
    // Core
    BusinessFeature.TABLES,
    BusinessFeature.QR_ORDERING,
    BusinessFeature.KITCHEN,
    BusinessFeature.KDS,
    BusinessFeature.ORDER_DINE_IN,
    BusinessFeature.ORDER_TAKEAWAY,
    // Addons
    BusinessFeature.ALLERGEN_LABELS,
    BusinessFeature.TIPS,
    BusinessFeature.SPLIT_BILL,
  ],
  [BusinessType.CAFE]: [
    // Core
    BusinessFeature.TABLES,
    BusinessFeature.QR_ORDERING,
    BusinessFeature.ORDER_DINE_IN,
    BusinessFeature.ORDER_TAKEAWAY,
    // Addons
    BusinessFeature.TIPS,
  ],
  [BusinessType.BAR]: [
    // Core
    BusinessFeature.TABLES,
    BusinessFeature.QR_ORDERING,
    BusinessFeature.ORDER_DINE_IN,

    // Addons
    BusinessFeature.HAPPY_HOUR,
    BusinessFeature.TIPS,
  ],
  [BusinessType.FAST_FOOD]: [
    // Core
    BusinessFeature.KITCHEN,
    BusinessFeature.KDS,
    BusinessFeature.ORDER_TAKEAWAY,
    // Addons
    BusinessFeature.ORDER_DELIVERY,
  ],
  [BusinessType.FOOD_TRUCK]: [
    // Core
    BusinessFeature.KITCHEN,
    BusinessFeature.ORDER_TAKEAWAY,

    // Addons
    BusinessFeature.ORDER_DELIVERY,
  ],
  [BusinessType.HOTEL]: [
    // Core
    BusinessFeature.TABLES,
    BusinessFeature.QR_ORDERING,
    BusinessFeature.ORDER_DINE_IN,
    // Addons
    BusinessFeature.ALLERGEN_LABELS,
    BusinessFeature.TIPS,
    BusinessFeature.SPLIT_BILL,
  ],
  [BusinessType.EVENT_VENUE]: [
    // Core
    BusinessFeature.TABLES,
    BusinessFeature.QR_ORDERING,
    BusinessFeature.ORDER_DINE_IN,
    // Addons
    BusinessFeature.ALLERGEN_LABELS,
    BusinessFeature.TIPS,
    BusinessFeature.SPLIT_BILL,
  ],
  [BusinessType.OTHER]: [
    // Core
    BusinessFeature.TABLES,
  ],
}

// Runtime helpers expected by UI/schema code
export const businessFeature = Object.values(BusinessFeature) as BusinessFeature[]

export const businessFeaturePresets = FEATURE_PRESETS
