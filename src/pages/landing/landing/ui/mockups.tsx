import type { ReactNode } from 'react'
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
    { icon: <Icons.Home />, label: 'Dashboard', active: true },
    { icon: <Icons.List />, label: 'Orders' },
    { icon: <Icons.Tray />, label: 'Menu' },
    { icon: <Icons.Grid />, label: 'Tables' },
    { icon: <Icons.Staff />, label: 'Staff' },
    { icon: <Icons.Monitor />, label: 'Kitchen' },
  ]
  const kpis = [
    { lbl: 'Total Orders', val: '256', delta: '+12%' },
    { lbl: 'Revenue', val: '$4,325', delta: '+13%' },
    { lbl: 'Active Tables', val: '18', delta: '/40' },
    { lbl: 'Pending', val: '7' },
  ]
  const top: [string, number][] = [
    ['Burger', 120],
    ['Pizza', 98],
    ['Pasta', 72],
    ['Coffee', 64],
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
          <div className='dtitle'>Dashboard</div>
          <div className='kpis'>
            {kpis.map((k) => (
              <div className='kpi' key={k.lbl}>
                <div className='lbl'>{k.lbl}</div>
                <div className='val'>
                  {k.val} {k.delta && <small>{k.delta}</small>}
                </div>
              </div>
            ))}
          </div>
          <div className='dash-lower'>
            <div className='chart-card'>
              <div className='ch-head'>
                <span>Sales Overview</span>
                <span>This Week</span>
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
                <span>Top Items</span>
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
    { icon: <Icons.Burger />, n: 'Cheese Burger', pr: '$8.50' },
    { icon: <Icons.Pizza />, n: 'Margherita Pizza', pr: '$10.50' },
    { icon: <Icons.Pasta />, n: 'Pasta Alfredo', pr: '$8.50' },
    { icon: <Icons.Coffee />, n: 'Ice Coffee', pr: '$4.50' },
  ]
  return (
    <div className='phone'>
      <div className='scr'>
        <div className='ph-head'>
          <div className='tt'>Our Menu</div>
          <div className='cart'>
            <Icons.Cart />
          </div>
        </div>
        <div className='tabs'>
          <span className='on'>All</span>
          <span>Food</span>
          <span>Drinks</span>
          <span>Desserts</span>
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
        <div className='viewcart'>View Cart · $22.50</div>
      </div>
    </div>
  )
}

export function QrCode() {
  const N = 21
  const isFinder = (x: number, y: number) => {
    const box = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7
    return box(0, 0) || box(N - 7, 0) || box(0, N - 7)
  }
  let seed = 7
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return (seed >> 8) % 100
  }
  const cells = []
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (isFinder(x, y)) continue
      if (rnd() < 46)
        cells.push(<rect key={`c${x}-${y}`} x={x} y={y} width='1' height='1' fill='#142319' />)
    }
  }
  const finder = (ox: number, oy: number, k: string) => [
    <rect
      key={`fo${k}`}
      x={ox}
      y={oy}
      width='7'
      height='7'
      rx='1.4'
      fill='none'
      stroke='#142319'
      strokeWidth='1'
    />,
    <rect key={`fi${k}`} x={ox + 2} y={oy + 2} width='3' height='3' rx='0.7' fill='#142319' />,
  ]
  const c = N / 2
  return (
    <div className='qr' style={{ background: '#fff', padding: '8px' }}>
      <svg viewBox={`0 0 ${N} ${N}`} width='100%' height='100%' aria-hidden='true'>
        {cells}
        {finder(0, 0, 'a')}
        {finder(N - 7, 0, 'b')}
        {finder(0, N - 7, 'c')}
        <rect x={c - 2.5} y={c - 2.5} width='5' height='5' rx='1.2' fill='#fff' />
        <path
          d={`M${c} ${c - 1.6} V${c + 1.6} M${c - 1.6} ${c} H${c + 1.6}`}
          stroke='#57ac1f'
          strokeWidth='1.1'
          strokeLinecap='round'
        />
      </svg>
    </div>
  )
}
