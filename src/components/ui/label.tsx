import type * as React from 'react'
import { forwardRef } from 'react'
import { cn } from '#/lib/utils.ts'

type LabelProps = React.ComponentProps<'label'> & { htmlFor: string }

const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, htmlFor, ...props },
  ref,
) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: this wrapper forwards htmlFor to the associated input.
    <label
      ref={ref}
      htmlFor={htmlFor}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  )
})
Label.displayName = 'Label'

export { Label }
