export interface Product {
  id: string
  tenantId: string
  name: string
  price: number
  category: 'pizza' | 'drink' | 'dessert'
  available: boolean
}
