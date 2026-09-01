import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '#/features/platform/lib/constants/platform-query-keys.ts'
import { getCategoriesServerFn, getCategoryServerFn } from '#/shared/api/product/category.fns'

export function useGetCategories(businessId: string) {
  return useQuery({
    queryKey: platformQueryKeys.menuCategories(businessId, false),
    queryFn: () => getCategoriesServerFn(),
    enabled: !!businessId,
  })
}

export function useGetCategory(businessId: string, categoryId: string) {
  return useQuery({
    queryKey: platformQueryKeys.categoryById(businessId, categoryId),
    queryFn: () => getCategoryServerFn({ data: { categoryId } }),
    enabled: !!businessId && !!categoryId,
  })
}
