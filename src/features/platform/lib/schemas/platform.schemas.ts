import { z } from 'zod'
import {
  orderStatuses,
  paymentMethods,
  paymentStatuses,
  staffRoles,
} from '#/features/platform/api/platform.types.ts'
import { m } from '#/paraglide/messages'

export const staffRoleSchema = z.enum(staffRoles)
/** @deprecated use staffRoleSchema */
export const roleSchema = staffRoleSchema
export const paymentMethodSchema = z.enum(paymentMethods)
export const paymentStatusSchema = z.enum(paymentStatuses)
export const orderStatusSchema = z.enum(orderStatuses)

export const decimalStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, { error: () => m.platform_validation_amount_decimal() })

export const createTableSchema = z.object({
  number: z
    .number()
    .int()
    .positive({ error: () => m.platform_validation_table_number_positive() }),
  capacity: z
    .number()
    .int()
    .positive({ error: () => m.platform_validation_capacity_positive() }),
  isActive: z.boolean().optional(),
})

export const updateTableSchema = createTableSchema.partial()

export const scanSessionSchema = z.object({
  businessId: z.string().uuid({ error: () => m.platform_validation_business_id_uuid() }),
  tableId: z.string().uuid({ error: () => m.platform_validation_table_id_uuid() }),
})

export const createMenuCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: () => m.platform_validation_category_name_required() }),
  description: z.string().trim().nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
})

export const updateMenuCategorySchema = createMenuCategorySchema.partial()

export const updateStaffSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, { error: () => m.platform_validation_display_name_min() })
    .optional(),
  role: staffRoleSchema.optional(),
  isActive: z.boolean().optional(),
})

const modifierGroupBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: () => m.platform_validation_group_name_required() }),
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
  { error: () => m.platform_validation_min_max_selections(), path: ['minSelections'] },
)

export const updateModifierGroupSchema = modifierGroupBaseSchema.partial()

export const addModifierSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: () => m.platform_validation_modifier_name_required() }),
  priceType: z.enum(['adjustment', 'fixed']).optional(),
  priceAdjustment: z.number().nonnegative({ error: () => m.platform_validation_price_min() }),
  position: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
})

export const updateModifierSchema = addModifierSchema.partial()

export const createOrderItemSchema = z.object({
  productId: z.string().uuid({ error: () => m.platform_validation_product_id_uuid() }),
  quantity: z
    .number()
    .int()
    .positive({ error: () => m.platform_validation_quantity_positive() }),
  notes: z.string().trim().optional(),
})

export const createOrderSchema = z
  .object({
    sessionToken: z.string().min(1).optional(),
    tableId: z.string().uuid().optional(),
    items: z
      .array(createOrderItemSchema)
      .min(1, { error: () => m.platform_validation_order_min_items() }),
  })
  .refine((value) => Boolean(value.sessionToken || value.tableId), {
    error: () => m.platform_validation_session_or_table_required(),
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
  orderId: z.string().uuid({ error: () => m.platform_validation_order_id_uuid() }),
  method: paymentMethodSchema,
  amount: z.number().positive({ error: () => m.platform_validation_amount_positive() }),
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
    .min(2, { error: () => m.platform_validation_display_name_min() })
    .max(60, { error: () => m.platform_validation_display_name_max() }),
  email: z.string().email({ error: () => m.platform_validation_email_invalid() }),
  role: staffRoleSchema,
})

export const createStaffWithPasswordSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, { error: () => m.platform_validation_display_name_min() })
    .max(60, { error: () => m.platform_validation_display_name_max() }),
  role: staffRoleSchema,
  email: z
    .string()
    .email({ error: () => m.platform_validation_email_invalid() })
    .optional()
    .or(z.literal('')),
  temporaryPassword: z.string().min(8, { error: () => m.platform_validation_password_min_8() }),
})

export const createStaffWithPinSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, { error: () => m.platform_validation_display_name_min() })
    .max(60, { error: () => m.platform_validation_display_name_max() }),
  role: staffRoleSchema,
  pin: z
    .string()
    .length(4, { error: () => m.platform_validation_pin_length() })
    .regex(/^\d+$/, { error: () => m.platform_validation_pin_digits_only() }),
})

export const loginWithPasswordSchema = z.object({
  email: z.string().email({ error: () => m.platform_validation_email_invalid() }),
  password: z.string().min(8, { error: () => m.platform_validation_password_min_8() }),
})

export const loginWithPinSchema = z.object({
  staffId: z.string().uuid({ error: () => m.platform_validation_staff_id_uuid() }),
  pin: z
    .string()
    .length(4, { error: () => m.platform_validation_pin_length() })
    .regex(/^\d+$/, { error: () => m.platform_validation_pin_digits_only() }),
})

export const acceptInviteSchema = z.object({
  token: z.string().min(1, { error: () => m.platform_validation_token_required() }),
  newPassword: z.string().min(8, { error: () => m.platform_validation_password_min_8() }),
})

export const changePasswordSchema = z.object({
  oldPassword: z
    .string()
    .min(1, { error: () => m.platform_validation_current_password_required() }),
  newPassword: z.string().min(8, { error: () => m.platform_validation_new_password_min() }),
})

export const updateStaffRoleSchema = z.object({
  role: staffRoleSchema,
})
