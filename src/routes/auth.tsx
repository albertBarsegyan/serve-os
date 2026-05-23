import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { ErrorBoundary } from '#/shared/ui/ErrorBoundary'
import { getPostAuthDestination } from '#/features/business/lib/utils/business-routing.ts'

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
    if (context.authUser && location.pathname.startsWith('/auth'))
      throw redirect({ to: getPostAuthDestination(context.authUser) })

    if (location.pathname === '/auth') throw redirect({ to: '/auth/sign-in' })
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
