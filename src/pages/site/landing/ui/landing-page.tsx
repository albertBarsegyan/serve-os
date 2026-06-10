import type { CSSProperties, ElementType, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import useThemeStore from '#/shared/store/use-theme.store.ts'
import './serve-os.css'
import { cn } from '#/lib/utils.ts'
import logo from '#/shared/assets/logo.png'
import { Icons } from './icons'
import { DashboardMock, FloatBadge, PhoneMock, QrCode } from './mockups'

interface RevealProps {
  as?: ElementType
  className?: string
  children: ReactNode
  style?: CSSProperties
  id?: string
}

export function Reveal({ as: Tag = 'div', className = '', children, ...rest }: Readonly<RevealProps>) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <Tag ref={ref} className={cn('reveal', className)} {...rest}>
      {children}
    </Tag>
  )
}

const FEATURES_LEAD = {
  icon: <Icons.Clipboard />,
  title: 'Smart Ordering',
  body: 'Guests scan, browse and order at the table. Staff fire tickets from any device. Orders route to the right station automatically — zero re-keying.',
}
const FEATURES = [
  {
    icon: <Icons.KitchenDisplay />,
    title: 'Kitchen Sync',
    body: 'Live kitchen display, color-coded by prep time.',
    accent: false,
  },
  {
    icon: <Icons.Card />,
    title: 'Payments',
    body: 'Split bills, tips and refunds, settled instantly.',
    accent: false,
  },
  {
    icon: <Icons.BarChart />,
    title: 'Real-time Analytics',
    body: 'Revenue, covers and best-sellers, live.',
    accent: true,
  },
]
const ORDER_POINTS: [string, string][] = [
  ['Your branded menu', '— photos, modifiers and live availability.'],
  ['Fewer errors', '— orders go straight from guest to kitchen.'],
  ['Faster tables', '— pay and re-order without the wait.'],
]
const TIMELINE: [string, string, string][] = [
  ['07:00', 'Open & prep', "Counts, par levels and the day's specials pushed live to every menu."],
  ['12:30', 'Lunch rush', 'QR orders flow to the kitchen, tables turn faster, nothing gets lost.'],
  ['19:00', 'Dinner service', 'Split bills, tips and payments settle at the table in a tap.'],
  ['23:00', 'Close & report', 'Z-report, labour and best-sellers ready before you lock the door.'],
]
const PLANS = [
  {
    name: 'Starter',
    mo: '0',
    yr: '0',
    dollar: true,
    suffix: '/mo',
    desc: 'For a single counter or cafe getting started.',
    feats: ['QR menu & ordering', '1 register, 5 tables', 'Basic reports'],
    cta: 'Get started',
    btn: 'ghost',
  },
  {
    name: 'Pro',
    tag: 'POPULAR',
    mo: '49',
    yr: '39',
    dollar: true,
    suffix: '/mo',
    feat: true,
    desc: 'For busy restaurants running full service.',
    feats: [
      'Everything in Starter',
      'Kitchen display & payments',
      'Unlimited tables & staff',
      'Real-time analytics',
    ],
    cta: 'Start free trial',
    btn: 'primary',
  },
  {
    name: 'Scale',
    custom: 'Custom',
    desc: 'For groups and multi-location operators.',
    feats: ['Everything in Pro', 'Multi-location dashboard', 'Dedicated support'],
    cta: 'Contact sales',
    btn: 'ghost',
  },
]

export function Nav() {
  const theme = useThemeStore((s) => s.theme)
  const toggle = useThemeStore((s) => s.toggle)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const close = () => setMenuOpen(false)

  return (
    <>
      <header className={`nav${scrolled ? ' scrolled' : ''}`}>
        <div className='wrap nav-inner'>
          <a className='logo' href='/'>
            <img src={logo} alt='serve-os logo' />
            serve<span className='g'>-os</span>
          </a>
          <nav className='nav-links'>
            <a href='/#features'>Features</a>
            <a href='/#ordering'>Ordering</a>
            <a href='/#how'>How it works</a>
            <a href='/#pricing'>Pricing</a>
          </nav>
          <div className='nav-right'>
            <button
              type='button'
              className='theme-toggle'
              onClick={toggle}
              aria-label='Toggle theme'
            >
              {theme === 'dark' ? <Icons.Moon /> : <Icons.Sun />}
            </button>
            <a className='btn ghost hide-mobile' href='/auth/sign-in'>
              Log in
            </a>
            <a className='btn primary hide-mobile' href='/#pricing'>
              Start free trial
            </a>
            <button
              type='button'
              className='menu-btn'
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <Icons.X /> : <Icons.Menu />}
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-menu${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
        <a className='mob-link' href='/#features' onClick={close}>Features</a>
        <a className='mob-link' href='/#ordering' onClick={close}>Ordering</a>
        <a className='mob-link' href='/#how' onClick={close}>How it works</a>
        <a className='mob-link' href='/#pricing' onClick={close}>Pricing</a>
        <a className='mob-link' href='/about' onClick={close}>About</a>
        <div className='mob-ctas'>
          <a className='btn ghost' href='/auth/sign-in' onClick={close}>Log in</a>
          <a className='btn primary' href='/auth/sign-up' onClick={close}>Start free trial</a>
        </div>
      </div>
    </>
  )
}

