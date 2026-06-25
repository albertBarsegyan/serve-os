import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { menuQueryOptions } from '#/entities/menu/lib/menu-query-options'
import { createSessionServerFn } from '#/features/guest-session/api/create-session.fns'
import type { ScanSessionResponse } from '#/features/platform/api/platform.types'
import { CustomerMenuPage } from '#/pages/customer/menu/ui/customer-menu-page'
import { clientApiInstance } from '#/shared/api/client-instance'
import { resumeSessionServerFn } from '#/shared/api/customer/session.fns'
import { useSessionRealtime } from '#/shared/realtime/use-session-realtime'
import { ErrorBoundary } from '#/shared/ui/error-boundary'
import '#/pages/customer/menu/ui/styles.css'
import { CustomerMenuPending } from '#/features/customer/menu-pending.tsx'

type CustomerMenuSearch = {
  id: string
}

export const Route = createFileRoute('/customer/menu')({
  validateSearch: (raw: Record<string, unknown>): CustomerMenuSearch => ({
    id: typeof raw.id === 'string' ? raw.id : '',
  }),

  loaderDeps: ({ search }) => ({ qrCode: search.id }),

  loader: async ({ deps, context }): Promise<ScanSessionResponse | null> => {
    let session: ScanSessionResponse | null = null

    if (deps.qrCode) {
      try {
        session = await createSessionServerFn({ data: { qrCode: deps.qrCode } })
      } catch {
        session = null
      }
    } else {
      // No QR — resume from the HttpOnly cookie forwarded by the browser
      try {
        session = await resumeSessionServerFn()
      } catch {
        session = null
      }
    }

    // SSR the menu so the component gets it from cache without a second fetch
    if (session?.businessId) {
      await context.queryClient.ensureQueryData(menuQueryOptions(session?.businessId))
    }

    return session
  },

  pendingComponent: CustomerMenuPending,
  component: CustomerMenuRoute,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})

function CustomerMenuRoute() {
  const loaderSession = Route.useLoaderData()
  const navigate = useNavigate()

  // When the loader returned null (no cookie, or expired cookie), try localStorage
  const resumeQuery = useQuery({
    queryKey: ['customer-session'],
    queryFn: async (): Promise<ScanSessionResponse | null> => {
      const token = localStorage.getItem('customer_session_token')
      if (!token) return null
      return await clientApiInstance
        .get('sessions/resume', { headers: { 'x-session-token': token } })
        .json<ScanSessionResponse>()
    },
    staleTime: 60_000,
    enabled: loaderSession === null,
    retry: false,
  })

  const session: ScanSessionResponse | null = loaderSession ?? resumeQuery.data ?? null

  // Connect realtime for this session — joins session:<token> room and patches cache
  useSessionRealtime(session?.sessionToken ?? '')

  useEffect(() => {
    if (loaderSession !== null) return
    if (resumeQuery.isPending) return
    if (!session) {
      localStorage.removeItem('customer_session_token')
      void navigate({ to: '/' })
    }
  }, [loaderSession, resumeQuery.isPending, session, navigate])

  if (!session) {
    return <CustomerMenuPending />
  }

  return (
    <CustomerMenuPage
      sessionToken={session.sessionToken}
      sessionId={session.tableSessionId}
      businessId={session.businessId}
      tableId={session.tableId}
      tableName={session.tableName}
      businessName={session.businessName}
      businessLogoUrl={session.businessLogoUrl}
      paymentMethods={session.paymentMethods}
    />
  )
}
