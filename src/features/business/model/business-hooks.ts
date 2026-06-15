import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { AuthenticatedUser } from '#/features/auth/api/auth.types.ts'
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
  getBusinessServerFn,
  listBusinessesServerFn,
  listPaymentMethodsServerFn,
  selectBusinessServerFn,
  updateBusinessServerFn,
  upsertPaymentMethodServerFn,
} from '#/shared/api/business/business.fns.ts'
import useActiveBusinessStore, {
  type ActiveBusiness,
} from '#/shared/store/use-active-business.store.ts'

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
  const setActive = useActiveBusinessStore((s) => s.setActive)

  return useMutation({
    mutationFn: (business: ActiveBusiness) => selectBusinessServerFn({ data: business.id }),
    onSuccess: async (_, business) => {
      setActive(business)
      await queryClient.invalidateQueries()
      await navigate()
    },
  })
}

export function useBusinessSwitcher({ navigate }: { navigate: NavigateFn }) {
  const selectBusinessMutation = useSelectBusinessMutation({ navigate })

  return {
    switchBusiness: (business: ActiveBusiness) => {
      selectBusinessMutation.mutate(business)
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
    queryFn: () => listPaymentMethodsServerFn({ data: { businessId: businessId! } }),
    enabled: enabled && !!businessId,
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

/**
 * Ensures the active-business store is populated for staff users.
 * Staff have a fixed businessId in their JWT; we fetch that specific business
 * to get name + currency for the store.
 */
export function useStaffActiveBusiness(authUser: AuthenticatedUser | null | undefined) {
  const active = useActiveBusinessStore((s) => s.active)
  const setActive = useActiveBusinessStore((s) => s.setActive)

  const isStaff = authUser?.type === 'staff'
  const staffBusinessId = isStaff ? authUser.businessId : null
  const needsSync = isStaff && active?.id !== staffBusinessId

  const { data: business } = useQuery({
    queryKey: ['business', staffBusinessId],
    queryFn: () => getBusinessServerFn({ data: { id: staffBusinessId as string } }),
    enabled: Boolean(needsSync),
  })

  useEffect(() => {
    if (!(needsSync && business)) return

    setActive({
      id: business.id,
      name: business.name,
      currency: business.currency,
      slug: business.slug,
    })
  }, [needsSync, business, setActive])
}
