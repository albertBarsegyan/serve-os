import { clientApiInstance } from '#/shared/api/client-instance'

/** Mirrors ImageEntityType in the backend storage.config — determines the storage path. */
export enum ImageEntityType {
  BUSINESS_LOGO = 'logo',
  BUSINESS_CATEGORY = 'category',
  BUSINESS_PRODUCT = 'product',
  BUSINESS_TABLE = 'table',
  USER_AVATAR = 'user-avatar',
  STAFF_AVATAR = 'staff-avatar',
}

export interface UploadImageOptions {
  entityType: ImageEntityType
  /** Staff ID — only required when an owner uploads on behalf of a specific staff member. */
  entityId?: string
}

export interface UploadedImage {
  id: string
  url: string
  key: string
  mimeType: string
  size: number
}

export function uploadImage(file: File, options?: UploadImageOptions): Promise<UploadedImage> {
  const formData = new FormData()
  formData.append('file', file)
  if (options?.entityType) formData.append('entityType', options.entityType)
  if (options?.entityId) formData.append('entityId', options.entityId)
  return clientApiInstance.post('images/upload', { body: formData }).json<UploadedImage>()
}
