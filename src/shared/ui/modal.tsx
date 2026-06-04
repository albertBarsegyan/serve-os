import { X } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils.ts'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
}: Readonly<ModalProps>) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'auto'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className={cn('fixed inset-0 z-100 flex items-center justify-center p-2 sm:p-4', className)}
    >
      <button
        type='button'
        aria-label='Close modal backdrop'
        className='fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity'
        onClick={onClose}
      />

      <div className='relative w-full max-w-4xl animate-in fade-in zoom-in duration-200 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-lg sm:p-8'>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-xl font-bold'>{title}</h2>
          <Button variant='ghost' size='icon' onClick={onClose} className='rounded-full'>
            <X className='h-5 w-5' />
          </Button>
        </div>

        <div className='mb-8 p-2 max-h-140 overflow-y-auto'>{children}</div>
        {footer && <div className='flex justify-end gap-3'>{footer}</div>}
      </div>
    </div>
  )
}
