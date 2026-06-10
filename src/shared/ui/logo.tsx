import { cn } from '#/lib/utils.ts'
import logoSrc from '#/shared/assets/logo.png'
import { LazyImage } from './lazy-image.tsx'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizeMap = {
  sm: 36,
  md: 48,
  lg: 56,
}

const textSizeMap = {
  sm: 'text-[24px]',
  md: 'text-[32px]',
  lg: 'text-[36px]',
}

export function Logo({ size = 'md', showText = false, className }: Readonly<LogoProps>) {
  const px = sizeMap[size]

  return (
    <span className={cn('inline-flex items-center gap-4', className)}>
      <LazyImage src={logoSrc} alt='ServeOS' width={px} height={px} imgClassName='object-contain' />
      {showText && (
        <span
          className={cn(
            'font-semibold tracking-tight text-primary whitespace-nowrap',
            textSizeMap[size],
          )}
        >
          serve-os
        </span>
      )}
    </span>
  )
}
