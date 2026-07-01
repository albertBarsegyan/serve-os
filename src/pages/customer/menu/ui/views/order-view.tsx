import { Check, Clock, MapPin } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useOrderNotifications } from '#/features/notification'
import { cancelCustomerOrder } from '#/shared/api/customer/customer-api'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import { CLIENT_EVENTS } from '#/shared/realtime/events'
import { getSocket } from '#/shared/realtime/socket'
import { C } from '../customer-theme'

export type CustomerOrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'payment'
  | 'paid'
  | 'cancelled'

export interface OrderRecord {
  orderId: string
  items: Array<{ name: string; qty: number; price: number }>
  total: number
  tableNumber: string
  placedAt: number
  paymentMethod: string
}

const STEPS: Array<{ status: CustomerOrderStatus; label: string; icon: string }> = [
  { status: 'placed', label: 'Order Placed', icon: '📋' },
  { status: 'confirmed', label: 'Confirmed', icon: '✅' },
  { status: 'preparing', label: 'Being Prepared', icon: '👨‍🍳' },
  { status: 'ready', label: 'Ready to Serve', icon: '🍽️' },
  { status: 'served', label: 'Served', icon: '🎉' },
  { status: 'payment', label: 'Payment', icon: '💳' },
  { status: 'paid', label: 'All Done', icon: '✨' },
]

const STATUS_ORDER: CustomerOrderStatus[] = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'served',
  'payment',
  'paid',
]

const STATUS_HINT: Record<CustomerOrderStatus, string> = {
  placed: 'Waiting for confirmation…',
  confirmed: 'Confirmed! Sending to kitchen…',
  preparing: 'Our kitchen is working on it!',
  ready: 'Ready to be served!',
  served: 'Enjoy your meal! Payment will follow shortly.',
  payment: 'Payment is being processed…',
  paid: 'Payment confirmed. Thank you!',
  cancelled: 'Your order was cancelled.',
}

interface OrderViewProps {
  order: OrderRecord
  sessionToken: string
  onBackToMenu: () => void
}

