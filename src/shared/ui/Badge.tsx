import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '#/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--sea-ink)] text-white',
        secondary: 'border-transparent bg-[var(--accent-soft)] text-[var(--sea-ink)]',
        destructive: 'border-transparent bg-red-500 text-white',
        outline: 'text-[var(--sea-ink)] border-[var(--line)]',
        success: 'border-transparent bg-emerald-500/10 text-emerald-600',
        warning: 'border-transparent bg-amber-500/10 text-amber-600',
        info: 'border-transparent bg-blue-500/10 text-blue-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
