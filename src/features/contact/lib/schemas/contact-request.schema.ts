import { z } from 'zod'

export const contactRequestSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
  message: z.string().trim().min(6, 'Phone number is required'),
})

export type ContactRequestFormValues = z.infer<typeof contactRequestSchema>
