import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import type {
  BusinessPaymentMethodResponse,
  BusinessResponse,
  CreateBusinessRequest,
  UpdateBusinessRequest,
  UpsertPaymentMethodRequest,
} from '#/features/business/api/business.types.ts'
import { platformQueryKeys } from '#/features/platform/lib/constants/platform-query-keys.ts'
import {
  createBusinessServerFn,
  deleteBusinessServerFn,
  deletePaymentMethodServerFn,
  listBusinessesServerFn,
  listPaymentMethodsServerFn,
  selectBusinessServerFn,
  updateBusinessServerFn,
  upsertPaymentMethodServerFn,
} from '#/shared/api/business/business.fns.ts'

export function useDeleteBusinessMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (businessId: string) => deleteBusinessServerFn({ data: { id: businessId } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['businesses'] })
    },
  })
}

export function useUpdateBusinessMutation() {
  const queryClient = useQueryClient()

  return useMutation<BusinessResponse, Error, { id: string; payload: UpdateBusinessRequest }>({
    mutationFn: ({ id, payload }) =>
      updateBusinessServerFn({ data: { id, payload } }) as Promise<BusinessResponse>,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['businesses'] })
    },
  })
}

export function useCreateBusinessMutation() {
  return useMutation<BusinessResponse, Error, { data: CreateBusinessRequest }>({
    mutationFn: ({ data }) => createBusinessServerFn({ data }) as Promise<BusinessResponse>,
  })
}

type NavigateFn = () => void | Promise<void>

export function useSelectBusinessMutation({ navigate }: { navigate: NavigateFn }) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (businessId: string) => selectBusinessServerFn({ data: businessId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['active-business-id'] })
      await queryClient.invalidateQueries({ queryKey: ['business'] })
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.root })
      await queryClient.invalidateQueries({ queryKey: ['customer-menu'] })
      // Best-effort refresh of the router's cached beforeLoad context (root resolves
      // `selectedBusinessId` from the cookie and caches it on the match) — useful for
      // callers that stay on the same page, like the in-place BusinessSwitcher. Some
      // routes' own beforeLoad can throw a redirect once this context turns fresh
      // (e.g. /select-business redirecting to the dashboard once a business is
      // selected), so this can reject — that's fine, we navigate explicitly next
      // regardless of what happens here.
      await router.invalidate().catch(() => undefined)
      await navigate()
    },
  })
}

export function useBusinessSwitcher({ navigate }: { navigate: NavigateFn }) {
  const selectBusinessMutation = useSelectBusinessMutation({ navigate })

  return {
    switchBusiness: (businessId: string) => {
      selectBusinessMutation.mutate(businessId)
    },
    isLoading: selectBusinessMutation.isPending,
  }
}

export const businessesQueryOptions = () =>
  queryOptions({
    queryKey: ['businesses'] as const,
    queryFn: listBusinessesServerFn,
  })

export function useBusinessesQuery({ enabled = false } = {}) {
  return useQuery({ ...businessesQueryOptions(), enabled })
}

export function usePaymentMethodsQuery({
  businessId,
  enabled = false,
  select,
}: {
  businessId?: string
  enabled?: boolean
  select?: (data: BusinessPaymentMethodResponse[]) => BusinessPaymentMethodResponse[]
}) {
  return useQuery({
    queryKey: ['payment-methods', businessId],
    queryFn: () => listPaymentMethodsServerFn({ data: { businessId: businessId ?? '' } }),
    enabled: enabled && Boolean(businessId),
    select: select ?? undefined,
  })
}

export function useUpsertPaymentMethodMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      businessId,
      payload,
    }: {
      businessId: string
      payload: UpsertPaymentMethodRequest
    }) => upsertPaymentMethodServerFn({ data: { businessId, payload } }),
    onSuccess: async (_, { businessId }) => {
      await queryClient.invalidateQueries({ queryKey: ['payment-methods', businessId] })
    },
  })
}

export function useDeletePaymentMethodMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ businessId, methodId }: { businessId: string; methodId: string }) =>
      deletePaymentMethodServerFn({ data: { businessId, methodId } }),
    onSuccess: async (_, { businessId }) => {
      await queryClient.invalidateQueries({ queryKey: ['payment-methods', businessId] })
    },
  })
}
