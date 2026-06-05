import { clientApiInstance } from '#/shared/api/client-instance'
import type { CustomerCategory } from './menu.types'

export interface CustomerOrderItem {
  productId: string
  quantity: number
  notes?: string
  selectedModifiers?: Array<{
    modifierId: string
    name: string
    priceAdjustment: number
  }>
}

export interface CustomerOrderResponse {
  id: string
  businessId: string
  tableId: string | null
  status: string
  totalAmount: string
  createdAt: string
}

export interface CustomerPaymentResponse {
  id: string
  orderId: string
  businessId: string
  method: string
  status: string
  amount: number
  createdAt: string
}

export function fetchCustomerMenu(businessId: string): Promise<CustomerCategory[]> {
  return clientApiInstance
    .get('menu/customer', { searchParams: { businessId } })
    .json<CustomerCategory[]>()
}

export function createCustomerOrder(
  sessionToken: string,
  items: CustomerOrderItem[],
): Promise<CustomerOrderResponse> {
  return clientApiInstance
    .post('orders', { json: { sessionToken, items } })
    .json<CustomerOrderResponse>()
}

export function createCustomerPayment(
  orderId: string,
  method: 'CASH' | 'POS' | 'ONLINE',
  amount: number,
): Promise<CustomerPaymentResponse> {
  return clientApiInstance
    .post('payments', { json: { orderId, method, amount } })
    .json<CustomerPaymentResponse>()
}
