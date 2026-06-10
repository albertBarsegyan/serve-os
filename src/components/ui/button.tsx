import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '#/lib/utils.ts'

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  {
    variants: {
      variant: {
        default: 'cursor-pointer bg-primary text-primary-foreground shadow hover:bg-primary/90',
        outline:
          'cursor-pointer  border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'cursor-pointer bg-primary text-secondary shadow-sm hover:bg-primary/80',
        ghost: 'cursor-pointer hover:bg-accent hover:text-accent-foreground',
        destructive:
          'cursor-pointer bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        link: 'cursor-pointer text-primary underline-offset-4 hover:underline',
      },

      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot='button'
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
