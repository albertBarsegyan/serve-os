import { Loader } from 'lucide-react'

interface LoadingSpinnerProps {
  fullScreen?: boolean
  message?: string
}

export function LoadingSpinner({
  fullScreen = false,
  message = 'Loading...',
}: LoadingSpinnerProps) {
  const content = (
    <div className='flex flex-col items-center justify-center gap-4'>
      <Loader className='h-8 w-8 animate-spin text-[#5D5FEF]' />
      {message && <p className='text-[#666] font-medium'>{message}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8F9FD] to-[#F0F1FD]'>
        {content}
      </div>
    )
  }

  return <div className='flex items-center justify-center p-8'>{content}</div>
}

export function LoadingSkeleton({
  count = 3,
  height = 'h-12',
}: {
  count?: number
  height?: string
}) {
  return (
    <div className='space-y-4'>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse`}
        />
      ))}
    </div>
  )
}
