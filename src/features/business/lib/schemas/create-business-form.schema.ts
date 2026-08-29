import { z } from 'zod'
import { businessTypes } from '#/features/business/api/business.types.ts'
import { BusinessFeature } from '#/features/business/api/business-domain.ts'
import { m } from '#/paraglide/messages'

const businessTypeSchema = z.enum(businessTypes)
const businessFeatureSchema = z.enum(BusinessFeature)

const currencySchema = z
  .string()
  .trim()
  .min(3, { error: () => m.business_validation_currency_required() })
  .regex(/^[A-Za-z]{3}$/, { error: () => m.business_validation_currency_format() })

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
      error: () => m.business_validation_working_hours_json(),
    },
  )

export const createBusinessFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: () => m.business_validation_name_required() }),
  type: businessTypeSchema,
  locationCountry: z
    .string()
    .trim()
    .min(1, { error: () => m.business_validation_country_required() }),
  locationCity: z
    .string()
    .trim()
    .min(1, { error: () => m.business_validation_city_required() }),
  currency: currencySchema,
  workingHoursJson: workingHoursJsonSchema,
  features: z.array(businessFeatureSchema),
})

export const createBusinessRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: () => m.business_validation_name_required() }),
  type: businessTypeSchema,
  location: z
    .string()
    .trim()
    .min(2, { error: () => m.business_validation_location_required() }),
  currency: currencySchema,
  workingHours: z.string().optional(),
  features: z.array(businessFeatureSchema).optional(),
})

export type CreateBusinessFormValues = z.infer<typeof createBusinessFormSchema>
