import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '#/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#5D5FEF] text-white hover:opacity-90',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline: 'border border-[#E8EBFD] bg-transparent hover:bg-[#F8F9FD] text-[#5D5FEF]',
        secondary: 'bg-[#E8EBFD] text-[#5D5FEF] hover:bg-[#D8DEFC]',
        ghost: 'hover:bg-[#F8F9FD] text-[var(--sea-ink-soft)] hover:text-[#5D5FEF]',
        link: 'text-[#5D5FEF] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 px-6 py-2',
        sm: 'h-10 rounded-xl px-4',
        lg: 'h-14 rounded-2xl px-10',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
