import { z } from 'zod'
import {
  allergens,
  type CreateProductRequest,
  dietaryFlags,
  servicePeriods,
  type UpdateProductRequest,
} from '#/features/product/api/product.types'

const urlRegex = /^https?:\/\/.+/

export const createProductFormSchema = z.object({
  categoryId: z.string().uuid('Category ID must be a valid UUID').min(1, 'Category is required'),
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().nullable().optional(),
  basePrice: z.coerce.number().min(0.01, 'Base price must be at least 0.01'),
  compareAtPrice: z.coerce
    .number()
    .min(0.01, 'Compare at price must be at least 0.01')
    .nullable()
    .optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .nullable()
    .optional(),
  sku: z.string().nullable().optional(),
  prepTimeMinutes: z.coerce
    .number()
    .int()
    .min(1, 'Prep time must be at least 1 minute')
    .max(180, 'Prep time cannot exceed 180 minutes')
    .optional(),
  availablePeriod: z.enum(servicePeriods).optional(),
  sortOrder: z.coerce.number().optional(),
  isFeatured: z.boolean().optional(),
  dietaryFlags: z.array(z.enum(dietaryFlags)).optional(),
  allergens: z.array(z.enum(allergens)).optional(),
  imageUrls: z
    .array(z.string().regex(urlRegex, 'Each image URL must be a valid HTTP(S) URL'))
    .optional(),
}) satisfies z.ZodType<CreateProductRequest>

export const updateProductFormSchema =
  createProductFormSchema.partial() satisfies z.ZodType<UpdateProductRequest>

export type CreateProductFormData = z.infer<typeof createProductFormSchema>
export type UpdateProductFormData = z.infer<typeof updateProductFormSchema>
