import { queryOptions } from '@tanstack/react-query'
import { fetchMenuServerFn } from '#/entities/menu/api/fetch-menu.fns'

/**
 * Query options for the customer-facing menu, keyed by businessId.
 * Uses a server function so SSR loaders can call ensureQueryData() and the
 * component's useQuery() reads the result from cache without a second fetch.
 *
 * The query key ['customer-menu', businessId] matches the existing inline
 * useQuery in CustomerMenuContent so the cache is shared.
 */
export const menuQueryOptions = (businessId: string) =>
  queryOptions({
    queryKey: ['customer-menu', businessId] as const,
    queryFn: () => fetchMenuServerFn({ data: { businessId } }),
    enabled: Boolean(businessId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
