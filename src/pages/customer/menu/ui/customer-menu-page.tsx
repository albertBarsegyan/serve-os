import { CustomerMenuContent } from './customer-menu-content'

interface CustomerMenuPageProps {
	businessId: string
	tableId: string
	sessionToken: string
}

export function CustomerMenuPage({ businessId, tableId, sessionToken }: CustomerMenuPageProps) {
	return (
		<CustomerMenuContent businessId={businessId} tableId={tableId} sessionToken={sessionToken} />
	)
}
