import { createServerFn } from '@tanstack/react-start'
import type {
  CreateProductRequest,
  ProductResponse,
  UpdateProductRequest,
} from '#/features/product/api/product.types'
import { serverApiInstance } from '#/shared/api/server-instance'
import { forwardCookies } from '#/shared/libs/utils/cookie.server'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'

/**
 * Create product
 */
export const createProductServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { businessId: string; payload: CreateProductRequest }) => data)
  .handler(
    async ({
      data,
    }: {
      data: { businessId: string; payload: CreateProductRequest }
    }): Promise<ProductResponse> => {
      const request = await serverApiInstance<ProductResponse>(`menu/products`, {
        method: 'POST',
        json: data.payload,
      })

      forwardCookies(request)

      if (!request.ok) {
        const error = await request.json()
        throw new Error(getResponseErrorMessage(error))
      }

      return request.json()
    },
  )

/**
 * Get products for business
 */
export const getProductsServerFn = createServerFn({
  method: 'GET',
})
  .inputValidator((data: { businessId: string }) => data)
  .handler(async (): Promise<ProductResponse[]> => {
    const request = await serverApiInstance<ProductResponse[]>(`menu/products`, {
      method: 'GET',
    })

    forwardCookies(request)

    if (!request.ok) {
      throw new Error('Failed to fetch products')
    }

    return request.json()
  })

/**
 * Get single product
 */
export const getProductServerFn = createServerFn({
  method: 'GET',
})
  .inputValidator((data: { businessId: string; productId: string }) => data)
  .handler(async ({ data }): Promise<ProductResponse> => {
    const request = await serverApiInstance<ProductResponse>(`menu/products/${data.productId}`, {
      method: 'GET',
    })

    forwardCookies(request)

    if (!request.ok) {
      throw new Error('Failed to fetch product')
    }

    return request.json()
  })

/**
 * Update product
 */
export const updateProductServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator(
    (data: { businessId: string; productId: string; payload: UpdateProductRequest }) => data,
  )
  .handler(
    async ({
      data,
    }: {
      data: { businessId: string; productId: string; payload: UpdateProductRequest }
    }): Promise<ProductResponse> => {
      const request = await serverApiInstance<ProductResponse>(`menu/products/${data.productId}`, {
        method: 'PATCH',
        json: data.payload,
      })

      forwardCookies(request)

      if (!request.ok) {
        const error = await request.json()
        throw new Error(getResponseErrorMessage(error))
      }

      return request.json()
    },
  )

/**
 * Delete product
 */
export const deleteProductServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { businessId: string; productId: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const request = await serverApiInstance(`menu/products/${data.productId}`, {
      method: 'DELETE',
    })

    forwardCookies(request)

    if (!request.ok) {
      throw new Error('Failed to delete product')
    }
  })
