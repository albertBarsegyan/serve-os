import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { CustomerMenuPage } from '#/pages/customer/menu/ui/customer-menu-page'
import { scanSession } from '#/shared/api/platform/platform-api'
import { ErrorBoundary } from '#/shared/ui/error-boundary.tsx'

type CustomerMenuSearch = {
  businessId: string
  tableId: string
}

export const Route = createFileRoute('/customer/menu')({
  validateSearch: (raw: Record<string, unknown>): CustomerMenuSearch => ({
    businessId: typeof raw.businessId === 'string' ? raw.businessId : '',
    tableId: typeof raw.tableId === 'string' ? raw.tableId : '',
  }),
  component: CustomerMenuRoute,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})

function CustomerMenuRoute() {
  const { businessId, tableId } = Route.useSearch()

  const sessionQuery = useQuery({
    queryKey: ['session-scan', businessId, tableId],
    queryFn: () => scanSession({ businessId, tableId }),
    enabled: Boolean(businessId && tableId),
    retry: 1,
    // Sessions are stable for the duration of a visit — no need to refetch on focus
    staleTime: 10 * 60 * 1000,
  })

  if (!(businessId && tableId)) {
    return (
      <main className='flex min-h-screen items-center justify-center p-6'>
        <div className='max-w-sm rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center'>
          <p className='font-semibold text-amber-900'>Invalid QR code</p>
          <p className='mt-1 text-sm text-amber-700'>
            businessId and tableId are required. Please rescan the QR code.
          </p>
        </div>
      </main>
    )
  }

  if (sessionQuery.isPending) {
    return (
      <main className='flex min-h-screen items-center justify-center p-6'>
        <p className='text-sm text-muted-foreground'>Starting your table session…</p>
      </main>
    )
  }

  if (sessionQuery.isError || !sessionQuery.data?.token) {
    return (
      <main className='flex min-h-screen items-center justify-center p-6'>
        <div className='max-w-sm rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center'>
          <p className='font-semibold text-destructive'>No active table session</p>
          <p className='mt-1 text-sm text-destructive/80'>
            Could not start a session for this table. Please rescan the QR code.
          </p>
          <button
            type='button'
            className='mt-4 rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-white'
            onClick={() => void sessionQuery.refetch()}
          >
            Retry
          </button>
        </div>
      </main>
    )
  }

  return (
    <CustomerMenuPage
      sessionToken={sessionQuery.data.token}
      sessionId={sessionQuery.data.id}
      businessId={businessId}
      tableId={tableId}
    />
  )
}
