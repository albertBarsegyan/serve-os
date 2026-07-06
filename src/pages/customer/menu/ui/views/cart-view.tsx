import { ChevronLeft, MapPin, Minus, Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import type { CartItem } from '#/features/cart/model/cart.store'
import { cartItemTotal, cartItemUnitPrice } from '#/features/cart/model/cart.store'
import { m } from '#/paraglide/messages'
import type { CustomerProduct } from '#/shared/api/customer/menu.types'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import { C } from '../customer-theme'

const GST_RATE = 0.05

interface CartViewProps {
  items: CartItem[]
  products: CustomerProduct[]
  tableName: string
  onBack: () => void
  onOrderNow: () => void
  onUpdateQty: (id: string, qty: number) => void
  onRemove: (id: string) => void
}

export function CartView({
  items,
  products,
  tableName,
  onBack,
  onOrderNow,
  onUpdateQty,
  onRemove,
}: Readonly<CartViewProps>) {
  const subtotal = useMemo(() => items.reduce((s, i) => s + cartItemTotal(i), 0), [items])
  const gst = subtotal * GST_RATE
  const grandTotal = subtotal + gst

  function getProductImage(productId: string): string | null {
    const p = products.find((pr) => pr.id === productId)
    return p?.imageUrls?.[0] ?? p?.imageUrl ?? null
  }

  return (
    <div className='c-page' style={{ background: C.bg, minHeight: '100dvh', paddingBottom: 100 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 16px',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <button
          type='button'
          onClick={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: C.card,
            border: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={20} color={C.w80} />
        </button>
        <h1 style={{ color: C.white, fontSize: 18, fontWeight: 700, margin: 0, flex: 1 }}>
          {m.customer_my_order()}
        </h1>
        <span style={{ color: C.w40, fontSize: 13 }}>
          {m.customer_item_count({ count: items.length })}
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Empty state */}
        {items.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 56 }}>🛒</span>
            <p style={{ color: C.w60, fontSize: 15, fontWeight: 600, margin: 0 }}>
              {m.customer_cart_empty()}
            </p>
            <p style={{ color: C.w40, fontSize: 13, margin: 0 }}>
              {m.customer_cart_empty_subtitle()}
            </p>
            <button
              type='button'
              onClick={onBack}
              style={{
                marginTop: 8,
                padding: '12px 28px',
                background: C.amberGrad,
                borderRadius: C.r12,
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {m.customer_browse_menu()}
            </button>
          </div>
        )}

        {/* Cart items */}
        {items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {items.map((item) => {
              const img = getProductImage(item.productId)
              return (
                <div
                  key={item.id}
                  style={{
                    background: C.card,
                    borderRadius: C.r16,
                    border: `1px solid ${C.border}`,
                    padding: 12,
                    display: 'flex',
                    gap: 12,
                  }}
                >
                  {/* Product image */}
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: C.r12,
                      background: C.card2,
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={item.productName}
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
                          fontSize: 28,
                        }}
                      >
                        🍽️
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <p
                        className='line-clamp-2'
                        style={{
                          color: C.white,
                          fontSize: 13,
                          fontWeight: 600,
                          margin: '0 0 3px',
                          lineHeight: 1.3,
                          flex: 1,
                          marginRight: 8,
                        }}
                      >
                        {item.productName}
                      </p>
                      <button
                        type='button'
                        onClick={() => onRemove(item.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 2,
                          flexShrink: 0,
                        }}
                      >
                        <Trash2 size={14} color={C.red} />
                      </button>
                    </div>
                    {item.selectedModifiers.length > 0 && (
                      <p
                        className='line-clamp-1'
                        style={{ color: C.w40, fontSize: 11, margin: '0 0 4px' }}
                      >
                        {item.selectedModifiers.map((m) => m.name).join(', ')}
                      </p>
                    )}
                    {item.notes && (
                      <p
                        className='line-clamp-1'
                        style={{
                          color: C.w40,
                          fontSize: 11,
                          fontStyle: 'italic',
                          margin: '0 0 8px',
                        }}
                      >
                        "{item.notes}"
                      </p>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      {/* Qty controls */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          background: C.card2,
                          borderRadius: C.r8,
                          padding: '3px',
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        <button
                          type='button'
                          onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            background: 'none',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Minus size={12} color={C.w60} />
                        </button>
                        <span
                          style={{
                            width: 20,
                            textAlign: 'center',
                            color: C.white,
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          type='button'
                          onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            background: 'none',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Plus size={12} color={C.w60} />
                        </button>
                      </div>
                      {/* Price */}
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: C.amber, fontSize: 14, fontWeight: 700, margin: 0 }}>
                          {formatPrice(cartItemTotal(item))}
                        </p>
                        <p style={{ color: C.w40, fontSize: 10, margin: 0 }}>
                          {formatPrice(cartItemUnitPrice(item))} {m.customer_each()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Table info */}
        {items.length > 0 && (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: C.r16,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: C.r12,
                background: 'rgba(249,115,22,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MapPin size={18} color={C.amber} />
            </div>
            <div>
              <p style={{ color: C.w40, fontSize: 11, margin: '0 0 2px', fontWeight: 500 }}>
                {m.customer_dinein_table_label()}
              </p>
              <p style={{ color: C.white, fontSize: 15, fontWeight: 700, margin: 0 }}>
                {tableName}
              </p>
            </div>
          </div>
        )}

        {/* Price breakdown */}
        {items.length > 0 && (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: C.r16,
              padding: '16px',
              marginBottom: 20,
            }}
          >
            <h3 style={{ color: C.white, fontSize: 14, fontWeight: 700, margin: '0 0 14px' }}>
              {m.customer_price_details()}
            </h3>
            <PriceRow label={m.customer_subtotal()} value={formatPrice(subtotal)} />
            <PriceRow
              label={m.customer_gst_percent({ percent: (GST_RATE * 100).toFixed(0) })}
              value={formatPrice(gst)}
              muted
            />
            <div
              style={{
                height: 1,
                background: C.border,
                margin: '12px 0',
              }}
            />
            <PriceRow label={m.customer_grand_total()} value={formatPrice(grandTotal)} bold />
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {items.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 16px 28px',
            background: C.card,
            borderTop: `1px solid ${C.border}`,
          }}
        >
          <button
            type='button'
            onClick={onOrderNow}
            style={{
              width: '100%',
              padding: '16px',
              background: C.amberGrad,
              borderRadius: C.r16,
              border: 'none',
              color: '#fff',
              fontWeight: 800,
              fontSize: 16,
              cursor: 'pointer',
              letterSpacing: '0.02em',
              boxShadow: C.shadowAmber,
            }}
          >
            {m.customer_order_now()} · {formatPrice(grandTotal)}
          </button>
        </div>
      )}
    </div>
  )
}

function PriceRow({
  label,
  value,
  muted,
  bold,
}: {
  label: string
  value: string
  muted?: boolean
  bold?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}
    >
      <span
        style={{
          color: muted ? C.w40 : bold ? C.white : C.w60,
          fontSize: bold ? 15 : 13,
          fontWeight: bold ? 700 : 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: bold ? C.amber : muted ? C.w40 : C.w80,
          fontSize: bold ? 16 : 13,
          fontWeight: bold ? 800 : 500,
        }}
      >
        {value}
      </span>
    </div>
  )
}
