import { z } from 'zod'
import { m } from '#/paraglide/messages'

export const contactRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: () => m.contact_validation_name_required() }),
  email: z
    .string()
    .trim()
    .min(1, { error: () => m.contact_validation_email_required() })
    .email({ error: () => m.contact_validation_email_invalid() }),
  message: z
    .string()
    .trim()
    .min(6, { error: () => m.contact_validation_message_required() }),
})

export type ContactRequestFormValues = z.infer<typeof contactRequestSchema>
