import { createFileRoute, Link, Outlet, redirect, useLocation } from '@tanstack/react-router'
import { adminRoutePathname } from '#/shared/libs/constants/route-pathname/admin.ts'
import { sharedRoutePathname } from '#/shared/libs/constants/route-pathname/shared.ts'
import { noIndexMeta } from '#/shared/libs/seo/meta.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'
import { Logo } from '#/shared/ui/logo.tsx'

function AuthErrorComponent({ error }: Readonly<{ error: Error }>) {
  return (
    <div className='flex min-h-screen flex-col justify-center bg-background py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <Link to='/' className='mb-6 flex items-center justify-center gap-2'>
          <Logo size='lg' />
        </Link>
      </div>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <ErrorBoundary error={error} />
      </div>
    </div>
  )
}

export const Route = createFileRoute('/auth')({
  component: AuthLayout,
  errorComponent: AuthErrorComponent,
  head: () => ({ meta: noIndexMeta }),
  beforeLoad: ({ context, location }) => {
    if (context.authUser && location.pathname.startsWith(sharedRoutePathname.AUTH))
      throw redirect({ to: adminRoutePathname.DASHBOARD })

    if (location.pathname === sharedRoutePathname.AUTH)
      throw redirect({ to: sharedRoutePathname.AUTH })
  },
})

function AuthLayout() {
  const location = useLocation()

  return (
    <div className='flex min-h-screen flex-col justify-center bg-background py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <Link to='/' className='mb-6 flex items-center justify-center gap-2'>
          <Logo size='lg' />
        </Link>
      </div>

      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <div key={location.pathname} className='page-enter'>
          <Outlet />
        </div>
      </div>

      <div className='mt-8 text-center text-sm text-muted-foreground'>
        <p>&copy; {new Date().getFullYear()} ServeOS. All rights reserved.</p>
      </div>
    </div>
  )
}
