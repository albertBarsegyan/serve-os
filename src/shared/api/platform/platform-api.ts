import type { ResponsePromise } from 'ky'
import type { StaffAuthUser } from '#/features/auth/api/auth.types.ts'
import type {
  AcceptInviteRequest,
  AddModifierRequest,
  ChangePasswordRequest,
  ConfirmPaymentRequest,
  CreateMenuCategoryRequest,
  CreateModifierGroupRequest,
  CreateOrderRequest,
  CreatePaymentRequest,
  CreateProductRequest,
  CreateStaffOrderRequest,
  CreateStaffWithInviteRequest,
  CreateStaffWithPasswordRequest,
  CreateStaffWithPinRequest,
  CreateTableRequest,
  MenuCategory,
  Modifier,
  ModifierGroup,
  Order,
  OrderStatus,
  PaginatedResponse,
  Payment,
  ProcessPaymentRequest,
  Product,
  ScanSessionRequest,
  ScanSessionResponse,
  SessionBill,
  SetTableReservationRequest,
  StaffLoginWithPasswordRequest,
  StaffLoginWithPinRequest,
  StaffMember,
  TableEntity,
  ToggleTableStatusRequest,
  UpdateMenuCategoryRequest,
  UpdateModifierGroupRequest,
  UpdateModifierRequest,
  UpdateOrderStatusRequest,
  UpdateProductRequest,
  UpdateStaffRequest,
  UpdateStaffRoleRequest,
  UpdateTableRequest,
} from '#/features/platform/api/platform.types.ts'
import { clientApiInstance } from '#/shared/api/client-instance.ts'

type ListResponse<T> =
  | T[]
  | { data: T[]; total?: number; page?: number; limit?: number; totalPages?: number }
  | { data?: T[] }

function unwrapList<T>(payload: ListResponse<T>): T[] {
  if (Array.isArray(payload)) return payload
  return (payload as { data?: T[] }).data ?? []
}

// --- Tables ---

export function createTable(data: CreateTableRequest): Promise<TableEntity> {
  return clientApiInstance.post('tables', { json: data }).json<TableEntity>()
}

export function listTables(): Promise<TableEntity[]> {
  return clientApiInstance.get('tables').json<ListResponse<TableEntity>>().then(unwrapList)
}

export function getTableById(tableId: string): Promise<TableEntity> {
  return clientApiInstance.get(`tables/${tableId}`).json<TableEntity>()
}

export function updateTable(tableId: string, data: UpdateTableRequest): Promise<TableEntity> {
  return clientApiInstance.patch(`tables/${tableId}`, { json: data }).json<TableEntity>()
}

export function deleteTable(tableId: string): Promise<unknown> {
  return clientApiInstance.delete(`tables/${tableId}`)
}

export function toggleTableStatus(
  tableId: string,
  data: ToggleTableStatusRequest,
): Promise<TableEntity> {
  return clientApiInstance.patch(`tables/${tableId}/status`, { json: data }).json<TableEntity>()
}

export function setTableReservation(
  tableId: string,
  data: SetTableReservationRequest,
): Promise<TableEntity> {
  return clientApiInstance.patch(`tables/${tableId}/reserve`, { json: data }).json<TableEntity>()
}

export function uploadTableImage(tableId: string, file: File): Promise<TableEntity> {
  const formData = new FormData()
  formData.append('image', file)
  return clientApiInstance.post(`tables/${tableId}/image`, { body: formData }).json<TableEntity>()
}

// --- Table Sessions ---

export function scanSession(data: ScanSessionRequest): Promise<ScanSessionResponse> {
  return clientApiInstance.post('sessions/scan', { json: data }).json<ScanSessionResponse>()
}

export function closeSession(sessionId: string): Promise<void> {
  return clientApiInstance.post(`sessions/${sessionId}/close`).json<void>()
}

export function getSessionBill(sessionId: string): Promise<SessionBill> {
  return clientApiInstance.get(`sessions/${sessionId}/bill`).json<SessionBill>()
}

// --- Menu Categories ---

export function createMenuCategory(data: CreateMenuCategoryRequest): Promise<MenuCategory> {
  return clientApiInstance.post('menu/categories', { json: data }).json<MenuCategory>()
}

