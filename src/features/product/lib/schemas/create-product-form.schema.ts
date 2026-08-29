import { z } from 'zod'
import {
  allergens,
  type CreateProductRequest,
  dietaryFlags,
  servicePeriods,
  type UpdateProductRequest,
} from '#/features/product/api/product.types'
import { m } from '#/paraglide/messages'

const urlRegex = /^https?:\/\/.+/

export const createProductFormSchema = z.object({
  categoryId: z
    .string()
    .uuid({ error: () => m.product_validation_category_id_uuid() })
    .min(1, { error: () => m.product_validation_category_required() }),
  name: z
    .string()
    .min(1, { error: () => m.product_validation_name_required() })
    .max(255),
  description: z.string().nullable().optional(),
  basePrice: z.coerce.number().min(0.01, { error: () => m.product_validation_base_price_min() }),
  compareAtPrice: z.coerce
    .number()
    .min(0.01, { error: () => m.product_validation_compare_price_min() })
    .nullable()
    .optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, { error: () => m.product_validation_slug_format() })
    .nullable()
    .optional(),
  sku: z.string().nullable().optional(),
  prepTimeMinutes: z.coerce
    .number()
    .int()
    .min(1, { error: () => m.product_validation_prep_time_min() })
    .max(180, { error: () => m.product_validation_prep_time_max() })
    .optional(),
  availablePeriod: z.enum(servicePeriods).optional(),
  sortOrder: z.coerce.number().optional(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  dietaryFlags: z.array(z.enum(dietaryFlags)).optional(),
  allergens: z.array(z.enum(allergens)).optional(),
  imageUrls: z
    .array(z.string().regex(urlRegex, { error: () => m.product_validation_image_url_invalid() }))
    .optional(),
}) satisfies z.ZodType<CreateProductRequest>

export const updateProductFormSchema =
  createProductFormSchema.partial() satisfies z.ZodType<UpdateProductRequest>

export type CreateProductFormData = z.infer<typeof createProductFormSchema>
export type UpdateProductFormData = z.infer<typeof updateProductFormSchema>
