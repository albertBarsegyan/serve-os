import type { BusinessFeature, StaffPermission, StaffRole } from '#/shared/lib/permissions/index.ts'

export interface SignUpRequest {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface OwnerAuthUser {
  type: 'owner'
  id: string
  email: string
  firstName: string
  lastName: string
  hasBusiness: boolean
  role: string
}

export interface StaffAuthUser {
  type: 'staff'
  staffId: string
  displayName: string
  email?: string | null
  businessId: string
  role: StaffRole
  permissions: StaffPermission[]
  business: { features: BusinessFeature[] }
}

export type AuthenticatedUser = OwnerAuthUser | StaffAuthUser
