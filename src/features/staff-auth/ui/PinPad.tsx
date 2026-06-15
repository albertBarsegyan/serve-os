import { Delete } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '#/components/ui/button'
import type { StaffRole } from '#/features/platform/api/platform.types.ts'
import { cn } from '#/lib/utils.ts'

const PIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const

const PIN_LENGTH = 4

interface PinPadProps {
  staffName: string
  staffRole: StaffRole
  staffAvatarUrl: string | null
  isPending: boolean
  errorMessage: string | null
  attemptsRemaining: number | null
  isLocked: boolean
  onSubmit: (pin: string) => void
  onBack: () => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function PinPad({
  staffName,
  staffRole,
  staffAvatarUrl,
  isPending,
  errorMessage,
  attemptsRemaining,
  isLocked,
  onSubmit,
  onBack,
}: PinPadProps) {
  const [digits, setDigits] = useState<string[]>([])
  const [shaking, setShaking] = useState(false)
  const prevError = useRef<string | null>(null)

  // Refs keep keydown handler current without re-registering on every render.
  const digitsRef = useRef(digits)
  digitsRef.current = digits
  const isPendingRef = useRef(isPending)
  isPendingRef.current = isPending
  const isLockedRef = useRef(isLocked)
  isLockedRef.current = isLocked
  const onSubmitRef = useRef(onSubmit)
  onSubmitRef.current = onSubmit

  useEffect(() => {
    if (errorMessage && errorMessage !== prevError.current) {
      setShaking(true)
      setDigits([])
      const timer = setTimeout(() => setShaking(false), 500)
      prevError.current = errorMessage
      return () => clearTimeout(timer)
    }
  }, [errorMessage])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPendingRef.current || isLockedRef.current) return

      if (/^\d$/.test(e.key)) {
        const cur = digitsRef.current
        if (cur.length >= PIN_LENGTH) return
        const next = [...cur, e.key]
        setDigits(next)
        if (next.length === PIN_LENGTH) {
          onSubmitRef.current(next.join(''))
        }
      } else if (e.key === 'Backspace') {
        setDigits((prev) => prev.slice(0, -1))
      } else if (e.key === 'Escape') {
        setDigits([])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const append = (digit: string) => {
    if (digits.length >= PIN_LENGTH || isPending || isLocked) return
    const next = [...digits, digit]
    setDigits(next)
    if (next.length === PIN_LENGTH) {
      onSubmit(next.join(''))
    }
  }

  const erase = () => {
    if (isPending || isLocked) return
    setDigits((prev) => prev.slice(0, -1))
  }

  const disabled = isPending || isLocked

  return (
    <div className='flex flex-col items-center gap-6'>
      {/* User confirmation card */}
      <div className='flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-8 py-4 text-center'>
        <div className='flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-muted'>
          {staffAvatarUrl ? (
            <img src={staffAvatarUrl} alt={staffName} className='h-full w-full object-cover' />
          ) : (
            <span className='text-xl font-bold uppercase text-muted-foreground'>
              {getInitials(staffName)}
            </span>
          )}
        </div>
        <div>
          <p className='text-base font-semibold'>{staffName}</p>
          <span className='rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground'>
            {staffRole}
          </span>
        </div>
      </div>

      <p className='text-sm text-muted-foreground'>Enter your 4-digit PIN</p>

      {/* Dot indicators */}
      <div className={cn('flex gap-3', shaking && 'pin-shake')}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static length, order never changes
            key={i}
            className='h-4 w-4 rounded-full border-2 border-primary transition-colors'
            style={{ backgroundColor: digits[i] !== undefined ? 'var(--primary)' : 'transparent' }}
          />
        ))}
      </div>

      {/* Error / locked feedback */}
      {isLocked ? (
        <p className='text-sm font-medium text-destructive'>
          Account locked. Contact your manager.
        </p>
      ) : errorMessage ? (
        <p className='text-sm font-medium text-destructive'>{errorMessage}</p>
      ) : null}

      {attemptsRemaining !== null && !isLocked && (
        <p className='text-xs text-muted-foreground'>
          {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining
        </p>
      )}

      {/* Numeric keypad */}
      <div className='grid grid-cols-3 gap-2'>
        {PIN_KEYS.map((key, i) => {
          if (key === '') {
            // biome-ignore lint/suspicious/noArrayIndexKey: decorative spacer
            return <div key={i} />
          }
          if (key === 'del') {
            return (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: static key layout
                key={i}
                type='button'
                onClick={erase}
                disabled={disabled || digits.length === 0}
                className='flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50'
              >
                <Delete className='h-5 w-5' />
              </button>
            )
          }
          return (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: static key layout
              key={i}
              type='button'
              onClick={() => append(key)}
              disabled={disabled || digits.length >= PIN_LENGTH}
              className='flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-lg font-semibold transition-colors hover:bg-accent disabled:opacity-50'
            >
              {key}
            </button>
          )
        })}
      </div>

      {isPending && <p className='text-sm text-muted-foreground'>Signing in…</p>}

      <Button variant='ghost' size='sm' onClick={onBack} disabled={isPending}>
        ← Wrong ID? Go back
      </Button>
    </div>
  )
}
