import {cn} from '#/lib/utils.ts'
import logoSrc from '#/shared/assets/serve-os-logo.png'
import {LazyImage} from './lazy-image.tsx'

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
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
}

export function Logo({ size = 'md', showText = false, className }: Readonly<LogoProps>) {
  const px = sizeMap[size]

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LazyImage src={logoSrc} alt='ServeOS' width={px} height={px} imgClassName='object-contain' />
      {showText && (
        <span
          className={cn(
            'font-semibold uppercase tracking-tight text-foreground',
            textSizeMap[size],
          )}
        >
          ServeOS
        </span>
      )}
    </span>
  )
}