export function listMenuCategories(includeProducts = false): Promise<MenuCategory[]> {
  return clientApiInstance
    .get('menu/categories', {
      searchParams: includeProducts ? { includeProducts: 'true' } : undefined,
    })
    .json<ListResponse<MenuCategory>>()
    .then(unwrapList)
}

export function updateMenuCategory(
  categoryId: string,
  data: UpdateMenuCategoryRequest,
): Promise<MenuCategory> {
  return clientApiInstance
    .patch(`menu/categories/${categoryId}`, { json: data })
    .json<MenuCategory>()
}

export function deleteMenuCategory(categoryId: string): ResponsePromise<void> {
  return clientApiInstance.delete(`menu/categories/${categoryId}`)
}

// --- Products ---

export function createProduct(data: CreateProductRequest): Promise<Product> {
  return clientApiInstance.post('menu/products', { json: data }).json<Product>()
}

export function listProducts(filters?: {
  categoryId?: string
  availableOnly?: boolean
}): Promise<Product[]> {
  return clientApiInstance
    .get('menu/products', {
      searchParams: {
        ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(filters?.availableOnly ? { availableOnly: 'true' } : {}),
        limit: '500',
        page: '1',
      },
    })
    .json<ListResponse<Product>>()
    .then(unwrapList)
}

export function listProductsPaged(params: {
  page: number
  limit: number
  categoryId?: string
  availableOnly?: boolean
}): Promise<PaginatedResponse<Product>> {
  return clientApiInstance
    .get('menu/products', {
      searchParams: {
        page: String(params.page),
        limit: String(params.limit),
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
        ...(params.availableOnly ? { availableOnly: 'true' } : {}),
      },
    })
    .json<PaginatedResponse<Product>>()
}

export function updateProduct(productId: string, data: UpdateProductRequest): Promise<Product> {
  return clientApiInstance.patch(`menu/products/${productId}`, { json: data }).json<Product>()
}

export function setProductAvailability(productId: string, isAvailable: boolean): Promise<Product> {
  return clientApiInstance
    .patch(`menu/products/${productId}/availability`, { json: { isAvailable } })
    .json<Product>()
}

export function deleteProduct(productId: string): Promise<{ message: string }> {
  return clientApiInstance.delete(`menu/products/${productId}`).json<{ message: string }>()
}

export function syncProductModifierGroups(productId: string, groupIds: string[]): Promise<Product> {
  return clientApiInstance
    .put(`menu/products/${productId}/modifier-groups`, { json: { groupIds } })
    .json<Product>()
}

// --- Modifier Groups ---

export function createModifierGroup(
  businessId: string,
  data: CreateModifierGroupRequest,
): Promise<ModifierGroup> {
  return clientApiInstance
    .post(`businesses/${businessId}/modifier-groups`, { json: data })
    .json<ModifierGroup>()
}

export function listModifierGroups(businessId: string): Promise<ModifierGroup[]> {
  return clientApiInstance
    .get(`businesses/${businessId}/modifier-groups`)
    .json<ListResponse<ModifierGroup>>()
    .then(unwrapList)
}

export function getModifierGroupById(businessId: string, groupId: string): Promise<ModifierGroup> {
  return clientApiInstance
    .get(`businesses/${businessId}/modifier-groups/${groupId}`)
    .json<ModifierGroup>()
}

export function updateModifierGroup(
  businessId: string,
  groupId: string,
  data: UpdateModifierGroupRequest,
): Promise<ModifierGroup> {
  return clientApiInstance
    .put(`businesses/${businessId}/modifier-groups/${groupId}`, { json: data })
    .json<ModifierGroup>()
}

export function deleteModifierGroup(businessId: string, groupId: string) {
  return clientApiInstance.delete(`businesses/${businessId}/modifier-groups/${groupId}`)
}

// --- Modifiers ---

export function addModifierToGroup(
  businessId: string,
  groupId: string,
  data: AddModifierRequest,
): Promise<Modifier> {
  return clientApiInstance
    .post(`businesses/${businessId}/modifier-groups/${groupId}/modifiers`, { json: data })
    .json<Modifier>()
}

