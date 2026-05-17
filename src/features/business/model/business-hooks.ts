import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AuthenticatedUser } from '#/features/auth/api/auth.types.ts'
import { authUserQueryOptions } from '#/features/auth/lib/query-options.ts'
import type { CreateBusinessRequest } from '#/features/business/api/business.types.ts'
import type { BusinessResponse } from '#/features/business/api/business-domain.ts'
import { createBusinessServerFn } from '#/shared/api/business/business.fns.ts'

export function useCreateBusinessMutation() {
  const queryClient = useQueryClient()

  return useMutation<BusinessResponse, Error, { data: CreateBusinessRequest }>({
    mutationFn: (args) => createBusinessServerFn(args) as Promise<BusinessResponse>,
    onSuccess: (business) => {
      const currentUser = queryClient.getQueryData<AuthenticatedUser>(
        authUserQueryOptions().queryKey,
      )

      if (currentUser) {
        queryClient.setQueryData<AuthenticatedUser>(authUserQueryOptions().queryKey, {
          ...currentUser,
          businessId: business.id,
        })
      }
    },
  })
}

void useCreateBusinessMutation
