import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  BusinessResponse,
  CreateBusinessRequest,
  UpdateBusinessRequest,
  UpsertPaymentMethodRequest,
} from '#/features/business/api/business.types.ts'
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

  return useMutation({
    mutationFn: (businessId: string) => selectBusinessServerFn({ data: businessId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries()
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

export function useBusinessesQuery({ enabled = false } = {}) {
  return useQuery({
    queryKey: ['businesses'],
    queryFn: listBusinessesServerFn,
    enabled: enabled,
  })
}

export function usePaymentMethodsQuery({
  businessId,
  enabled = false,
}: {
  businessId?: string
  enabled?: boolean
}) {
  return useQuery({
    queryKey: ['payment-methods', businessId],
    queryFn: () => listPaymentMethodsServerFn({ data: { businessId: businessId ?? '' } }),
    enabled: enabled && Boolean(businessId),
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
