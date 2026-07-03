import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '#/features/platform/lib/constants/platform-query-keys.ts'
import type {
  CreateProductRequest,
  ProductResponse,
  UpdateProductRequest,
} from '#/features/product/api/product.types'
import { clientApiInstance } from '#/shared/api/client-instance'
import {
  createProductServerFn,
  deleteProductServerFn,
  getProductServerFn,
  updateProductServerFn,
} from '#/shared/api/product/product.fns'

export function useGetProduct(businessId: string, productId: string) {
  return useQuery({
    queryKey: platformQueryKeys.productById(productId),
    queryFn: () => getProductServerFn({ data: { productId } }),
    enabled: !!businessId && !!productId,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ businessId, payload }: { businessId: string; payload: CreateProductRequest }) =>
      createProductServerFn({ data: { businessId, payload } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.productsRoot() })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategories(true) })
      queryClient.invalidateQueries({ queryKey: ['customer-menu', data.businessId] })
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
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.productsRoot() })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategories(true) })
      queryClient.invalidateQueries({ queryKey: ['customer-menu', data.businessId] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ businessId, productId }: { businessId: string; productId: string }) =>
      deleteProductServerFn({ data: { businessId, productId } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.productsRoot() })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategories(true) })
      queryClient.invalidateQueries({ queryKey: ['customer-menu', variables.businessId] })
    },
  })
}

function reorderProductImagesApi(productId: string, imageUrls: string[]): Promise<ProductResponse> {
  return clientApiInstance
    .patch(`menu/products/${productId}/images/reorder`, { json: { imageUrls } })
    .json<ProductResponse>()
}

export function useReorderProductImages() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      productId,
      imageUrls,
    }: {
      businessId: string
      productId: string
      imageUrls: string[]
    }) => reorderProductImagesApi(productId, imageUrls),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.productsRoot() })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategories(true) })
      queryClient.invalidateQueries({ queryKey: ['customer-menu', data.businessId] })
    },
  })
}
