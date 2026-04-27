import { Link } from '@tanstack/react-router'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className='mt-20 border-t border-[var(--line)] bg-[var(--surface)] px-4 pb-14 pt-20 text-[var(--sea-ink-soft)]'>
      <div className='page-wrap grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4'>
        <div className='col-span-1 lg:col-span-2'>
          <div className='mb-6 flex items-center gap-2 font-bold text-[var(--sea-ink)]'>
            <span className='h-3 w-3 rounded-full bg-[linear-gradient(90deg,var(--brand-magenta),var(--brand-rose))]' />
            ServeOS
          </div>
          <p className='mb-6 max-w-xs text-sm leading-relaxed'>
            The modern operating system for hospitality. Streamlining ordering, service flow, and payments for venues of all sizes.
          </p>
          <div className='flex gap-4'>
            <a href='#' className='transition hover:text-[var(--sea-ink)]'>
              <svg viewBox='0 0 24 24' width='20' height='20' fill='currentColor'>
                <path d='M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z' />
              </svg>
            </a>
            <a href='#' className='transition hover:text-[var(--sea-ink)]'>
              <svg viewBox='0 0 24 24' width='20' height='20' fill='currentColor'>
                <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h4 className='mb-6 font-bold text-[var(--sea-ink)]'>Product</h4>
          <ul className='space-y-4 text-sm'>
            <li><a href='#features' className='transition hover:text-[var(--sea-ink)]'>Features</a></li>
            <li><a href='#pricing' className='transition hover:text-[var(--sea-ink)]'>Pricing</a></li>
            <li><a href='#' className='transition hover:text-[var(--sea-ink)]'>Demo</a></li>
            <li><a href='#' className='transition hover:text-[var(--sea-ink)]'>Releases</a></li>
          </ul>
        </div>

        <div>
          <h4 className='mb-6 font-bold text-[var(--sea-ink)]'>Company</h4>
          <ul className='space-y-4 text-sm'>
            <li><Link to='/about' className='transition hover:text-[var(--sea-ink)]'>About Us</Link></li>
            <li><a href='#' className='transition hover:text-[var(--sea-ink)]'>Careers</a></li>
            <li><a href='#' className='transition hover:text-[var(--sea-ink)]'>Contact</a></li>
            <li><a href='#' className='transition hover:text-[var(--sea-ink)]'>Privacy Policy</a></li>
          </ul>
        </div>

        <div>
          <h4 className='mb-6 font-bold text-[var(--sea-ink)]'>Support</h4>
          <ul className='space-y-4 text-sm'>
            <li><a href='#' className='transition hover:text-[var(--sea-ink)]'>Help Center</a></li>
            <li><a href='#' className='transition hover:text-[var(--sea-ink)]'>API Docs</a></li>
            <li><a href='#' className='transition hover:text-[var(--sea-ink)]'>Status</a></li>
          </ul>
        </div>
      </div>

      <div className='page-wrap mt-16 flex flex-col items-center justify-between gap-4 border-t border-[var(--line)] pt-8 text-center text-xs sm:flex-row sm:text-left'>
        <p className='m-0'>
          &copy; {year} ServeOS. All rights reserved.
        </p>
        <div className='flex gap-6'>
          <p className='m-0'>Built with TanStack Start</p>
          <p className='m-0'>Privacy</p>
          <p className='m-0'>Terms</p>
        </div>
      </div>
    </footer>
  )
}
