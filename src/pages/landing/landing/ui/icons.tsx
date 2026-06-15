import type { ReactNode } from 'react'

interface SvgProps {
  children: ReactNode
  sw?: number
  fill?: string
}

function Svg({ children, sw = 2, fill = 'none' }: SvgProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill={fill}
      stroke='currentColor'
      strokeWidth={sw}
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      {children}
    </svg>
  )
}

export const Icons = {
  Sun: () => (
    <Svg>
      <circle cx='12' cy='12' r='4' />
      <path d='M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' />
    </Svg>
  ),
  Moon: () => (
    <Svg>
      <path d='M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z' />
    </Svg>
  ),
  ArrowRight: () => (
    <Svg sw={2.2}>
      <path d='M5 12h14M13 6l6 6-6 6' />
    </Svg>
  ),
  Play: () => (
    <Svg>
      <circle cx='12' cy='12' r='9' />
      <path d='M10 9l5 3-5 3z' fill='currentColor' stroke='none' />
    </Svg>
  ),
  TrendingUp: () => (
    <Svg sw={2.2}>
      <path d='M3 17l6-6 4 4 8-8M21 7h-5M21 7v5' />
    </Svg>
  ),
  Bell: () => (
    <Svg sw={2.2}>
      <path d='M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0' />
    </Svg>
  ),
  Home: () => (
    <Svg>
      <path d='M3 10l9-7 9 7v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z' />
    </Svg>
  ),
  List: () => (
    <Svg>
      <path d='M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' />
    </Svg>
  ),
  Tray: () => (
    <Svg>
      <path d='M3 11h18M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M6 11v8M18 11v8' />
    </Svg>
  ),
  Grid: () => (
    <Svg>
      <rect x='3' y='3' width='7' height='7' rx='1' />
      <rect x='14' y='3' width='7' height='7' rx='1' />
      <rect x='3' y='14' width='7' height='7' rx='1' />
    </Svg>
  ),
  Staff: () => (
    <Svg>
      <circle cx='9' cy='8' r='3' />
      <path d='M3 20a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6' />
    </Svg>
  ),
  Monitor: () => (
    <Svg>
      <rect x='3' y='4' width='18' height='13' rx='2' />
      <path d='M8 21h8' />
    </Svg>
  ),
  Clipboard: () => (
    <Svg>
      <rect x='4' y='2' width='16' height='20' rx='3' />
      <path d='M9 7h6M9 11h6M9 15h3' />
    </Svg>
  ),
  KitchenDisplay: () => (
    <Svg>
      <rect x='2' y='3' width='20' height='14' rx='2' />
      <path d='M8 21h8M12 17v4' />
    </Svg>
  ),
  Card: () => (
    <Svg>
      <rect x='2' y='5' width='20' height='14' rx='2' />
      <path d='M2 10h20M6 15h4' />
    </Svg>
  ),
  BarChart: () => (
    <Svg>
      <path d='M3 3v18h18' />
      <path d='M7 14l4-4 3 3 5-6' />
    </Svg>
  ),
  Users: () => (
    <Svg>
      <circle cx='9' cy='8' r='3.2' />
      <path d='M2.5 20a6.5 6.5 0 0 1 13 0M17 6a3.2 3.2 0 0 1 0 6.4M22 20a6.2 6.2 0 0 0-4.5-6' />
    </Svg>
  ),
  Cart: () => (
    <Svg>
      <circle cx='9' cy='21' r='1' />
      <circle cx='18' cy='21' r='1' />
      <path d='M2 3h3l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L23 7H6' />
    </Svg>
  ),
  Burger: () => (
    <Svg>
      <path d='M4 13h16M5 13a7 7 0 0 1 14 0M4 17h16' />
    </Svg>
  ),
  Pizza: () => (
    <Svg>
      <path d='M12 2l9 6-9 14L3 8z' />
      <path d='M9 9h.01M14 11h.01M11 14h.01' />
    </Svg>
  ),
  Pasta: () => (
    <Svg>
      <path d='M4 11h16a8 8 0 0 1-16 0zM12 3v4M9 4v3M15 4v3' />
    </Svg>
  ),
  Coffee: () => (
    <Svg>
      <path d='M5 8h12v3a6 6 0 0 1-12 0zM17 9h2a2 2 0 0 1 0 4h-2M5 20h12' />
    </Svg>
  ),
  Check: () => (
    <Svg sw={3}>
      <path d='M5 12l5 5 9-11' />
    </Svg>
  ),
  Menu: () => (
    <Svg sw={2.2}>
      <path d='M3 12h18M3 6h18M3 18h18' />
    </Svg>
  ),
  X: () => (
    <Svg sw={2.2}>
      <path d='M18 6L6 18M6 6l12 12' />
    </Svg>
  ),
  MapPin: () => (
    <Svg>
      <path d='M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z' />
      <circle cx='12' cy='10' r='3' />
    </Svg>
  ),
  Globe: () => (
    <Svg>
      <circle cx='12' cy='12' r='10' />
      <path d='M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' />
    </Svg>
  ),
}
