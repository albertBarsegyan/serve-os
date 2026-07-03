export const platformQueryKeys = {
  root: ['platform'] as const,

  tables: () => [...platformQueryKeys.root, 'tables'] as const,
  tableById: (tableId: string) => [...platformQueryKeys.tables(), tableId] as const,

  sessions: () => [...platformQueryKeys.root, 'sessions'] as const,
  sessionBill: (sessionId: string) => [...platformQueryKeys.sessions(), sessionId, 'bill'] as const,

  menuCategoriesRoot: () => [...platformQueryKeys.root, 'menu-categories'] as const,
  menuCategories: (includeProducts: boolean) =>
    [
      ...platformQueryKeys.menuCategoriesRoot(),
      includeProducts ? 'with-products' : 'flat',
    ] as const,
  categoryById: (categoryId: string) =>
    [...platformQueryKeys.menuCategoriesRoot(), 'detail', categoryId] as const,

  productsRoot: () => [...platformQueryKeys.root, 'products'] as const,
  products: (filters?: { categoryId?: string; availableOnly?: boolean }) =>
    [
      ...platformQueryKeys.productsRoot(),
      'list',
      filters?.categoryId ?? 'all-categories',
      filters?.availableOnly ? 'available-only' : 'all',
    ] as const,
  productsPaged: (
    page: number,
    limit: number,
    filters?: { categoryId?: string; availableOnly?: boolean },
  ) =>
    [
      ...platformQueryKeys.productsRoot(),
      'list-paged',
      page,
      limit,
      filters?.categoryId ?? 'all-categories',
      filters?.availableOnly ? 'available-only' : 'all',
    ] as const,
  productById: (productId: string) =>
    [...platformQueryKeys.productsRoot(), 'detail', productId] as const,

  modifierGroups: (businessId: string) =>
    [...platformQueryKeys.root, 'modifier-groups', businessId] as const,
  modifierGroupById: (businessId: string, groupId: string) =>
    [...platformQueryKeys.modifierGroups(businessId), groupId] as const,
  modifiers: (businessId: string, groupId: string) =>
    [...platformQueryKeys.modifierGroupById(businessId, groupId), 'modifiers'] as const,

  ordersRoot: () => [...platformQueryKeys.root, 'orders'] as const,
  orders: (filters?: { status?: string; tableId?: string }) =>
    [
      ...platformQueryKeys.ordersRoot(),
      'list',
      filters?.status ?? 'all-statuses',
      filters?.tableId ?? 'all-tables',
    ] as const,
  ordersPaged: (page: number, limit: number, filters?: { status?: string; tableId?: string }) =>
    [
      ...platformQueryKeys.ordersRoot(),
      'list-paged',
      page,
      limit,
      filters?.status ?? 'all-statuses',
      filters?.tableId ?? 'all-tables',
    ] as const,
  orderById: (orderId: string) => [...platformQueryKeys.ordersRoot(), 'detail', orderId] as const,

  kitchenOrders: () => [...platformQueryKeys.root, 'kitchen-orders'] as const,

  paymentsRoot: () => [...platformQueryKeys.root, 'payments'] as const,
  payments: () => [...platformQueryKeys.paymentsRoot(), 'list'] as const,
  paymentsPaged: (page: number, limit: number) =>
    [...platformQueryKeys.paymentsRoot(), 'list-paged', page, limit] as const,

  staffRoot: (businessId: string) => [...platformQueryKeys.root, 'staff', businessId] as const,
  staff: (businessId: string) => [...platformQueryKeys.staffRoot(businessId), 'list'] as const,
  staffPaged: (businessId: string, page: number, limit: number) =>
    [...platformQueryKeys.staffRoot(businessId), 'list-paged', page, limit] as const,
  staffById: (businessId: string, staffId: string) =>
    [...platformQueryKeys.staffRoot(businessId), 'detail', staffId] as const,
}
