export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  email?: string
}

export interface UpdateProfileResponse {
  id: string
  email: string
  firstName: string
  lastName: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
