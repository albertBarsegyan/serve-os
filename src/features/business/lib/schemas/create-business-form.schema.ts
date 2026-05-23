import { z } from 'zod'
import { businessTypes } from '#/features/business/api/business.types.ts'
import { businessFeatures } from '#/features/business/api/business-domain.ts'

const businessTypeSchema = z.enum(businessTypes)
const businessFeatureSchema = z.enum(businessFeatures)

const currencySchema = z
  .string()
  .trim()
  .min(3, 'Currency is required')
  .regex(/^[A-Za-z]{3}$/, 'Currency must be a 3-letter ISO code')

const workingHoursJsonSchema = z
  .string()
  .trim()
  .default('')
  .refine(
    (value) => {
      if (!value) return true

      try {
        const parsed = JSON.parse(value)
        return Boolean(parsed && typeof parsed === 'object' && !Array.isArray(parsed))
      } catch {
        return false
      }
    },
    {
      message: 'Working hours must be a valid JSON object',
    },
  )

export const createBusinessFormSchema = z.object({
  name: z.string().trim().min(2, 'Business name is required'),
  type: businessTypeSchema,
  location: z.string().trim().min(2, 'Location is required'),
  currency: currencySchema,
  workingHoursJson: workingHoursJsonSchema,
  features: z.array(businessFeatureSchema),
})

export const createBusinessRequestSchema = z.object({
  name: z.string().trim().min(2, 'Business name is required'),
  type: businessTypeSchema,
  location: z.string().trim().min(2, 'Location is required'),
  currency: currencySchema,
  workingHours: z.string().optional(),
  features: z.array(businessFeatureSchema).optional(),
})

export type CreateBusinessFormValues = z.infer<typeof createBusinessFormSchema>
