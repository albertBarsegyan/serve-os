import { useQuery } from '@tanstack/react-query'
import { authUserQueryOptions } from '#/features/auth/lib/query-options.ts'
import { useBusinessesQuery } from '#/features/business/model/business-hooks.ts'
import useActiveBusinessStore from '#/shared/store/use-active-business.store.ts'
import {
  type BusinessFeature,
  ROLE_PERMISSION_MAP,
  type StaffPermission,
  type StaffRole,
} from './index.ts'

export function usePermissions() {
  const { data } = useQuery(authUserQueryOptions())
  const user = data?.user ?? null

  const activeBusiness = useActiveBusinessStore((s) => s.active)
  const { data: businesses = [] } = useBusinessesQuery({ enabled: user?.type === 'owner' })

  const activeBusinessFull = businesses.find((b) => b.id === activeBusiness?.id) ?? null

  const isOwner = () => user?.type === 'owner'
  const isStaff = () => user?.type === 'staff'

  const staffRole = (): StaffRole | null => {
    if (user?.type !== 'staff') return null
    return user.role
  }

  const hasPermission = (p: StaffPermission): boolean => {
    if (user?.type !== 'staff') return false
    return ROLE_PERMISSION_MAP[user.role].includes(p)
  }

  const hasFeature = (f: BusinessFeature): boolean => {
    if (user?.type === 'staff') return user.business.features.includes(f)
    return activeBusinessFull?.features.includes(f) ?? false
  }

  const canSee = (f: BusinessFeature): boolean => isOwner() || hasFeature(f)

  return { isOwner, isStaff, staffRole, hasPermission, hasFeature, canSee }
}
