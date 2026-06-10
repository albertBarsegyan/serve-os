import type { StaffAuthUser } from '#/features/auth/api/auth.types.ts'
import type { StaffRole } from '#/features/platform/api/platform.types.ts'

export interface RosterStaffMember {
  id: string
  displayName: string
  role: StaffRole
  authType: 'PIN' | 'PASSWORD' | 'INVITE_PENDING'
}

export interface StaffRosterResponse {
  business: { name: string; slug: string }
  staff: RosterStaffMember[]
}

export interface SlugStaffLoginRequest {
  slug: string
  identifier: string
  secret: string
}

export interface StaffLoginResponse {
  tokens: { accessToken: string }
  user: StaffAuthUser
  requiresPasswordChange?: boolean
}
