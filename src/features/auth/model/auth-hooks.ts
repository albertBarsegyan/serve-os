import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '#/features/auth/api/auth'
import { authQueryKey } from '#/features/auth/lib/constants/auth-query-keys.ts'
import { setAuthToken, clearAuthToken } from '#/features/auth/lib/utils/auth-token'

export function useSignInMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.signIn,
    onSuccess: (data) => {
      // Store auth token on successful login
      if (data?.token) {
        setAuthToken(data.token)
      } else {
        setAuthToken('exists') // Token in cookie
      }
      void queryClient.invalidateQueries({ queryKey: [authQueryKey.ME] })
    },
  })
}

export function useSignUpMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.signup,
    onSettled: (data) => {
      // Store auth token on successful signup
      if (data?.token) {
        setAuthToken(data.token)
      } else {
        setAuthToken('exists') // Token in cookie
      }
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
      // Clear auth token on logout
      clearAuthToken()
      void queryClient.clear()
    },
  })
}
