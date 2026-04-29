import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '#/features/auth/api/auth'
import { authQueryKey } from '#/features/auth/lib/constants/auth-query-keys.ts'

export function useSignInMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.signIn,
    onSuccess: (data) => {
      void queryClient.setQueryData([authQueryKey.ME], data)
    },
  })
}

export function useSignUpMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: (data) => {
      void queryClient.setQueryData([authQueryKey.ME], data)
    },
  })
}

export const useMe = (cookie?: string) => {
  return useQuery({
    queryKey: [authQueryKey.ME],
    queryFn: () => authApi.me(cookie),
    retry: false,
  })
}

export const useLogoutMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.logout,
    retry: false,
    onSuccess: () => {
      queryClient.setQueryData([authQueryKey.ME], null)
    },
  })
}
