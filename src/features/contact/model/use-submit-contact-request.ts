import { useMutation } from '@tanstack/react-query'
import { submitContactRequest } from '#/features/contact/api/contact.api.ts'

export function useSubmitContactRequestMutation() {
  return useMutation({
    mutationFn: submitContactRequest,
  })
}
