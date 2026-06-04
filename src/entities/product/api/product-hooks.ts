import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '#/features/platform/lib/constants/platform-query-keys.ts'
import type {
  CreateProductRequest,
  UpdateProductRequest,
} from '#/features/product/api/product.types'
import {
  createProductServerFn,
  deleteProductServerFn,
  getProductServerFn,
  getProductsServerFn,
  updateProductServerFn,
} from '#/shared/api/product/product.fns'

const PRODUCTS_QUERY_KEY = 'products'

export function useGetProducts(businessId: string) {
  return useQuery({
    queryKey: [PRODUCTS_QUERY_KEY, businessId],
    queryFn: () => getProductsServerFn({ data: { businessId } }),
    enabled: !!businessId,
  })
}

export function useGetProduct(businessId: string, productId: string) {
  return useQuery({
    queryKey: [PRODUCTS_QUERY_KEY, businessId, productId],
    queryFn: () => getProductServerFn({ data: { businessId, productId } }),
    enabled: !!businessId && !!productId,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ businessId, payload }: { businessId: string; payload: CreateProductRequest }) =>
      createProductServerFn({ data: { businessId, payload } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY, data.businessId] })
      queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'products'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      businessId,
      productId,
      payload,
    }: {
      businessId: string
      productId: string
      payload: UpdateProductRequest
    }) => updateProductServerFn({ data: { businessId, productId, payload } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY, data.businessId] })
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY, data.businessId, data.id] })
      queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'products'] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ businessId, productId }: { businessId: string; productId: string }) =>
      deleteProductServerFn({ data: { businessId, productId } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY, variables.businessId] })
      queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'products'] })
    },
  })
}
