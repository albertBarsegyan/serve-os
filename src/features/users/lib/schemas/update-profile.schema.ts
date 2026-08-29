import { z } from 'zod'
import { m } from '#/paraglide/messages'

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, { error: () => m.users_validation_first_name_required() }),
  lastName: z.string().min(1, { error: () => m.users_validation_last_name_required() }),
  email: z.string().email({ error: () => m.users_validation_email_invalid() }),
})

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>
