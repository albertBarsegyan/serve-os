// ── Shared pagination types ───────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ── Re-exports: business domain (authoritative source for BusinessFeature) ────
export { BusinessFeature } from '#/features/business/api/business-domain.ts'

// ── Re-exports: product types (authoritative source for Product shapes) ───────
export type {
  Allergen,
  CreateProductRequest,
  DietaryFlag,
  ProductResponse as Product,
  ProductVariantResponse,
  ServicePeriod,
  UpdateProductRequest,
} from '#/features/product/api/product.types.ts'
export {
  allergens,
  dietaryFlags,
  servicePeriods,
} from '#/features/product/api/product.types.ts'

// ── Staff roles — matches backend StaffRole enum exactly ─────────────────────
export const staffRoles = ['MANAGER', 'WAITER', 'CASHIER', 'KITCHEN'] as const
export type StaffRole = (typeof staffRoles)[number]
// Keep 'roles' export so platform.schemas.ts doesn't need a separate import change
export const roles = staffRoles
/** @deprecated Use StaffRole */
export type Role = StaffRole

// ── Payment ───────────────────────────────────────────────────────────────────
export const paymentMethods = ['CASH', 'POS', 'ONLINE'] as const
export type PaymentMethod = (typeof paymentMethods)[number]

export const paymentStatuses = ['PENDING', 'CONFIRMED', 'FAILED'] as const
export type PaymentStatus = (typeof paymentStatuses)[number]

// ── Order status — matches backend OrderStatus enum exactly ───────────────────
export const orderStatuses = [
  'CREATED',
  'CONFIRMED',
  'IN_KITCHEN',
  'READY',
  'DELIVERED',
  'CLOSED',
  'CANCELLED',
  'PAYMENT_FAILED',
  'REFUNDED',
] as const
export type OrderStatus = (typeof orderStatuses)[number]

