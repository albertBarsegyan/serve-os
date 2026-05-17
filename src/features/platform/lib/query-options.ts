import { queryOptions } from '@tanstack/react-query'
import type { OrderStatus } from '#/features/platform/api/platform.types.ts'
import { platformQueryKeys } from '#/features/platform/lib/constants/platform-query-keys.ts'
import {
  getCustomerSessionByToken,
  getOrderById,
  getStaffById,
  getTableById,
  listBusinessPaymentMethods,
  listKitchenTickets,
  listMenuCategories,
  listOrders,
  listProducts,
  listStaff,
  listTables,
} from '#/shared/api/platform/platform-api.ts'

export function customerSessionByTokenQueryOptions(token: string) {
  return queryOptions({
    queryKey: platformQueryKeys.customerSessionByToken(token),
    queryFn: () => getCustomerSessionByToken(token),
    enabled: Boolean(token),
  })
}

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

export function kitchenTicketsQueryOptions(status?: 'PREPARING' | 'READY') {
  return queryOptions({
    queryKey: platformQueryKeys.kitchenTickets(status),
    queryFn: () => listKitchenTickets(status ? { status } : undefined),
  })
}

export function staffQueryOptions() {
  return queryOptions({
    queryKey: platformQueryKeys.staff(),
    queryFn: listStaff,
  })
}

export function staffByIdQueryOptions(staffId: string) {
  return queryOptions({
    queryKey: platformQueryKeys.staffById(staffId),
    queryFn: () => getStaffById(staffId),
    enabled: Boolean(staffId),
  })
}

export function businessPaymentMethodsQueryOptions() {
  return queryOptions({
    queryKey: platformQueryKeys.businessPaymentMethods(),
    queryFn: listBusinessPaymentMethods,
  })
}

