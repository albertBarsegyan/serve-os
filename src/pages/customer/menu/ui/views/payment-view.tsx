import { useMutation } from '@tanstack/react-query'
import { Banknote, Check, ChevronLeft, CreditCard, Smartphone } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CartItem } from '#/features/cart/model/cart.store'
import { cartItemTotal } from '#/features/cart/model/cart.store'
import type { CustomerPaymentMethod } from '#/features/platform/api/platform.types'
import { createCustomerOrder, createCustomerPayment } from '#/shared/api/customer/customer-api'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import { C } from '../customer-theme'

const GST_RATE = 0.05

type ApiPaymentMethod = 'CASH' | 'POS' | 'ONLINE'

interface PaymentMethodConfig {
  method: ApiPaymentMethod
  label: string
  sublabel: string
  icon: React.ReactNode
  iconBg: string
}

const PAYMENT_METHOD_CONFIGS: Record<ApiPaymentMethod, PaymentMethodConfig> = {
  CASH: {
    method: 'CASH',
    label: 'Cash',
    sublabel: 'Pay at the table',
    icon: <Banknote size={18} color={C.green} />,
    iconBg: C.greenBg,
  },
  POS: {
    method: 'POS',
    label: 'Card (POS)',
    sublabel: 'Swipe or tap at counter',
    icon: <CreditCard size={18} color='#6366F1' />,
    iconBg: 'rgba(99,102,241,0.15)',
  },
  ONLINE: {
    method: 'ONLINE',
    label: 'Online Payment',
    sublabel: 'UPI, GPay, PhonePe & more',
    icon: <Smartphone size={18} color='#F97316' />,
    iconBg: 'rgba(249,115,22,0.12)',
  },
}

interface PaymentViewProps {
  items: CartItem[]
  tableName: string
  sessionToken: string
  paymentMethods: CustomerPaymentMethod[]
  onBack: () => void
  onSuccess: (orderId: string, total: number) => void
}

