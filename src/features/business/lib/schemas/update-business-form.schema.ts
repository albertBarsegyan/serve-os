import { z } from 'zod'
import { businessTypes } from '#/features/business/api/business.types.ts'
import { BusinessFeature } from '#/features/business/api/business-domain.ts'
import { m } from '#/paraglide/messages'

export const updateBusinessRequestSchema = z.object({
  id: z.string(),

  payload: z.object({
    logoUrl: z.string().nullable().optional(),

    name: z.string().min(1).optional(),

    type: z.enum(businessTypes),

    location: z.string().min(1).optional(),

    currency: z.string().min(1).optional(),

    workingHours: z.any().optional(),

    isActive: z.boolean().optional(),

    features: z.array(z.nativeEnum(BusinessFeature)).optional(),
  }),
})

export type UpdateBusinessRequest = z.infer<typeof updateBusinessRequestSchema>['payload']

const currencySchema = z
  .string()
  .trim()
  .min(3, { error: () => m.business_validation_currency_required() })
  .regex(/^[A-Za-z]{3}$/, { error: () => m.business_validation_currency_format() })

export const updateBusinessFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { error: () => m.business_validation_name_required() }),
    type: z.enum(businessTypes),
    locationCountry: z
      .string()
      .trim()
      .min(1, { error: () => m.business_validation_country_required() }),
    locationCity: z
      .string()
      .trim()
      .min(1, { error: () => m.business_validation_city_required() }),
    currency: currencySchema,
    features: z.array(z.nativeEnum(BusinessFeature)),
    workingHours: z.string().trim().optional(),
  })
  .strict()

export type UpdateBusinessFormValues = z.infer<typeof updateBusinessFormSchema>
