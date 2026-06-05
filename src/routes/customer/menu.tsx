import { createFileRoute, redirect } from '@tanstack/react-router'
import { CustomerMenuPage } from '#/pages/customer/menu/ui/customer-menu-page'
import { scanSessionServerFn } from '#/shared/api/customer/session.fns.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary.tsx'

type CustomerMenuSearch = {
  id: string
}

export const Route = createFileRoute('/customer/menu')({
  validateSearch: (raw: Record<string, unknown>): CustomerMenuSearch => ({
    id: typeof raw.id === 'string' ? raw.id : '',
  }),

  beforeLoad: ({ search }) => {
    if (!search.id) throw redirect({ to: '/' })
  },

  loaderDeps: ({ search }) => ({ qrCode: search.id }),
  loader: ({ deps }) => scanSessionServerFn({ data: { qrCode: deps.qrCode } }),

  pendingComponent: () => (
    <main className='flex min-h-screen items-center justify-center p-6'>
      <p className='text-sm text-muted-foreground'>Starting your table session…</p>
    </main>
  ),

  component: CustomerMenuRoute,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})

function CustomerMenuRoute() {
  const session = Route.useLoaderData()

  return (
    <CustomerMenuPage
      sessionToken={session.sessionToken}
      sessionId={session.tableSessionId}
      businessId={session.businessId}
      tableId={session.tableId}
      tableName={session.tableName}
      businessName={session.businessName}
    />
  )
}
