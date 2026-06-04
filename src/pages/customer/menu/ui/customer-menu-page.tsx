import { CustomerMenuContent } from './customer-menu-content'

interface CustomerMenuPageProps {
  businessId: string
  tableId: string
  sessionToken: string
  sessionId: string
}

export function CustomerMenuPage({
  businessId,
  tableId,
  sessionToken,
  sessionId,
}: Readonly<CustomerMenuPageProps>) {
  return (
    <CustomerMenuContent
      businessId={businessId}
      tableId={tableId}
      sessionToken={sessionToken}
      sessionId={sessionId}
    />
  )
}
