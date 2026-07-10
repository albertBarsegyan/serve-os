import type { CSSProperties, ElementType, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import useThemeStore from '#/shared/store/use-theme.store.ts'
import './landing.css'
import { useNavigate } from '@tanstack/react-router'
import { LanguageSwitcher } from '#/components/language-switcher.tsx'
import { ContactForm } from '#/features/contact/ui/contact-form.tsx'
import { PaletteSwitcher } from '#/features/palette/ui/PaletteSwitcher.tsx'
import { cn } from '#/lib/utils.ts'
import { m } from '#/paraglide/messages'
import { getLocale } from '#/paraglide/runtime'
import { useBodyScrollLock } from '#/shared/libs/hooks/scroll-lock.ts'
import { LogoSvg } from '#/shared/ui/logo-svg.tsx'
import { Icons } from './icons'
import { DashboardMock, FloatBadge, PhoneMock, QrCode } from './mockups'

interface RevealProps {
  as?: ElementType
  className?: string
  children: ReactNode
  style?: CSSProperties
  id?: string
}

export function Reveal({
  as: Tag = 'div',
  className = '',
  children,
  ...rest
}: Readonly<RevealProps>) {
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

export function Nav() {
  const theme = useThemeStore((s) => s.theme)
  const toggle = useThemeStore((s) => s.toggle)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const locale = getLocale()
  const isArmenian = locale === 'hy'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const close = () => setMenuOpen(false)

  const storyUrl = locale === 'hy' ? 'https://story.serve-os.net/hy' : 'https://story.serve-os.net/'

  return (
    <>
      <header className={`nav${scrolled ? ' scrolled' : ''}`}>
        <div className='wrap nav-inner'>
          <a className='logo' href='/'>
            <LogoSvg aria-hidden='true' />
            serve<span className='g'>-os</span>
          </a>
          <nav
            className={cn('nav-links', {
              'small-gap': isArmenian,
            })}
          >
            <a
              className={cn('nav-links-item', {
                'small-font': isArmenian,
              })}
              href='/#features'
            >
              {m.landing_nav_features()}
            </a>
            <a
              className={cn('nav-links-item', {
                'small-font': isArmenian,
              })}
              href='/#ordering'
            >
              {m.landing_nav_ordering()}
            </a>
            <a
              className={cn('nav-links-item', {
                'small-font': isArmenian,
              })}
              href='/#how'
            >
              {m.landing_nav_how()}
            </a>
            <a
              className={cn('nav-links-item', {
                'small-font': isArmenian,
              })}
              href='/#pricing'
            >
              {m.landing_nav_pricing()}
            </a>
            <a
              className={cn('nav-links-item', {
                'small-font': isArmenian,
              })}
              href={storyUrl}
            >
              {m.landing_nav_story()}
            </a>
          </nav>
          <div className='nav-right'>
            <PaletteSwitcher triggerClassName='palette-toggle h-[40px] w-[40px] rounded-[11px]' />
            <LanguageSwitcher triggerClassName='h-[40px] w-auto gap-1.5 rounded-[11px] border border-[var(--line)] bg-[var(--panel)] px-3 text-[var(--ink)] hover:border-[var(--accent)] hover:bg-[var(--panel)] hover:text-[var(--accent)]' />
            <button
              type='button'
              className='theme-toggle'
              onClick={toggle}
              aria-label={m.landing_nav_toggle_theme()}
            >
              {theme === 'dark' ? <Icons.Moon /> : <Icons.Sun />}
            </button>
            <a className='btn ghost hide-mobile' href='/auth/sign-in'>
              {m.landing_nav_login()}
            </a>
            <a className='btn primary hide-mobile' href='/#pricing'>
              {m.landing_nav_start_trial()}
            </a>
            <button
              type='button'
              className='menu-btn'
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? m.landing_nav_close_menu() : m.landing_nav_open_menu()}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <Icons.X /> : <Icons.Menu />}
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-menu${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
        <button
          type='button'
          className='mob-link'
          onClick={async () => {
            await navigate({ to: '/', hash: 'features' })
            close()
          }}
        >
          {m.landing_nav_features()}
        </button>
        <button
          type='button'
          className='mob-link'
          onClick={async () => {
            await navigate({ to: '/', hash: 'ordering' })
            close()
          }}
        >
          {m.landing_nav_ordering()}
        </button>
        <button
          type='button'
          className='mob-link'
          onClick={async () => {
            await navigate({ to: '/', hash: 'how' })
            close()
          }}
        >
          {m.landing_nav_how()}
        </button>
        <button
          type='button'
          className='mob-link'
          onClick={async () => {
            await navigate({ to: '/', hash: 'pricing' })
            close()
          }}
        >
          {m.landing_nav_pricing()}
        </button>
        <button
          type='button'
          className='mob-link'
          onClick={async () => {
            await navigate({ to: '/about' })
            close()
          }}
        >
          {m.landing_nav_about()}
        </button>
        <button
          type='button'
          className='mob-link'
          onClick={() => {
            const language = getLocale()
            window.location.href = `https://story.serve-os.net${language === 'hy' ? '/hy' : ''}`
            close()
          }}
        >
          {m.landing_nav_story()}
        </button>
        <div className='mob-ctas'>
          <a className='btn ghost' href='/auth/sign-in' onClick={close}>
            {m.landing_nav_login()}
          </a>
          <a className='btn primary' href='/auth/sign-up' onClick={close}>
            {m.landing_nav_start_trial()}
          </a>
        </div>
      </div>
    </>
  )
}

function DemoVideoModal({ onClose }: Readonly<{ onClose: () => void }>) {
  useBodyScrollLock(true)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className='demo-modal'>
      <button
        type='button'
        aria-label={m.landing_demo_modal_close_aria_label()}
        className='demo-modal-backdrop'
        onClick={onClose}
      />
      <button
        type='button'
        className='demo-modal-close'
        aria-label={m.landing_demo_modal_close_aria_label()}
        onClick={onClose}
      >
        <Icons.X />
      </button>
      <video
        className='demo-modal-video'
        src='/media/menu-demo.mp4'
        preload='metadata'
        autoPlay
        controls
        playsInline
      >
        <track kind='captions' />
      </video>
    </div>,
    document.body,
  )
}

