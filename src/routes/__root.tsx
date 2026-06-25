import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { Toaster } from 'sonner'
import type { AuthenticatedUser } from '#/features/auth/api/auth.types.ts'
import { authUserQueryOptions } from '#/features/auth/lib/query-options.ts'
import { getLocale } from '#/paraglide/runtime'
import { activeBusinessIdQueryOptions } from '#/shared/libs/hooks/use-active-business.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'
import { NotFoundContent } from '#/shared/ui/not-found-content'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import TanStackQueryProvider from '../integrations/tanstack-query/root-provider'
import appCss from '../styles.css?url'

interface MyRouterContext {
  queryClient: QueryClient
  authUser?: AuthenticatedUser | null
  selectedBusinessId?: string | null
}

const THEME_INIT_SCRIPT = `(function(){try{var root=document.documentElement;var stored=localStorage.getItem('theme');var theme=(stored&&JSON.parse(stored).state&&JSON.parse(stored).state.theme)||'light';root.classList.remove('light','dark');root.classList.add(theme);root.setAttribute('data-theme',theme);root.style.colorScheme=theme;}catch(e){document.documentElement.classList.add('light');}try{var ps=localStorage.getItem('color-palette');var pal=(ps&&JSON.parse(ps).state&&JSON.parse(ps).state.palette)||'ocean';document.documentElement.setAttribute('data-palette',pal);}catch(e){document.documentElement.setAttribute('data-palette','ocean');}})();`

const GTM_ID = import.meta.env.VITE_GTM_ID

function GtmNoscript() {
  if (!(import.meta.env.PROD && GTM_ID)) return null
  const html = `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe>`
  return (
    <>
      {/** biome-ignore lint/security/noDangerouslySetInnerHtml: GTM noscript fallback, static string, not user input */}
      <noscript suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />
    </>
  )
}

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
    // GTM bootstrap — injected only in production builds with a configured container ID.
    // TODO: wire a consent gate here before pushing events to window.dataLayer.
    scripts:
      import.meta.env.PROD && GTM_ID
        ? [
            {
              children: `window.dataLayer=window.dataLayer||[];(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
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
        <GtmNoscript />
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
        <GtmNoscript />
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
