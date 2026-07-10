import ky from 'ky'
import type { ContactRequestFormValues } from '#/features/contact/lib/schemas/contact-request.schema.ts'

const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY
const WEB3FORMS_ENDPOINT = import.meta.env.VITE_WEB3FORMS_ENDPOINT

interface Web3FormsResponse {
  success: boolean
  message?: string
}

export async function submitContactRequest(values: ContactRequestFormValues) {
  const response = await ky
    .post(WEB3FORMS_ENDPOINT, {
      json: {
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: 'New serve-os trial request',
        ...values,
      },
    })
    .json<Web3FormsResponse>()

  if (!response.success) {
    throw new Error(response.message ?? 'Submission failed')
  }

  return response
}
