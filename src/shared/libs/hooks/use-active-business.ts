import { queryOptions, useQuery } from '@tanstack/react-query'
import { authUserQueryOptions } from '#/features/auth/lib/query-options.ts'
import type { BusinessResponse } from '#/features/business/api/business.types.ts'
import { useBusinessesQuery } from '#/features/business/model/business-hooks.ts'
import { getBusinessServerFn } from '#/shared/api/business/business.fns.ts'
import { getActiveBusinessId } from '#/shared/server/get-active-business-id.ts'

export const activeBusinessIdQueryOptions = () =>
  queryOptions({
    queryKey: ['active-business-id'] as const,
    queryFn: getActiveBusinessId,
    staleTime: Number.POSITIVE_INFINITY,
  })

export function useSelectedBusinessId(): string | null {
  const { data: authData } = useQuery(authUserQueryOptions())
  const user = authData?.user ?? null

  const { data: ownerBusinessId } = useQuery({
    ...activeBusinessIdQueryOptions(),
    enabled: user?.type === 'owner',
  })

  if (user?.type === 'staff') return user.businessId
  return ownerBusinessId ?? null
}

export function useActiveBusiness(): BusinessResponse | null {
  const businessId = useSelectedBusinessId()
  const { data: authData } = useQuery(authUserQueryOptions())
  const user = authData?.user ?? null

  const { data: businesses = [] } = useBusinessesQuery({
    enabled: user?.type === 'owner',
  })

  const { data: staffBusiness } = useQuery({
    queryKey: ['business', businessId],
    queryFn: () => getBusinessServerFn({ data: { id: businessId as string } }),
    enabled: user?.type === 'staff' && Boolean(businessId),
  })

  if (user?.type === 'staff') return staffBusiness ?? null
  if (user?.type === 'owner') return businesses.find((b) => b.id === businessId) ?? null
  return null
}
