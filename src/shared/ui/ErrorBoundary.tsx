import { AlertTriangle, Home, RotateCcw } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import type React from 'react'
import { Button } from './Button'

interface ErrorBoundaryProps {
  error: Error
  reset?: () => void
  isNotFound?: boolean
}

export function ErrorBoundary({
  error,
  reset,
  isNotFound = false,
}: ErrorBoundaryProps) {
  const navigate = useNavigate()

  const handleReset = () => {
    if (reset) {
      reset()
    } else {
      window.location.reload()
    }
  }

  if (isNotFound) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8F9FD] to-[#F0F1FD] px-4'>
        <div className='text-center max-w-lg'>
          <div className='mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
            <AlertTriangle className='h-8 w-8 text-red-600' />
          </div>
          <h1 className='mb-2 text-3xl font-black text-[#2D2D2D]'>Page Not Found</h1>
          <p className='mb-8 text-[#666]'>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className='flex flex-col gap-3 sm:flex-row justify-center'>
            <Button
              onClick={() => navigate({ to: '/' })}
              className='flex items-center justify-center gap-2'
            >
              <Home className='h-4 w-4' />
              Go to Home
            </Button>
            <Button variant='outline' onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isDev = import.meta.env.DEV
  const errorMessage = error?.message || 'An unexpected error occurred'
  const errorStack = error?.stack || ''

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8F9FD] to-[#F0F1FD] px-4'>
      <div className='max-w-lg w-full'>
        <div className='rounded-lg border border-red-200 bg-white p-8 shadow-lg'>
          <div className='mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100'>
            <AlertTriangle className='h-7 w-7 text-red-600' />
          </div>

          <h1 className='mb-2 text-2xl font-black text-[#2D2D2D]'>
            Something Went Wrong
          </h1>

          <p className='mb-6 text-[#666]'>
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>

          {isDev && (
            <div className='mb-6 rounded bg-red-50 p-4 border border-red-200'>
              <p className='mb-2 text-xs font-mono font-bold text-red-700'>Error Details:</p>
              <p className='mb-3 text-sm font-mono text-red-600 break-words'>
                {errorMessage}
              </p>
              {errorStack && (
                <details className='text-xs'>
                  <summary className='cursor-pointer font-bold text-red-700 mb-2'>
                    Stack Trace
                  </summary>
                  <pre className='overflow-auto bg-red-900 text-red-100 p-2 rounded text-xs max-h-40'>
                    {errorStack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className='flex flex-col gap-3'>
            <Button onClick={handleReset} className='w-full flex items-center justify-center gap-2'>
              <RotateCcw className='h-4 w-4' />
              Try Again
            </Button>
            <Button
              variant='outline'
              onClick={() => navigate({ to: '/' })}
              className='w-full flex items-center justify-center gap-2'
            >
              <Home className='h-4 w-4' />
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ErrorFallbackProps {
  error: Error
  isNotFound?: boolean
}

export function ErrorFallback({ error, isNotFound }: ErrorFallbackProps) {
  return <ErrorBoundary error={error} isNotFound={isNotFound} />
}
