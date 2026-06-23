import { cn } from '#/lib/utils.ts'
import { LogoSvg } from './logo-svg.tsx'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizeMap = {
  sm: 'w-9 h-9',
  md: 'w-12 h-12',
  lg: 'w-14 h-14',
}

const textSizeMap = {
  sm: 'text-[24px]',
  md: 'text-[32px]',
  lg: 'text-[36px]',
}

export function Logo({ size = 'md', showText = false, className }: Readonly<LogoProps>) {
  return (
    <span className={cn('inline-flex items-center gap-4 text-primary', className)}>
      <LogoSvg className={cn('shrink-0', sizeMap[size])} aria-hidden='true' />
      {showText && (
        <span className={cn('font-semibold tracking-tight whitespace-nowrap', textSizeMap[size])}>
          serve-os
        </span>
      )}
    </span>
  )
}
