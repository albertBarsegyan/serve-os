import { AlertTriangle, Home } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from './Button'

export function NotFoundPage() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8F9FD] to-[#F0F1FD] px-4'>
      <div className='text-center max-w-lg'>
        <div className='mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100'>
          <AlertTriangle className='h-8 w-8 text-yellow-600' />
        </div>
        <h1 className='mb-2 text-4xl font-black text-[#2D2D2D]'>404</h1>
        <h2 className='mb-4 text-2xl font-bold text-[#2D2D2D]'>Page Not Found</h2>
        <p className='mb-8 text-[#666] leading-relaxed'>
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div className='flex flex-col gap-3 sm:flex-row justify-center'>
          <Link to='/'>
            <Button className='flex items-center justify-center gap-2 w-full sm:w-auto'>
              <Home className='h-4 w-4' />
              Go to Home
            </Button>
          </Link>
          <Button
            variant='outline'
            onClick={() => window.history.back()}
            className='w-full sm:w-auto'
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}
