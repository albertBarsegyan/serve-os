import {Link} from '@tanstack/react-router'
import {Logo} from '#/shared/ui/logo.tsx'

export default function Header() {
  return (
    <header className='sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg'>
      <nav className='page-wrap flex items-center justify-between py-3 sm:py-4'>
        <div className='flex items-center gap-8'>
          <h2 className='m-0 flex-shrink-0 text-base font-semibold tracking-tight'>
            <Link to='/'>
              <Logo size='md' showText={false} />
            </Link>
          </h2>

          <div className='hidden items-center gap-6 md:flex'>
            <a
              href='#features'
              className='text-sm font-medium text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)]'
            >
              Features
            </a>
            <a
              href='#pricing'
              className='text-sm font-medium text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)]'
            >
              Pricing
            </a>
            <Link
              to='/about'
              className='text-sm font-medium text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)]'
            >
              About
            </Link>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <div className='hidden items-center gap-3 sm:flex'>
            <Link
              to='/auth/sign-in'
              className='text-sm font-bold text-[#666] transition hover:text-[#2D2D2D] px-2'
            >
              Sign In
            </Link>
            <Link
              to='/auth/sign-up'
              className='rounded-full bg-[#5D5FEF] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#5D5FEF]/20 transition hover:opacity-90'
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
