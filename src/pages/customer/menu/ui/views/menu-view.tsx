import { Languages, Moon, Plus, ShoppingCart, Sun } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { m } from '#/paraglide/messages'
import { getLocale, locales, setLocale } from '#/paraglide/runtime'
import type { CustomerCategory, CustomerProduct } from '#/shared/api/customer/menu.types'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import { LazyImage } from '#/shared/ui/lazy-image'
import { C } from '../customer-theme'

function nextLocale() {
  const current = getLocale()
  const currentIndex = locales.indexOf(current)
  return locales[(currentIndex + 1) % locales.length]
}

interface MenuViewProps {
  businessName: string
  businessLogoUrl?: string | null
  tableName: string
  categories: CustomerCategory[]
  cartCount: number
  cartTotal: number
  isDark: boolean
  toggleTheme: () => void
  onProductSelect: (p: CustomerProduct) => void
  onQuickAdd: (p: CustomerProduct) => void
  onCartOpen: () => void
}

export function MenuView({
  businessName,
  businessLogoUrl,
  tableName,
  categories,
  cartCount,
  cartTotal,
  isDark,
  toggleTheme,
  onProductSelect,
  onQuickAdd,
  onCartOpen,
}: Readonly<MenuViewProps>) {
  const [activeCatId, setActiveCatId] = useState<string | null>(null)
  const chipBarRef = useRef<HTMLDivElement>(null)
  const scrollingRef = useRef(false)

  const effectiveCatId = activeCatId ?? categories[0]?.id ?? null
  const logoInitial = businessName.trim()[0]?.toUpperCase() ?? '?'

  // Update active chip based on scroll position
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollingRef.current) return
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-cat-id')
            if (id) setActiveCatId(id)
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    )
    for (const cat of categories) {
      const el = document.getElementById(`cat-${cat.id}`)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [categories])

  // Scroll active chip into view in the chip bar
  useEffect(() => {
    if (!(effectiveCatId && chipBarRef.current)) return
    const chip = chipBarRef.current.querySelector(
      `[data-chip="${effectiveCatId}"]`,
    ) as HTMLElement | null
    chip?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [effectiveCatId])

  const scrollToCategory = useCallback((catId: string) => {
    const el = document.getElementById(`cat-${catId}`)
    if (!el) return
    scrollingRef.current = true
    setActiveCatId(catId)
    const top = el.getBoundingClientRect().top + window.scrollY - 120
    window.scrollTo({ top, behavior: 'smooth' })
    setTimeout(() => {
      scrollingRef.current = false
    }, 900)
  }, [])

  return (
    <div
      className='c-page'
      style={{ background: C.bg, minHeight: '100dvh', fontFamily: C.fontBody }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: C.surface,
          borderBottom: `1px solid ${C.hairline}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Theme + language toggles – left */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type='button'
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: C.rFull,
              background: C.surface2,
              border: `1px solid ${C.hairline}`,
              cursor: 'pointer',
            }}
          >
            {isDark ? <Sun size={15} color={C.dim} /> : <Moon size={15} color={C.dim} />}
            <span style={{ color: C.dim, fontSize: 12, fontWeight: 600 }}>
              {isDark ? m.customer_theme_light() : m.customer_theme_dark()}
            </span>
          </button>
          <button
            type='button'
            onClick={() => setLocale(nextLocale())}
            aria-label={m.customer_change_language()}
            title={m.customer_change_language()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: C.rFull,
              background: C.surface2,
              border: `1px solid ${C.hairline}`,
              cursor: 'pointer',
            }}
          >
            <Languages size={15} color={C.dim} />
            <span style={{ color: C.dim, fontSize: 12, fontWeight: 600 }}>
              {getLocale().toUpperCase()}
            </span>
          </button>
        </div>

        <CartBtn count={cartCount} onClick={onCartOpen} />
      </div>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', padding: '32px 16px 24px' }}>
        <div
          style={{
            position: 'relative',
            width: 104,
            height: 104,
            borderRadius: '50%',
            margin: '0 auto 16px',
            boxShadow: `0 0 0 3px ${C.surface}, 0 0 28px rgba(255,106,61,0.35)`,
          }}
        >
          {businessLogoUrl ? (
            <LazyImage
              src={businessLogoUrl}
              alt={businessName}
              imgClassName='w-full h-full object-cover rounded-full'
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: C.amberGrad,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {logoInitial}
            </div>
          )}
        </div>

        <h1
          style={{
            fontFamily: C.fontDisplay,
            fontSize: 30,
            fontWeight: 400,
            color: C.white,
            margin: '0 0 6px',
            lineHeight: 1.15,
          }}
        >
          {businessName}
        </h1>

        {/* Status row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginTop: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: C.green,
                boxShadow: '0 0 0 3px rgba(34,197,94,0.2)',
              }}
            />
            <span style={{ color: C.dim, fontSize: 12, fontWeight: 500 }}>
              {m.customer_open_now()}
            </span>
          </div>
          <span style={{ color: C.hairline }}>·</span>
          <span style={{ color: C.dim, fontSize: 12 }}>
            {m.customer_table({ name: tableName })}
          </span>
        </div>
      </div>

      {/* ── Sticky category chip bar ── */}
      {categories.length > 0 && (
        <div
          ref={chipBarRef}
          style={{
            position: 'sticky',
            top: 52,
            zIndex: 15,
            background: C.bg,
            borderBottom: `1px solid ${C.hairline}`,
          }}
        >
          <div
            className='c-scrollbar-none'
            style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '10px 16px' }}
          >
            {categories.map((cat) => {
              const active = cat.id === effectiveCatId
              return (
                <button
                  key={cat.id}
                  data-chip={cat.id}
                  type='button'
                  onClick={() => scrollToCategory(cat.id)}
                  style={{
                    flexShrink: 0,
                    padding: '6px 16px',
                    borderRadius: C.rFull,
                    border: `1.5px solid ${active ? C.accent : C.hairline}`,
                    background: active ? C.accent : 'transparent',
                    color: active ? '#fff' : C.dim,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Category sections ── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '4px 16px 120px' }}>
        {categories.map((cat) => (
          <section
            key={cat.id}
            id={`cat-${cat.id}`}
            data-cat-id={cat.id}
            style={{ marginBottom: 28 }}
          >
            <h2
              style={{
                color: C.white,
                fontSize: 18,
                fontWeight: 700,
                margin: '24px 0 12px',
                fontFamily: C.fontBody,
              }}
            >
              {cat.name}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cat.products.length === 0 ? (
                <p style={{ color: C.faint, fontSize: 13, margin: 0 }}>{m.customer_no_items()}</p>
              ) : (
                cat.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={onProductSelect}
                    onQuickAdd={onQuickAdd}
                  />
                ))
              )}
            </div>
          </section>
        ))}
      </div>

      {/* ── Floating cart bar ── */}
      {cartCount > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)',
            maxWidth: 728,
            zIndex: 40,
          }}
        >
          <button
            type='button'
            onClick={onCartOpen}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: C.amberGrad,
              borderRadius: C.r16,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: C.shadowAmber,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {cartCount}
            </div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
              {m.customer_view_order()}
            </span>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
              {formatPrice(cartTotal)}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function CartBtn({ count, onClick }: Readonly<{ count: number; onClick: () => void }>) {
  return (
    <button
      type='button'
      onClick={onClick}
      style={{
        position: 'relative',
        width: 38,
        height: 38,
        borderRadius: '50%',
        border: `1px solid ${count > 0 ? C.accent : C.hairline}`,
        background: count > 0 ? C.accent : C.surface2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <ShoppingCart size={18} color={count > 0 ? '#fff' : C.dim} />
      {count > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 18,
            height: 18,
            borderRadius: C.rFull,
            background: '#fff',
            color: C.accent,
            fontSize: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            padding: '0 3px',
            border: `1.5px solid ${C.accent}`,
          }}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function ProductCard({
  product,
  onSelect,
  onQuickAdd,
}: Readonly<{
  product: CustomerProduct
  onSelect: (p: CustomerProduct) => void
  onQuickAdd: (p: CustomerProduct) => void
}>) {
  const img = product.imageUrls?.[0] ?? product.imageUrl
  const unavailable = !product.isAvailable

  return (
    <button
      type='button'
      onClick={() => onSelect(product)}
      disabled={unavailable}
      style={{
        background: C.surface,
        borderRadius: C.r16,
        border: `1px solid ${C.hairline}`,
        display: 'flex',
        gap: 12,
        padding: 12,
        textAlign: 'left',
        width: '100%',
        cursor: unavailable ? 'not-allowed' : 'pointer',
        opacity: unavailable ? 0.55 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {/* Text – left */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <p
          className='line-clamp-2'
          style={{ color: C.white, fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.35 }}
        >
          {product.name}
        </p>

        {/* Dietary tags */}
        {product.dietaryFlags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {product.dietaryFlags.slice(0, 3).map((f) => (
              <span
                key={f}
                style={{
                  padding: '2px 8px',
                  borderRadius: C.rFull,
                  background: C.greenBg,
                  color: C.green,
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {dietaryShort(f)}
              </span>
            ))}
          </div>
        )}

        {product.description && (
          <p
            className='line-clamp-2'
            style={{ color: C.faint, fontSize: 12, margin: 0, lineHeight: 1.45 }}
          >
            {product.description}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <span style={{ color: C.accent, fontSize: 15, fontWeight: 700 }}>
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice != null && product.compareAtPrice > product.price && (
            <s style={{ color: C.faint, fontSize: 12 }}>{formatPrice(product.compareAtPrice)}</s>
          )}
        </div>
      </div>

      {/* Thumbnail – right */}
      <div style={{ position: 'relative', width: 104, height: 104, flexShrink: 0 }}>
        {img ? (
          <img
            src={img}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: C.r16 }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: C.r16,
              background: C.surface2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
            }}
          >
            🍽️
          </div>
        )}
        {/* Floating add button */}
        {!unavailable && (
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation()
              onQuickAdd(product)
            }}
            style={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: C.accent,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(255,106,61,0.4)',
            }}
          >
            <Plus size={16} color='#fff' />
          </button>
        )}
      </div>
    </button>
  )
}

function dietaryShort(flag: string): string {
  switch (flag) {
    case 'vegan':
      return m.customer_dietary_short_vegan()
    case 'vegetarian':
      return m.customer_dietary_short_veg()
    case 'gluten_free':
      return m.customer_dietary_short_gf()
    case 'dairy_free':
      return m.customer_dietary_short_df()
    default:
      return flag
  }
}
