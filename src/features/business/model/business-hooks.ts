import { useMutation } from '@tanstack/react-query'
import type {
  BusinessResponse,
  CreateBusinessRequest,
} from '#/features/business/api/business.types.ts'

import { createBusinessServerFn } from '#/shared/api/business/business.fns.ts'

export function useCreateBusinessMutation() {
  return useMutation<BusinessResponse, Error, { data: CreateBusinessRequest }>({
    mutationFn: ({ data }) => createBusinessServerFn({ data }) as Promise<BusinessResponse>,
  })
}

void useCreateBusinessMutation
