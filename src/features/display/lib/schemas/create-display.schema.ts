import { z } from 'zod'

export const createDisplaySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
})

export type CreateDisplayFormValues = z.infer<typeof createDisplaySchema>
