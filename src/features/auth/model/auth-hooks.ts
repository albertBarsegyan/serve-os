import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authUserQueryOptions } from '#/features/auth/lib/query-options.ts'
import { disposeAudio, initializeAudio } from '#/features/notification/lib/play-sound.ts'
import { logoutServerFn, signInServerFn, signUpServerFn } from '#/shared/api/auth/auth.fns.ts'

export function useSignInMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: signInServerFn,
    onSuccess: async (data) => {
      queryClient.setQueryData(authUserQueryOptions().queryKey, data)

      await initializeAudio()

      return data
    },
  })
}

export function useSignUpMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: signUpServerFn,
    onSuccess: async (data) => {
      queryClient.setQueryData(authUserQueryOptions().queryKey, data)

      await initializeAudio()
    },
  })
}

export const useLogoutMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => logoutServerFn(),
    retry: false,
    onSuccess: async () => {
      await queryClient.cancelQueries()
      queryClient.clear()

      disposeAudio()
    },
  })
}