export function OrderView({ order, sessionToken, onBackToMenu }: Readonly<OrderViewProps>) {
  const [currentStatus, setCurrentStatus] = useState<CustomerOrderStatus>('placed')
  const [isCancelling, setIsCancelling] = useState(false)
  const callWaiterCooldownRef = useRef(false)

  useOrderNotifications({
    room: 'session',
    id: sessionToken,
    handlers: {
      'order:confirmed': (p) => {
        if (p.orderId === order.orderId) setCurrentStatus('confirmed')
      },
      'order:preparing': (p) => {
        if (p.orderId === order.orderId) setCurrentStatus('preparing')
      },
      'order:ready': (p) => {
        if (p.orderId === order.orderId) setCurrentStatus('ready')
      },
      'order:served': (p) => {
        if (p.orderId === order.orderId) setCurrentStatus('served')
      },
      'order:payment-open': (p) => {
        if (p.orderId === order.orderId) setCurrentStatus('payment')
      },
      'order:paid': (p) => {
        if (p.orderId === order.orderId) setCurrentStatus('paid')
      },
      'order:cancelled': (p) => {
        if (p.orderId === order.orderId) setCurrentStatus('cancelled')
      },
    },
  })

  const [elapsed, setElapsed] = useState(Date.now() - order.placedAt)
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - order.placedAt), 1000)
    return () => clearInterval(id)
  }, [order.placedAt])

  async function handleCancel() {
    setIsCancelling(true)
    try {
      await cancelCustomerOrder(order.orderId, sessionToken)
      setCurrentStatus('cancelled')
    } catch {
      toast.error('Could not cancel the order. Please ask a waiter for help.')
    } finally {
      setIsCancelling(false)
    }
  }

  function handleCallWaiter() {
    if (callWaiterCooldownRef.current) {
      toast.info('Waiter already notified — give them a moment!', { position: 'top-center' })
      return
    }
    callWaiterCooldownRef.current = true
    setTimeout(() => {
      callWaiterCooldownRef.current = false
    }, 5000)

    getSocket().emit(CLIENT_EVENTS.CALL_WAITER, { sessionToken })
    toast.success('Waiter has been called!', { position: 'top-center' })
  }

  const isCancelled = currentStatus === 'cancelled'
  const isServed = currentStatus === 'served'
  const isPayment = currentStatus === 'payment'
  const isPaid = currentStatus === 'paid'
  const currentIdx = STATUS_ORDER.indexOf(currentStatus)

  const elapsedMin = Math.floor(elapsed / 60000)
  const elapsedSec = Math.floor((elapsed % 60000) / 1000)
  const elapsedLabel = elapsedMin > 0 ? `${elapsedMin}m ${elapsedSec}s` : `${elapsedSec}s`

  if (isCancelled) {
    return (
      <div
        className='c-page'
        style={{
          background: C.bg,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 20px',
          textAlign: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            margin: '0 auto',
          }}
        >
          ❌
        </div>
        <h1 style={{ color: C.white, fontSize: 20, fontWeight: 800, margin: 0 }}>
          Order Cancelled
        </h1>
        <p style={{ color: C.w40, fontSize: 13, margin: 0 }}>
          #{order.orderId.slice(0, 8).toUpperCase()} · Table {order.tableNumber}
        </p>
        <button
          type='button'
          onClick={onBackToMenu}
          style={{
            marginTop: 8,
            width: '100%',
            maxWidth: 320,
            padding: '16px',
            background: C.amberGrad,
            borderRadius: C.r16,
            border: 'none',
            color: '#fff',
            fontWeight: 800,
            fontSize: 16,
            cursor: 'pointer',
            boxShadow: C.shadowAmber,
          }}
        >
          Back to Menu
        </button>
      </div>
    )
  }

  return (
    <div className='c-page' style={{ background: C.bg, minHeight: '100dvh', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 0', textAlign: 'center' }}>
        <div
          className={isPaid || isServed ? '' : 'c-pulse'}
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: isPaid
              ? C.greenBg
              : isServed
                ? 'rgba(34,197,94,0.12)'
                : isPayment
                  ? 'rgba(99,102,241,0.12)'
                  : 'rgba(249,115,22,0.12)',
            margin: '0 auto 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
          }}
        >
          {isPaid ? '✨' : isServed ? '🎉' : isPayment ? '💳' : '⏳'}
        </div>
        <h1 style={{ color: C.white, fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>
          {isPaid ? 'All done! Thank you!' : isServed ? 'Enjoy your meal!' : 'Order in Progress'}
        </h1>
        <p style={{ color: C.w40, fontSize: 13, margin: 0 }}>
          #{order.orderId.slice(0, 8).toUpperCase()} · Table {order.tableNumber}
        </p>
      </div>

      {/* Status hint */}
      {!isPaid && (
        <div
          style={{
            margin: '20px 16px 0',
            background: 'rgba(249,115,22,0.08)',
            border: '1px solid rgba(249,115,22,0.22)',
            borderRadius: C.r16,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Clock size={20} color={C.amber} />
          <div>
            <p style={{ color: C.amber, fontSize: 13, fontWeight: 700, margin: '0 0 1px' }}>
              {STATUS_HINT[currentStatus]}
            </p>
            <p style={{ color: C.w40, fontSize: 11, margin: 0 }}>Waiting {elapsedLabel}</p>
          </div>
        </div>
      )}

      {/* Progress stepper */}
      <div style={{ padding: '24px 20px 0' }}>
        {STEPS.map((step, i) => {
          const done = i < currentIdx
          const active = i === currentIdx
          const pending = i > currentIdx

          const circleStyle: React.CSSProperties = {
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: done ? C.green : active ? C.amberGrad : C.card,
            border: `2px solid ${done ? C.green : active ? C.amber : C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            zIndex: 1,
            transition: 'all 0.4s ease',
          }

          return (
            <div
              key={step.status}
              style={{ display: 'flex', gap: 16, minHeight: i < STEPS.length - 1 ? 72 : 'auto' }}
            >
              {/* Connector column */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 40,
                  flexShrink: 0,
                }}
              >
                <div className={active ? 'c-pulse' : undefined} style={circleStyle}>
                  {done ? (
                    <Check size={18} color='#fff' strokeWidth={3} />
                  ) : (
                    <span style={{ fontSize: 18, opacity: pending ? 0.3 : 1 }}>{step.icon}</span>
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      marginTop: 4,
                      background: done ? C.green : C.border,
                      borderRadius: 1,
                      transition: 'background 0.5s ease',
                    }}
                  />
                )}
              </div>

              {/* Label column */}
              <div style={{ paddingTop: 8, flex: 1 }}>
                <p
                  style={{
                    color: done ? C.green : active ? C.white : C.w30,
                    fontSize: 14,
                    fontWeight: active || done ? 700 : 500,
                    margin: '0 0 3px',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {step.label}
                </p>
                {active && (
                  <p style={{ color: C.amber, fontSize: 11, fontWeight: 600, margin: 0 }}>
                    In progress…
                  </p>
                )}
                {done && <p style={{ color: C.w40, fontSize: 11, margin: 0 }}>Completed</p>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Order details card */}
      <div
        style={{
          margin: '24px 16px 0',
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: C.r16,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <MapPin size={14} color={C.amber} />
          <span style={{ color: C.w60, fontSize: 12, fontWeight: 600 }}>
            Table {order.tableNumber} · {order.paymentMethod}
          </span>
        </div>
        <h3 style={{ color: C.white, fontSize: 14, fontWeight: 700, margin: '0 0 10px' }}>
          Order Details
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {order.items.map((item) => (
            <div
              key={`${item.name}-${item.qty}`}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span
                className='line-clamp-1'
                style={{ color: C.w60, fontSize: 12, flex: 1, marginRight: 8 }}
              >
                {item.qty}× {item.name}
              </span>
              <span style={{ color: C.w60, fontSize: 12, flexShrink: 0 }}>
                {formatPrice(item.price)}
              </span>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: C.border, margin: '12px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>Total</span>
          <span style={{ color: C.amber, fontSize: 16, fontWeight: 800 }}>
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          type='button'
          onClick={handleCallWaiter}
          style={{
            width: '100%',
            padding: '14px',
            background: 'rgba(249,115,22,0.10)',
            border: `1px solid ${C.amber}`,
            borderRadius: C.r16,
            color: C.amber,
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          🙋 Call Waiter
        </button>

        {currentStatus === 'placed' && (
          <button
            type='button'
            onClick={() => void handleCancel()}
            disabled={isCancelling}
            style={{
              width: '100%',
              padding: '14px',
              background: 'transparent',
              border: `1px solid ${C.red}`,
              borderRadius: C.r16,
              color: C.red,
              fontWeight: 700,
              fontSize: 15,
              cursor: isCancelling ? 'not-allowed' : 'pointer',
              opacity: isCancelling ? 0.6 : 1,
            }}
          >
            {isCancelling ? 'Cancelling…' : '✕ Cancel Order'}
          </button>
        )}
      </div>

      {/* Back to menu — only after payment is confirmed */}
      {isPaid && (
        <div style={{ padding: '20px 16px 0' }}>
          <button
            type='button'
            onClick={onBackToMenu}
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
              boxShadow: C.shadowAmber,
            }}
          >
            Back to Menu
          </button>
        </div>
      )}
    </div>
  )
}
