// Mirror of backend StaffRole enum (src/common/enums/staff-role.enum.ts)
export const StaffRole = {
  MANAGER: 'MANAGER',
  WAITER: 'WAITER',
  CASHIER: 'CASHIER',
  KITCHEN: 'KITCHEN',
} as const
export type StaffRole = (typeof StaffRole)[keyof typeof StaffRole]

// Mirror of backend StaffPermission enum (src/common/enums/staff-permission.enum.ts)
export const StaffPermission = {
  ORDER_VIEW: 'order_view',
  ORDER_CREATE: 'order_create',
  ORDER_EDIT: 'order_edit',
  ORDER_CANCEL: 'order_cancel',
  TABLE_VIEW: 'table_view',
  TABLE_ASSIGN: 'table_assign',
  TABLE_CREATE: 'table_create',
  TABLE_UPDATE: 'table_update',
  TABLE_DELETE: 'table_delete',
  TABLE_TOGGLE_STATUS: 'table_toggle_status',
  TABLE_MANAGE_RESERVATION: 'table_manage_reservation',
  KITCHEN_VIEW: 'kitchen_view',
  KITCHEN_UPDATE: 'kitchen_update',
  PAYMENT_TAKE: 'payment_take',
  PAYMENT_REFUND: 'payment_refund',
  TIPS_MANAGE: 'tips_manage',
  SPLIT_BILL: 'split_bill',
  STAFF_MANAGE: 'staff_manage',
  BUSINESS_SETTINGS: 'business_settings',
  REPORTS_VIEW: 'reports_view',
  MENU_VIEW: 'menu_view',
  MENU_EDIT: 'menu_edit',
  MENU_AVAILABILITY: 'menu_availability',
} as const
export type StaffPermission = (typeof StaffPermission)[keyof typeof StaffPermission]

export type { BusinessFeature as BusinessFeatureValue } from '#/features/business/api/business-domain.ts'
// Re-export from authoritative frontend source to avoid duplication
export { BusinessFeature } from '#/features/business/api/business-domain.ts'

// Mirror of backend ROLE_PERMISSION_MAP (src/common/enums/staff-permission.enum.ts)
export const ROLE_PERMISSION_MAP: Record<StaffRole, StaffPermission[]> = {
  [StaffRole.MANAGER]: Object.values(StaffPermission),

  [StaffRole.WAITER]: [
    StaffPermission.ORDER_VIEW,
    StaffPermission.ORDER_CREATE,
    StaffPermission.ORDER_EDIT,
    StaffPermission.ORDER_CANCEL,
    StaffPermission.TABLE_VIEW,
    StaffPermission.TABLE_ASSIGN,
    StaffPermission.TABLE_MANAGE_RESERVATION,
    StaffPermission.PAYMENT_TAKE,
    StaffPermission.TIPS_MANAGE,
    StaffPermission.SPLIT_BILL,
    StaffPermission.MENU_VIEW,
  ],

  [StaffRole.KITCHEN]: [
    StaffPermission.KITCHEN_VIEW,
    StaffPermission.KITCHEN_UPDATE,
    StaffPermission.MENU_VIEW,
    StaffPermission.MENU_AVAILABILITY,
    StaffPermission.TABLE_VIEW,
  ],

  [StaffRole.CASHIER]: [
    StaffPermission.ORDER_VIEW,
    StaffPermission.TABLE_VIEW,
    StaffPermission.PAYMENT_TAKE,
    StaffPermission.PAYMENT_REFUND,
    StaffPermission.TIPS_MANAGE,
    StaffPermission.SPLIT_BILL,
    StaffPermission.REPORTS_VIEW,
  ],
}
