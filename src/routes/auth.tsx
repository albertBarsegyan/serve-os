import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { ErrorBoundary } from '#/shared/ui/ErrorBoundary'

function AuthErrorComponent({ error }: { error: Error }) {
  return (
    <div className='min-h-screen bg-[#F8F9FD] flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <Link to='/' className='flex justify-center items-center gap-2 mb-6'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#5D5FEF] text-sm font-bold text-white shadow-lg shadow-[#5D5FEF]/20'>
            S
          </div>
          <span className='text-2xl font-black tracking-tighter text-[#2D2D2D] uppercase'>
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
})

function AuthLayout() {
  return (
    <div className='min-h-screen bg-[#F8F9FD] flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <Link to='/' className='flex justify-center items-center gap-2 mb-6'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#5D5FEF] text-sm font-bold text-white shadow-lg shadow-[#5D5FEF]/20'>
            S
          </div>
          <span className='text-2xl font-black tracking-tighter text-[#2D2D2D] uppercase'>
            ServeOS
          </span>
        </Link>
      </div>

      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <Outlet />
      </div>

      <div className='mt-8 text-center text-sm text-[#666]'>
        <p>&copy; {new Date().getFullYear()} ServeOS. All rights reserved.</p>
      </div>
    </div>
  )
}
