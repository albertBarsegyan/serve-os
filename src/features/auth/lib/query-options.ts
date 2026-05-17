import { queryOptions } from '@tanstack/react-query'
import { authQueryKey } from '#/features/auth/lib/constants/auth-query-keys.ts'
import { getAuthUserServerFn } from '#/shared/api/auth/auth.fns.ts'

export const authUserQueryOptions = () =>
  queryOptions({
    queryKey: [authQueryKey.ME] as const,
    queryFn: getAuthUserServerFn,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
