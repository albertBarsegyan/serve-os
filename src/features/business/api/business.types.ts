import type { BusinessType } from '#/features/business/api/business-domain.ts'
import type { BusinessFeature } from '#/features/platform/api/platform.types.ts'

export const businessTypes = [
  'RESTAURANT',
  'CAFE',
  'BAR',
  'FAST_FOOD',
  'FOOD_TRUCK',
  'HOTEL',
  'EVENT_VENUE',
  'OTHER',
] as const

export interface CreateBusinessRequest {
  name: string
  type: keyof typeof BusinessType
  location: string
  currency: string
  workingHours?: string
  features?: BusinessFeature[]
}

export interface UpdateBusinessRequest {
  name?: string
  type: keyof typeof BusinessType
  location?: string
  currency?: string
  workingHours?: string
  isActive?: boolean
  features?: BusinessFeature[]
}

export interface BusinessResponse {
  id: string
  name: string
  type: keyof typeof BusinessType
  features: BusinessFeature[]
  location: string
  currency: string
  workingHours?: string
  slug: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  ownerId: string
}

export type PaymentMethodType = 'CASH' | 'POS' | 'ONLINE'

export interface OnlinePaymentConfig {
  clientId?: string
  secretKey?: string
  merchantId?: string
  testMode?: boolean
}

export interface BusinessPaymentMethodResponse {
  id: string
  method: PaymentMethodType
  isActive: boolean
  config: OnlinePaymentConfig | null
  createdAt: string
  updatedAt: string
}

export interface UpsertPaymentMethodRequest {
  method: PaymentMethodType
  isActive: boolean
  config?: OnlinePaymentConfig
}
