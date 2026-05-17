import { clientApiInstance } from '#/shared/api/client-instance.ts'
import type {
  AssignKitchenTicketRequest,
  AttachModifierGroupsRequest,
  BusinessPaymentMethod,
  ConfirmPaymentRequest,
  CreateCustomerSessionRequest,
  CreateMenuCategoryRequest,
  CreateModifierGroupRequest,
  CreateOrderRequest,
  CreatePaymentRequest,
  CreateProductRequest,
  CreateStaffInviteRequest,
  CreateTableRequest,
  CustomerSession,
  KitchenTicket,
  KitchenTicketStatus,
  MenuCategory,
  Modifier,
  ModifierGroup,
  Order,
  OrderStatus,
  Payment,
  Product,
  StaffInvite,
  StaffMember,
  TableEntity,
  UpdateKitchenTicketStatusRequest,
  UpdateOrderItemsRequest,
  UpdateOrderStatusRequest,
  UpdateProductRequest,
  UpdateStaffRoleRequest,
  UpdateTableRequest,
  UpsertBusinessPaymentMethodRequest,
} from '#/features/platform/api/platform.types.ts'

type ListResponse<T> = T[] | { data?: T[] }

function unwrapList<T>(payload: ListResponse<T>): T[] {
  if (Array.isArray(payload)) return payload
  return payload.data ?? []
}

export function createCustomerSession(data: CreateCustomerSessionRequest): Promise<CustomerSession> {
  return clientApiInstance.post('customer-sessions', { json: data }).json<CustomerSession>()
}

export function getCustomerSessionByToken(token: string): Promise<CustomerSession> {
  return clientApiInstance
    .get(`customer-sessions/token/${encodeURIComponent(token)}`)
    .json<CustomerSession>()
}

export function createTable(data: CreateTableRequest): Promise<TableEntity> {
  return clientApiInstance.post('tables', { json: data }).json<TableEntity>()
}

export function listTables(): Promise<TableEntity[]> {
  return clientApiInstance
    .get('tables')
    .json<ListResponse<TableEntity>>()
    .then(unwrapList)
}

export function getTableById(tableId: string): Promise<TableEntity> {
  return clientApiInstance.get(`tables/${tableId}`).json<TableEntity>()
}

export function updateTable(tableId: string, data: UpdateTableRequest): Promise<TableEntity> {
  return clientApiInstance.patch(`tables/${tableId}`, { json: data }).json<TableEntity>()
}

export function deleteTable(tableId: string): Promise<{ message: string }> {
  return clientApiInstance.delete(`tables/${tableId}`).json<{ message: string }>()
}

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
      },
    })
    .json<ListResponse<Product>>()
    .then(unwrapList)
}

export function updateProduct(productId: string, data: UpdateProductRequest): Promise<Product> {
  return clientApiInstance.patch(`menu/products/${productId}`, { json: data }).json<Product>()
}

export function deleteProduct(productId: string): Promise<{ message: string }> {
  return clientApiInstance.delete(`menu/products/${productId}`).json<{ message: string }>()
}

export function createModifierGroup(data: CreateModifierGroupRequest): Promise<ModifierGroup> {
  return clientApiInstance.post('modifier-groups', { json: data }).json<ModifierGroup>()
}

export function addModifierToGroup(
  groupId: string,
  data: { name: string; priceAdjustment: string; position?: number; isActive?: boolean },
): Promise<Modifier> {
  return clientApiInstance
    .post(`modifier-groups/${groupId}/modifiers`, { json: data })
    .json<Modifier>()
}

export function attachModifierGroupsToProduct(
  productId: string,
  data: AttachModifierGroupsRequest,
): Promise<Product> {
  return clientApiInstance
    .post(`menu/products/${productId}/modifier-groups`, { json: data })
    .json<Product>()
}

export function createOrder(data: CreateOrderRequest): Promise<Order> {
  return clientApiInstance.post('orders', { json: data }).json<Order>()
}