function Hero() {
  return (
    <section className='hero'>
      <div className='wrap hero-grid'>
        <div className='hero-copy'>
          <span className='eyebrow'>Hospitality Management OS</span>
          <h1>
            Manage Better.<span className='line2 g'>Serve Better.</span>
          </h1>
          <p className='hero-sub'>
            The all-in-one operating system that runs the floor, the kitchen and the books — for
            modern restaurants and cafes.
          </p>
          <div className='hero-cta'>
            <a className='btn primary lg' href='/#pricing'>
              Start free trial <Icons.ArrowRight />
            </a>
            <a className='btn ghost lg' href='/#ordering'>
              <Icons.Play />
              Watch the demo
            </a>
          </div>
          <div className='hero-meta'>
            <div className='avatars'>
              <span />
              <span />
              <span />
              <span />
            </div>
            <span>Trusted by 400+ cafes</span>
            <span className='dot' />
            <span>No card required</span>
          </div>
        </div>
        <Reveal className='hero-mock'>
          <DashboardMock />
          <FloatBadge pos='b1' icon={<Icons.TrendingUp />} title='+13%' sub='Revenue this week' />
          <FloatBadge pos='b2' icon={<Icons.Bell />} title='7 new' sub='Orders in kitchen' />
        </Reveal>
      </div>
    </section>
  )
}

