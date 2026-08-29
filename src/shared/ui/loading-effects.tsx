import { Loader } from 'lucide-react'
import { m } from '#/paraglide/messages'

interface LoadingSpinnerProps {
  fullScreen?: boolean
  message?: string
}

export function LoadingSpinner({
  fullScreen = false,
  message = m.shared_loading(),
}: Readonly<LoadingSpinnerProps>) {
  const content = (
    <div className='flex flex-col items-center justify-center gap-4'>
      <Loader className='h-8 w-8 animate-spin text-primary' />
      {message && <p className='font-medium text-muted-foreground'>{message}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>{content}</div>
    )
  }

  return <div className='flex items-center justify-center p-8'>{content}</div>
}

export function LoadingSkeleton({
  count = 3,
  height = 'h-12',
}: Readonly<{
  count?: number
  height?: string
}>) {
  return (
    <div className='space-y-4'>
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static list, items have no identity
        <div key={i} className={`${height} animate-pulse rounded-lg bg-muted`} />
      ))}
    </div>
  )
}
