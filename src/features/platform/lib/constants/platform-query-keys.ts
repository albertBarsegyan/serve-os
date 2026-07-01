export const platformQueryKeys = {
  root: ['platform'] as const,

  tables: () => [...platformQueryKeys.root, 'tables'] as const,
  tableById: (tableId: string) => [...platformQueryKeys.tables(), tableId] as const,

  sessions: () => [...platformQueryKeys.root, 'sessions'] as const,
  sessionBill: (sessionId: string) => [...platformQueryKeys.sessions(), sessionId, 'bill'] as const,

  menuCategories: (includeProducts: boolean) =>
    [
      ...platformQueryKeys.root,
      'menu-categories',
      includeProducts ? 'with-products' : 'flat',
    ] as const,
  products: (filters?: { categoryId?: string; availableOnly?: boolean }) =>
    [
      ...platformQueryKeys.root,
      'products',
      filters?.categoryId ?? 'all-categories',
      filters?.availableOnly ? 'available-only' : 'all',
    ] as const,
  productsPaged: (
    page: number,
    limit: number,
    filters?: { categoryId?: string; availableOnly?: boolean },
  ) =>
    [
      ...platformQueryKeys.root,
      'products-paged',
      page,
      limit,
      filters?.categoryId ?? 'all-categories',
      filters?.availableOnly ? 'available-only' : 'all',
    ] as const,

  modifierGroups: (businessId: string) =>
    [...platformQueryKeys.root, 'modifier-groups', businessId] as const,
  modifierGroupById: (businessId: string, groupId: string) =>
    [...platformQueryKeys.modifierGroups(businessId), groupId] as const,
  modifiers: (businessId: string, groupId: string) =>
    [...platformQueryKeys.modifierGroupById(businessId, groupId), 'modifiers'] as const,

  orders: (filters?: { status?: string; tableId?: string }) =>
    [
      ...platformQueryKeys.root,
      'orders',
      filters?.status ?? 'all-statuses',
      filters?.tableId ?? 'all-tables',
    ] as const,
  ordersPaged: (page: number, limit: number, filters?: { status?: string; tableId?: string }) =>
    [
      ...platformQueryKeys.root,
      'orders-paged',
      page,
      limit,
      filters?.status ?? 'all-statuses',
      filters?.tableId ?? 'all-tables',
    ] as const,
  orderById: (orderId: string) => [...platformQueryKeys.root, 'orders', orderId] as const,

  kitchenOrders: () => [...platformQueryKeys.root, 'kitchen-orders'] as const,

  payments: () => [...platformQueryKeys.root, 'payments'] as const,
  paymentsPaged: (page: number, limit: number) =>
    [...platformQueryKeys.root, 'payments-paged', page, limit] as const,

  staff: (businessId: string) => [...platformQueryKeys.root, 'staff', businessId] as const,
  staffPaged: (businessId: string, page: number, limit: number) =>
    [...platformQueryKeys.root, 'staff-paged', businessId, page, limit] as const,
  staffById: (businessId: string, staffId: string) =>
    [...platformQueryKeys.staff(businessId), staffId] as const,
}