// ── Order type — matches backend OrderType enum exactly ───────────────────────
export const orderTypes = ['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const
export type OrderType = (typeof orderTypes)[number]

// ── Staff auth type — matches backend StaffAuthType enum ─────────────────────
export const staffAuthTypes = ['PIN', 'PASSWORD', 'INVITE_PENDING'] as const
export type StaffAuthType = (typeof staffAuthTypes)[number]

// ── Modifier selection type — matches backend ModifierSelectionType enum ──────
export const modifierSelectionTypes = ['SINGLE', 'MULTIPLE'] as const
export type ModifierSelectionType = (typeof modifierSelectionTypes)[number]

// ── Payment webhook events — matches backend PaymentWebhookEvent enum ─────────
export const paymentWebhookEvents = ['success', 'failure', 'refund'] as const
export type PaymentWebhookEvent = (typeof paymentWebhookEvents)[number]

// ── Shared ────────────────────────────────────────────────────────────────────
export interface ApiListQuery {
  limit?: number
  offset?: number
}

// ── Table sessions ────────────────────────────────────────────────────────────
export interface ScanSessionRequest {
  qrCode: string
}

export interface CustomerPaymentMethod {
  method: 'CASH' | 'POS' | 'ONLINE'
  isActive: boolean
}

export interface ScanSessionResponse {
  sessionToken: string
  tableSessionId: string
  businessId: string
  tableId: string
  tableName: string
  businessName: string
  businessLogoUrl: string | null
  paymentMethods: CustomerPaymentMethod[]
}

export interface SessionBillGroup {
  sessionToken: string
  orders: Order[]
  subtotal: number
  tipTotal: number
}

export interface SessionBill {
  sessionId: string
  tableId: string | null
  businessId: string
  groups: SessionBillGroup[]
}

// ── Tables ────────────────────────────────────────────────────────────────────
export interface TableEntity {
  id: string
  businessId: string
  number: number
  qrCode: string
  capacity: number
  isActive: boolean
  isReserved: boolean
  imageUrl: string | null
  currentSessionId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTableRequest {
  number: number
  capacity: number
  isActive?: boolean
  imageUrl?: string | null
}

export interface UpdateTableRequest {
  number?: number
  capacity?: number
  isActive?: boolean
  imageUrl?: string | null
}

export interface ToggleTableStatusRequest {
  isActive: boolean
}

export interface SetTableReservationRequest {
  isReserved: boolean
}

// ── Menu categories ───────────────────────────────────────────────────────────
export interface MenuCategory {
  id: string
  businessId: string
  name: string
  description?: string | null
  imageUrl?: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  products?: import('#/features/product/api/product.types.ts').ProductResponse[]
}

export interface CreateMenuCategoryRequest {
  name: string
  description?: string | null
  imageUrl?: string | null
  sortOrder?: number
}

export type UpdateMenuCategoryRequest = Partial<CreateMenuCategoryRequest>

// ── Modifiers ─────────────────────────────────────────────────────────────────
export type ModifierPriceType = 'adjustment' | 'fixed'

export interface Modifier {
  id: string
  groupId: string
  name: string
  priceAdjustment: number
  priceType: ModifierPriceType
  position: number
  isActive: boolean
}

export interface ModifierGroup {
  id: string
  businessId: string
  name: string
  selectionType: ModifierSelectionType
  isRequired: boolean
  minSelections: number
  maxSelections: number | null
  position: number
  isActive: boolean
  modifiers: Modifier[]
}

export interface CreateModifierGroupRequest {
  name: string
  selectionType?: ModifierSelectionType
  isRequired?: boolean
  minSelections?: number
  maxSelections?: number
  position?: number
  isActive?: boolean
}

export type UpdateModifierGroupRequest = Partial<CreateModifierGroupRequest>

export interface AddModifierRequest {
  name: string
  priceAdjustment: number
  priceType?: ModifierPriceType
  position?: number
  isActive?: boolean
}

export type UpdateModifierRequest = Partial<AddModifierRequest>

// ── Orders ────────────────────────────────────────────────────────────────────
export interface OrderItemSelectedModifier {
  modifierId: string
  name: string
  priceAdjustment: number
}

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: string
  notes?: string
  selectedModifiers: OrderItemSelectedModifier[]
  // Populated when orders are fetched with product relations (e.g. kitchen endpoint)
  product?: { id: string; name: string; price: number } | null
}

export interface Order {
  id: string
  businessId: string
  tableId: string | null
  waiterId: string | null
  status: OrderStatus
  type: OrderType
  paymentStatus: 'UNPAID' | 'PAID'
  totalAmount: string
  customerName?: string | null
  notes?: string | null
  items: OrderItem[]
  createdAt: string
  // Populated when orders are fetched with table relation (e.g. kitchen endpoint)
  table?: { id: string; number: number } | null
}

// Matches backend CreateOrderFromQrDto — public QR flow
export interface CreateOrderItemRequest {
  productId: string
  quantity: number
  notes?: string
}

export interface CreateOrderRequest {
  sessionToken?: string
  tableId?: string
  items: CreateOrderItemRequest[]
}

// Staff-initiated order creation
export interface CreateStaffOrderItemRequest {
  productId: string
  quantity: number
  notes?: string
  selectedModifiers?: Array<{
    modifierId: string
    name: string
    priceAdjustment: number
  }>
}

export interface CreateStaffOrderRequest {
  type: OrderType
  tableId?: string
  items: CreateStaffOrderItemRequest[]
  customerName?: string
  notes?: string
}

// Status transitions: CREATED and CONFIRMED are starting states, not valid targets
export interface UpdateOrderStatusRequest {
  status: Exclude<OrderStatus, 'CREATED' | 'CONFIRMED'>
}

// Matches backend RefundOrderDto — refundId is an external reference, generated if omitted
export interface RefundOrderRequest {
  refundId?: string
}

// ── Payments ──────────────────────────────────────────────────────────────────
export interface Payment {
  id: string
  businessId: string
  orderId: string
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  confirmedAt: string | null
  confirmedById: string | null
  createdAt: string
}

export interface CreatePaymentRequest {
  orderId: string
  method: PaymentMethod
  amount: number
}

// Backend confirms via authenticated user — no request body needed
export type ConfirmPaymentRequest = Record<string, never>

export interface ProcessPaymentRequest {
  tipAmount?: number
}

// ── Staff ─────────────────────────────────────────────────────────────────────
export interface CreateStaffWithInviteRequest {
  displayName: string
  role: StaffRole
  email: string
}

export interface CreateStaffWithPasswordRequest {
  displayName: string
  role: StaffRole
  email?: string
  temporaryPassword: string
}

export interface CreateStaffWithPinRequest {
  displayName: string
  role: StaffRole
  pin: string
}

export interface StaffLoginWithPasswordRequest {
  email: string
  password: string
}

export interface StaffLoginWithPinRequest {
  staffId: string
  pin: string
}

export interface AcceptInviteRequest {
  token: string
  newPassword: string
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

// Matches backend StaffResponseDto (excludes sensitive fields)
export interface StaffMember {
  id: string
  businessId: string
  createdByOwnerId: string
  displayName: string
  role: (typeof staffRoles)[number]
  authType: string
  email: string | null
  inviteExpiresAt: string | null
  mustChangePassword: boolean
  avatarUrl: string | null
  isActive: boolean
  featureOverrides: Record<string, unknown> | null
  employeeId: string
  pinFailedAttempts: number
  pinLockedUntil: string | null
  lastLoginAt: string | null
  lastLoginIp: string | null
  lastLoginTerminal: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateStaffRoleRequest {
  role: StaffRole
}

export interface UpdateStaffRequest {
  avatarUrl?: string | null
  displayName?: string
  role?: StaffRole
  isActive?: boolean
}

export interface ValidationErrorResponse {
  errors: Array<{ field: string; message: string }>
}
