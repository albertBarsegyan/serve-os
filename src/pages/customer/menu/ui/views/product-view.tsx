import {Check, ChevronDown, ChevronLeft, ChevronUp, Clock, ShoppingBag} from 'lucide-react'
import {useMemo, useState} from 'react'
import type {CartModifier} from '#/features/cart/model/cart.store'
import type {CustomerModifierGroup, CustomerProduct} from '#/shared/api/customer/menu.types'
import {formatPrice} from '#/shared/libs/utils/price.utils'
import {C} from '../customer-theme'

const DIETARY_LABELS: Record<string, string> = {
  vegan: 'Vegan 🌱',
  vegetarian: 'Vegetarian',
  gluten_free: 'Gluten-Free',
  dairy_free: 'Dairy-Free',
}

interface ProductViewProps {
  product: CustomerProduct
  cartCount: number
  onBack: () => void
  onGoToCart: () => void
  onAdd: (qty: number, modifiers: CartModifier[], notes: string) => void
  onAddAndNext: (qty: number, modifiers: CartModifier[], notes: string) => void
}

export function ProductView({
  product,
  cartCount,
  onBack,
  onGoToCart,
  onAdd,
  onAddAndNext,
}: Readonly<ProductViewProps>) {
  const [qty, setQty] = useState(1)
  const [groupSelections, setGroupSelections] = useState<Record<string, string[]>>({})
  const [notes, setNotes] = useState('')
  const [termsOpen, setTermsOpen] = useState(false)

  const img = product.imageUrls?.[0] ?? product.imageUrl
  const activeGroups = product.modifierGroups.filter((g) => g.modifiers.some((m) => m.isActive))

  const isValid = useMemo(() => {
    return activeGroups.every((g) => {
      const sel = groupSelections[g.id] ?? []
      return !g.isRequired || sel.length >= g.minSelections
    })
  }, [activeGroups, groupSelections])

  const modifierPrice = useMemo(() => {
    return activeGroups.reduce((total, g) => {
      const sel = groupSelections[g.id] ?? []
      return (
        total +
        g.modifiers
          .filter((m) => sel.includes(m.id))
          .reduce((s, m) => s + Number(m.priceAdjustment), 0)
      )
    }, 0)
  }, [activeGroups, groupSelections])

  const unitPrice = Number(product.price) + modifierPrice
  const totalPrice = unitPrice * qty

  function buildModifiers(): CartModifier[] {
    return activeGroups.flatMap((g) =>
      (groupSelections[g.id] ?? []).flatMap((modId) => {
        const mod = g.modifiers.find((m) => m.id === modId)
        if (!mod) return []
        return [
          {
            groupId: g.id,
            modifierId: mod.id,
            name: mod.name,
            priceAdjustment: mod.priceAdjustment,
          },
        ]
      }),
    )
  }

  return (
    <div className='c-page' style={{ background: C.bg, minHeight: '100dvh', paddingBottom: 100 }}>
      {/* Hero image */}
      <div style={{ position: 'relative', width: '100%', height: '45dvh', background: C.card2 }}>
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
              fontSize: 80,
            }}
          >
            🍽️
          </div>
        )}
        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 40%, rgba(13,13,13,0.6) 100%)',
          }}
        />
        {/* Top bar overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 16px',
          }}
        >
          <button
            type='button'
            onClick={onBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(8px)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={20} color='#fff' />
          </button>
          <button
            type='button'
            onClick={onGoToCart}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: cartCount > 0 ? C.amber : 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(8px)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <ShoppingBag size={20} color='#fff' />
            {cartCount > 0 && (
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
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 16px 0' }}>
        {/* Name + price */}
        <h1
          style={{
            color: C.white,
            fontSize: 22,
            fontWeight: 800,
            margin: '0 0 6px',
            lineHeight: 1.25,
          }}
        >
          {product.name}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <span style={{ color: C.amber, fontSize: 22, fontWeight: 800 }}>
            {formatPrice(unitPrice)}
          </span>
          {product.compareAtPrice != null && product.compareAtPrice > product.price && (
            <s style={{ color: C.w40, fontSize: 15 }}>{formatPrice(product.compareAtPrice)}</s>
          )}
        </div>

        {/* Availability + prep time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: product.isAvailable ? C.green : C.red,
                boxShadow: product.isAvailable ? `0 0 0 3px ${C.greenBg}` : 'none',
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: product.isAvailable ? C.green : C.red,
              }}
            >
              {product.isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
          {product.prepTimeMinutes > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={13} color={C.w40} />
              <span style={{ fontSize: 12, color: C.w60 }}>{product.prepTimeMinutes} min</span>
            </div>
          )}
        </div>

        {/* Dietary pills */}
        {product.dietaryFlags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {product.dietaryFlags.map((flag) => (
              <span
                key={flag}
                style={{
                  padding: '5px 12px',
                  borderRadius: C.rFull,
                  background: C.greenBg,
                  border: `1px solid rgba(34,197,94,0.25)`,
                  color: C.green,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {DIETARY_LABELS[flag] ?? flag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: C.white, fontSize: 14, fontWeight: 700, margin: '0 0 8px' }}>
              Description
            </h3>
            <p style={{ color: C.w60, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              {product.description}
            </p>
          </div>
        )}

        {/* Allergens */}
        {product.allergens.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: C.white, fontSize: 14, fontWeight: 700, margin: '0 0 8px' }}>
              Allergens
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {product.allergens.map((a) => (
                <span
                  key={a}
                  style={{
                    padding: '4px 10px',
                    borderRadius: C.rFull,
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#FCA5A5',
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  ⚠️ {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Modifier groups */}
        {activeGroups.map((g) => (
          <ModifierGroup
            key={g.id}
            group={g}
            selections={groupSelections[g.id] ?? []}
            onChange={(ids) => setGroupSelections((prev) => ({ ...prev, [g.id]: ids }))}
          />
        ))}

        {/* Notes */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ color: C.white, fontSize: 14, fontWeight: 700, margin: '0 0 8px' }}>
            Special Requests
          </h3>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder='e.g. no onions, extra sauce…'
            style={{
              width: '100%',
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: C.r12,
              padding: '10px 12px',
              color: C.w80,
              fontSize: 13,
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Terms & Conditions (collapsible) */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: C.r12,
            marginBottom: 20,
            overflow: 'hidden',
          }}
        >
          <button
            type='button'
            onClick={() => setTermsOpen((o) => !o)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ color: C.w60, fontSize: 13, fontWeight: 600 }}>
              Terms & Conditions of Storage
            </span>
            {termsOpen ? (
              <ChevronUp size={16} color={C.w40} />
            ) : (
              <ChevronDown size={16} color={C.w40} />
            )}
          </button>
          {termsOpen && (
            <div style={{ padding: '0 14px 14px', color: C.w40, fontSize: 12, lineHeight: 1.6 }}>
              This dish is prepared fresh and should be consumed immediately. Store any leftovers in
              a sealed container and refrigerate within 2 hours. Consume within 24 hours.
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: C.card,
          borderTop: `1px solid ${C.border}`,
          padding: '12px 16px 28px',
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 12,
          zIndex: 50,
        }}
      >
        {/* Qty selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: C.card2,
            borderRadius: C.r12,
            padding: '4px',
            border: `1px solid ${C.border}`,
            justifyContent: 'center',
          }}
        >
          <QtyBtn onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>
            −
          </QtyBtn>
          <input
            className='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            onChange={(e) => setQty(Number(e.target.value || 0))}
            value={qty}
            style={{
              width: 32,
              textAlign: 'center',
              color: C.white,
              fontSize: 15,
              fontWeight: 700,
            }}
          />

          <QtyBtn onClick={() => setQty((q) => q + 1)}>+</QtyBtn>
        </div>

        <div className='flex justify-between w-full flex-1 gap-2'>
          <button
            type='button'
            disabled={!(isValid && product.isAvailable)}
            onClick={() => onAdd(qty, buildModifiers(), notes)}
            style={{
              flex: 1,
              padding: '13px 8px',
              borderRadius: C.r12,
              border: `1px solid ${C.border}`,
              background: !(isValid && product.isAvailable) ? C.card3 : C.card2,
              color: !(isValid && product.isAvailable) ? C.w40 : C.amber,
              fontWeight: 700,
              fontSize: 13,
              cursor: !(isValid && product.isAvailable) ? 'not-allowed' : 'pointer',
            }}
          >
            ADD TO CART
          </button>

          {/* NEXT */}
          <button
            type='button'
            disabled={!(isValid && product.isAvailable)}
            onClick={() => onAddAndNext(qty, buildModifiers(), notes)}
            style={{
              flex: 1.4,
              padding: '13px 8px',
              borderRadius: C.r12,
              border: 'none',
              background: !(isValid && product.isAvailable) ? C.card3 : C.amberGrad,
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: !(isValid && product.isAvailable) ? 'not-allowed' : 'pointer',
              opacity: !(isValid && product.isAvailable) ? 0.5 : 1,
            }}
          >
            {formatPrice(totalPrice)} · NEXT →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modifier Group ─────────────────────────────────────────────────────────────

function ModifierGroup({
  group,
  selections,
  onChange,
}: {
  group: CustomerModifierGroup
  selections: string[]
  onChange: (ids: string[]) => void
}) {
  const activeModifiers = group.modifiers.filter((m) => m.isActive)
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: C.r12,
        padding: '12px 14px',
        marginBottom: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>{group.name}</span>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: C.rFull,
            background: group.isRequired ? 'rgba(239,68,68,0.12)' : C.w06,
            color: group.isRequired ? '#FCA5A5' : C.w40,
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          {group.isRequired ? 'Required' : 'Optional'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {activeModifiers.map((mod) => {
          const checked = selections.includes(mod.id)
          const isSingle = group.selectionType === 'SINGLE'
          function toggle() {
            if (isSingle) {
              onChange(checked ? [] : [mod.id])
            } else {
              onChange(checked ? selections.filter((id) => id !== mod.id) : [...selections, mod.id])
            }
          }
          return (
            <label
              key={mod.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: C.r12,
                background: checked ? 'rgba(249,115,22,0.12)' : C.card2,
                border: `1px solid ${checked ? 'rgba(249,115,22,0.3)' : C.border}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type='button'
                  onClick={toggle}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: isSingle ? '50%' : C.r8,
                    border: `2px solid ${checked ? C.amber : C.w20}`,
                    background: checked ? C.amber : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  {checked && <Check size={12} color='#fff' strokeWidth={3} />}
                </button>
                <span style={{ color: C.w80, fontSize: 13 }}>{mod.name}</span>
              </div>
              {mod.priceAdjustment !== 0 && (
                <span style={{ color: C.amber, fontSize: 12, fontWeight: 600 }}>
                  {mod.priceAdjustment > 0 ? '+' : ''}
                  {formatPrice(mod.priceAdjustment)}
                </span>
              )}
              <input
                type={isSingle ? 'radio' : 'checkbox'}
                className='sr-only'
                checked={checked}
                onChange={toggle}
                readOnly
              />
            </label>
          )
        })}
      </div>
    </div>
  )
}

function QtyBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        background: disabled ? 'transparent' : C.card3,
        border: 'none',
        color: disabled ? C.w20 : C.white,
        fontSize: 20,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  )
}
