import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { LoginResponseBody } from '#/shared/api/dto'
import { authApi } from '#/features/auth/api/auth'
import { authQueryKey } from '#/features/auth/lib/constants/auth-query-keys.ts'
import { setAuthToken, clearAuthToken } from '#/features/auth/lib/utils/auth-token'

export function useSignInMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.signIn,
    onSuccess: (data: LoginResponseBody) => {
      // Store token for persistence across page reloads
      setAuthToken(data.access_token)
      // Set user data in cache
      queryClient.setQueryData([authQueryKey.ME], data.user)
    },
  })
}

export function useSignUpMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [authQueryKey.ME] })
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

export const useLogoutMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.logout,
    retry: false,
    onSuccess: () => {
      // Clear persisted token
      clearAuthToken()
      // Clear all cached data
      void queryClient.clear()
    },
  })
}