export function updateOrderStatus(orderId: string, data: UpdateOrderStatusRequest): Promise<Order> {
  return clientApiInstance.patch(`orders/${orderId}/status`, { json: data }).json<Order>()
}

export function updateOrderItems(orderId: string, data: UpdateOrderItemsRequest): Promise<Order> {
  return clientApiInstance.patch(`orders/${orderId}/items`, { json: data }).json<Order>()
}

export function listOrders(filters?: {
  status?: OrderStatus
  tableId?: string
  limit?: number
  offset?: number
}): Promise<Order[]> {
  return clientApiInstance
    .get('orders', {
      searchParams: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.tableId ? { tableId: filters.tableId } : {}),
        ...(typeof filters?.limit === 'number' ? { limit: String(filters.limit) } : {}),
        ...(typeof filters?.offset === 'number' ? { offset: String(filters.offset) } : {}),
      },
    })
    .json<ListResponse<Order>>()
    .then(unwrapList)
}

export function getOrderById(orderId: string): Promise<Order> {
  return clientApiInstance.get(`orders/${orderId}`).json<Order>()
}

export function listKitchenTickets(filters?: {
  status?: Extract<KitchenTicketStatus, 'PREPARING' | 'READY'>
}): Promise<KitchenTicket[]> {
  return clientApiInstance
    .get('kitchen/tickets', {
      searchParams: filters?.status ? { status: filters.status } : undefined,
    })
    .json<ListResponse<KitchenTicket>>()
    .then(unwrapList)
}

export function assignKitchenTicket(
  ticketId: string,
  data: AssignKitchenTicketRequest,
): Promise<KitchenTicket> {
  return clientApiInstance.patch(`kitchen/tickets/${ticketId}/assign`, { json: data }).json<KitchenTicket>()
}

export function updateKitchenTicketStatus(
  ticketId: string,
  data: UpdateKitchenTicketStatusRequest,
): Promise<KitchenTicket> {
  return clientApiInstance
    .patch(`kitchen/tickets/${ticketId}/status`, { json: data })
    .json<KitchenTicket>()
}

export function createPayment(data: CreatePaymentRequest): Promise<Payment> {
  return clientApiInstance.post('payments', { json: data }).json<Payment>()
}

export function confirmPayment(paymentId: string, data: ConfirmPaymentRequest): Promise<Payment> {
  return clientApiInstance.post(`payments/${paymentId}/confirm`, { json: data }).json<Payment>()
}

export function createStaffInvite(data: CreateStaffInviteRequest): Promise<StaffInvite> {
  return clientApiInstance.post('staff/invites', { json: data }).json<StaffInvite>()
}

export function acceptStaffInvite(token: string): Promise<StaffInvite> {
  return clientApiInstance.get(`staff/invites/accept/${encodeURIComponent(token)}`).json<StaffInvite>()
}

export function listStaff(): Promise<StaffMember[]> {
  return clientApiInstance
    .get('staff')
    .json<ListResponse<StaffMember>>()
    .then(unwrapList)
}

export function getStaffById(staffId: string): Promise<StaffMember> {
  return clientApiInstance.get(`staff/${staffId}`).json<StaffMember>()
}

export function updateStaffRole(staffId: string, data: UpdateStaffRoleRequest): Promise<StaffMember> {
  return clientApiInstance.patch(`staff/${staffId}`, { json: data }).json<StaffMember>()
}

export function removeStaff(staffId: string): Promise<{ message: string }> {
  return clientApiInstance.delete(`staff/${staffId}`).json<{ message: string }>()
}

export function listBusinessPaymentMethods(): Promise<BusinessPaymentMethod[]> {
  return clientApiInstance
    .get('business/payment-methods')
    .json<ListResponse<BusinessPaymentMethod>>()
    .then(unwrapList)
}

export function upsertBusinessPaymentMethod(
  data: UpsertBusinessPaymentMethodRequest,
): Promise<BusinessPaymentMethod> {
  return clientApiInstance.post('business/payment-methods', { json: data }).json<BusinessPaymentMethod>()
}

