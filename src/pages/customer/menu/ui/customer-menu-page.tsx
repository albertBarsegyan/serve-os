import { CustomerMenuContent } from './customer-menu-content'

interface CustomerMenuPageProps {
  businessId: string
  tableId: string
  sessionToken: string
  sessionId: string
  tableName: string
  businessName: string
}

export function CustomerMenuPage(props: Readonly<CustomerMenuPageProps>) {
  return <CustomerMenuContent {...props} />
}