export function PaymentView({
  items,
  tableName,
  sessionToken,
  paymentMethods,
  onBack,
  onSuccess,
}: Readonly<PaymentViewProps>) {
  const activeMethods = useMemo<ApiPaymentMethod[]>(() => {
    const active = paymentMethods
      .filter((m) => m.isActive)
      .map((m) => m.method)
      .filter((m): m is ApiPaymentMethod => m in PAYMENT_METHOD_CONFIGS)
    return active.length > 0 ? active : (['CASH', 'POS', 'ONLINE'] as ApiPaymentMethod[])
  }, [paymentMethods])

  const [selected, setSelected] = useState<ApiPaymentMethod>(() => activeMethods[0] ?? 'CASH')

  const subtotal = useMemo(() => items.reduce((s, i) => s + cartItemTotal(i), 0), [items])
  const gst = subtotal * GST_RATE
  const grandTotal = subtotal + gst

  const placeOrder = useMutation({
    mutationFn: async () => {
      const order = await createCustomerOrder(
        sessionToken,
        items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes || undefined,
          selectedModifiers: item.selectedModifiers.map((m) => ({
            modifierId: m.modifierId,
            name: m.name,
            priceAdjustment: Number(m.priceAdjustment),
          })),
        })),
      )
      await createCustomerPayment(order.id, selected, grandTotal)
      return order
    },
    onSuccess: (order) => {
      onSuccess(order.id, grandTotal)
    },
  })

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
          background: C.card,
        }}
      >
        <button
          type='button'
          onClick={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: C.card2,
            border: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={20} color={C.w80} />
        </button>
        <h1 style={{ color: C.white, fontSize: 18, fontWeight: 700, margin: 0 }}>
          Payment Options
        </h1>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Order summary mini card */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: C.r16,
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <span style={{ color: C.w60, fontSize: 12, fontWeight: 600 }}>
              ORDER SUMMARY · {tableName}
            </span>
            <span style={{ color: C.w40, fontSize: 12 }}>
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
          </div>
          {items.slice(0, 3).map((item) => (
            <div
              key={item.id}
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}
            >
              <span
                className='line-clamp-1'
                style={{ color: C.w60, fontSize: 12, flex: 1, marginRight: 8 }}
              >
                {item.quantity}× {item.productName}
              </span>
              <span style={{ color: C.w60, fontSize: 12, flexShrink: 0 }}>
                {formatPrice(cartItemTotal(item))}
              </span>
            </div>
          ))}
          {items.length > 3 && (
            <p style={{ color: C.w40, fontSize: 11, margin: '2px 0 0' }}>
              +{items.length - 3} more items
            </p>
          )}
          <div style={{ height: 1, background: C.border, margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40 }}>
                <span style={{ color: C.w40, fontSize: 12 }}>Subtotal</span>
                <span style={{ color: C.w60, fontSize: 12 }}>{formatPrice(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40 }}>
                <span style={{ color: C.w40, fontSize: 12 }}>GST (5%)</span>
                <span style={{ color: C.w60, fontSize: 12 }}>{formatPrice(gst)}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: C.w40, fontSize: 10, margin: '0 0 2px', fontWeight: 600 }}>
                TOTAL
              </p>
              <span style={{ color: C.amber, fontSize: 18, fontWeight: 800 }}>
                {formatPrice(grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment methods */}
        <PaymentSection title='Choose Payment Method'>
          {activeMethods.map((method) => {
            const config = PAYMENT_METHOD_CONFIGS[method]
            return (
              <PaymentRow
                key={method}
                icon={config.icon}
                label={config.label}
                sublabel={config.sublabel}
                selected={selected === method}
                onSelect={() => setSelected(method)}
                iconBg={config.iconBg}
              />
            )
          })}
        </PaymentSection>

        {/* Error */}
        {placeOrder.isError && (
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: C.r12,
              padding: '12px 14px',
              color: '#FCA5A5',
              fontSize: 13,
            }}
          >
            Something went wrong. Please try again.
          </div>
        )}
      </div>

      {/* Sticky proceed button */}
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
          onClick={() => placeOrder.mutate()}
          disabled={placeOrder.isPending}
          style={{
            width: '100%',
            padding: '16px',
            background: placeOrder.isPending ? C.card2 : C.amberGrad,
            borderRadius: C.r16,
            border: 'none',
            color: placeOrder.isPending ? C.w40 : '#fff',
            fontWeight: 800,
            fontSize: 16,
            cursor: placeOrder.isPending ? 'not-allowed' : 'pointer',
            letterSpacing: '0.02em',
            boxShadow: placeOrder.isPending ? 'none' : C.shadowAmber,
          }}
        >
          {placeOrder.isPending ? 'Placing Order…' : `PROCEED TO PAY · ${formatPrice(grandTotal)}`}
        </button>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PaymentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: C.r16,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '12px 16px 8px' }}>
        <span style={{ color: C.w40, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
          {title.toUpperCase()}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  )
}

function PaymentRow({
  icon,
  label,
  sublabel,
  selected,
  onSelect,
  iconBg,
}: {
  icon: React.ReactNode
  label: string
  sublabel: string
  selected: boolean
  onSelect: () => void
  iconBg?: string
}) {
  return (
    <button
      type='button'
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: selected ? 'rgba(249,115,22,0.06)' : 'transparent',
        border: 'none',
        borderTop: `1px solid ${C.border}`,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'background 0.15s ease',
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: C.r12,
          background: iconBg ?? 'rgba(249,115,22,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: C.white, fontSize: 13, fontWeight: 600, margin: '0 0 1px' }}>{label}</p>
        <p style={{ color: C.w40, fontSize: 11, margin: 0 }}>{sublabel}</p>
      </div>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: `2px solid ${selected ? C.amber : C.w20}`,
          background: selected ? C.amber : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.15s ease',
        }}
      >
        {selected && <Check size={11} color='#fff' strokeWidth={3} />}
      </div>
    </button>
  )
}
