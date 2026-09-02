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
  listActiveSessions,
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

export function tablesQueryOptions(businessId: string) {
  return queryOptions({
    queryKey: platformQueryKeys.tables(businessId),
    queryFn: listTables,
    enabled: Boolean(businessId),
  })
}

export function tableByIdQueryOptions(businessId: string, tableId: string) {
  return queryOptions({
    queryKey: platformQueryKeys.tableById(businessId, tableId),
    queryFn: () => getTableById(tableId),
    enabled: Boolean(businessId) && Boolean(tableId),
  })
}

export function sessionBillQueryOptions(sessionId: string) {
  return queryOptions({
    queryKey: platformQueryKeys.sessionBill(sessionId),
    queryFn: () => getSessionBill(sessionId),
    enabled: Boolean(sessionId),
  })
}

export function activeSessionsQueryOptions(businessId: string) {
  return queryOptions({
    queryKey: platformQueryKeys.activeSessions(businessId),
    queryFn: listActiveSessions,
    enabled: Boolean(businessId),
  })
}

export function menuCategoriesQueryOptions(businessId: string, includeProducts = false) {
  return queryOptions({
    queryKey: platformQueryKeys.menuCategories(businessId, includeProducts),
    queryFn: () => listMenuCategories(includeProducts),
    enabled: Boolean(businessId),
  })
}

export function productsQueryOptions(
  businessId: string,
  filters?: { categoryId?: string; availableOnly?: boolean },
) {
  return queryOptions({
    queryKey: platformQueryKeys.products(businessId, filters),
    queryFn: () => listProducts(filters),
    enabled: Boolean(businessId),
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

export function ordersQueryOptions(
  businessId: string,
  filters?: {
    status?: OrderStatus
    tableId?: string
    limit?: number
    offset?: number
  },
) {
  return queryOptions({
    queryKey: platformQueryKeys.orders(businessId, filters),
    queryFn: () => listOrders(filters),
    enabled: Boolean(businessId),
  })
}

export function orderByIdQueryOptions(businessId: string, orderId: string) {
  return queryOptions({
    queryKey: platformQueryKeys.orderById(businessId, orderId),
    queryFn: () => getOrderById(orderId),
    enabled: Boolean(businessId) && Boolean(orderId),
  })
}

export function kitchenActiveOrdersQueryOptions(businessId: string) {
  return queryOptions({
    queryKey: platformQueryKeys.kitchenOrders(businessId),
    queryFn: fetchActiveKitchenOrders,
    enabled: Boolean(businessId),
    refetchInterval: 15000,
  })
}

export function paymentsQueryOptions(businessId: string) {
  return queryOptions({
    queryKey: platformQueryKeys.payments(businessId),
    queryFn: listPayments,
    enabled: Boolean(businessId),
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
  businessId: string,
  page: number,
  limit: number,
  filters?: { status?: OrderStatus; tableId?: string },
) {
  return queryOptions({
    queryKey: platformQueryKeys.ordersPaged(businessId, page, limit, filters),
    queryFn: () => listOrdersPaged({ page, limit, ...filters }),
    enabled: Boolean(businessId),
  })
}

export function pagedPaymentsQueryOptions(businessId: string, page: number, limit: number) {
  return queryOptions({
    queryKey: platformQueryKeys.paymentsPaged(businessId, page, limit),
    queryFn: () => listPaymentsPaged({ page, limit }),
    enabled: Boolean(businessId),
  })
}

export function pagedProductsQueryOptions(
  businessId: string,
  page: number,
  limit: number,
  filters?: { categoryId?: string; availableOnly?: boolean },
) {
  return queryOptions({
    queryKey: platformQueryKeys.productsPaged(businessId, page, limit, filters),
    queryFn: () => listProductsPaged({ page, limit, ...filters }),
    enabled: Boolean(businessId),
  })
}

export function pagedStaffQueryOptions(businessId: string, page: number, limit: number) {
  return queryOptions({
    queryKey: platformQueryKeys.staffPaged(businessId, page, limit),
    queryFn: () => listStaffPaged(businessId, { page, limit }),
    enabled: Boolean(businessId),
  })
}
