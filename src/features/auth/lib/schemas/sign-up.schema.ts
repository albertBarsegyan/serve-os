import { z } from 'zod'
import { m } from '#/paraglide/messages'

export const signUpSchema = z
  .object({
    email: z.string().email({ error: () => m.auth_signup_validation_email_invalid() }),
    password: z.string().min(6, { error: () => m.auth_signup_validation_password_min() }),
    confirmPassword: z.string().min(6, { error: () => m.auth_signup_validation_password_min() }),
    firstName: z.string().min(1, { error: () => m.auth_signup_validation_first_name_required() }),
    lastName: z.string().min(1, { error: () => m.auth_signup_validation_last_name_required() }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: () => m.auth_signup_validation_passwords_mismatch(),
    path: ['confirmPassword'],
  })

export const signUpRequestSchema = z.object({
  email: z.string().email({ error: () => m.auth_signup_validation_email_invalid() }),
  password: z.string().min(6, { error: () => m.auth_signup_validation_password_min() }),
  firstName: z.string().min(1, { error: () => m.auth_signup_validation_first_name_required() }),
  lastName: z.string().min(1, { error: () => m.auth_signup_validation_last_name_required() }),
})

export type SignUpFormValues = z.infer<typeof signUpSchema>
