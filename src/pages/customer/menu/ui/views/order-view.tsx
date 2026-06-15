import { Check, Clock, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useOrderStatusSocket } from '#/shared/libs/hooks/use-order-status-socket'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import { C } from '../customer-theme'

export type CustomerOrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
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
]

const STATUS_ORDER: CustomerOrderStatus[] = ['placed', 'confirmed', 'preparing', 'ready', 'served']

const STATUS_HINT: Record<CustomerOrderStatus, string> = {
  placed: 'Waiting for confirmation…',
  confirmed: 'Confirmed! Sending to kitchen…',
  preparing: 'Our kitchen is working on it!',
  ready: 'Ready to be served!',
  served: 'Enjoy your meal!',
  cancelled: 'Your order was cancelled.',
}

interface OrderViewProps {
  order: OrderRecord
  sessionToken: string
  onBackToMenu: () => void
}

export function OrderView({ order, sessionToken, onBackToMenu }: Readonly<OrderViewProps>) {
  const currentStatus = useOrderStatusSocket(sessionToken, order.orderId)
  const [elapsed, setElapsed] = useState(Date.now() - order.placedAt)

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - order.placedAt), 1000)
    return () => clearInterval(id)
  }, [order.placedAt])

  const isCancelled = currentStatus === 'cancelled'
  const isServed = currentStatus === 'served'
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
          className={isServed ? '' : 'c-pulse'}
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: isServed ? C.greenBg : 'rgba(249,115,22,0.12)',
            margin: '0 auto 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
          }}
        >
          {isServed ? '🎉' : '⏳'}
        </div>
        <h1 style={{ color: C.white, fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>
          {isServed ? 'Enjoy your meal!' : 'Order in Progress'}
        </h1>
        <p style={{ color: C.w40, fontSize: 13, margin: 0 }}>
          #{order.orderId.slice(0, 8).toUpperCase()} · Table {order.tableNumber}
        </p>
      </div>

      {/* Status hint */}
      {!isServed && (
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
          <span style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>Total Paid</span>
          <span style={{ color: C.amber, fontSize: 16, fontWeight: 800 }}>
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      {/* Back to menu — only after served */}
      {isServed && (
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
