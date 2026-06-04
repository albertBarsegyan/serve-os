import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AuthenticatedUser } from '#/features/auth/api/auth.types'
import { authUserQueryOptions } from '#/features/auth/lib/query-options'
import type { ChangePasswordRequest, UpdateProfileRequest } from '#/features/users/api/users.types'
import { changeUserPassword, updateUserProfile } from '#/shared/api/users/users.api'

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateUserProfile(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        authUserQueryOptions().queryKey,
        (prev: { user: AuthenticatedUser | null } | undefined) => {
          if (!prev?.user || prev.user.type !== 'owner') return prev
          return {
            user: {
              ...prev.user,
              firstName: updated.firstName,
              lastName: updated.lastName,
              email: updated.email,
            },
          }
        },
      )
    },
  })
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => changeUserPassword(data),
  })
}