export function listModifiers(businessId: string, groupId: string): Promise<Modifier[]> {
  return clientApiInstance
    .get(`businesses/${businessId}/modifier-groups/${groupId}/modifiers`)
    .json<ListResponse<Modifier>>()
    .then(unwrapList)
}

export function updateModifier(
  businessId: string,
  groupId: string,
  modifierId: string,
  data: UpdateModifierRequest,
): Promise<Modifier> {
  return clientApiInstance
    .put(`businesses/${businessId}/modifier-groups/${groupId}/modifiers/${modifierId}`, {
      json: data,
    })
    .json<Modifier>()
}

export function deleteModifier(
  businessId: string,
  groupId: string,
  modifierId: string,
): Promise<void> {
  return clientApiInstance
    .delete(`businesses/${businessId}/modifier-groups/${groupId}/modifiers/${modifierId}`)
    .json<void>()
}

// --- Orders ---

export function createOrder(data: CreateOrderRequest): Promise<Order> {
  return clientApiInstance.post('orders', { json: data }).json<Order>()
}

export function createStaffOrder(data: CreateStaffOrderRequest): Promise<Order> {
  return clientApiInstance.post('orders/staff', { json: data }).json<Order>()
}

export function updateOrderStatus(orderId: string, data: UpdateOrderStatusRequest): Promise<Order> {
  return clientApiInstance.patch(`orders/${orderId}/status`, { json: data }).json<Order>()
}

export function confirmOrder(orderId: string): Promise<Order> {
  return clientApiInstance.post(`orders/${orderId}/confirm`).json<Order>()
}

export function listOrders(filters?: { status?: OrderStatus; tableId?: string }): Promise<Order[]> {
  return clientApiInstance
    .get('orders', {
      searchParams: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.tableId ? { tableId: filters.tableId } : {}),
        limit: '500',
        page: '1',
      },
    })
    .json<ListResponse<Order>>()
    .then(unwrapList)
}

export function listOrdersPaged(params: {
  page: number
  limit: number
  status?: OrderStatus
  tableId?: string
}): Promise<PaginatedResponse<Order>> {
  return clientApiInstance
    .get('orders', {
      searchParams: {
        page: String(params.page),
        limit: String(params.limit),
        ...(params.status ? { status: params.status } : {}),
        ...(params.tableId ? { tableId: params.tableId } : {}),
      },
    })
    .json<PaginatedResponse<Order>>()
}

export function getOrderById(orderId: string): Promise<Order> {
  return clientApiInstance.get(`orders/${orderId}`).json<Order>()
}

export function processCashPayment(orderId: string, data: ProcessPaymentRequest): Promise<Payment> {
  return clientApiInstance.post(`orders/${orderId}/payment/cash`, { json: data }).json<Payment>()
}

export function processPosPayment(orderId: string, data: ProcessPaymentRequest): Promise<Payment> {
  return clientApiInstance.post(`orders/${orderId}/payment/pos`, { json: data }).json<Payment>()
}

// --- Payments ---

export function createPayment(data: CreatePaymentRequest): Promise<Payment> {
  return clientApiInstance.post('payments', { json: data }).json<Payment>()
}

export function listPayments(): Promise<Payment[]> {
  return clientApiInstance
    .get('payments', { searchParams: { limit: '500', page: '1' } })
    .json<ListResponse<Payment>>()
    .then(unwrapList)
}

export function listPaymentsPaged(params: {
  page: number
  limit: number
}): Promise<PaginatedResponse<Payment>> {
  return clientApiInstance
    .get('payments', {
      searchParams: { page: String(params.page), limit: String(params.limit) },
    })
    .json<PaginatedResponse<Payment>>()
}

export function confirmPayment(paymentId: string, data: ConfirmPaymentRequest): Promise<Payment> {
  return clientApiInstance.patch(`payments/${paymentId}/confirm`, { json: data }).json<Payment>()
}

// --- Staff ---

export function createStaffWithInvite(
  businessId: string,
  data: CreateStaffWithInviteRequest,
): Promise<StaffMember> {
  return clientApiInstance
    .post(`businesses/${businessId}/staff/invite`, { json: data })
    .json<StaffMember>()
}

