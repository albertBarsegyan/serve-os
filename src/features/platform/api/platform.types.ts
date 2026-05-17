export const roles = ['OWNER', 'ADMIN', 'WAITER', 'CHEF'] as const
export type Role = (typeof roles)[number]

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

export const paymentMethods = ['CASH', 'POS', 'ONLINE'] as const
export type PaymentMethod = (typeof paymentMethods)[number]

export const paymentStatuses = ['PENDING', 'CONFIRMED', 'FAILED'] as const
export type PaymentStatus = (typeof paymentStatuses)[number]

export const orderStatuses = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'DELIVERED',
  'CLOSED',
  'CANCELLED',
] as const
export type OrderStatus = (typeof orderStatuses)[number]

export const kitchenTicketStatuses = ['PREPARING', 'READY', 'CANCELLED'] as const
export type KitchenTicketStatus = (typeof kitchenTicketStatuses)[number]

export interface ApiListQuery {
  limit?: number
  offset?: number
}

export interface CustomerSession {
  id: string
  businessId: string
  tableId: string
  token: string
  expiresAt: string | null
  isActive: boolean
  createdAt: string
}

export interface CreateCustomerSessionRequest {
  businessId?: string
  tableId: string
  expiresAt?: string
}

export interface TableEntity {
  id: string
  businessId: string
  number: number
  qrCode: string
  capacity: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTableRequest {
  number: number
  capacity: number
  qrCode: string
  isActive?: boolean
}

export interface UpdateTableRequest {
  number?: number
  capacity?: number
  qrCode?: string
  isActive?: boolean
}

export interface MenuCategory {
  id: string
  businessId: string
  name: string
  sortOrder: number
  products?: Product[]
}

export interface CreateMenuCategoryRequest {
  name: string
  sortOrder?: number
}

export interface Modifier {
  id: string
  businessId: string
  modifierGroupId: string
  name: string
  priceAdjustment: string
  position: number
  isActive: boolean
}

export interface ModifierGroup {
  id: string
  businessId: string
  name: string
  selectionType: 'SINGLE' | 'MULTIPLE'
  isRequired: boolean
  minSelections: number | null
  maxSelections: number | null
  position: number
  isActive: boolean
  modifiers: Modifier[]
}

export interface Product {
  id: string
  businessId: string
  categoryId: string
  name: string
  description?: string
  price: string
  imageUrl?: string
  isAvailable: boolean
  allergens: string[]
  modifierGroups: ModifierGroup[]
}

export interface CreateProductRequest {
  name: string
  description?: string
  price: string
  categoryId: string
  imageUrl?: string
  isAvailable?: boolean
  allergens?: string[]
  modifierGroupIds?: string[]
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  price?: string
  categoryId?: string
  imageUrl?: string
  isAvailable?: boolean
  allergens?: string[]
}

export interface CreateModifierGroupRequest {
  name: string
  selectionType: 'SINGLE' | 'MULTIPLE'
  isRequired?: boolean
  minSelections?: number
  maxSelections?: number
  position?: number
  isActive?: boolean
}

export interface AddModifierRequest {
  name: string
  priceAdjustment: string
  position?: number
  isActive?: boolean
}

export interface AttachModifierGroupsRequest {
  modifierGroupIds: string[]
}

export interface OrderItemSelectedModifier {
  modifierId: string
  name: string
  priceAdjustment: string
}

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: string
  notes?: string
  selectedModifiers: OrderItemSelectedModifier[]
}

export interface Order {
  id: string
  businessId: string
  tableId: string | null
  waiterId: string | null
  status: OrderStatus
  paymentMethod: PaymentMethod | null
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED'
  totalAmount: string
  items: OrderItem[]
  createdAt: string
}

export interface CreateOrderItemRequest {
  productId: string
  quantity: number
  unitPrice: string
  notes?: string
  selectedModifierIds?: string[]
}

export interface CreateOrderRequest {
  customerSessionToken?: string
  tableId?: string
  items: CreateOrderItemRequest[]
  paymentMethod?: PaymentMethod
}

export interface UpdateOrderStatusRequest {
  status: Exclude<OrderStatus, 'PENDING' | 'CONFIRMED'>
}

export interface UpdateOrderItemsRequest {
  items: CreateOrderItemRequest[]
}

export interface KitchenTicketItem {
  orderItemId: string
  productId: string
  productName: string
  notes?: string
  quantity: number
  kitchenStationId?: string
}

export interface KitchenTicket {
  id: string
  orderId: string
  items: KitchenTicketItem[]
  status: KitchenTicketStatus
  createdAt: string
}

export interface AssignKitchenTicketRequest {
  stationId: string
  chefId: string
}

export interface UpdateKitchenTicketStatusRequest {
  status: Exclude<KitchenTicketStatus, 'CANCELLED'>
}

export interface Payment {
  id: string
  businessId: string
  orderId: string
  method: PaymentMethod
  status: PaymentStatus
  amount: string
  confirmedAt: string | null
  confirmedBy: string | null
  createdAt: string
}

export interface CreatePaymentRequest {
  orderId: string
  method: PaymentMethod
  amount: string
  metadata?: Record<string, unknown>
}

export interface ConfirmPaymentRequest {
  confirmedBy: string
}

export interface StaffInvite {
  id: string
  businessId: string
  invitedBy: string
  email: string
  role: Exclude<Role, 'OWNER'>
  token: string
  expiresAt: string | null
  isAccepted: boolean
  createdAt: string
}

export interface CreateStaffInviteRequest {
  email: string
  role: Exclude<Role, 'OWNER'>
  expiresAt?: string
}

export interface StaffMember {
  id: string
  businessId: string
  userId: string
  role: Role
  email?: string
  firstName?: string
  lastName?: string
  createdAt?: string
  updatedAt?: string
}

export interface UpdateStaffRoleRequest {
  role: Role
}

export interface BusinessPaymentMethod {
  id: string
  businessId: string
  method: PaymentMethod
  isActive: boolean
  config?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export interface UpsertBusinessPaymentMethodRequest {
  method: PaymentMethod
  isActive: boolean
  config?: Record<string, unknown>
}

export interface ValidationErrorResponse {
  errors: Array<{ field: string; message: string }>
}

