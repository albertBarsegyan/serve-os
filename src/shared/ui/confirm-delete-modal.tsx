import { AlertTriangle } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { m } from '#/paraglide/messages'
import { useBodyScrollLock } from '#/shared/libs/hooks/scroll-lock.ts'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  name: string
  entityLabel: string
  isPending?: boolean
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  name,
  entityLabel,
  isPending = false,
}: Readonly<ConfirmDeleteModalProps>) {
  useBodyScrollLock(isOpen)

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-100 flex items-center justify-center p-4'>
      <button
        type='button'
        aria-label={m.shared_confirm_delete_close_aria()}
        className='fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity'
        onClick={onClose}
      />
      <div className='relative w-full max-w-md animate-in fade-in zoom-in duration-200 rounded-xl border border-border bg-card p-6 shadow-lg'>
        <div className='mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10'>
          <AlertTriangle className='h-5 w-5 text-destructive' />
        </div>
        <h2 className='mb-1.5 text-lg font-bold'>
          {m.shared_confirm_delete_title({ entityLabel })}
        </h2>
        <p className='mb-6 text-sm text-muted-foreground'>
          {m.shared_confirm_delete_message_prefix()}{' '}
          <span className='font-semibold text-foreground'>{name}</span>
          {m.shared_confirm_delete_message_suffix()}
        </p>
        <div className='flex justify-end gap-3'>
          <Button variant='ghost' onClick={onClose} disabled={isPending}>
            {m.shared_confirm_delete_cancel()}
          </Button>
          <Button variant='destructive' onClick={onConfirm} disabled={isPending}>
            {isPending ? m.shared_confirm_delete_deleting() : m.shared_confirm_delete_delete()}
          </Button>
        </div>
      </div>
    </div>
  )
}
