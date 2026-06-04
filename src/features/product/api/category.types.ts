export interface CategoryResponse {
  id: string
  businessId: string
  name: string
  description?: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryRequest {
  name: string
  description?: string | null
  sortOrder?: number
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>

