import { queryOptions } from '@tanstack/react-query'
import type { OrderStatus } from '#/features/platform/api/platform.types.ts'
import { platformQueryKeys } from '#/features/platform/lib/constants/platform-query-keys.ts'
import {
  fetchActiveKitchenOrders,
  getModifierGroupById,
  getOrderById,
  getSessionBill,
  getStaffById,
  getTableById,
  listMenuCategories,
  listModifierGroups,
  listModifiers,
  listOrders,
  listOrdersPaged,
  listPayments,
  listPaymentsPaged,
  listProducts,
  listProductsPaged,
  listStaff,
  listStaffPaged,
  listTables,
} from '#/shared/api/platform/platform-api.ts'

export function tablesQueryOptions() {
  return queryOptions({
    queryKey: platformQueryKeys.tables(),
    queryFn: listTables,
  })
}

export function tableByIdQueryOptions(tableId: string) {
  return queryOptions({
    queryKey: platformQueryKeys.tableById(tableId),
    queryFn: () => getTableById(tableId),
    enabled: Boolean(tableId),
  })
}

export function sessionBillQueryOptions(sessionId: string) {
  return queryOptions({
    queryKey: platformQueryKeys.sessionBill(sessionId),
    queryFn: () => getSessionBill(sessionId),
    enabled: Boolean(sessionId),
  })
}

export function menuCategoriesQueryOptions(includeProducts = false) {
  return queryOptions({
    queryKey: platformQueryKeys.menuCategories(includeProducts),
    queryFn: () => listMenuCategories(includeProducts),
  })
}

export function productsQueryOptions(filters?: { categoryId?: string; availableOnly?: boolean }) {
  return queryOptions({
    queryKey: platformQueryKeys.products(filters),
    queryFn: () => listProducts(filters),
  })
}

export function modifierGroupsQueryOptions(businessId: string) {
  return queryOptions({
    queryKey: platformQueryKeys.modifierGroups(businessId),
    queryFn: () => listModifierGroups(businessId),
    enabled: Boolean(businessId),
  })
}

export function modifierGroupByIdQueryOptions(businessId: string, groupId: string) {
  return queryOptions({
    queryKey: platformQueryKeys.modifierGroupById(businessId, groupId),
    queryFn: () => getModifierGroupById(businessId, groupId),
    enabled: Boolean(businessId) && Boolean(groupId),
  })
}

export function modifiersQueryOptions(businessId: string, groupId: string) {
  return queryOptions({
    queryKey: platformQueryKeys.modifiers(businessId, groupId),
    queryFn: () => listModifiers(businessId, groupId),
    enabled: Boolean(businessId) && Boolean(groupId),
  })
}

export function ordersQueryOptions(filters?: {
  status?: OrderStatus
  tableId?: string
  limit?: number
  offset?: number
}) {
  return queryOptions({
    queryKey: platformQueryKeys.orders(filters),
    queryFn: () => listOrders(filters),
  })
}

export function orderByIdQueryOptions(orderId: string) {
  return queryOptions({
    queryKey: platformQueryKeys.orderById(orderId),
    queryFn: () => getOrderById(orderId),
    enabled: Boolean(orderId),
  })
}

export function kitchenActiveOrdersQueryOptions() {
  return queryOptions({
    queryKey: platformQueryKeys.kitchenOrders(),
    queryFn: fetchActiveKitchenOrders,
    refetchInterval: 15000,
  })
}

export function paymentsQueryOptions() {
  return queryOptions({
    queryKey: platformQueryKeys.payments(),
    queryFn: listPayments,
  })
}

export function staffQueryOptions(businessId: string) {
  return queryOptions({
    queryKey: platformQueryKeys.staff(businessId),
    queryFn: () => listStaff(businessId),
    enabled: Boolean(businessId),
  })
}

export function staffByIdQueryOptions(businessId: string, staffId: string) {
  return queryOptions({
    queryKey: platformQueryKeys.staffById(businessId, staffId),
    queryFn: () => getStaffById(businessId, staffId),
    enabled: Boolean(businessId) && Boolean(staffId),
  })
}

// ── Paginated variants ────────────────────────────────────────────────────────

export function pagedOrdersQueryOptions(
  page: number,
  limit: number,
  filters?: { status?: OrderStatus; tableId?: string },
) {
  return queryOptions({
    queryKey: platformQueryKeys.ordersPaged(page, limit, filters),
    queryFn: () => listOrdersPaged({ page, limit, ...filters }),
  })
}

export function pagedPaymentsQueryOptions(page: number, limit: number) {
  return queryOptions({
    queryKey: platformQueryKeys.paymentsPaged(page, limit),
    queryFn: () => listPaymentsPaged({ page, limit }),
  })
}

export function pagedProductsQueryOptions(
  page: number,
  limit: number,
  filters?: { categoryId?: string; availableOnly?: boolean },
) {
  return queryOptions({
    queryKey: platformQueryKeys.productsPaged(page, limit, filters),
    queryFn: () => listProductsPaged({ page, limit, ...filters }),
  })
}

export function pagedStaffQueryOptions(businessId: string, page: number, limit: number) {
  return queryOptions({
    queryKey: platformQueryKeys.staffPaged(businessId, page, limit),
    queryFn: () => listStaffPaged(businessId, { page, limit }),
    enabled: Boolean(businessId),
  })
}
