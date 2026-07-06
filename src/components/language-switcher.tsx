import { Check, Languages } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '#/components/ui/popover'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'
import { getLocale, type Locale, locales, setLocale } from '#/paraglide/runtime'

// Locale names are endonyms (shown in their own script) and intentionally not translated.
const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  hy: 'Հայերեն',
}

type LanguageSwitcherProps = {
  triggerClassName?: string
}

export function LanguageSwitcher({ triggerClassName }: LanguageSwitcherProps) {
  const currentLocale = getLocale()

  return (
    <Popover>
      <PopoverTrigger
        aria-label={m.language_label()}
        title={m.language_label()}
        className={cn(
          'cursor-pointer flex h-12 w-12 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-accent-foreground',
          triggerClassName,
        )}
      >
        <Languages size={22} />
      </PopoverTrigger>
      <PopoverContent className='w-auto p-3' align='end'>
        <p className='mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground'>
          {m.language_label()}
        </p>
        <div className='flex flex-col gap-1'>
          {locales.map((locale) => {
            const isActive = locale === currentLocale
            return (
              <button
                key={locale}
                type='button'
                onClick={() => setLocale(locale)}
                aria-pressed={isActive}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-sm transition hover:bg-accent hover:text-(--button-text)',
                  isActive && 'bg-accent text-(--button-text) font-medium',
                )}
              >
                {LOCALE_LABELS[locale]}
                {isActive && <Check size={14} />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
