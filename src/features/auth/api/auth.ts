import type {
  AuthenticatedUser,
  SignUpRequest,
  SignupResponseBody,
} from '#/features/auth/api/auth.types.ts'
import type { LoginRequestBody, LoginResponseBody } from '#/shared/api/dto'
import { api } from '#/shared/api/ky'

export const authApi = {
  signIn: async (credentials: LoginRequestBody): Promise<LoginResponseBody> => {
    return await api.post('auth/login', { json: credentials }).json<LoginResponseBody>()
  },

  signup: async (data: SignUpRequest): Promise<SignupResponseBody> => {
    return await api.post('auth/register', { json: data }).json<SignupResponseBody>()
  },

  logout: async (): Promise<void> => {
    return await api.post('auth/logout').json()
  },

  me: async (): Promise<AuthenticatedUser | null> => {
    return await api.get('auth/me').json()
  },
}
