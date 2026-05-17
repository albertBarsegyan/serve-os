export const platformQueryKeys = {
  root: ['platform'] as const,
  customerSessions: () => [...platformQueryKeys.root, 'customer-sessions'] as const,
  customerSessionByToken: (token: string) =>
    [...platformQueryKeys.customerSessions(), 'token', token] as const,

  tables: () => [...platformQueryKeys.root, 'tables'] as const,
  tableById: (tableId: string) => [...platformQueryKeys.tables(), tableId] as const,

  menuCategories: (includeProducts: boolean) =>
    [...platformQueryKeys.root, 'menu-categories', includeProducts ? 'with-products' : 'flat'] as const,
  products: (filters?: { categoryId?: string; availableOnly?: boolean }) =>
    [
      ...platformQueryKeys.root,
      'products',
      filters?.categoryId ?? 'all-categories',
      filters?.availableOnly ? 'available-only' : 'all',
    ] as const,

  modifierGroups: () => [...platformQueryKeys.root, 'modifier-groups'] as const,

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

  kitchenTickets: (status?: 'PREPARING' | 'READY') =>
    [...platformQueryKeys.root, 'kitchen-tickets', status ?? 'all'] as const,

  payments: () => [...platformQueryKeys.root, 'payments'] as const,

  staffInvites: () => [...platformQueryKeys.root, 'staff-invites'] as const,
  inviteByToken: (token: string) => [...platformQueryKeys.staffInvites(), token] as const,

  staff: () => [...platformQueryKeys.root, 'staff'] as const,
  staffById: (staffId: string) => [...platformQueryKeys.staff(), staffId] as const,

  businessPaymentMethods: () => [...platformQueryKeys.root, 'business-payment-methods'] as const,
}

