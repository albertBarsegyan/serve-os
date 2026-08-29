import { z } from 'zod'
import { m } from '#/paraglide/messages'

export const createDisplaySchema = z.object({
  name: z
    .string()
    .min(1, { error: () => m.display_validation_name_required() })
    .max(100, { error: () => m.display_validation_name_too_long() }),
})

export type CreateDisplayFormValues = z.infer<typeof createDisplaySchema>
