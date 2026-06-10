import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authUserQueryOptions } from '#/features/auth/lib/query-options.ts'
import { loginStaffBySlugFn } from '#/features/staff-auth/api/staff-auth.fns.ts'
import type { SlugStaffLoginRequest } from '#/features/staff-auth/api/staff-auth.types.ts'

export function useLoginStaffBySlugMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SlugStaffLoginRequest) => loginStaffBySlugFn({ data }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authUserQueryOptions().queryKey })
    },
  })
}
