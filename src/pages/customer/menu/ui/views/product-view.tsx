import { Check, ChevronLeft, ChevronRight, Clock, Minus, Plus, X } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CartModifier } from '#/features/cart/model/cart.store'
import { m } from '#/paraglide/messages'
import type { CustomerModifierGroup, CustomerProduct } from '#/shared/api/customer/menu.types'
import { formatPrice, lineTotal, unitPrice } from '#/shared/libs/utils/pricing.utils'
import { C } from '../customer-theme'

/* ── Sheet drag tuning ─────────────────────────────────────────────────────── */

const SNAP_MS = 280
const SNAP_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
/** Fallback peek height (px) if the anchor element can't be measured. */
const PEEK_FALLBACK = 150
/** Extra breathing room below the peek anchor. */
const PEEK_PADDING = 10
/** px/ms — above this a flick decides the snap instead of distance. */
const FLICK_VELOCITY = 0.45
/** Fraction of travel needed to change state when dragging slowly. */
const COLLAPSE_RATIO = 0.28
const EXPAND_RATIO = 0.65
/** Resistance applied when dragging past either end stop. */
const RUBBER = 3

const EMPTY_SELECTION: string[] = []

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
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  /* ── Sheet drag refs (no state → no re-render while dragging) ── */
  const sheetRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLButtonElement>(null)
  const peekAnchorRef = useRef<HTMLDivElement>(null)

  const collapsedRef = useRef(false)

  const dragRef = useRef({
    active: false,
    fromHandle: false,
    moved: false,
    pointerId: -1,
    startY: 0,
    startOffset: 0,
    offset: 0,
    max: 0,
    lastY: 0,
    lastT: 0,
    velocity: 0,
    raf: 0,
    pending: 0,
  })

  const images = useMemo(
    () =>
      product.imageUrls?.length > 0
        ? product.imageUrls
        : product.imageUrl
          ? [product.imageUrl]
          : [],
    [product.imageUrls, product.imageUrl],
  )

  const displayedImg = images[activeIdx] ?? null

  const activeGroups = useMemo(
    () => product.modifierGroups.filter((g) => g.modifiers.some((mod) => mod.isActive)),
    [product.modifierGroups],
  )

  /* ── Modifier validation ────────────────────────────────────────────────── */

  const isValid = useMemo(() => {
    return activeGroups.every((group) => {
      const selections = groupSelections[group.id] ?? EMPTY_SELECTION

      if (group.isRequired && selections.length < group.minSelections) {
        return false
      }

      if (group.maxSelections != null && selections.length > group.maxSelections) {
        return false
      }

      return true
    })
  }, [activeGroups, groupSelections])

  /* ── Price calculation ────────────────────────────────────────────────────
   * Delegates to the shared pricing module (#/shared/libs/utils/pricing.utils) so the
   * fixed/adjustment modifier rule stays in one place, shared with the cart/payment/
   * order views instead of being reimplemented per screen.
   */

  const selectedModifiers = useMemo<CartModifier[]>(() => {
    return activeGroups.flatMap((group) =>
      (groupSelections[group.id] ?? EMPTY_SELECTION).flatMap((modifierId) => {
        const modifier = group.modifiers.find((item) => item.id === modifierId)

        if (!modifier) {
          return []
        }

        return [
          {
            groupId: group.id,
            modifierId: modifier.id,
            name: modifier.name,
            priceAdjustment: Number(modifier.priceAdjustment),
            priceType: modifier.priceType,
          },
        ]
      }),
    )
  }, [activeGroups, groupSelections])

  const unitPriceValue = useMemo(
    () => unitPrice(Number(product.price), selectedModifiers),
    [product.price, selectedModifiers],
  )

  const totalPrice = lineTotal({
    basePrice: Number(product.price),
    quantity: qty,
    selectedModifiers,
  })

  const handleGroupChange = useCallback((groupId: string, ids: string[]) => {
    setGroupSelections((prev) => ({
      ...prev,
      [groupId]: ids,
    }))
  }, [])

  /* ── Drag mechanics ─────────────────────────────────────────────────────── */

  /** Distance the sheet can travel before only the peek header is left. */
  const getMaxOffset = useCallback(() => {
    const sheet = sheetRef.current

    if (!sheet) {
      return 0
    }

    const sheetRect = sheet.getBoundingClientRect()
    const anchor = peekAnchorRef.current

    const peek = anchor
      ? anchor.getBoundingClientRect().bottom - sheetRect.top + PEEK_PADDING
      : PEEK_FALLBACK

    return Math.max(0, Math.round(sheetRect.height - peek))
  }, [])

  const paint = useCallback(() => {
    const d = dragRef.current

    d.raf = 0

    const sheet = sheetRef.current

    if (!sheet) {
      return
    }

    sheet.style.transform = `translate3d(0, ${d.pending}px, 0)`

    const scrim = scrimRef.current

    if (scrim && d.max > 0) {
      const progress = Math.min(1, Math.max(0, d.pending / d.max))

      scrim.style.opacity = String(1 - progress * 0.8)
    }
  }, [])

  const schedule = useCallback(
    (y: number) => {
      const d = dragRef.current

      d.pending = y

      if (d.raf === 0) {
        d.raf = requestAnimationFrame(paint)
      }
    },
    [paint],
  )

  const snapTo = useCallback(
    (toCollapsed: boolean, animate = true) => {
      const sheet = sheetRef.current

      if (!sheet) {
        return
      }

      const d = dragRef.current

      if (d.raf !== 0) {
        cancelAnimationFrame(d.raf)
        d.raf = 0
      }

      const max = getMaxOffset()
      const target = toCollapsed ? max : 0

      collapsedRef.current = toCollapsed && max > 0

      d.max = max
      d.offset = target
      d.pending = target

      sheet.style.transition = animate ? `transform ${SNAP_MS}ms ${SNAP_EASE}` : 'none'

      sheet.style.transform = `translate3d(0, ${target}px, 0)`

      sheet.dataset.collapsed = String(collapsedRef.current)

      const scrim = scrimRef.current

      if (scrim) {
        scrim.style.transition = animate ? `opacity ${SNAP_MS}ms ${SNAP_EASE}` : 'none'

        scrim.style.opacity = collapsedRef.current ? '0.2' : '1'
      }

      const body = bodyRef.current

      if (body) {
        body.style.overflowY = collapsedRef.current ? 'hidden' : 'auto'
      }

      handleRef.current?.setAttribute('aria-expanded', String(!collapsedRef.current))
    },
    [getMaxOffset],
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) {
        return
      }

      const sheet = sheetRef.current

      if (!sheet) {
        return
      }

      const d = dragRef.current

      d.active = true
      d.moved = false
      d.pointerId = e.pointerId
      d.fromHandle = handleRef.current?.contains(e.target as Node) ?? false
      d.max = getMaxOffset()
      d.startY = e.clientY
      d.startOffset = collapsedRef.current ? d.max : 0
      d.offset = d.startOffset
      d.lastY = e.clientY
      d.lastT = e.timeStamp
      d.velocity = 0

      sheet.style.transition = 'none'

      const scrim = scrimRef.current

      if (scrim) {
        scrim.style.transition = 'none'
      }

      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [getMaxOffset],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current

      if (!d.active || e.pointerId !== d.pointerId) {
        return
      }

      const dy = e.clientY - d.startY

      if (!d.moved && Math.abs(dy) > 3) {
        d.moved = true
      }

      const dt = e.timeStamp - d.lastT

      if (dt > 0) {
        d.velocity = (e.clientY - d.lastY) / dt
      }

      d.lastY = e.clientY
      d.lastT = e.timeStamp

      let next = d.startOffset + dy

      if (next < 0) {
        next /= RUBBER
      } else if (next > d.max) {
        next = d.max + (next - d.max) / RUBBER
      }

      d.offset = next

      schedule(next)
    },
    [schedule],
  )

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current

      if (!d.active || e.pointerId !== d.pointerId) {
        return
      }

      d.active = false

      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }

      if (!d.moved) {
        if (d.fromHandle || collapsedRef.current) {
          snapTo(!collapsedRef.current)
        } else {
          snapTo(collapsedRef.current)
        }

        return
      }

      const ratio = collapsedRef.current ? EXPAND_RATIO : COLLAPSE_RATIO

      const shouldCollapse =
        Math.abs(d.velocity) > FLICK_VELOCITY ? d.velocity > 0 : d.offset > d.max * ratio

      snapTo(shouldCollapse)
    },
    [snapTo],
  )

  const onPointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current

      if (!d.active || e.pointerId !== d.pointerId) {
        return
      }

      d.active = false

      snapTo(collapsedRef.current)
    },
    [snapTo],
  )

  // Keyboard toggle (click with detail === 0 comes from Enter/Space).
  const onHandleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (e.detail === 0) {
        snapTo(!collapsedRef.current)
      }
    },
    [snapTo],
  )

  const handleSwitchLightBox = () => {
    setLightboxOpen((prev) => !prev)
  }

  // Re-measure on viewport changes and drop any pending frame on unmount.
  useEffect(() => {
    function onResize() {
      snapTo(collapsedRef.current, false)
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)

      const d = dragRef.current

      if (d.raf !== 0) {
        cancelAnimationFrame(d.raf)
      }
    }
  }, [snapTo])

  const canAdd = isValid && product.isAvailable

  return (
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
        onClick={images.length > 1 ? handleSwitchLightBox : undefined}
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
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: C.surface,
            }}
          />
        )}

        <div
          ref={scrimRef}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 1,
            willChange: 'opacity',
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
      </div>

      {/* ── Bottom sheet wrapper ── */}
      <div
        ref={sheetRef}
        data-collapsed='false'
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
            willChange: 'transform',
            transform: 'translate3d(0, 0, 0)',
          }}
        >
          {/* ── Drag zone: handle + pinned header ── */}
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={onPointerCancel}
            style={{
              flexShrink: 0,
              touchAction: 'none',
              cursor: 'grab',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            {/* Grab handle */}
            <button
              ref={handleRef}
              type='button'
              aria-label='Resize details'
              aria-expanded='true'
              onClick={onHandleClick}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 0 4px',
                background: 'transparent',
                border: 'none',
                cursor: 'grab',
              }}
            >
              <span
                style={{
                  display: 'block',
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: C.hairline,
                  margin: '0 auto',
                }}
              />
            </button>

            {/* ── Pinned header ── */}
            <div style={{ padding: '8px 20px 14px' }}>
              {/* Meta row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                {product.prepTimeMinutes > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Clock size={13} color={C.faint} />

                    <span
                      style={{
                        color: C.faint,
                        fontSize: 12,
                      }}
                    >
                      {m.customer_prep_time_minutes({
                        minutes: product.prepTimeMinutes,
                      })}
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
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  {product.dietaryFlags.map((flag) => (
                    <span
                      key={flag}
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
                      {dietaryLabel(flag)}
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

              {/* Product base price */}
              <div
                ref={peekAnchorRef}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    color: C.accent,
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  {formatPrice(unitPriceValue)}
                </span>

                {product.compareAtPrice != null && product.compareAtPrice > product.price && (
                  <s
                    style={{
                      color: C.faint,
                      fontSize: 14,
                    }}
                  >
                    {formatPrice(product.compareAtPrice)}
                  </s>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p
                  style={{
                    color: C.dim,
                    fontSize: 13,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {product.description}
                </p>
              )}
            </div>
          </div>

          <div
            style={{
              height: 1,
              background: C.hairline,
              flexShrink: 0,
            }}
          />

          {/* ── Scrollable body ── */}
          <div
            ref={bodyRef}
            className='c-scrollbar-none'
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 20px',
            }}
          >
            {/* Thumbnail strip */}
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
                    aria-label={m.customer_view_image({
                      index: i + 1,
                    })}
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
                      alt={m.customer_thumbnail_index({
                        index: i + 1,
                      })}
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
            {activeGroups.map((group) => (
              <ModifierGroup
                key={group.id}
                group={group}
                selections={groupSelections[group.id] ?? EMPTY_SELECTION}
                onChange={handleGroupChange}
              />
            ))}

            {/* Allergens */}
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

                <p
                  style={{
                    color: '#fca5a5',
                    fontSize: 13,
                    margin: 0,
                  }}
                >
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
              <QtyBtn
                onClick={() => setQty((current) => Math.max(1, current - 1))}
                disabled={qty <= 1}
              >
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

              <QtyBtn onClick={() => setQty((current) => current + 1)}>
                <Plus size={14} />
              </QtyBtn>
            </div>

            {/* Add to order */}
            <button
              type='button'
              disabled={!canAdd}
              onClick={() => onAdd(qty, selectedModifiers, notes)}
              style={{
                flex: 1,
                padding: '0 16px',
                height: '40px',
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
        <ProductGalleryLightbox
          images={images}
          initialIdx={activeIdx}
          onClose={(finalIdx) => {
            setActiveIdx(finalIdx)
            setLightboxOpen(false)
          }}
        />
      )}
    </div>
  )
}

