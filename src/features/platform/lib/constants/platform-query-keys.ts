// `*Root` builders take an *optional* businessId: pass it to scope a read/precise
// invalidation to one business; omit it only for a broad invalidation that should
// catch every business's cached entries under that root (still correct — TanStack
// Query's default `exact: false` matches by prefix, so the shorter key still matches
// every longer key beneath it, it's just less targeted than passing a businessId).
function scopedRoot(segment: string, businessId?: string) {
  return businessId
    ? ([...platformQueryKeys.root, segment, businessId] as const)
    : ([...platformQueryKeys.root, segment] as const)
}

export const platformQueryKeys = {
  root: ['platform'] as const,

  tablesRoot: (businessId?: string) => scopedRoot('tables', businessId),
  tables: (businessId: string) => [...platformQueryKeys.tablesRoot(businessId), 'list'] as const,
  tableById: (businessId: string, tableId: string) =>
    [...platformQueryKeys.tablesRoot(businessId), 'detail', tableId] as const,

  // Session-scoped (guest ordering) — sessionId is itself the tenant boundary,
  // there's no logged-in "active business" for a customer to key off of.
  sessions: () => [...platformQueryKeys.root, 'sessions'] as const,
  sessionBill: (sessionId: string) => [...platformQueryKeys.sessions(), sessionId, 'bill'] as const,

  menuCategoriesRoot: (businessId?: string) => scopedRoot('menu-categories', businessId),
  menuCategories: (businessId: string, includeProducts: boolean) =>
    [
      ...platformQueryKeys.menuCategoriesRoot(businessId),
      includeProducts ? 'with-products' : 'flat',
    ] as const,
  categoryById: (businessId: string, categoryId: string) =>
    [...platformQueryKeys.menuCategoriesRoot(businessId), 'detail', categoryId] as const,

  productsRoot: (businessId?: string) => scopedRoot('products', businessId),
  products: (businessId: string, filters?: { categoryId?: string; availableOnly?: boolean }) =>
    [
      ...platformQueryKeys.productsRoot(businessId),
      'list',
      filters?.categoryId ?? 'all-categories',
      filters?.availableOnly ? 'available-only' : 'all',
    ] as const,
  productsPaged: (
    businessId: string,
    page: number,
    limit: number,
    filters?: { categoryId?: string; availableOnly?: boolean },
  ) =>
    [
      ...platformQueryKeys.productsRoot(businessId),
      'list-paged',
      page,
      limit,
      filters?.categoryId ?? 'all-categories',
      filters?.availableOnly ? 'available-only' : 'all',
    ] as const,
  productById: (businessId: string, productId: string) =>
    [...platformQueryKeys.productsRoot(businessId), 'detail', productId] as const,

  modifierGroups: (businessId: string) =>
    [...platformQueryKeys.root, 'modifier-groups', businessId] as const,
  modifierGroupById: (businessId: string, groupId: string) =>
    [...platformQueryKeys.modifierGroups(businessId), groupId] as const,
  modifiers: (businessId: string, groupId: string) =>
    [...platformQueryKeys.modifierGroupById(businessId, groupId), 'modifiers'] as const,

  ordersRoot: (businessId?: string) => scopedRoot('orders', businessId),
  orders: (businessId: string, filters?: { status?: string; tableId?: string }) =>
    [
      ...platformQueryKeys.ordersRoot(businessId),
      'list',
      filters?.status ?? 'all-statuses',
      filters?.tableId ?? 'all-tables',
    ] as const,
  ordersPaged: (
    businessId: string,
    page: number,
    limit: number,
    filters?: { status?: string; tableId?: string },
  ) =>
    [
      ...platformQueryKeys.ordersRoot(businessId),
      'list-paged',
      page,
      limit,
      filters?.status ?? 'all-statuses',
      filters?.tableId ?? 'all-tables',
    ] as const,
  orderById: (businessId: string, orderId: string) =>
    [...platformQueryKeys.ordersRoot(businessId), 'detail', orderId] as const,

  // Optional businessId, like the other `*Root` builders — but note that reads
  // (`kitchenActiveOrdersQueryOptions`) always pass a concrete businessId, so any
  // code doing an *exact*-key cache operation (getQueryData/setQueryData, not
  // invalidateQueries) against this key must pass the same businessId too, or it
  // will silently miss the real cache entry instead of matching it.
  kitchenOrders: (businessId?: string) => scopedRoot('kitchen-orders', businessId),

  paymentsRoot: (businessId?: string) => scopedRoot('payments', businessId),
  payments: (businessId: string) =>
    [...platformQueryKeys.paymentsRoot(businessId), 'list'] as const,
  paymentsPaged: (businessId: string, page: number, limit: number) =>
    [...platformQueryKeys.paymentsRoot(businessId), 'list-paged', page, limit] as const,

  staffRoot: (businessId: string) => [...platformQueryKeys.root, 'staff', businessId] as const,
  staff: (businessId: string) => [...platformQueryKeys.staffRoot(businessId), 'list'] as const,
  staffPaged: (businessId: string, page: number, limit: number) =>
    [...platformQueryKeys.staffRoot(businessId), 'list-paged', page, limit] as const,
  staffById: (businessId: string, staffId: string) =>
    [...platformQueryKeys.staffRoot(businessId), 'detail', staffId] as const,
}
