import { z } from 'zod'

export const emailPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type EmailPasswordValues = z.infer<typeof emailPasswordSchema>
