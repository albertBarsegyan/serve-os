import { z } from 'zod'
import { m } from '#/paraglide/messages'

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { error: () => m.users_validation_current_password_required() }),
    newPassword: z.string().min(6, { error: () => m.users_validation_password_min() }),
    confirmPassword: z.string().min(6, { error: () => m.users_validation_password_min() }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: () => m.users_validation_passwords_mismatch(),
    path: ['confirmPassword'],
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>
