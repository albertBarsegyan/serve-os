import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { isHTTPError } from 'ky'
import { useEffect } from 'react'
import { menuQueryOptions } from '#/entities/menu/lib/menu-query-options'
import { sessionQueryOptions } from '#/entities/session/lib/session-query-options'
import { createSessionServerFn } from '#/features/guest-session/api/create-session.fns'
import type { ScanSessionResponse } from '#/features/platform/api/platform.types'
import { CustomerMenuPage } from '#/pages/customer/menu/ui/customer-menu-page'
import { m } from '#/paraglide/messages'
import { clientApiInstance } from '#/shared/api/client-instance'
import { resumeSessionServerFn } from '#/shared/api/customer/session.fns'
import { absoluteUrl, buildSeoMeta } from '#/shared/libs/seo/meta.ts'
import {
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
} from '#/shared/libs/utils/storage.utils'
import { useMenuRealtime } from '#/shared/realtime/use-menu-realtime'
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
        // Idempotent server-side: creates or rejoins the table's active session, so
        // reloading /customer/menu?id=... never spawns a second independent session.
        session = await createSessionServerFn({ data: { qrCode: deps.qrCode } })
      } catch (error) {
        // A 4xx here means an expected, already-resolved condition (bad/expired QR) —
        // fall back to the localStorage resume path. Anything else (5xx, network
        // failure, a thrown redirect) is unexpected and must reach the error boundary
        // instead of being silently reinterpreted as "no session".
        if (isHTTPError(error) && error.response.status < 500) {
          session = null
        } else {
          throw error
        }
      }
    } else {
      // No QR — resume from the HttpOnly cookie forwarded by the browser
      try {
        session = await resumeSessionServerFn()
      } catch (error) {
        if (isHTTPError(error) && error.response.status < 500) {
          session = null
        } else {
          throw error
        }
      }
    }

    // SSR the menu + session status in parallel — both only need identifiers off the
    // already-resolved session, so there's no ordering dependency between them.
    if (session) {
      await Promise.all([
        context.queryClient.ensureQueryData(menuQueryOptions(session.businessId)),
        context.queryClient.ensureQueryData(sessionQueryOptions(session.sessionToken)),
      ])
    }
    return session
  },

  head: ({ loaderData }) => ({
    meta: buildSeoMeta({
      title: loaderData
        ? m.customer_menu_seo_title({ businessName: loaderData.businessName })
        : m.customer_menu_seo_title_fallback(),
      description: loaderData
        ? m.customer_menu_seo_description({ businessName: loaderData.businessName })
        : undefined,
      image: loaderData?.businessLogoUrl ?? undefined,
      path: '/customer/menu',
    }),
    scripts: loaderData
      ? [
          {
            type: 'application/ld+json',
            children: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Restaurant',
              name: loaderData.businessName,
              image: loaderData.businessLogoUrl ?? undefined,
              menu: absoluteUrl('/customer/menu'),
            }),
          },
        ]
      : undefined,
  }),

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
      const token = getLocalStorageItem('customer_session_token')
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
  // Refetches the menu when staff toggle a product's availability mid-session
  useMenuRealtime(session?.businessId ?? '')

  // Session-token persistence lives here (not in the menu UI) so it happens exactly
  // once the session is finally resolved, regardless of which path produced it.
  useEffect(() => {
    if (session?.sessionToken) setLocalStorageItem('customer_session_token', session.sessionToken)
  }, [session?.sessionToken])

  useEffect(() => {
    if (loaderSession !== null) return
    if (resumeQuery.isPending) return
    if (!session) {
      removeLocalStorageItem('customer_session_token')
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
