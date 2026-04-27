import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '#/features/auth/api/auth'
import { authQueryKey } from '#/features/auth/lib/constants/auth-query-keys.ts'

export function useSignInMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.signIn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [authQueryKey.ME] })
    },
  })
}

export function useSignUpMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.signup,
    onSettled: () => {
      void queryClient.invalidateQueries()
    },
  })
}

export const useMe = () => {
  return useQuery({
    queryKey: [authQueryKey.ME],
    queryFn: authApi.me,
    retry: false,
  })
}
