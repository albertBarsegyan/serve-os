import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateDisplayRequest } from '#/features/display/api/display.types.ts'
import {
  createDisplayServerFn,
  listDisplaysServerFn,
  regenerateDisplayServerFn,
  revokeDisplayServerFn,
} from '#/shared/api/display/display.fns.ts'

export const displaysQueryOptions = (businessId: string) =>
  queryOptions({
    queryKey: ['displays', businessId] as const,
    queryFn: () => listDisplaysServerFn({ data: { businessId } }),
    enabled: Boolean(businessId),
  })

export function useDisplaysQuery(businessId: string) {
  return useQuery(displaysQueryOptions(businessId))
}

export function useCreateDisplayMutation(businessId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateDisplayRequest) =>
      createDisplayServerFn({ data: { businessId, payload } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['displays', businessId] })
    },
  })
}

export function useRegenerateDisplayMutation(businessId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => regenerateDisplayServerFn({ data: { businessId, id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['displays', businessId] })
    },
  })
}

export function useRevokeDisplayMutation(businessId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => revokeDisplayServerFn({ data: { businessId, id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['displays', businessId] })
    },
  })
}
