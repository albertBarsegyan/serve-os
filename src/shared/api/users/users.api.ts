import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from '#/features/users/api/users.types'
import { clientApiInstance } from '#/shared/api/client-instance'

export function updateUserProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
  return clientApiInstance.patch('users/me', { json: data }).json<UpdateProfileResponse>()
}

export async function changeUserPassword(data: ChangePasswordRequest): Promise<void> {
  await clientApiInstance.patch('users/me/password', { json: data }).json()
}
