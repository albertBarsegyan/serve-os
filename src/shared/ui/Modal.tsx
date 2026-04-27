import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '#/lib/utils'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6'>
      <div 
        className='fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity' 
        onClick={onClose} 
      />
      <div className='relative w-full max-w-lg animate-in fade-in zoom-in duration-200 rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl sm:p-8'>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-xl font-bold'>{title}</h2>
          <Button variant='ghost' size='icon' onClick={onClose} className='rounded-full'>
            <X className='h-5 w-5' />
          </Button>
        </div>
        <div className='mb-8'>{children}</div>
        {footer && <div className='flex justify-end gap-3'>{footer}</div>}
      </div>
    </div>
  )
}
