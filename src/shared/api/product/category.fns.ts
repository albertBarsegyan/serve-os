import { createServerFn } from '@tanstack/react-start'
import type {
  CategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '#/features/product/api/category.types'
import { serverApiInstance } from '#/shared/api/server-instance'
import { forwardCookies } from '#/shared/libs/utils/cookie.utils'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'

/**
 * Create category
 */
export const createCategoryServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { businessId: string; payload: CreateCategoryRequest }) => data)
  .handler(
    async ({
      data,
    }: {
      data: { businessId: string; payload: CreateCategoryRequest }
    }): Promise<CategoryResponse> => {
      const request = await serverApiInstance<CategoryResponse>(
        `menu/categories`,
        {
          method: 'POST',
          json: data.payload,
        },
      )

      forwardCookies(request)

      if (!request.ok) {
        const error = await request.json()
        throw new Error(getResponseErrorMessage(error))
      }

      return request.json()
    },
  )

/**
 * Get categories for business
 */
export const getCategoriesServerFn = createServerFn({
  method: 'GET',
})
  .inputValidator((data: { businessId: string }) => data)
  .handler(async ({ data }): Promise<CategoryResponse[]> => {
    const request = await serverApiInstance<CategoryResponse[]>(
      `menu/categories`,
      {
        method: 'GET',
      },
    )

    forwardCookies(request)

    if (!request.ok) {
      throw new Error('Failed to fetch categories')
    }

    return request.json()
  })

/**
 * Get single category
 */
export const getCategoryServerFn = createServerFn({
  method: 'GET',
})
  .inputValidator((data: { businessId: string; categoryId: string }) => data)
  .handler(async ({ data }): Promise<CategoryResponse> => {
    const request = await serverApiInstance<CategoryResponse>(
      `menu/categories/${data.categoryId}`,
      {
        method: 'GET',
      },
    )

    forwardCookies(request)

    if (!request.ok) {
      throw new Error('Failed to fetch category')
    }

    return request.json()
  })

/**
 * Update category
 */
export const updateCategoryServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator(
    (data: { businessId: string; categoryId: string; payload: UpdateCategoryRequest }) => data,
  )
  .handler(
    async ({
      data,
    }: {
      data: { businessId: string; categoryId: string; payload: UpdateCategoryRequest }
    }): Promise<CategoryResponse> => {
      const request = await serverApiInstance<CategoryResponse>(
        `menu/categories/${data.categoryId}`,
        {
          method: 'PATCH',
          json: data.payload,
        },
      )

      forwardCookies(request)

      if (!request.ok) {
        const error = await request.json()
        throw new Error(getResponseErrorMessage(error))
      }

      return request.json()
    },
  )

/**
 * Delete category
 */
export const deleteCategoryServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { businessId: string; categoryId: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const request = await serverApiInstance(
      `menu/categories/${data.categoryId}`,
      {
        method: 'DELETE',
      },
    )

    forwardCookies(request)

    if (!request.ok) {
      throw new Error('Failed to delete category')
    }
  })
