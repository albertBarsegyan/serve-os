import type { SignUpRequest } from '#/features/auth/api/auth.types.ts'
import type { SignUpFormValues } from '#/features/auth/lib/schemas/sign-up-form.schema.ts'

export const signUpAdapter = {
  toApi: (formData: SignUpFormValues): SignUpRequest => {
    const { confirmPassword, ...requestData } = formData
    return requestData
  },
}
