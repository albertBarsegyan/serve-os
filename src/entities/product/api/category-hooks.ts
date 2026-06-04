import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '#/features/product/api/category.types'
import {
  createCategoryServerFn,
  deleteCategoryServerFn,
  getCategoriesServerFn,
  getCategoryServerFn,
  updateCategoryServerFn,
} from '#/shared/api/product/category.fns'

export const CATEGORIES_QUERY_KEY = 'categories'

export function useGetCategories(businessId: string) {
  return useQuery({
    queryKey: [CATEGORIES_QUERY_KEY, businessId],
    queryFn: () => getCategoriesServerFn({ data: { businessId } }),
    enabled: !!businessId,
  })
}

export function useGetCategory(businessId: string, categoryId: string) {
  return useQuery({
    queryKey: [CATEGORIES_QUERY_KEY, businessId, categoryId],
    queryFn: () => getCategoryServerFn({ data: { businessId, categoryId } }),
    enabled: !!businessId && !!categoryId,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ businessId, payload }: { businessId: string; payload: CreateCategoryRequest }) =>
      createCategoryServerFn({ data: { businessId, payload } }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: [CATEGORIES_QUERY_KEY, data.businessId],
      })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      businessId,
      categoryId,
      payload,
    }: {
      businessId: string
      categoryId: string
      payload: UpdateCategoryRequest
    }) => updateCategoryServerFn({ data: { businessId, categoryId, payload } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [CATEGORIES_QUERY_KEY, data.businessId],
      })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ businessId, categoryId }: { businessId: string; categoryId: string }) =>
      deleteCategoryServerFn({ data: { businessId, categoryId } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [CATEGORIES_QUERY_KEY, variables.businessId],
      })
    },
  })
}