function Hero() {
  const locale = getLocale()
  const [demoOpen, setDemoOpen] = useState(false)

  const isArmenianLocale = locale === 'hy'

  return (
    <section className='hero'>
      <div className='wrap hero-grid'>
        <div className='hero-copy'>
          <span className='eyebrow'>{m.landing_hero_eyebrow()}</span>
          <h1 className={cn({ small: isArmenianLocale })}>
            {m.landing_hero_title_line1()}
            <span className='line2 g'>{m.landing_hero_title_line2()}</span>
          </h1>
          <p className='hero-sub'>{m.landing_hero_subtitle()}</p>
          <div className='hero-cta'>
            <a className='btn primary lg' href='/#pricing'>
              {m.landing_nav_start_trial()} <Icons.ArrowRight />
            </a>
            <button
              type='button'
              id='demoButton'
              className='btn ghost lg'
              onClick={() => setDemoOpen(true)}
            >
              <Icons.Play />
              {m.landing_hero_cta_demo()}
            </button>
          </div>
          <div className='hero-meta'>
            <span>{m.landing_hero_meta_no_card()}</span>
          </div>
        </div>
        <Reveal className='hero-mock'>
          <DashboardMock />
          <FloatBadge
            pos='b1'
            icon={<Icons.TrendingUp />}
            title={m.landing_hero_badge1_title()}
            sub={m.landing_hero_badge1_sub()}
          />
          <FloatBadge
            pos='b2'
            icon={<Icons.Bell />}
            title={m.landing_hero_badge2_title()}
            sub={m.landing_hero_badge2_sub()}
          />
        </Reveal>
      </div>
      {demoOpen && <DemoVideoModal onClose={() => setDemoOpen(false)} />}
    </section>
  )
}

