import { Moon, Sun } from 'lucide-react'
import { useCallback, useRef } from 'react'
import { m } from '#/paraglide/messages'
import useThemeStore from '#/shared/store/use-theme.store.ts'

export function ThemeSwitcher() {
  const { theme, toggle } = useThemeStore()
  const iconRef = useRef<HTMLSpanElement>(null)

  const handleClick = useCallback(() => {
    const el = iconRef.current
    if (el) {
      el.classList.remove('theme-icon-animate')
      void el.offsetWidth
      el.classList.add('theme-icon-animate')
    }
    toggle()
  }, [toggle])

  return (
    <button
      type='button'
      onClick={handleClick}
      aria-label={
        theme === 'dark' ? m.shared_theme_switch_to_light() : m.shared_theme_switch_to_dark()
      }
      className='cursor-pointer flex h-12 w-12 items-center justify-center rounded-full text-[var(--sea-ink-soft)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--sea-ink)]'
    >
      <span ref={iconRef}>{theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}</span>
    </button>
  )
}
