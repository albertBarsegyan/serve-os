import { z } from 'zod'
import {
  businessFeatures,
  kitchenTicketStatuses,
  orderStatuses,
  paymentMethods,
  paymentStatuses,
  roles,
} from '#/features/platform/api/platform.types.ts'

export const roleSchema = z.enum(roles)
export const businessFeatureSchema = z.enum(businessFeatures)
export const paymentMethodSchema = z.enum(paymentMethods)
export const paymentStatusSchema = z.enum(paymentStatuses)
export const orderStatusSchema = z.enum(orderStatuses)
export const kitchenTicketStatusSchema = z.enum(kitchenTicketStatuses)

export const decimalStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal string')

export const createCustomerSessionSchema = z.object({
  businessId: z.string().uuid().optional(),
  tableId: z.string().uuid('Table ID must be a valid UUID'),
  expiresAt: z.string().datetime().optional(),
})

export const createTableSchema = z.object({
  number: z.number().int().positive('Table number must be positive'),
  capacity: z.number().int().positive('Capacity must be positive'),
  qrCode: z.string().trim().min(1, 'QR code is required'),
  isActive: z.boolean().optional(),
})

export const updateTableSchema = createTableSchema.partial()

export const createMenuCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required'),
  sortOrder: z.number().int().nonnegative().optional(),
})

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  description: z.string().trim().optional(),
  price: decimalStringSchema,
  categoryId: z.string().uuid('Category ID must be a valid UUID'),
  imageUrl: z.string().url('Image URL must be valid').optional(),
  isAvailable: z.boolean().optional(),
  allergens: z.array(z.string().trim().min(1)).optional(),
  modifierGroupIds: z.array(z.string().uuid()).optional(),
})

export const updateProductSchema = createProductSchema.partial()

export const createModifierGroupSchema = z
  .object({
    name: z.string().trim().min(1, 'Group name is required'),
    selectionType: z.enum(['SINGLE', 'MULTIPLE']),
    isRequired: z.boolean().optional(),
    minSelections: z.number().int().nonnegative().optional(),
    maxSelections: z.number().int().positive().optional(),
    position: z.number().int().nonnegative().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.minSelections === undefined ||
      value.maxSelections === undefined ||
      value.minSelections <= value.maxSelections,
    { message: 'minSelections must be <= maxSelections', path: ['minSelections'] },
  )

export const addModifierSchema = z.object({
  name: z.string().trim().min(1, 'Modifier name is required'),
  priceAdjustment: decimalStringSchema,
  position: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
})

export const attachModifierGroupsSchema = z.object({
  modifierGroupIds: z.array(z.string().uuid()).min(1, 'Select at least one modifier group'),
})

export const createOrderItemSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: decimalStringSchema,
  notes: z.string().trim().optional(),
  selectedModifierIds: z.array(z.string().uuid()).optional(),
})

export const createOrderSchema = z
  .object({
    customerSessionToken: z.string().min(1).optional(),
    tableId: z.string().uuid().optional(),
    items: z.array(createOrderItemSchema).min(1, 'Order needs at least one item'),
    paymentMethod: paymentMethodSchema.optional(),
  })
  .refine((value) => Boolean(value.customerSessionToken || value.tableId), {
    message: 'Either customerSessionToken or tableId is required',
    path: ['customerSessionToken'],
  })

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PREPARING', 'READY', 'DELIVERED', 'CLOSED', 'CANCELLED']),
})

export const updateOrderItemsSchema = z.object({
  items: z.array(createOrderItemSchema).min(1, 'Order needs at least one item'),
})

export const assignKitchenTicketSchema = z.object({
  stationId: z.string().uuid('Station ID must be a valid UUID'),
  chefId: z.string().uuid('Chef ID must be a valid UUID'),
})

export const updateKitchenTicketStatusSchema = z.object({
  status: z.enum(['PREPARING', 'READY']),
})

export const createPaymentSchema = z.object({
  orderId: z.string().uuid('Order ID must be a valid UUID'),
  method: paymentMethodSchema,
  amount: decimalStringSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const confirmPaymentSchema = z.object({
  confirmedBy: z.string().uuid('confirmedBy must be a valid UUID'),
})

export const createStaffInviteSchema = z.object({
  email: z.string().email('Invalid invite email'),
  role: z.enum(['ADMIN', 'WAITER', 'CHEF']),
  expiresAt: z.string().datetime().optional(),
})

export const updateStaffRoleSchema = z.object({
  role: roleSchema,
})

export const upsertBusinessPaymentMethodSchema = z.object({
  method: paymentMethodSchema,
  isActive: z.boolean(),
  config: z.record(z.string(), z.unknown()).optional(),
})

