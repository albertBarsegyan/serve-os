import { m } from '#/paraglide/messages'

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

// Resolved per-call (not module scope) so the label reflects the locale active at render/SSR
// time rather than whatever locale happened to be active the first time this module was loaded.
export function businessTypeLabel(type: BusinessType | keyof typeof BusinessType): string {
  const labels: Record<BusinessType, string> = {
    RESTAURANT: m.business_type_restaurant(),
    CAFE: m.business_type_cafe(),
    BAR: m.business_type_bar(),
    FAST_FOOD: m.business_type_fast_food(),
    FOOD_TRUCK: m.business_type_food_truck(),
    HOTEL: m.business_type_hotel(),
    EVENT_VENUE: m.business_type_event_venue(),
    OTHER: m.business_type_other(),
  }
  return labels[type]
}

export function businessTypeOptions(): Array<{ value: BusinessType; label: string }> {
  return Object.values(BusinessType).map((type) => ({
    value: type,
    label: businessTypeLabel(type),
  }))
}

export function businessFeatureLabel(feature: BusinessFeature): string {
  const labels: Record<BusinessFeature, string> = {
    [BusinessFeature.ORDER_DINE_IN]: m.business_feature_order_dine_in(),
    [BusinessFeature.ORDER_TAKEAWAY]: m.business_feature_order_takeaway(),
    [BusinessFeature.ORDER_DELIVERY]: m.business_feature_order_delivery(),
    [BusinessFeature.TABLES]: m.business_feature_tables(),
    [BusinessFeature.QR_ORDERING]: m.business_feature_qr_ordering(),
    [BusinessFeature.KITCHEN]: m.business_feature_kitchen(),
    [BusinessFeature.KDS]: m.business_feature_kds(),
    [BusinessFeature.ALLERGEN_LABELS]: m.business_feature_allergen_labels(),
    [BusinessFeature.HAPPY_HOUR]: m.business_feature_happy_hour(),
    [BusinessFeature.TIPS]: m.business_feature_tips(),
    [BusinessFeature.SPLIT_BILL]: m.business_feature_split_bill(),
  }
  return labels[feature]
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
