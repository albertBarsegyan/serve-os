import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authUserQueryOptions } from '#/features/auth/lib/query-options.ts'
import {
  loginStaffBySlugFn,
  lookupStaffFn,
  pinLoginStaffFn,
} from '#/features/staff-auth/api/staff-auth.fns.ts'
import type {
  SlugStaffLoginRequest,
  StaffLookupRequest,
  StaffPinLoginRequest,
} from '#/features/staff-auth/api/staff-auth.types.ts'

export function useLoginStaffBySlugMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SlugStaffLoginRequest) => loginStaffBySlugFn({ data }),
    onSuccess: (data) => {
      queryClient.setQueryData(authUserQueryOptions().queryKey, { user: data.user })
    },
  })
}

export function useStaffLookupMutation() {
  return useMutation({
    mutationFn: (data: StaffLookupRequest) => lookupStaffFn({ data }),
  })
}

export function useStaffPinLoginMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StaffPinLoginRequest) => pinLoginStaffFn({ data }),
    onSuccess: (data) => {
      queryClient.setQueryData(authUserQueryOptions().queryKey, { user: data.user })
    },
  })
}
