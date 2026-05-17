import { useNavigate } from '@tanstack/react-router'
import { AlertTriangle, Home, RotateCcw } from 'lucide-react'

import { Button } from '#/components/ui/button'

interface ErrorBoundaryProps {
  error: Error
  reset?: () => void
  isNotFound?: boolean
}

export function ErrorBoundary({ error, reset, isNotFound = false }: Readonly<ErrorBoundaryProps>) {
  const navigate = useNavigate()

  const handleReset = () => {
    if (reset) {
      reset()
    } else {
      globalThis.location.reload()
    }
  }

  if (isNotFound) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background px-4'>
        <div className='text-center max-w-lg'>
          <div className='mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10'>
            <AlertTriangle className='h-8 w-8 text-destructive' />
          </div>
          <h1 className='mb-2 text-3xl font-semibold tracking-tight text-foreground'>Page Not Found</h1>
          <p className='mb-8 text-muted-foreground'>
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
            <Button variant='outline' onClick={() => globalThis.history.back()}>
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
    <div className='min-h-screen flex items-center justify-center bg-background px-4'>
      <div className='max-w-lg w-full'>
        <div className='rounded-xl border border-border bg-card p-8 text-card-foreground shadow-sm'>
          <div className='mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10'>
            <AlertTriangle className='h-7 w-7 text-destructive' />
          </div>

          <h1 className='mb-2 text-2xl font-semibold tracking-tight'>Something Went Wrong</h1>

          <p className='mb-6 text-muted-foreground'>
            We encountered an unexpected error. Please try again or contact support if the problem
            persists.
          </p>

          {isDev && (
            <div className='mb-6 rounded-lg border border-destructive/20 bg-destructive/5 p-4'>
              <p className='mb-2 text-xs font-mono font-semibold text-destructive'>Error Details:</p>
                  <p className='mb-3 wrap-break-word font-mono text-sm text-destructive'>{errorMessage}</p>
              {errorStack && (
                <details className='text-xs'>
                  <summary className='mb-2 cursor-pointer font-semibold text-destructive'>
                    Stack Trace
                  </summary>
                  <pre className='max-h-40 overflow-auto rounded bg-foreground p-2 text-xs text-background'>
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

export function ErrorFallback({ error, isNotFound }: Readonly<ErrorFallbackProps>) {
  return <ErrorBoundary error={error} isNotFound={isNotFound} />
}