function Trust() {
  const names = [
    'Green Dine',
    'Maple & Co.',
    'The Corner Bistro',
    'Olive Lane',
    'Roastery 9',
    'Saffron House',
  ]
  return (
    <section className='trust'>
      <div className='wrap'>
        <div className='lbl'>RUNNING SERVICE AT INDEPENDENT CAFES &amp; RESTAURANTS EVERYWHERE</div>
        <div className='trust-row'>
          {names.map((n) => (
            <span className='name' key={n}>
              {n}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section className='sec-pad' id='features'>
      <div className='wrap'>
        <Reveal className='sec-head'>
          <span className='eyebrow'>Everything in one place</span>
          <h2>
            One system, <span className='g'>every station</span>
          </h2>
          <p>
            From the first scan at the table to the closing report — front of house, kitchen and
            back office finally speak the same language.
          </p>
        </Reveal>
        <div className='bento'>
          <Reveal className='tile big feature-accent'>
            <div className='ico'>{FEATURES_LEAD.icon}</div>
            <h3>{FEATURES_LEAD.title}</h3>
            <p>{FEATURES_LEAD.body}</p>
            <div className='mini-chart'>
              <svg viewBox='0 0 130 56' preserveAspectRatio='none' aria-hidden='true'>
                <path
                  d='M0 44 L26 38 L52 46 L78 26 L104 32 L130 12'
                  fill='none'
                  stroke='var(--accent)'
                  strokeWidth='2.4'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </div>
          </Reveal>
          {FEATURES.map((f) => (
            <Reveal className={`tile${f.accent ? ' feature-accent' : ''}`} key={f.title}>
              <div className='ico'>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </Reveal>
          ))}
          <Reveal className='tile wide'>
            <div className='ico'>
              <Icons.Users />
            </div>
            <div className='txt'>
              <h3>Staff Management</h3>
              <p>
                Rosters, roles and shift performance — keep the whole team in sync without the
                spreadsheets.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Ordering() {
  return (
    <section className='sec-pad showcase' id='ordering'>
      <div className='wrap show-grid'>
        <Reveal className='show-copy'>
          <span className='eyebrow'>Tableside ordering</span>
          <h2 style={{ fontSize: 'clamp(30px,4.2vw,46px)' }}>
            Scan. Order. <span className='g'>Served.</span>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '18px', lineHeight: 1.6 }}>
            Put a QR code on every table. Guests order from their phone and tickets land in the
            kitchen in seconds — no app to download, no waiting to flag down a server.
          </p>
          <div className='show-list'>
            {ORDER_POINTS.map(([b, s]) => (
              <div className='row' key={b}>
                <span className='ck'>
                  <Icons.Check />
                </span>
                <div>
                  <b>{b}</b> <span>{s}</span>
                </div>
              </div>
            ))}
          </div>
          <a
            className='btn ghost lg'
            href='/#pricing'
            style={{ alignSelf: 'flex-start', marginTop: '6px' }}
          >
            Try tableside ordering <Icons.ArrowRight />
          </a>
        </Reveal>
        <Reveal className='devices'>
          <PhoneMock />
          <div className='qr-tent'>
            <div className='qh'>Scan to Order</div>
            <QrCode />
            <div className='qfoot'>
              <img src={logo} alt='' />
              serve<span className='g'>-os</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Timeline() {
  return (
    <section className='sec-pad' id='how'>
      <div className='wrap'>
        <Reveal className='sec-head'>
          <span className='eyebrow'>A day on serve-os</span>
          <h2>
            From open to close, <span className='g'>handled</span>
          </h2>
        </Reveal>
        <div className='timeline'>
          {TIMELINE.map(([time, title, body]) => (
            <Reveal className='tl-step' key={time}>
              <div className='node'>
                <i />
              </div>
              <div className='time'>{time}</div>
              <h3>{title}</h3>
              <p>{body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  const [cycle, setCycle] = useState('mo')
  return (
    <section
      className='sec-pad'
      id='pricing'
      style={{
        background: 'var(--bg2)',
        borderTop: '1px solid var(--line)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div className='wrap'>
        <Reveal className='sec-head center'>
          <span className='eyebrow'>Pricing</span>
          <h2>
            Simple plans, <span className='g'>no surprises</span>
          </h2>
          <p>Start free. Upgrade when you're ready. Cancel anytime.</p>
          <div className='price-toggle'>
            <button
              type='button'
              className={cycle === 'mo' ? 'on' : ''}
              onClick={() => setCycle('mo')}
            >
              Monthly
            </button>
            <button
              type='button'
              className={cycle === 'yr' ? 'on' : ''}
              onClick={() => setCycle('yr')}
            >
              Yearly · save 20%
            </button>
          </div>
        </Reveal>
        <div className='price-grid'>
          {PLANS.map((p) => (
            <Reveal className={`plan${p.feat ? ' feat' : ''}`} key={p.name}>
              <div className='pname'>
                {p.name}
                {p.tag && <span className='tag'>{p.tag}</span>}
              </div>
              <div className='price'>
                {p.custom ? (
                  <span className='amt nodollar'>{p.custom}</span>
                ) : (
                  <>
                    <span>$</span>
                    <span className='amt'>{cycle === 'yr' ? p.yr : p.mo}</span>
                    <span>{p.suffix}</span>
                  </>
                )}
              </div>
              <p className='pdesc'>{p.desc}</p>
              <ul>
                {p.feats.map((f) => (
                  <li key={f}>
                    <Icons.Check />
                    {f}
                  </li>
                ))}
              </ul>
              <a className={`btn ${p.btn}`} href='/auth/sign-up'>
                {p.cta}
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function SiteCta() {
  return (
    <section style={{ padding: '90px 0' }}>
      <div className='wrap'>
        <Reveal className='cta-band'>
          <h2>Serve better, starting today.</h2>
          <p>Set up your menu in an afternoon. Free for 14 days — no card required.</p>
          <a className='btn light lg' href='/auth/sign-up'>
            Start your free trial <Icons.ArrowRight />
          </a>
        </Reveal>
      </div>
    </section>
  )
}

export function SiteFooter() {
  const cols: [string, [string, string][]][] = [
    [
      'Product',
      [
        ['Features', '/#features'],
        ['Tableside ordering', '/#ordering'],
        ['Pricing', '/#pricing'],
        ['Integrations', '/'],
      ],
    ],
    [
      'Company',
      [
        ['About', '/about'],
        ['Customers', '/'],
        ['Careers', '/'],
        ['Contact', '/'],
      ],
    ],
    [
      'Support',
      [
        ['Help center', '/'],
        ['Setup guide', '/'],
        ['Status', '/'],
        ['Privacy', '/'],
      ],
    ],
  ]
  return (
    <footer className='site'>
      <div className='wrap'>
        <div className='foot-grid'>
          <div>
            <a className='logo' href='/'>
              <img src={logo} alt='' />
              serve<span className='g'>-os</span>
            </a>
            <p className='blurb'>
              All-in-one hospitality management for modern restaurants and cafes. Manage better,
              serve better.
            </p>
          </div>
          {cols.map(([h, links]) => (
            <div className='foot-col' key={h}>
              <h4>{h}</h4>
              {links.map(([t, u]) => (
                <a href={u} key={t}>
                  {t}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className='foot-bottom'>
          <span>© {new Date().getFullYear()} serve-os. All rights reserved.</span>
          <span>Manage Better. Serve Better.</span>
        </div>
      </div>
    </footer>
  )
}

export function LandingPage() {
  return (
    <main id='top'>
      <Hero />
      <Trust />
      <Features />
      <Ordering />
      <Timeline />
      <Pricing />
      <SiteCta />
    </main>
  )
}
