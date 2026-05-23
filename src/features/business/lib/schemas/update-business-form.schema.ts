import { z } from 'zod'
import { businessFeatures, businessTypes } from '#/features/business/api/business.types.ts'

export const updateBusinessRequestSchema = z.object({
  id: z.string(),

  payload: z.object({
    name: z.string().min(1).optional(),

    type: z.enum(businessTypes).optional(),

    location: z.string().min(1).optional(),

    currency: z.string().min(1).optional(),

    workingHours: z.any().optional(),

    isActive: z.boolean().optional(),

    features: z.array(z.enum(businessFeatures)).optional(),
  }),
})

export type UpdateBusinessRequest = z.infer<typeof updateBusinessRequestSchema>['payload']