export function createStaffWithPassword(
  businessId: string,
  data: CreateStaffWithPasswordRequest,
): Promise<StaffMember> {
  return clientApiInstance
    .post(`businesses/${businessId}/staff/password`, { json: data })
    .json<StaffMember>()
}

export function createStaffWithPin(
  businessId: string,
  data: CreateStaffWithPinRequest,
): Promise<StaffMember> {
  return clientApiInstance
    .post(`businesses/${businessId}/staff/pin`, { json: data })
    .json<StaffMember>()
}

export type StaffLoginSuccess = { tokens: { accessToken: string }; user: StaffAuthUser }
export type StaffLoginRequiresPasswordChange = {
  requiresPasswordChange: true
  staffId: string
  tokens: { accessToken: string }
}

export function loginStaffWithPassword(
  businessId: string,
  data: StaffLoginWithPasswordRequest,
): Promise<StaffLoginSuccess | StaffLoginRequiresPasswordChange> {
  return clientApiInstance
    .post(`businesses/${businessId}/staff/login`, { json: data })
    .json<StaffLoginSuccess | StaffLoginRequiresPasswordChange>()
}

export function loginStaffWithPin(
  businessId: string,
  data: StaffLoginWithPinRequest,
): Promise<StaffLoginSuccess> {
  return clientApiInstance
    .post(`businesses/${businessId}/staff/login/pin`, { json: data })
    .json<StaffLoginSuccess>()
}

export function logoutStaff(businessId: string): Promise<void> {
  return clientApiInstance.post(`businesses/${businessId}/staff/logout`).json<void>()
}

export function acceptStaffInvite(data: AcceptInviteRequest): Promise<void> {
  return clientApiInstance.post('staff/accept-invite', { json: data }).json<void>()
}

export function changePassword(data: ChangePasswordRequest): Promise<void> {
  return clientApiInstance.post('staff/change-password', { json: data }).json<void>()
}

export async function listStaff(businessId: string): Promise<StaffMember[]> {
  const payload = await clientApiInstance
    .get(`businesses/${businessId}/staff`, { searchParams: { limit: '500', page: '1' } })
    .json<ListResponse<StaffMember>>()
  return unwrapList(payload)
}

export function listStaffPaged(
  businessId: string,
  params: { page: number; limit: number },
): Promise<PaginatedResponse<StaffMember>> {
  return clientApiInstance
    .get(`businesses/${businessId}/staff`, {
      searchParams: { page: String(params.page), limit: String(params.limit) },
    })
    .json<PaginatedResponse<StaffMember>>()
}

export function getStaffById(businessId: string, staffId: string): Promise<StaffMember> {
  return clientApiInstance.get(`businesses/${businessId}/staff/${staffId}`).json<StaffMember>()
}

export function updateStaffRole(
  businessId: string,
  staffId: string,
  data: UpdateStaffRoleRequest,
): Promise<StaffMember> {
  return clientApiInstance
    .patch(`businesses/${businessId}/staff/${staffId}`, { json: data })
    .json<StaffMember>()
}

export function updateStaff(
  businessId: string,
  staffId: string,
  data: UpdateStaffRequest,
): Promise<StaffMember> {
  return clientApiInstance
    .patch(`businesses/${businessId}/staff/${staffId}`, { json: data })
    .json<StaffMember>()
}

export function removeStaff(businessId: string, staffId: string): Promise<{ message: string }> {
  return clientApiInstance
    .delete(`businesses/${businessId}/staff/${staffId}`)
    .json<{ message: string }>()
}

export function unlockStaff(businessId: string, staffId: string): Promise<StaffMember> {
  return clientApiInstance
    .post(`businesses/${businessId}/staff/${staffId}/unlock`)
    .json<StaffMember>()
}

// --- Kitchen (active orders only — /kitchen/active-orders) ---

export function fetchActiveKitchenOrders(): Promise<Order[]> {
  return clientApiInstance.get('kitchen/active-orders').json<ListResponse<Order>>().then(unwrapList)
}