function Trust() {
  const names = [
    m.landing_trust_name_1(),
    m.landing_trust_name_2(),
    m.landing_trust_name_3(),
    m.landing_trust_name_4(),
    m.landing_trust_name_5(),
    m.landing_trust_name_6(),
  ]
  return (
    <section className='trust'>
      <div className='wrap'>
        <div className='lbl'>{m.landing_trust_label()}</div>
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
  const featuresLead = {
    icon: <Icons.Clipboard />,
    title: m.landing_feature_lead_title(),
    body: m.landing_feature_lead_body(),
  }
  const features = [
    {
      icon: <Icons.KitchenDisplay />,
      title: m.landing_feature_1_title(),
      body: m.landing_feature_1_body(),
      accent: false,
    },
    {
      icon: <Icons.Card />,
      title: m.landing_feature_2_title(),
      body: m.landing_feature_2_body(),
      accent: false,
    },
    {
      icon: <Icons.BarChart />,
      title: m.landing_feature_3_title(),
      body: m.landing_feature_3_body(),
      accent: true,
    },
  ]
  return (
    <section className='sec-pad' id='features'>
      <div className='wrap'>
        <Reveal className='sec-head'>
          <span className='eyebrow'>{m.landing_features_eyebrow()}</span>
          <h2>
            {m.landing_features_title_line1()}{' '}
            <span className='g'>{m.landing_features_title_line2()}</span>
          </h2>
          <p>{m.landing_features_subtitle()}</p>
        </Reveal>
        <div className='bento'>
          <Reveal className='tile big feature-accent'>
            <div className='ico'>{featuresLead.icon}</div>
            <h3>{featuresLead.title}</h3>
            <p>{featuresLead.body}</p>
          </Reveal>
          {features.map((f) => (
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
              <h3>{m.landing_feature_staff_title()}</h3>
              <p>{m.landing_feature_staff_body()}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Ordering() {
  const orderPoints: [string, string][] = [
    [m.landing_ordering_point_1_title(), m.landing_ordering_point_1_body()],
    [m.landing_ordering_point_2_title(), m.landing_ordering_point_2_body()],
    [m.landing_ordering_point_3_title(), m.landing_ordering_point_3_body()],
  ]
  return (
    <section className='sec-pad showcase' id='ordering'>
      <div className='wrap show-grid'>
        <Reveal className='show-copy'>
          <span className='eyebrow'>{m.landing_ordering_eyebrow()}</span>
          <h2 style={{ fontSize: 'clamp(30px,4.2vw,46px)' }}>
            {m.landing_ordering_title_line1()}{' '}
            <span className='g'>{m.landing_ordering_title_line2()}</span>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '18px', lineHeight: 1.6 }}>
            {m.landing_ordering_subtitle()}
          </p>
          <div className='show-list'>
            {orderPoints.map(([b, s]) => (
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
            {m.landing_ordering_cta()} <Icons.ArrowRight />
          </a>
        </Reveal>
        <Reveal className='devices'>
          <PhoneMock />
          <div className='qr-tent'>
            <div className='qh'>{m.landing_ordering_qr_heading()}</div>
            <QrCode />
            <div className='qfoot'>
              <LogoSvg aria-hidden='true' />
              serve<span className='g'>-os</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Timeline() {
  const timeline: [string, string, string][] = [
    ['07:00', m.landing_timeline_1_title(), m.landing_timeline_1_body()],
    ['12:30', m.landing_timeline_2_title(), m.landing_timeline_2_body()],
    ['19:00', m.landing_timeline_3_title(), m.landing_timeline_3_body()],
    ['23:00', m.landing_timeline_4_title(), m.landing_timeline_4_body()],
  ]
  return (
    <section className='sec-pad' id='how'>
      <div className='wrap'>
        <Reveal className='sec-head'>
          <span className='eyebrow'>{m.landing_timeline_eyebrow()}</span>
          <h2>
            {m.landing_timeline_title_line1()}{' '}
            <span className='g'>{m.landing_timeline_title_line2()}</span>
          </h2>
        </Reveal>
        <div className='timeline'>
          {timeline.map(([time, title, body]) => (
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
          <span className='eyebrow'>{m.landing_pricing_eyebrow()}</span>
          <h2>
            {m.landing_pricing_title_line1()}{' '}
            <span className='g'>{m.landing_pricing_title_line2()}</span>
          </h2>
          <p>{m.landing_pricing_subtitle()}</p>
        </Reveal>
        <Reveal className='contact-form-wrap'>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  )
}

export function SiteCta() {
  return (
    <section style={{ padding: '90px 0' }}>
      <div className='wrap'>
        <Reveal className='cta-band'>
          <h2>{m.landing_cta_title()}</h2>
          <p>{m.landing_cta_subtitle()}</p>
          <a className='btn light lg' href='/auth/sign-up'>
            {m.landing_cta_button()} <Icons.ArrowRight />
          </a>
        </Reveal>
      </div>
    </section>
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
