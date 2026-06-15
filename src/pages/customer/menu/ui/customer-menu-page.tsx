import type { CustomerPaymentMethod } from '#/features/platform/api/platform.types'
import { CustomerMenuContent } from './customer-menu-content'

interface CustomerMenuPageProps {
  businessId: string
  tableId: string
  sessionToken: string
  sessionId: string
  tableName: string
  businessName: string
  businessLogoUrl: string | null
  paymentMethods: CustomerPaymentMethod[]
}

export function CustomerMenuPage(props: Readonly<CustomerMenuPageProps>) {
  return <CustomerMenuContent {...props} />
}
