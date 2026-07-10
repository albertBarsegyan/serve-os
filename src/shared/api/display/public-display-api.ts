import { queryOptions } from '@tanstack/react-query'
import { clientApiInstance } from '#/shared/api/client-instance'
import type { DisplayOrderPayload } from '#/shared/realtime/events'

export interface DisplaySnapshotResponse {
  businessId: string
  businessName: string
  logoUrl?: string | null
  preparing: DisplayOrderPayload[]
  ready: DisplayOrderPayload[]
}

export function fetchDisplaySnapshot(token: string): Promise<DisplaySnapshotResponse> {
  return clientApiInstance.get(`public/display/${token}`).json<DisplaySnapshotResponse>()
}

export const displaySnapshotQueryKey = (token: string) => ['display-snapshot', token] as const

export const displaySnapshotQueryOptions = (token: string) =>
  queryOptions({
    queryKey: displaySnapshotQueryKey(token),
    queryFn: () => fetchDisplaySnapshot(token),
    enabled: Boolean(token),
    // A TV screen is left running for hours — this is the safety net if the socket
    // silently dies (matches the KDS page's own poll fallback for the same reason).
    refetchInterval: 15_000,
  })
