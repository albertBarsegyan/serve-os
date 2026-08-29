import { Link } from '@tanstack/react-router'
import { ThemeSwitcher } from '#/components/theme-switcher.tsx'
import { m } from '#/paraglide/messages'
import { Logo } from '#/shared/ui/logo.tsx'

export default function Header() {
  return (
    <header className='sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg'>
      <nav className='page-wrap flex items-center justify-between py-3 sm:py-4'>
        <div className='flex items-center gap-8'>
          <Link to='/'>
            <Logo size='lg' showText={false} />
          </Link>

          <div className='hidden items-center gap-6 md:flex'>
            <a
              href='#features'
              className='text-sm font-medium text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)]'
            >
              {m.landing_nav_features()}
            </a>
            <a
              href='#pricing'
              className='text-sm font-medium text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)]'
            >
              {m.landing_nav_pricing()}
            </a>
            <Link
              to='/about'
              className='text-sm font-medium text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)]'
            >
              {m.landing_nav_about()}
            </Link>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <ThemeSwitcher />
          <div className='hidden items-center gap-3 sm:flex'>
            <Link
              to='/auth/sign-in'
              className='text-sm font-bold text-[#666] transition hover:text-[#2D2D2D] dark:text-[#999] dark:hover:text-[#EDEDED] px-2'
            >
              {m.header_sign_in()}
            </Link>
            <Link
              to='/auth/sign-up'
              className='rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white dark:text-black shadow-lg shadow-[#5D5FEF]/20 transition hover:opacity-90'
            >
              {m.header_get_started()}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
