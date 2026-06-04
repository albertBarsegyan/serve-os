import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { adminRoutePathname } from '#/shared/libs/constants/route-pathname/admin.ts'
import { sharedRoutePathname } from '#/shared/libs/constants/route-pathname/shared.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

function AuthErrorComponent({ error }: Readonly<{ error: Error }>) {
  return (
    <div className='flex min-h-screen flex-col justify-center bg-background py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <Link to='/' className='mb-6 flex items-center justify-center gap-2'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm'>
            S
          </div>
          <span className='text-2xl font-semibold tracking-tight text-foreground uppercase'>
            ServeOS
          </span>
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
  beforeLoad: ({ context, location }) => {
    if (context.authUser && location.pathname.startsWith(sharedRoutePathname.AUTH))
      throw redirect({ to: adminRoutePathname.DASHBOARD })

    if (location.pathname === sharedRoutePathname.AUTH)
      throw redirect({ to: sharedRoutePathname.AUTH })
  },
})

function AuthLayout() {
  return (
    <div className='flex min-h-screen flex-col justify-center bg-background py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <Link to='/' className='mb-6 flex items-center justify-center gap-2'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm'>
            S
          </div>
          <span className='text-2xl font-semibold tracking-tight text-foreground uppercase'>
            ServeOS
          </span>
        </Link>
      </div>

      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <Outlet />
      </div>

      <div className='mt-8 text-center text-sm text-muted-foreground'>
        <p>&copy; {new Date().getFullYear()} ServeOS. All rights reserved.</p>
      </div>
    </div>
  )
}