// ── GlassBtn ───────────────────────────────────────────────────────────────────

const GlassBtn = memo(function GlassBtn({
  onClick,
  label,
  children,
}: Readonly<{
  onClick: () => void
  label: string
  children: React.ReactNode
}>) {
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
})

// ── Qty button ─────────────────────────────────────────────────────────────────

function QtyBtn({
  onClick,
  disabled,
  children,
}: Readonly<{
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}>) {
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

const ModifierGroup = memo(function ModifierGroup({
  group,
  selections,
  onChange,
}: Readonly<{
  group: CustomerModifierGroup
  selections: string[]
  onChange: (groupId: string, ids: string[]) => void
}>) {
  const activeModifiers = useMemo(
    () => group.modifiers.filter((modifier) => modifier.isActive),
    [group.modifiers],
  )

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
      {/* Group header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            color: C.white,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {group.name}
        </span>

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
          <span
            style={{
              color: C.faint,
              fontSize: 10,
              marginLeft: 'auto',
            }}
          >
            {group.maxSelections == null
              ? m.customer_choose_min({
                  min: group.minSelections,
                })
              : m.customer_choose_range({
                  min: group.minSelections,
                  max: group.maxSelections,
                })}
          </span>
        )}
      </div>

      {/* Modifiers */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {activeModifiers.map((modifier) => {
          const checked = selections.includes(modifier.id)
          const isSingle = group.selectionType === 'SINGLE'

          function toggle() {
            if (isSingle) {
              onChange(group.id, checked ? [] : [modifier.id])

              return
            }

            const max = group.maxSelections

            if (!checked && max != null && selections.length >= max) {
              return
            }

            onChange(
              group.id,
              checked
                ? selections.filter((id) => id !== modifier.id)
                : [...selections, modifier.id],
            )
          }

          return (
            <label
              key={modifier.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '10px 12px',
                borderRadius: C.r12,
                background: checked ? 'rgba(255,106,61,0.1)' : 'transparent',
                border: `1px solid ${checked ? 'rgba(255,106,61,0.3)' : C.hairline}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  minWidth: 0,
                }}
              >
                <button
                  type='button'
                  aria-label={modifier.name}
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

                <span
                  style={{
                    color: C.w80,
                    fontSize: 13,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {modifier.name}
                </span>
              </div>

              {/* ── Modifier price ── */}
              {modifier.priceAdjustment !== 0 && (
                <span
                  style={{
                    color: checked ? C.accent : C.dim,
                    fontSize: 12,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {modifier.priceType === 'fixed'
                    ? formatPrice(modifier.priceAdjustment)
                    : `${modifier.priceAdjustment > 0 ? '+' : ''}${formatPrice(
                        modifier.priceAdjustment,
                      )}`}
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
})

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
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose(idx)
      }

      if (e.key === 'ArrowLeft') {
        setIdx((current) => Math.max(0, current - 1))
      }

      if (e.key === 'ArrowRight') {
        setIdx((current) => Math.min(images.length - 1, current + 1))
      }
    }

    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [idx, images.length, onClose])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current

    if (Math.abs(dx) <= 50) {
      return
    }

    if (dx < 0) {
      setIdx((current) => Math.min(images.length - 1, current + 1))
    } else {
      setIdx((current) => Math.max(0, current - 1))
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
        alt={m.customer_image_of_total({
          current: idx + 1,
          total: images.length,
        })}
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
          onClick={() => setIdx((current) => current - 1)}
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
          onClick={() => setIdx((current) => current + 1)}
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
              aria-label={m.customer_go_to_image({
                index: i + 1,
              })}
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
