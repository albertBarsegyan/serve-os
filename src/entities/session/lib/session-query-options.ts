import { queryOptions } from '@tanstack/react-query'
import { getSessionCurrentServerFn } from '#/entities/session/api/session-current.fns'

/**
 * Query options for the active guest session, keyed by session token so the
 * cache is scoped to the specific session and useSessionRealtime can invalidate it.
 *
 * Mirrors authUserQueryOptions — call with context.queryClient.ensureQueryData()
 * in a loader to SSR the session, then useQuery() in components reads from cache.
 */
export const sessionQueryOptions = (token: string) =>
  queryOptions({
    queryKey: ['session', token] as const,
    queryFn: getSessionCurrentServerFn,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: Boolean(token),
  })
