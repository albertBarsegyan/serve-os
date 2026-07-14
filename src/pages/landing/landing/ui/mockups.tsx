import type { ReactNode } from 'react'
import { m } from '#/paraglide/messages'
import qrCode from '#/shared/assets/illustrations/qrcode.png'
import { LazyImage } from '#/shared/ui/lazy-image.tsx'
import { LogoSvg } from '#/shared/ui/logo-svg.tsx'
import { Icons } from './icons'

interface FloatBadgeProps {
  pos: string
  icon: ReactNode
  title: string
  sub: string
}

export function DashboardMock() {
  const nav = [
    { icon: <Icons.Home />, label: m.landing_mockup_nav_dashboard(), active: true },
    { icon: <Icons.List />, label: m.landing_mockup_nav_orders() },
    { icon: <Icons.Tray />, label: m.landing_mockup_nav_menu() },
    { icon: <Icons.Grid />, label: m.landing_mockup_nav_tables() },
    { icon: <Icons.Staff />, label: m.landing_mockup_nav_staff() },
    { icon: <Icons.Monitor />, label: m.landing_mockup_nav_kitchen() },
  ]
  const kpis = [
    { lbl: m.landing_mockup_kpi_total_orders(), val: '256' },
    { lbl: m.landing_mockup_kpi_revenue(), val: '$999' },
    { lbl: m.landing_mockup_kpi_active_tables(), val: '18' },
    { lbl: m.landing_mockup_kpi_pending(), val: '7' },
  ]
  const top: [string, number][] = [
    [m.landing_mockup_top_item_burger(), 120],
    [m.landing_mockup_top_item_pizza(), 98],
    [m.landing_mockup_top_item_pasta(), 72],
    [m.landing_mockup_top_item_coffee(), 64],
  ]
  return (
    <div className='mockup'>
      <div className='topbar'>
        <i />
        <i />
        <i />
      </div>
      <div className='dash'>
        <aside className='dash-side'>
          <div className='brandrow'>
            <LogoSvg aria-hidden='true' />
            serve<span className='g'>-os</span>
          </div>
          {nav.map((n) => (
            <div key={n.label} className={`navit${n.active ? ' active' : ''}`}>
              {n.icon}
              {n.label}
            </div>
          ))}
        </aside>
        <div className='dash-main'>
          <div className='dtitle'>{m.landing_mockup_dashboard_title()}</div>
          <div className='kpis'>
            {kpis.map((k) => (
              <div className='kpi' key={k.lbl}>
                <div className='lbl'>{k.lbl}</div>
                <div className='val'>{k.val}</div>
              </div>
            ))}
          </div>
          <div className='dash-lower'>
            <div className='chart-card'>
              <div className='ch-head'>
                <span>{m.landing_mockup_sales_overview()}</span>
                <span>{m.landing_mockup_this_week()}</span>
              </div>
              <svg viewBox='0 0 320 92' preserveAspectRatio='none' aria-hidden='true'>
                <defs>
                  <linearGradient id='cg' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0' stopColor='var(--accent)' stopOpacity='0.32' />
                    <stop offset='1' stopColor='var(--accent)' stopOpacity='0' />
                  </linearGradient>
                </defs>
                <path
                  d='M0 64 L46 58 L92 70 L138 44 L184 52 L230 30 L276 36 L320 14 L320 92 L0 92 Z'
                  fill='url(#cg)'
                />
                <path
                  d='M0 64 L46 58 L92 70 L138 44 L184 52 L230 30 L276 36 L320 14'
                  fill='none'
                  stroke='var(--accent)'
                  strokeWidth='2.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <circle cx='320' cy='14' r='3.5' fill='var(--accent)' />
              </svg>
            </div>
            <div className='top-card'>
              <div className='ch-head'>
                <span>{m.landing_mockup_top_items_heading()}</span>
              </div>
              {top.map(([name, ct]) => (
                <div className='topitem' key={name}>
                  <span className='sw' />
                  <span className='nm'>{name}</span>
                  <span className='ct'>{ct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FloatBadge({ pos, icon, title, sub }: FloatBadgeProps) {
  return (
    <div className={`float-badge ${pos}`}>
      <div className='ic'>{icon}</div>
      <div>
        <div className='t'>{title}</div>
        <div className='s'>{sub}</div>
      </div>
    </div>
  )
}

export function PhoneMock() {
  const items = [
    { icon: <Icons.Burger />, n: m.landing_mockup_item_cheese_burger(), pr: '$8.50' },
    { icon: <Icons.Pizza />, n: m.landing_mockup_item_margherita_pizza(), pr: '$10.50' },
    { icon: <Icons.Pasta />, n: m.landing_mockup_item_pasta_alfredo(), pr: '$8.50' },
    { icon: <Icons.Coffee />, n: m.landing_mockup_item_ice_coffee(), pr: '$4.50' },
  ]
  return (
    <div className='phone'>
      <div className='scr'>
        <div className='ph-head'>
          <div className='tt'>{m.landing_mockup_our_menu()}</div>
          <div className='cart'>
            <Icons.Cart />
          </div>
        </div>
        <div className='tabs'>
          <span className='on'>{m.landing_mockup_tab_all()}</span>
          <span>{m.landing_mockup_tab_food()}</span>
          <span>{m.landing_mockup_tab_drinks()}</span>
          <span>{m.landing_mockup_tab_desserts()}</span>
        </div>
        <div className='items'>
          {items.map((it) => (
            <div className='menu-item' key={it.n}>
              <div className='thumb'>{it.icon}</div>
              <div className='info'>
                <div className='n'>{it.n}</div>
                <div className='pr'>{it.pr}</div>
              </div>
              <div className='add'>+</div>
            </div>
          ))}
        </div>
        <div className='viewcart'>{m.landing_mockup_view_cart_label()} · $22.50</div>
      </div>
    </div>
  )
}

export function QrCode() {
  return (
    <div className='qr' style={{ background: '#fff', padding: '8px' }}>
      <LazyImage src={qrCode} alt={'qr code'} />
    </div>
  )
}
