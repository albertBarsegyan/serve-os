import { z } from 'zod'
import { m } from '#/paraglide/messages'

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, { error: () => m.auth_signin_validation_email_required() })
    .email({ error: () => m.auth_signin_validation_email_invalid() }),
  password: z.string().min(6, { error: () => m.auth_signin_validation_password_min() }),
})

export type SignInFormValues = z.infer<typeof signInSchema>
