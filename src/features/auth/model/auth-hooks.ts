import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authUserQueryOptions } from '#/features/auth/lib/query-options.ts'
import { logoutServerFn, signInServerFn, signUpServerFn } from '#/shared/api/auth/auth.fns.ts'

export function useSignInMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: signInServerFn,
    onSuccess: (data) => {
      queryClient.setQueryData(authUserQueryOptions().queryKey, data)
    },
  })
}

export function useSignUpMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: signUpServerFn,
    onSuccess: (data) => {
      queryClient.setQueryData(authUserQueryOptions().queryKey, data)
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
    },
  })
}
