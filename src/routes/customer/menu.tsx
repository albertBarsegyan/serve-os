import { createFileRoute } from '@tanstack/react-router'
import { ErrorBoundary } from '#/shared/ui/ErrorBoundary'
import { CustomerMenuPage } from '#/pages/customer/menu/ui/customer-menu-page'

type CustomerMenuSearch = {
	businessId: string
	tableId: string
	sessionToken: string
}

export const Route = createFileRoute('/customer/menu')({
	validateSearch: (raw: Record<string, unknown>): CustomerMenuSearch => ({
		businessId:
			typeof raw.businessId === 'string'
				? raw.businessId
				: (import.meta.env.VITE_DEV_BUSINESS_ID ?? ''),
		tableId:
			typeof raw.tableId === 'string'
				? raw.tableId
				: (import.meta.env.VITE_DEV_DEFAULT_TABLE_ID ?? 'demo-table'),
		sessionToken: typeof raw.sessionToken === 'string' ? raw.sessionToken : '',
	}),
	component: CustomerMenuRoute,
	errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})

function CustomerMenuRoute() {
	const search = Route.useSearch()
	return (
		<CustomerMenuPage
			businessId={search.businessId}
			tableId={search.tableId}
			sessionToken={search.sessionToken}
		/>
	)
}
