import { Check, ChevronDown, Search } from 'lucide-react'
import { type ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
}: Readonly<SearchSelectProps>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = 'search-select-listbox'

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value])

  const filtered = useMemo(
    () =>
      query
        ? options.filter((o) => o.label.toLowerCase().startsWith(query.toLowerCase()))
        : options,
    [options, query],
  )

  useLayoutEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useLayoutEffect(() => {
    if (activeIndex < 0 || !listRef.current) return
    const item =
      listRef.current.querySelectorAll<HTMLButtonElement>('button[data-option]')[activeIndex]
    item?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const close = () => {
    setOpen(false)
    setQuery('')
    setActiveIndex(-1)
  }

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    close()
  }

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => (i < filtered.length - 1 ? i + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => (i > 0 ? i - 1 : filtered.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && filtered[activeIndex]) {
          handleSelect(filtered[activeIndex].value)
        } else if (filtered.length === 1) {
          handleSelect(filtered[0].value)
        }
        break
      case 'Escape':
        close()
        break
    }
  }

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (listRef.current?.contains(e.relatedTarget)) return
    close()
  }

  console.log('filtered', filtered)

  return (
    <div className='relative'>
      <button
        type='button'
        id={id}
        disabled={disabled}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={listboxId}
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
        <div className='absolute z-50 mt-1 w-full min-w-32 rounded-md border border-input bg-background shadow-md'>
          <div className='flex items-center border-b border-input px-3'>
            <Search className='mr-2 h-4 w-4 shrink-0 text-muted-foreground' />
            <input
              ref={inputRef}
              role='combobox'
              aria-autocomplete='list'
              aria-expanded={open}
              aria-controls={listboxId}
              aria-activedescendant={
                activeIndex >= 0 ? `option-${filtered[activeIndex]?.value}` : undefined
              }
              value={query}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              onBlur={handleInputBlur}
              placeholder={searchPlaceholder}
              className='h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground'
            />
          </div>
          <div
            ref={listRef}
            role='listbox'
            id={listboxId}
            aria-label={searchPlaceholder}
            className='max-h-52 overflow-y-auto p-1'
          >
            {filtered.length === 0 ? (
              <p className='py-2 text-center text-sm text-muted-foreground'>No results.</p>
            ) : (
              filtered.map((option, index) => (
                <button
                  key={option.label}
                  id={`option-${option.value}`}
                  type='button'
                  role='option'
                  data-option
                  aria-selected={option.value === value}
                  tabIndex={-1}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    'flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground',
                    option.value === value && 'bg-accent/50 font-medium',
                    index === activeIndex && 'bg-accent text-accent-foreground',
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
