import { Moon, Plus, Search, ShoppingBag, Sun, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'
import { LazyImage } from '#/shared/ui/lazy-image'
import type { CustomerCategory, CustomerProduct } from '#/shared/api/customer/menu.types'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import { C } from '../customer-theme'

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
  onCartOpen,
}: Readonly<MenuViewProps>) {
  const [activeCatId, setActiveCatId] = useState<string | null>(null)

  const effectiveCatId = activeCatId ?? categories[0]?.id ?? null
  const activeProducts = categories.find((c) => c.id === effectiveCatId)?.products ?? []
  const logoInitial = businessName.trim()[0]?.toUpperCase() ?? '?'

  return (
    <div
      className='c-page'
      style={{ background: C.bg, minHeight: '100dvh', paddingBottom: 84, fontFamily: 'inherit' }}
    >
      {/* Top bar */}
      <div
        id='topBar'
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px 10px',
          borderBottom: `1px solid ${C.border}`,
          background: C.card,
        }}
      >
        {/* Theme toggle — left */}
        <IconBtn onClick={toggleTheme}>
          {isDark ? <Sun size={18} color={C.w60} /> : <Moon size={18} color={C.w60} />}
        </IconBtn>

        {/* Center — business identity */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            minWidth: 0,
          }}
        >
          {/* Logo / Initial */}
          {businessLogoUrl ? (
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
                border: `2px solid ${C.border}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }}
            >
              <LazyImage
                src={businessLogoUrl}
                alt={businessName}
                imgClassName='w-full h-full object-cover'
              />
            </div>
          ) : (
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: C.amberGrad,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 20,
                fontWeight: 700,
                color: '#fff',
                boxShadow: C.shadowAmber,
                letterSpacing: '-0.02em',
              }}
            >
              {logoInitial}
            </div>
          )}

          {/* Business name */}
          <p
            className='line-clamp-1'
            style={{
              color: C.white,
              fontWeight: 700,
              fontSize: 14,
              margin: 0,
              lineHeight: 1.2,
              maxWidth: 180,
              textAlign: 'center',
            }}
          >
            {businessName}
          </p>

          {/* Menu label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <UtensilsCrossed size={9} color={C.amber} />
            <span
              style={{
                fontSize: 10,
                color: C.amber,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Menu
            </span>
            <UtensilsCrossed size={9} color={C.amber} style={{ transform: 'scaleX(-1)' }} />
          </div>
        </div>

        {/* Cart — right */}
        <IconBtn onClick={onCartOpen} highlight={cartCount > 0} count={cartCount}>
          <ShoppingBag size={18} color={cartCount > 0 ? C.white : C.w60} />
        </IconBtn>
      </div>

      {/* Table badge */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 16px 0' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 12px',
            background: 'rgba(249,115,22,0.08)',
            borderRadius: C.rFull,
            border: `1px solid rgba(249,115,22,0.2)`,
          }}
        >
          <span style={{ fontSize: 10, color: C.amber, fontWeight: 700, letterSpacing: '0.06em' }}>
            {tableName}
          </span>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 16px 14px' }}>
        <div
          style={{
            background: C.card,
            borderRadius: C.r12,
            border: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '11px 14px',
          }}
        >
          <Search size={16} color={C.w40} />
          <span style={{ color: C.w40, fontSize: 14 }}>Search dishes, drinks…</span>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <SectionHeader title='Categories' />
          <div
            className='c-scrollbar-none'
            style={{
              display: 'flex',
              gap: 14,
              overflowX: 'auto',
              padding: '4px 16px 10px',
            }}
          >
            {categories.map((cat) => {
              const active = cat.id === effectiveCatId
              return (
                <button
                  key={cat.id}
                  type='button'
                  onClick={() => setActiveCatId(cat.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 7,
                    flexShrink: 0,
                    cursor: 'pointer',
                    border: 'none',
                    background: 'transparent',
                    padding: '2px 0',
                  }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: active ? C.amberGrad : C.card,
                      border: active ? 'none' : `2px solid ${C.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      boxShadow: active ? C.shadowAmber : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: 26 }}>🍽️</span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: active ? 700 : 500,
                      color: active ? C.amber : C.w60,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cat.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, padding: '0 16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h3 style={{ color: C.white, fontSize: 15, fontWeight: 700, margin: 0 }}>
            {categories.find((c) => c.id === effectiveCatId)?.name ?? 'All Items'}
          </h3>
          <span style={{ color: C.w40, fontSize: 12 }}>{activeProducts.length} items</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: C.w40, fontSize: 14 }}>
              No items in this category
            </div>
          ) : (
            activeProducts.map((p) => (
              <ProductCard key={p.id} product={p} onSelect={onProductSelect} />
            ))
          )}
        </div>
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 40 }}>
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
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>View Order</span>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
              {formatPrice(cartTotal)}
            </span>
          </button>
        </div>
      )}

      {/* Bottom nav */}
      <BottomNav active='home' onCart={onCartOpen} cartCount={cartCount} />
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function IconBtn({
  onClick,
  highlight,
  count,
  children,
}: Readonly<{
  onClick: () => void
  highlight?: boolean
  count?: number
  children: React.ReactNode
}>) {
  return (
    <button
      type='button'
      onClick={onClick}
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: `1px solid ${C.border}`,
        background: highlight ? C.amber : C.card2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {children}
      {count != null && count > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#EF4444',
            color: '#fff',
            fontSize: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
          }}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function SectionHeader({ title, action }: Readonly<{ title: string; action?: string }>) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 16px',
        marginBottom: 10,
      }}
    >
      <h3 style={{ color: C.white, fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</h3>
      {action && (
        <button
          type='button'
          style={{
            color: C.amber,
            fontSize: 12,
            fontWeight: 600,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {action}
        </button>
      )}
    </div>
  )
}

function ProductCard({
  product,
  onSelect,
}: Readonly<{
  product: CustomerProduct
  onSelect: (p: CustomerProduct) => void
}>) {
  const [pressed, setPressed] = useState(false)
  const img = product.imageUrls?.[0] ?? product.imageUrl

  return (
    <div
      style={{
        background: C.card,
        borderRadius: C.r16,
        border: `1px solid ${C.border}`,
        display: 'flex',
        gap: 12,
        padding: 12,
        overflow: 'hidden',
      }}
    >
      <button
        type='button'
        onClick={() => onSelect(product)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          flex: 1,
          display: 'flex',
          gap: 12,
          textAlign: 'left',
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: 82,
            height: 82,
            borderRadius: C.r12,
            flexShrink: 0,
            background: C.card2,
            overflow: 'hidden',
          }}
        >
          {img ? (
            <img
              src={img}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 30,
              }}
            >
              🍽️
            </div>
          )}
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <p
            className='line-clamp-2'
            style={{
              color: C.white,
              fontSize: 14,
              fontWeight: 600,
              margin: '0 0 4px',
              lineHeight: 1.3,
            }}
          >
            {product.name}
          </p>
          {product.description && (
            <p
              className='line-clamp-2'
              style={{ color: C.w40, fontSize: 12, margin: '0 0 8px', lineHeight: 1.4 }}
            >
              {product.description}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.amber, fontSize: 15, fontWeight: 700 }}>
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice != null && product.compareAtPrice > product.price && (
              <s style={{ color: C.w30, fontSize: 12 }}>{formatPrice(product.compareAtPrice)}</s>
            )}
          </div>
        </div>
      </button>
      <button
        type='button'
        disabled={!product.isAvailable}
        onClick={() => {
          setPressed(true)
          setTimeout(() => setPressed(false), 150)
          onSelect(product)
        }}
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: C.r12,
          background: product.isAvailable ? C.amberGrad : C.card2,
          border: 'none',
          cursor: product.isAvailable ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'flex-end',
          transform: pressed ? 'scale(0.85)' : 'scale(1)',
          transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <Plus size={18} color={product.isAvailable ? '#fff' : C.w30} />
      </button>
    </div>
  )
}

export function BottomNav({
  active,
  onCart,
  cartCount,
}: {
  active: 'home' | 'cart' | 'profile'
  onCart: () => void
  cartCount: number
}) {
  const tabs = [
    { key: 'home' as const, label: 'Home', icon: '🏠', action: undefined },
    { key: 'cart' as const, label: 'Cart', icon: '🛒', action: onCart, badge: cartCount },
    { key: 'profile' as const, label: 'Profile', icon: '👤', action: undefined },
  ]
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: C.card,
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        padding: '8px 0 20px',
        zIndex: 50,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type='button'
          onClick={tab.action}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            background: 'none',
            border: 'none',
            cursor: tab.action ? 'pointer' : 'default',
            position: 'relative',
          }}
        >
          <span style={{ fontSize: 22 }}>{tab.icon}</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: tab.key === active ? C.amber : C.w40,
            }}
          >
            {tab.label}
          </span>
          {tab.badge != null && tab.badge > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 0,
                right: '50%',
                transform: 'translate(80%,-30%)',
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#EF4444',
                color: '#fff',
                fontSize: 9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  )
}
