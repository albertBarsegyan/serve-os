import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authUserQueryOptions } from '#/features/auth/lib/query-options.ts'
import { initializeAudio } from '#/features/notification/lib/play-sound.ts'
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
    onSuccess: async (data) => {
      queryClient.setQueryData(authUserQueryOptions().queryKey, { user: data.user })

      // Unlocks autoplay for real-time notification sounds (new order, call-waiter,
      // etc.) inside this user-gesture-backed login flow — without this, staff who
      // log in via PIN/slug (the normal floor-staff flow) never hear any sound, since
      // a later gesture-less socket-triggered .play() is silently blocked by the
      // browser's autoplay policy.
      await initializeAudio()
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
    onSuccess: async (data) => {
      queryClient.setQueryData(authUserQueryOptions().queryKey, { user: data.user })

      await initializeAudio()
    },
  })
}
