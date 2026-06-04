import { useState } from 'react'
import { cn } from '#/lib/utils.ts'

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  imgClassName?: string
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  imgClassName,
}: Readonly<LazyImageProps>) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={cn('overflow-hidden', className)}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        onLoad={() => setLoaded(true)}
        className={cn(
          'transition-[filter,opacity] duration-500 bg-transparent',
          loaded ? 'blur-0 opacity-100' : 'blur-md opacity-0',
          imgClassName,
        )}
      />
    </div>
  )
}
