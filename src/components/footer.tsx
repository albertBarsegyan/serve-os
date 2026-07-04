import { Link } from '@tanstack/react-router'
import { Logo } from '#/shared/ui/logo.tsx'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className='mt-20 border-t border-(--line) bg-secondary px-4 pb-14 pt-20 text-[var(--primary)]'>
      <div className='page-wrap grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4'>
        <div className='col-span-1 lg:col-span-2'>
          <div className='mb-6'>
            <Logo size='lg' />
          </div>
          <p className='mb-6 max-w-xs text-sm leading-relaxed'>
            The modern operating system for hospitality. Streamlining ordering, service flow, and
            payments for venues of all sizes.
          </p>
        </div>

        <div>
          <h4 className='mb-6 font-bold text-[var(--primary)]'>Product</h4>
          <ul className='space-y-4 text-sm'>
            <li>
              <a href='#features' className='transition hover:text-[var(--primary)]'>
                Features
              </a>
            </li>
            <li>
              <a href='#pricing' className='transition hover:text-[var(--primary)]'>
                Pricing
              </a>
            </li>
            <li>
              {/* biome-ignore lint/a11y/useValidAnchor: placeholder link */}
              <a href='#' className='transition hover:text-[var(--primary)]'>
                Demo
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className='mb-6 font-bold text-[var(--primary)]'>Company</h4>
          <ul className='space-y-4 text-sm'>
            <li>
              <Link to='/about' className='transition hover:text-[var(--primary)]'>
                About Us
              </Link>
            </li>

            <li>
              {/* biome-ignore lint/a11y/useValidAnchor: placeholder link */}
              <a href='#' className='hidden transition hover:text-[var(--primary)]'>
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className='page-wrap mt-16 border-t border-[var(--line)] pt-8 text-xs'>
        <div className='flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left'>
          <p className='m-0'>&copy; {year} ServeOS. All rights reserved.</p>
          <div className='flex gap-6'>
            <p className='m-0 hidden'>Privacy</p>
            <p className='m-0 hidden'>Terms</p>
          </div>
        </div>

        <div className='mt-6 flex flex-col items-center justify-between gap-4 border-t border-[var(--line)] pt-6 text-center sm:flex-row sm:text-left'>
          <p className='m-0'>
            Made by{' '}
            <a
              href='https://neolabsagency.com'
              target='_blank'
              rel='noreferrer'
              className='font-medium transition hover:text-[var(--primary)]'
            >
              Neo Labs Agency
            </a>
          </p>
          <div className='flex flex-wrap items-center justify-center gap-4'>
            <a href='tel:+37494770713' className='transition hover:text-[var(--primary)]'>
              +374 94 770713
            </a>
            <a
              href='mailto:neo.labs.agency@gmail.com'
              className='transition hover:text-[var(--primary)]'
            >
              neo.labs.agency@gmail.com
            </a>
            <a
              href='https://www.instagram.com/neo.labs.agency/'
              target='_blank'
              rel='noreferrer'
              className='transition hover:text-[var(--primary)]'
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
