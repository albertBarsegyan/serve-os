import {TanStackDevtools} from '@tanstack/react-devtools'
import type {QueryClient} from '@tanstack/react-query'
import {createRootRouteWithContext, HeadContent, Scripts} from '@tanstack/react-router'
import {TanStackRouterDevtoolsPanel} from '@tanstack/react-router-devtools'
import {Toaster} from 'sonner'
import type {AuthenticatedUser} from '#/features/auth/api/auth.types.ts'
import {authUserQueryOptions} from '#/features/auth/lib/query-options.ts'
import {getLocale} from '#/paraglide/runtime'
import {activeBusinessIdQueryOptions} from '#/shared/libs/hooks/use-active-business.ts'
import {ErrorBoundary} from '#/shared/ui/error-boundary'
import {NotFoundContent} from '#/shared/ui/not-found-content'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import TanStackQueryProvider from '../integrations/tanstack-query/root-provider'
import appCss from '../styles.css?url'

interface MyRouterContext {
  queryClient: QueryClient
  authUser?: AuthenticatedUser | null
  selectedBusinessId?: string | null
}

const THEME_INIT_SCRIPT = `(function(){try{var root=document.documentElement;var stored=localStorage.getItem('theme');var theme=(stored&&JSON.parse(stored).state&&JSON.parse(stored).state.theme)||'light';root.classList.remove('light','dark');root.classList.add(theme);root.setAttribute('data-theme',theme);root.style.colorScheme=theme;}catch(e){document.documentElement.classList.add('light');}try{var ps=localStorage.getItem('color-palette');var pal=(ps&&JSON.parse(ps).state&&JSON.parse(ps).state.palette)||'ocean';document.documentElement.setAttribute('data-palette',pal);}catch(e){document.documentElement.setAttribute('data-palette','ocean');}})();`

const GTAG_ID = import.meta.env.VITE_GTAG_ID
console.log('import.meta.env.PROD', import.meta.env.PROD)
export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ context }) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', getLocale())
    }

    const { user } = await context.queryClient.ensureQueryData(authUserQueryOptions())

    let selectedBusinessId: string | null = null
    if (user?.type === 'staff') {
      selectedBusinessId = user.businessId
    } else if (user?.type === 'owner') {
      selectedBusinessId = await context.queryClient.ensureQueryData(activeBusinessIdQueryOptions())
    }

    return { authUser: user, selectedBusinessId }
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
    scripts:
      import.meta.env.PROD && GTAG_ID
        ? [
            {
              src: `https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`,
              async: true,
            },
            {
              children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GTAG_ID}');`,
            },
          ]
        : [],
  }),
  shellComponent: RootDocument,
  errorComponent: RootErrorComponent,
  notFoundComponent: NotFoundContent,
})

function RootErrorComponent({ error }: Readonly<{ error: Error }>) {
  return (
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        {/** biome-ignore lint/security/noDangerouslySetInnerHtml: hardcoded theme init script, not user input */}
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
