import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Minus,
  Plus,
  Share2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CartModifier } from '#/features/cart/model/cart.store'
import { m } from '#/paraglide/messages'
import type { CustomerModifierGroup, CustomerProduct } from '#/shared/api/customer/menu.types'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import { C } from '../customer-theme'

function dietaryLabel(flag: string): string {
  switch (flag) {
    case 'vegan':
      return m.customer_dietary_vegan()
    case 'vegetarian':
      return m.customer_dietary_vegetarian()
    case 'gluten_free':
      return m.customer_dietary_gluten_free()
    case 'dairy_free':
      return m.customer_dietary_dairy_free()
    default:
      return flag
  }
}

interface ProductViewProps {
  product: CustomerProduct
  cartCount: number
  onBack: () => void
  onGoToCart: () => void
  onAdd: (qty: number, modifiers: CartModifier[], notes: string) => void
  onAddAndNext: (qty: number, modifiers: CartModifier[], notes: string) => void
}

export function ProductView({ product, onBack, onAdd }: Readonly<ProductViewProps>) {
  const [qty, setQty] = useState(1)
  const [groupSelections, setGroupSelections] = useState<Record<string, string[]>>({})
  const [notes, setNotes] = useState('')
  const [faved, setFaved] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const images =
    product.imageUrls?.length > 0 ? product.imageUrls : product.imageUrl ? [product.imageUrl] : []

  const displayedImg = images[activeIdx] ?? null
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

  function handleShare() {
    if (navigator.share) {
      void navigator.share({ title: product.name, text: product.description ?? product.name })
    }
  }

  function openLightbox() {
    setLightboxOpen(true)
  }

  function closeLightbox(finalIdx: number) {
    setActiveIdx(finalIdx)
    setLightboxOpen(false)
  }

  const canAdd = isValid && product.isAvailable

  return (
    /* Full-viewport overlay */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        overflow: 'hidden',
        fontFamily: C.fontBody,
      }}
    >
      {/* ── Background image + scrim ── */}
      <button
        type='button'
        aria-label={images.length > 1 ? m.customer_open_gallery() : undefined}
        onClick={images.length > 1 ? openLightbox : undefined}
        style={{
          position: 'absolute',
          inset: 0,
          cursor: images.length > 1 ? 'pointer' : 'default',
          padding: 0,
          border: 'none',
          background: 'transparent',
        }}
      >
        {displayedImg ? (
          <img
            src={displayedImg}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: C.surface }} />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.88) 100%)',
          }}
        />
      </button>

      {/* ── Top controls ── */}
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
          zIndex: 10,
        }}
      >
        <GlassBtn onClick={onBack} label={m.customer_back()}>
          <ChevronLeft size={22} color='#fff' />
        </GlassBtn>
        <div style={{ display: 'flex', gap: 8 }}>
          <GlassBtn onClick={handleShare} label={m.customer_share()}>
            <Share2 size={18} color='#fff' />
          </GlassBtn>
          <GlassBtn onClick={() => setFaved((f) => !f)} label={m.customer_favourite()}>
            <Heart size={18} color='#fff' fill={faved ? '#fff' : 'none'} />
          </GlassBtn>
        </div>
      </div>

      {/* ── Bottom sheet wrapper (centres on tablet) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <div
          className='c-sheet'
          style={{
            width: '100%',
            maxWidth: 720,
            maxHeight: '86dvh',
            borderRadius: '20px 20px 0 0',
            background: C.surface,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Drag handle */}
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: C.hairline,
              margin: '12px auto 0',
              flexShrink: 0,
            }}
          />

          {/* ── Pinned header ── */}
          <div style={{ padding: '12px 20px 14px', flexShrink: 0 }}>
            {/* Meta row: prep time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              {product.prepTimeMinutes > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} color={C.faint} />
                  <span style={{ color: C.faint, fontSize: 12 }}>
                    {m.customer_prep_time_minutes({ minutes: product.prepTimeMinutes })}
                  </span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: product.isAvailable ? C.green : C.red,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    color: product.isAvailable ? C.green : C.red,
                    fontWeight: 500,
                  }}
                >
                  {product.isAvailable ? m.customer_available() : m.customer_unavailable()}
                </span>
              </div>
            </div>

            {/* Dietary flags */}
            {product.dietaryFlags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {product.dietaryFlags.map((f) => (
                  <span
                    key={f}
                    style={{
                      padding: '3px 10px',
                      borderRadius: C.rFull,
                      background: C.greenBg,
                      color: C.green,
                      fontSize: 11,
                      fontWeight: 600,
                      border: '1px solid rgba(34,197,94,0.2)',
                    }}
                  >
                    {dietaryLabel(f)}
                  </span>
                ))}
              </div>
            )}

            {/* Product name */}
            <h1
              style={{
                fontFamily: C.fontDisplay,
                fontSize: 26,
                fontWeight: 400,
                color: C.white,
                margin: '0 0 6px',
                lineHeight: 1.2,
              }}
            >
              {product.name}
            </h1>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ color: C.accent, fontSize: 20, fontWeight: 700 }}>
                {formatPrice(unitPrice)}
              </span>
              {product.compareAtPrice != null && product.compareAtPrice > product.price && (
                <s style={{ color: C.faint, fontSize: 14 }}>
                  {formatPrice(product.compareAtPrice)}
                </s>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p style={{ color: C.dim, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                {product.description}
              </p>
            )}
          </div>

          <div style={{ height: 1, background: C.hairline, flexShrink: 0 }} />

          {/* ── Scrollable body ── */}
          <div
            className='c-scrollbar-none'
            style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}
          >
            {/* Thumbnail strip — only when 2+ images */}
            {images.length > 1 && (
              <div
                className='c-scrollbar-none'
                style={{
                  display: 'flex',
                  gap: 8,
                  overflowX: 'auto',
                  marginBottom: 16,
                  paddingBottom: 2,
                }}
              >
                {images.map((imgUrl, i) => (
                  <button
                    key={imgUrl + String(i)}
                    type='button'
                    aria-label={m.customer_view_image({ index: i + 1 })}
                    onClick={() => setActiveIdx(i)}
                    style={{
                      flexShrink: 0,
                      width: 64,
                      height: 64,
                      borderRadius: 10,
                      overflow: 'hidden',
                      border:
                        i === activeIdx
                          ? '2px solid rgba(255,255,255,0.9)'
                          : '2px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'border-color 0.15s ease',
                      background: 'transparent',
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={m.customer_thumbnail_index({ index: i + 1 })}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* TODO: Size / variant selector — requires product_variants field from API */}

            {/* Modifier groups */}
            {activeGroups.map((g) => (
              <ModifierGroup
                key={g.id}
                group={g}
                selections={groupSelections[g.id] ?? []}
                onChange={(ids) => setGroupSelections((prev) => ({ ...prev, [g.id]: ids }))}
              />
            ))}

            {/* Allergens callout */}
            {product.allergens.length > 0 && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: C.r12,
                  padding: '12px 14px',
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    color: '#fca5a5',
                    fontSize: 11,
                    fontWeight: 700,
                    margin: '0 0 4px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {m.customer_allergens()}
                </p>
                <p style={{ color: '#fca5a5', fontSize: 13, margin: 0 }}>
                  {product.allergens.join(', ')}
                </p>
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom: 16 }}>
              <label
                htmlFor='product-notes'
                style={{
                  display: 'block',
                  color: C.dim,
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                {m.customer_notes_label()}
              </label>
              <textarea
                id='product-notes'
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={m.customer_notes_placeholder()}
                style={{
                  width: '100%',
                  background: C.surface2,
                  border: `1px solid ${C.hairline}`,
                  borderRadius: C.r12,
                  padding: '10px 12px',
                  color: C.white,
                  fontSize: 13,
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* ── Pinned action bar ── */}
          <div
            style={{
              flexShrink: 0,
              padding: '12px 20px 32px',
              borderTop: `1px solid ${C.hairline}`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: C.surface,
            }}
          >
            {/* Qty stepper */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: C.surface2,
                borderRadius: C.r12,
                border: `1px solid ${C.hairline}`,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <QtyBtn onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>
                <Minus size={14} />
              </QtyBtn>
              <span
                style={{
                  width: 36,
                  textAlign: 'center',
                  color: C.white,
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {qty}
              </span>
              <QtyBtn onClick={() => setQty((q) => q + 1)}>
                <Plus size={14} />
              </QtyBtn>
            </div>

            {/* Add to order */}
            <button
              type='button'
              disabled={!canAdd}
              onClick={() => onAdd(qty, buildModifiers(), notes)}
              style={{
                flex: 1,
                padding: '14px 16px',
                borderRadius: C.r16,
                border: 'none',
                background: canAdd ? C.accent : C.surface2,
                color: canAdd ? '#fff' : C.faint,
                fontWeight: 700,
                fontSize: 15,
                cursor: canAdd ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: canAdd ? C.shadowAmber : 'none',
                transition: 'all 0.18s ease',
              }}
            >
              <span>{m.customer_add_to_order()}</span>
              <span>{formatPrice(totalPrice)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Fullscreen lightbox ── */}
      {lightboxOpen && (
        <ProductGalleryLightbox images={images} initialIdx={activeIdx} onClose={closeLightbox} />
      )}
    </div>
  )
}

// ── GlassBtn ───────────────────────────────────────────────────────────────────

function GlassBtn({
  onClick,
  label,
  children,
}: Readonly<{ onClick: () => void; label: string; children: React.ReactNode }>) {
  return (
    <button
      type='button'
      aria-label={label}
      onClick={onClick}
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

// ── Qty button ─────────────────────────────────────────────────────────────────

function QtyBtn({
  onClick,
  disabled,
  children,
}: Readonly<{ onClick: () => void; disabled?: boolean; children: React.ReactNode }>) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 38,
        height: 38,
        background: 'transparent',
        border: 'none',
        color: disabled ? C.faint : C.white,
        fontSize: 18,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}

// ── Modifier Group ─────────────────────────────────────────────────────────────

function ModifierGroup({
  group,
  selections,
  onChange,
}: Readonly<{
  group: CustomerModifierGroup
  selections: string[]
  onChange: (ids: string[]) => void
}>) {
  const activeModifiers = group.modifiers.filter((m) => m.isActive)
  return (
    <div
      style={{
        border: `1px solid ${C.hairline}`,
        borderRadius: C.r12,
        padding: '12px 14px',
        marginBottom: 14,
        background: C.surface2,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>{group.name}</span>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: C.rFull,
            background: group.isRequired ? 'rgba(239,68,68,0.12)' : C.surface2,
            color: group.isRequired ? '#FCA5A5' : C.faint,
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          {group.isRequired ? m.customer_required() : m.customer_optional()}
        </span>
        {group.minSelections > 0 && (
          <span style={{ color: C.faint, fontSize: 10, marginLeft: 'auto' }}>
            {group.maxSelections == null
              ? m.customer_choose_min({ min: group.minSelections })
              : m.customer_choose_range({ min: group.minSelections, max: group.maxSelections })}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {activeModifiers.map((mod) => {
          const checked = selections.includes(mod.id)
          const isSingle = group.selectionType === 'SINGLE'
          function toggle() {
            if (isSingle) {
              onChange(checked ? [] : [mod.id])
            } else {
              const max = group.maxSelections
              if (!checked && max != null && selections.length >= max) return
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
                background: checked ? 'rgba(255,106,61,0.1)' : 'transparent',
                border: `1px solid ${checked ? 'rgba(255,106,61,0.3)' : C.hairline}`,
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
                    border: `2px solid ${checked ? C.accent : C.faint}`,
                    background: checked ? C.accent : 'transparent',
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
                <span style={{ color: C.accent, fontSize: 12, fontWeight: 600 }}>
                  {mod.priceAdjustment > 0 ? '+' : ''}
                  {formatPrice(mod.priceAdjustment)}
                </span>
              )}
              <input
                type={isSingle ? 'radio' : 'checkbox'}
                className='sr-only'
                checked={checked}
                onChange={toggle}
              />
            </label>
          )
        })}
      </div>
    </div>
  )
}

// ── ProductGalleryLightbox ─────────────────────────────────────────────────────

function ProductGalleryLightbox({
  images,
  initialIdx,
  onClose,
}: Readonly<{
  images: string[]
  initialIdx: number
  onClose: (finalIdx: number) => void
}>) {
  const [idx, setIdx] = useState(initialIdx)
  const touchStartX = useRef(0)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose(idx)
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(images.length - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [idx, images.length, onClose])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) {
      if (dx < 0) setIdx((i) => Math.min(images.length - 1, i + 1))
      else setIdx((i) => Math.max(0, i - 1))
    }
  }

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label={m.customer_image_gallery()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.96)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close */}
      <button
        type='button'
        aria-label={m.customer_close_gallery()}
        onClick={() => onClose(idx)}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
        }}
      >
        <X size={20} color='#fff' />
      </button>

      {/* Main image */}
      <img
        src={images[idx]}
        alt={m.customer_image_of_total({ current: idx + 1, total: images.length })}
        style={{
          maxWidth: '100%',
          maxHeight: 'calc(100dvh - 120px)',
          objectFit: 'contain',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          display: 'block',
        }}
        draggable={false}
      />

      {/* Previous */}
      {idx > 0 && (
        <button
          type='button'
          aria-label={m.customer_previous_image()}
          onClick={() => setIdx((i) => i - 1)}
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={22} color='#fff' />
        </button>
      )}

      {/* Next */}
      {idx < images.length - 1 && (
        <button
          type='button'
          aria-label={m.customer_next_image()}
          onClick={() => setIdx((i) => i + 1)}
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronRight size={22} color='#fff' />
        </button>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {images.map((_, i) => (
            <button
              key={String(i)}
              type='button'
              aria-label={m.customer_go_to_image({ index: i + 1 })}
              onClick={() => setIdx(i)}
              style={{
                width: i === idx ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: i === idx ? '#fff' : 'rgba(255,255,255,0.35)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* Backdrop tap to close */}
      <button
        type='button'
        aria-label={m.customer_close_gallery()}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
        onClick={() => onClose(idx)}
      />
    </div>
  )
}
