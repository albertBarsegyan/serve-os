import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { Toaster } from 'sonner'
import type { AuthenticatedUser } from '#/features/auth/api/auth.types.ts'
import { authUserQueryOptions } from '#/features/auth/lib/query-options.ts'
import { getLocale } from '#/paraglide/runtime'
import { ErrorBoundary } from '#/shared/ui/error-boundary'
import { NotFoundContent } from '#/shared/ui/not-found-content'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import TanStackQueryProvider from '../integrations/tanstack-query/root-provider'
import appCss from '../styles.css?url'

interface MyRouterContext {
  queryClient: QueryClient
  authUser?: AuthenticatedUser | null
}

const THEME_INIT_SCRIPT = `(function(){try{var root=document.documentElement;var stored=localStorage.getItem('theme');var theme=(stored&&JSON.parse(stored).state&&JSON.parse(stored).state.theme)||'light';root.classList.remove('light','dark');root.classList.add(theme);root.setAttribute('data-theme',theme);root.style.colorScheme=theme;}catch(e){document.documentElement.classList.add('light');}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ context }) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', getLocale())
    }

    const { user } = await context.queryClient.ensureQueryData(authUserQueryOptions())

    return { authUser: user }
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
      { rel: 'icon', href: '/favicon/favicon.ico', sizes: '48x48' },
      { rel: 'icon', href: '/favicon/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon/favicon-96x96.png' },
      { rel: 'apple-touch-icon', href: '/favicon/apple-touch-icon.png' },
      { rel: 'manifest', href: '/favicon/site.webmanifest' },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: RootErrorComponent,
  notFoundComponent: NotFoundContent,
})

function RootErrorComponent({ error }: Readonly<{ error: Error }>) {
  return (
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className='font-sans antialiased wrap-anywhere selection:bg-(--selection-bg)'>
        <ErrorBoundary error={error} />
        <Scripts />
      </body>
    </html>
  )
}

function RootDocument({ children }: Readonly<{ children: React.ReactNode }>) {
  // useEffect(() => {
  //   document.body.classList.add('page-loaded')
  // }, [])

  return (
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        {/** biome-ignore lint/security/noDangerouslySetInnerHtml: <this loads secure theme script> */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className='font-sans antialiased wrap-anywhere selection:bg-(--selection-bg)'>
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
