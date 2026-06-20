import { z } from 'zod'
import {
  orderStatuses,
  paymentMethods,
  paymentStatuses,
  staffRoles,
} from '#/features/platform/api/platform.types.ts'

export const staffRoleSchema = z.enum(staffRoles)
/** @deprecated use staffRoleSchema */
export const roleSchema = staffRoleSchema
export const paymentMethodSchema = z.enum(paymentMethods)
export const paymentStatusSchema = z.enum(paymentStatuses)
export const orderStatusSchema = z.enum(orderStatuses)

export const decimalStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal string')

export const createTableSchema = z.object({
  number: z.number().int().positive('Table number must be positive'),
  capacity: z.number().int().positive('Capacity must be positive'),
  isActive: z.boolean().optional(),
})

export const updateTableSchema = createTableSchema.partial()

export const scanSessionSchema = z.object({
  businessId: z.string().uuid('Business ID must be a valid UUID'),
  tableId: z.string().uuid('Table ID must be a valid UUID'),
})

export const createMenuCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required'),
  description: z.string().trim().nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
})

export const updateMenuCategorySchema = createMenuCategorySchema.partial()

export const updateStaffSchema = z.object({
  displayName: z.string().trim().min(2, 'Display name must be at least 2 characters').optional(),
  role: staffRoleSchema.optional(),
  isActive: z.boolean().optional(),
})

const modifierGroupBaseSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required'),
  selectionType: z.enum(['SINGLE', 'MULTIPLE']),
  isRequired: z.boolean().optional(),
  minSelections: z.number().int().nonnegative().optional(),
  maxSelections: z.number().int().positive().optional(),
  position: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
})

export const createModifierGroupSchema = modifierGroupBaseSchema.refine(
  (value) =>
    value.minSelections === undefined ||
    value.maxSelections === undefined ||
    value.minSelections <= value.maxSelections,
  { message: 'minSelections must be <= maxSelections', path: ['minSelections'] },
)

export const updateModifierGroupSchema = modifierGroupBaseSchema.partial()

export const addModifierSchema = z.object({
  name: z.string().trim().min(1, 'Modifier name is required'),
  priceType: z.enum(['adjustment', 'fixed']).optional(),
  priceAdjustment: z.number().nonnegative('Price must be 0 or more'),
  position: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
})

export const updateModifierSchema = addModifierSchema.partial()

export const createOrderItemSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  notes: z.string().trim().optional(),
})

export const createOrderSchema = z
  .object({
    sessionToken: z.string().min(1).optional(),
    tableId: z.string().uuid().optional(),
    items: z.array(createOrderItemSchema).min(1, 'Order needs at least one item'),
  })
  .refine((value) => Boolean(value.sessionToken || value.tableId), {
    message: 'Either sessionToken or tableId is required',
    path: ['sessionToken'],
  })

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'IN_KITCHEN',
    'READY',
    'DELIVERED',
    'CLOSED',
    'CANCELLED',
    'PAYMENT_FAILED',
    'REFUNDED',
  ]),
})

export const createPaymentSchema = z.object({
  orderId: z.string().uuid('Order ID must be a valid UUID'),
  method: paymentMethodSchema,
  amount: z.number().positive('Amount must be positive'),
})

// Confirmation is performed by the authenticated user — no body fields needed
export const confirmPaymentSchema = z.object({})

export const processPaymentSchema = z.object({
  tipAmount: z.number().nonnegative().optional(),
})

export const createStaffWithInviteSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(60, 'Display name cannot exceed 60 characters'),
  email: z.string().email('Invalid email address'),
  role: staffRoleSchema,
})

export const createStaffWithPasswordSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(60, 'Display name cannot exceed 60 characters'),
  role: staffRoleSchema,
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  temporaryPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export const createStaffWithPinSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(60, 'Display name cannot exceed 60 characters'),
  role: staffRoleSchema,
  pin: z
    .string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d+$/, 'PIN must be digits only'),
})

export const loginWithPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const loginWithPinSchema = z.object({
  staffId: z.string().uuid('Staff ID must be a valid UUID'),
  pin: z
    .string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d+$/, 'PIN must be digits only'),
})

export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export const updateStaffRoleSchema = z.object({
  role: staffRoleSchema,
})
