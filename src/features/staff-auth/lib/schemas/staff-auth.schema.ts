import { z } from 'zod'
import { m } from '#/paraglide/messages'

export const emailPasswordSchema = z.object({
  email: z.string().email({ error: () => m.staff_auth_validation_email_invalid() }),
  password: z.string().min(1, { error: () => m.staff_auth_validation_password_required() }),
})

export type EmailPasswordValues = z.infer<typeof emailPasswordSchema>
