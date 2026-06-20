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

  modifierGroups: (businessId: string) =>
    [...platformQueryKeys.root, 'modifier-groups', businessId] as const,
  modifierGroupById: (businessId: string, groupId: string) =>
    [...platformQueryKeys.modifierGroups(businessId), groupId] as const,
  modifiers: (businessId: string, groupId: string) =>
    [...platformQueryKeys.modifierGroupById(businessId, groupId), 'modifiers'] as const,

  orders: (filters?: { status?: string; tableId?: string; limit?: number; offset?: number }) =>
    [
      ...platformQueryKeys.root,
      'orders',
      filters?.status ?? 'all-statuses',
      filters?.tableId ?? 'all-tables',
      filters?.limit ?? 'no-limit',
      filters?.offset ?? 0,
    ] as const,
  orderById: (orderId: string) => [...platformQueryKeys.root, 'orders', orderId] as const,

  kitchenOrders: () => [...platformQueryKeys.root, 'kitchen-orders'] as const,

  payments: () => [...platformQueryKeys.root, 'payments'] as const,

  staff: (businessId: string) => [...platformQueryKeys.root, 'staff', businessId] as const,
  staffById: (businessId: string, staffId: string) =>
    [...platformQueryKeys.staff(businessId), staffId] as const,
}
