export interface UpdateProfileRequest {
  avatarUrl?: string | null
  firstName?: string
  lastName?: string
  email?: string
}

export interface UpdateProfileResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string | null
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
