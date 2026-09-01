import { m } from '#/paraglide/messages'
import { getLocalStorageItem } from '#/shared/libs/utils/storage.utils'

function PendingSkeleton({
  w,
  h,
  r,
  card,
  card2,
}: Readonly<{
  w: number | string
  h: number
  r: number | string
  card: string
  card2: string
}>) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: `linear-gradient(90deg, ${card} 25%, ${card2} 50%, ${card} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
        flexShrink: 0,
      }}
    />
  )
}

export function CustomerMenuPending() {
  const isDark = (() => {
    try {
      const saved = getLocalStorageItem('c-theme')
      if (saved) return saved === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return true
    }
  })()

  const bg = isDark ? '#0d0d0d' : '#f8f5f1'
  const card = isDark ? '#1a1a1a' : '#ffffff'
  const card2 = isDark ? '#242424' : '#f2ede7'
  const textPrimary = isDark ? '#ffffff' : '#1a1a1a'
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
  const border = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)'

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: bg,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'inherit',
        paddingBottom: 72,
        overflow: 'hidden',
      }}
    >
      {/* Top bar skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 12px' }}>
        <PendingSkeleton w={42} h={42} r='50%' card={card} card2={card2} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <PendingSkeleton w='38%' h={9} r={6} card={card} card2={card2} />
          <PendingSkeleton w='65%' h={13} r={6} card={card} card2={card2} />
        </div>
        <PendingSkeleton w={42} h={42} r='50%' card={card} card2={card2} />
        <PendingSkeleton w={42} h={42} r='50%' card={card} card2={card2} />
      </div>

      {/* Search bar skeleton */}
      <div style={{ padding: '0 16px 16px' }}>
        <PendingSkeleton w='100%' h={44} r={12} card={card} card2={card2} />
      </div>

      {/* Hero card */}
      <div style={{ margin: '0 16px 20px', position: 'relative' }}>
        <div
          style={{
            width: '100%',
            height: 130,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${card} 0%, ${card2} 100%)`,
            border: `1px solid ${border}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <div
            className='c-pulse'
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#F97316 0%,#FBBF24 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              flexShrink: 0,
            }}
          >
            🍽️
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: textPrimary, fontSize: 14, fontWeight: 700, margin: '0 0 3px' }}>
              {m.customer_pending_setting_up_table()}
            </p>
            <p style={{ color: textMuted, fontSize: 12, margin: 0 }}>
              {m.customer_pending_starting_session()}
            </p>
          </div>
        </div>
      </div>

      {/* Categories heading skeleton */}
      <div style={{ padding: '0 16px 10px' }}>
        <PendingSkeleton w='28%' h={13} r={6} card={card} card2={card2} />
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 14, padding: '4px 16px 20px', overflow: 'hidden' }}>
        {[56, 48, 64, 52].map((w) => (
          <div
            key={w}
            style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <PendingSkeleton w={60} h={60} r='50%' card={card} card2={card2} />
            <PendingSkeleton w={w} h={9} r={5} card={card} card2={card2} />
          </div>
        ))}
      </div>

      {/* Section heading skeleton */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 16px 12px',
        }}
      >
        <PendingSkeleton w='35%' h={14} r={6} card={card} card2={card2} />
        <PendingSkeleton w='15%' h={10} r={5} card={card} card2={card2} />
      </div>

      {/* Product card skeletons */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map((k) => (
          <div
            key={k}
            style={{
              background: card,
              borderRadius: 16,
              border: `1px solid ${border}`,
              padding: 12,
              display: 'flex',
              gap: 12,
            }}
          >
            <PendingSkeleton w={82} h={82} r={12} card={card} card2={card2} />
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <PendingSkeleton w='70%' h={13} r={6} card={card} card2={card2} />
              <PendingSkeleton w='90%' h={10} r={5} card={card} card2={card2} />
              <PendingSkeleton w='40%' h={10} r={5} card={card} card2={card2} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', flexShrink: 0 }}>
              <PendingSkeleton w={36} h={36} r={12} card={card} card2={card2} />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
