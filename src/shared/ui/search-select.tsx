import { Check, ChevronDown, Search } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { cn } from '#/lib/utils'

export interface SearchSelectOption {
  value: string
  label: string
}

interface SearchSelectProps {
  options: SearchSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  id?: string
  className?: string
  startIcon?: ReactNode
}

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  disabled = false,
  id,
  className,
  startIcon,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputId = useId()

  const selected = options.find((o) => o.value === value)

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className='relative'>
      <button
        type='button'
        id={id}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          !selected && 'text-muted-foreground',
          className,
        )}
      >
        {startIcon && <span className='shrink-0 text-muted-foreground'>{startIcon}</span>}
        <span className='flex-1 truncate text-left'>{selected?.label ?? placeholder}</span>
        <ChevronDown className='h-4 w-4 shrink-0 opacity-50' />
      </button>

      {open && (
        <div className='absolute z-50 mt-1 w-full min-w-[8rem] rounded-md border border-input bg-background shadow-md'>
          <div className='flex items-center border-b border-input px-3'>
            <Search className='mr-2 h-4 w-4 shrink-0 text-muted-foreground' />
            <input
              id={inputId}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setOpen(false)
                  setQuery('')
                }
                if (e.key === 'Enter' && filtered.length === 1) {
                  handleSelect(filtered[0].value)
                }
              }}
              placeholder={searchPlaceholder}
              className='h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground'
            />
          </div>
          <div className='max-h-52 overflow-y-auto p-1'>
            {filtered.length === 0 ? (
              <p className='py-2 text-center text-sm text-muted-foreground'>No results.</p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type='button'
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground',
                    option.value === value && 'bg-accent/50 font-medium',
                  )}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      option.value === value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
