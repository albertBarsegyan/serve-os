import { Delete } from 'lucide-react'
import { useState } from 'react'
import { Button } from '#/components/ui/button'

const PIN_LENGTH = 4

interface PinPadProps {
  staffName: string
  isPending: boolean
  onSubmit: (pin: string) => void
  onBack: () => void
}

export function PinPad({ staffName, isPending, onSubmit, onBack }: PinPadProps) {
  const [digits, setDigits] = useState<string[]>([])

  const append = (digit: string) => {
    if (digits.length >= PIN_LENGTH || isPending) return
    const next = [...digits, digit]
    setDigits(next)
    if (next.length === PIN_LENGTH) {
      onSubmit(next.join(''))
    }
  }

  const erase = () => {
    if (isPending) return
    setDigits((prev) => prev.slice(0, -1))
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

  return (
    <div className='flex flex-col items-center gap-6'>
      <div className='text-center'>
        <p className='text-base font-semibold'>{staffName}</p>
        <p className='text-sm text-muted-foreground'>Enter your 4-digit PIN</p>
      </div>

      <div className='flex gap-3'>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static length, order never changes
            key={i}
            className='h-4 w-4 rounded-full border-2 border-primary transition-colors'
            style={{ backgroundColor: digits[i] !== undefined ? 'var(--primary)' : 'transparent' }}
          />
        ))}
      </div>

      <div className='grid grid-cols-3 gap-2'>
        {keys.map((key, i) => {
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
                disabled={isPending || digits.length === 0}
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
              disabled={isPending || digits.length >= PIN_LENGTH}
              className='flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-lg font-semibold transition-colors hover:bg-accent disabled:opacity-50'
            >
              {key}
            </button>
          )
        })}
      </div>

      {isPending && <p className='text-sm text-muted-foreground'>Signing in…</p>}

      <Button variant='ghost' size='sm' onClick={onBack} disabled={isPending}>
        ← Back
      </Button>
    </div>
  )
}
