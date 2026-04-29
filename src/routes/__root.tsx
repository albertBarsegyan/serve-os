import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, redirect, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { getRequest } from '@tanstack/react-start/server'
import { Toaster } from 'sonner'
import { authApi } from '#/features/auth/api/auth.ts'
import { authQueryKey } from '#/features/auth/lib/constants/auth-query-keys.ts'
import { getLocale } from '#/paraglide/runtime'
import { ErrorBoundary } from '#/shared/ui/ErrorBoundary'
import { NotFoundPage } from '#/shared/ui/NotFoundPage'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import TanStackQueryProvider from '../integrations/tanstack-query/root-provider'
import appCss from '../styles.css?url'

interface MyRouterContext {
  queryClient: QueryClient
  request?: Request
}

const THEME_INIT_SCRIPT = `(function(){try{var root=document.documentElement;root.classList.remove('dark');root.classList.add('light');root.setAttribute('data-theme','light');root.style.colorScheme='light';}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ context, location }) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', getLocale())
    }

    const request = getRequest()

    const cookie = request?.headers.get('cookie')

    if (cookie) {
      const user = await context.queryClient.fetchQuery({
        queryKey: [authQueryKey.ME],
        queryFn: () => authApi.me(cookie),
      })

      if (user?.id && location.pathname === '/') throw redirect({ to: '/admin/dashboard' })
    }
  },

  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'ServeOS - Next-Gen Hospitality OS',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: RootErrorComponent,
  notFoundComponent: NotFoundPage,
})

function RootErrorComponent({ error }: { error: Error }) {
  return (
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className='font-sans antialiased wrap-anywhere selection:bg-[var(--selection-bg)]'>
        <ErrorBoundary error={error} />
        <Scripts />
      </body>
    </html>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className='font-sans antialiased wrap-anywhere selection:bg-[var(--selection-bg)]'>
        <TanStackQueryProvider>
          {children}

          <Toaster richColors />
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
        </TanStackQueryProvider>
        <Scripts />
      </body>
    </html>
  )
}
