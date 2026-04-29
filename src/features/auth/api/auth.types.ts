export interface SignUpRequest {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface AuthenticatedUser {
  id: string
  email: string
  firstName: string
  lastName: string
  businessId?: string
  role?: string
}

export type SignupResponseBody = object
