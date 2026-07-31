import { Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '#/components/ui/popover'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'
import { getLocale, type Locale, locales, setLocale } from '#/paraglide/runtime'

// Locale names are endonyms (shown in their own script) and intentionally not translated.
export const LOCALE_META: Record<Locale, { label: string; code: string; flag: string }> = {
  en: { label: 'English', code: 'EN', flag: '🇬🇧' },
  hy: { label: 'Հայերեն', code: 'AM', flag: '🇦🇲' },
}

type LanguageSwitcherProps = {
  triggerClassName?: string
}

export function LanguageSwitcher({ triggerClassName }: LanguageSwitcherProps) {
  const currentLocale = getLocale()
  const current = LOCALE_META[currentLocale]

  return (
    <Popover>
      <PopoverTrigger
        aria-label={m.language_label()}
        title={m.language_label()}
        className={cn(
          'cursor-pointer flex h-12 w-auto items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold text-foreground transition hover:bg-accent hover:text-accent-foreground',
          triggerClassName,
        )}
      >
        <span aria-hidden='true' className='text-base leading-none'>
          {current.flag}
        </span>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-3' align='end'>
        <p className='mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground'>
          {m.language_label()}
        </p>
        <div className='flex flex-col gap-1'>
          {locales.map((locale) => {
            const isActive = locale === currentLocale
            const meta = LOCALE_META[locale]
            return (
              <button
                key={locale}
                type='button'
                onClick={() => setLocale(locale)}
                aria-pressed={isActive}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive &&
                    'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                )}
              >
                <span className='flex items-center gap-2'>
                  <span aria-hidden='true' className='text-base leading-none'>
                    {meta.flag}
                  </span>
                  {meta.label}
                </span>
                {isActive && <Check size={14} />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
