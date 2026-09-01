import { Check, Clock, MapPin } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useOrderNotifications } from '#/features/notification'
import { useTipOrderForm } from '#/features/order/tip-order/model/use-tip-order-form'
import { m } from '#/paraglide/messages'
import { cancelCustomerOrder } from '#/shared/api/customer/customer-api'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import { CLIENT_EVENTS, type OrderStatusChangedPayload } from '#/shared/realtime/events'
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
  | 'payment_failed'
  | 'refunded'

/** Terminal statuses that short-circuit the stepper and render their own screen. */
const TERMINAL_STATUSES = new Set<CustomerOrderStatus>(['cancelled', 'payment_failed', 'refunded'])

/**
 * The resync payload's customerStatus collapses DELIVERED and CLOSED into a single
 * 'served' value (that's all the backend's shared CustomerOrderStatus type has room for),
 * which would otherwise regress a reloading customer from 'payment' or 'paid' back to
 * 'served'. Refine using the raw order status + paymentStatus, which the resync payload
 * carries precisely for this purpose.
 */
export function resolveResyncStatus(p: OrderStatusChangedPayload): CustomerOrderStatus | null {
  const mapped = p.customerStatus as CustomerOrderStatus
  if (mapped === 'served') {
    if (p.status === 'CLOSED' || p.paymentStatus === 'PAID') return 'paid'
    if (p.paymentStatus === 'PENDING' || p.paymentStatus === 'PARTIALLY_PAID') return 'payment'
    return 'served'
  }
  if (TERMINAL_STATUSES.has(mapped) || STATUS_ORDER.includes(mapped)) return mapped
  return null
}

/**
 * Whether a resync/reconnect payload should be allowed to patch the stored tip.
 *
 * The backend always reports a real number for tipAmount (0 by default), and a resync
 * fires on every socket connect — including the very first one, right after mount, before
 * the guest has touched anything. Patching unconditionally there would turn tipAmount from
 * undefined ("never asked") into 0 ("explicit no-tip") and hide the picker before it's ever
 * seen. Only reconcile when either a real tip already exists upstream (incoming.tipAmount >
 * 0, e.g. added from another device) or one is already recorded locally (currentTipAmount
 * !== undefined, keeping it in sync going forward) — and only from a payload no older than
 * what's already applied, so a stale resync can't regress a newer tip.
 */
export function shouldReconcileTip(
  currentTipAmount: number | undefined,
  currentTipUpdatedAt: string | undefined,
  incoming: { tipAmount: number; updatedAt: string },
): boolean {
  const hasSomethingToReconcile = incoming.tipAmount > 0 || currentTipAmount !== undefined
  const isFresh = !currentTipUpdatedAt || incoming.updatedAt > currentTipUpdatedAt
  return hasSomethingToReconcile && isFresh
}

export interface OrderRecord {
  orderId: string
  items: Array<{ name: string; qty: number; price: number }>
  total: number
  tableNumber: string
  placedAt: number
  paymentMethod: string
  /** Undefined = never asked yet; 0 = an explicit "no tip" was submitted. */
  tipAmount?: number
  /** Order.updatedAt as of the last applied tipAmount — guards a reconcile payload
   * that's older than what's already showing from applying out of order. */
  tipUpdatedAt?: string
}

// NOTE: built by functions (not module-level constants) so labels/hints re-evaluate
// against the current locale on every render instead of being baked in at first import.
function getSteps(): Array<{ status: CustomerOrderStatus; label: string; icon: string }> {
  return [
    { status: 'placed', label: m.customer_step_order_placed(), icon: '📋' },
    { status: 'confirmed', label: m.customer_step_confirmed(), icon: '✅' },
    { status: 'preparing', label: m.customer_step_preparing(), icon: '👨‍🍳' },
    { status: 'ready', label: m.customer_step_ready(), icon: '🍽️' },
    { status: 'served', label: m.customer_step_served(), icon: '🎉' },
    { status: 'payment', label: m.customer_step_payment(), icon: '💳' },
    { status: 'paid', label: m.customer_step_paid(), icon: '✨' },
  ]
}

const STATUS_ORDER: CustomerOrderStatus[] = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'served',
  'payment',
  'paid',
]

function getStatusHint(): Record<CustomerOrderStatus, string> {
  return {
    placed: m.customer_hint_placed(),
    confirmed: m.customer_hint_confirmed(),
    preparing: m.customer_hint_preparing(),
    ready: m.customer_hint_ready(),
    served: m.customer_hint_served(),
    payment: m.customer_hint_payment(),
    paid: m.customer_hint_paid(),
    cancelled: m.customer_hint_cancelled(),
    payment_failed: m.customer_hint_payment_failed(),
    refunded: m.customer_hint_refunded(),
  }
}

interface OrderViewProps {
  order: OrderRecord
  sessionToken: string
  onBackToMenu: () => void
  /**
   * Patches fields into the parent's OrderRecord (state + sessionStorage) — this view has
   * no TanStack Query of its own to invalidate. TODO: this whole ad-hoc
   * state/sessionStorage/socket sync setup should migrate to TanStack Query; tracked as
   * separate work, not part of this change.
   */
  onOrderUpdate: (patch: Partial<OrderRecord>) => void
}

interface TerminalScreenProps {
  icon: string
  iconBg: string
  title: string
  orderId: string
  tableNumber: string
  onBackToMenu: () => void
}

function TerminalScreen({
  icon,
  iconBg,
  title,
  orderId,
  tableNumber,
  onBackToMenu,
}: Readonly<TerminalScreenProps>) {
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
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          margin: '0 auto',
        }}
      >
        {icon}
      </div>
      <h1 style={{ color: C.white, fontSize: 20, fontWeight: 800, margin: 0 }}>{title}</h1>
      <p style={{ color: C.w40, fontSize: 13, margin: 0 }}>
        #{orderId.slice(0, 8).toUpperCase()} · {m.customer_table({ name: tableNumber })}
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
        {m.customer_back_to_menu()}
      </button>
    </div>
  )
}

export function OrderView({
  order,
  sessionToken,
  onBackToMenu,
  onOrderUpdate,
}: Readonly<OrderViewProps>) {
  const [currentStatus, setCurrentStatus] = useState<CustomerOrderStatus>('placed')
  const [isCancelling, setIsCancelling] = useState(false)
  const callWaiterCooldownRef = useRef(false)

  useOrderNotifications({
    room: 'session',
    id: sessionToken,
    handlers: {
      // Fired right after join (including reconnect/page-reload) with the session's
      // current active order — without this, a reload would keep showing 'placed'
      // until the next live transition, even if the order had already progressed.
      'order:status-changed': (p) => {
        if (p.orderId !== order.orderId) return
        const resolved = resolveResyncStatus(p)
        if (resolved) setCurrentStatus(resolved)

        // Reconcile the stored tip on every (re)connect rather than trusting sessionStorage —
        // see shouldReconcileTip for why this isn't a blind patch.
        if (shouldReconcileTip(order.tipAmount, order.tipUpdatedAt, p)) {
          onOrderUpdate({ tipAmount: p.tipAmount, tipUpdatedAt: p.updatedAt })
        }
      },
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
      'order:payment-failed': (p) => {
        if (p.orderId === order.orderId) setCurrentStatus('payment_failed')
      },
      'order:refunded': (p) => {
        if (p.orderId === order.orderId) setCurrentStatus('refunded')
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
      toast.error(m.customer_cancel_order_error())
    } finally {
      setIsCancelling(false)
    }
  }

  function handleCallWaiter() {
    if (callWaiterCooldownRef.current) {
      toast.info(m.customer_waiter_already_notified(), { position: 'top-center' })
      return
    }
    callWaiterCooldownRef.current = true
    setTimeout(() => {
      callWaiterCooldownRef.current = false
    }, 5000)

    getSocket().emit(CLIENT_EVENTS.CALL_WAITER, { sessionToken })
    toast.success(m.customer_waiter_called(), { position: 'top-center' })
  }

  const isCancelled = currentStatus === 'cancelled'
  const isPaymentFailed = currentStatus === 'payment_failed'
  const isRefunded = currentStatus === 'refunded'
  const isServed = currentStatus === 'served'
  const isPayment = currentStatus === 'payment'
  const isPaid = currentStatus === 'paid'

  // 'served' and 'payment' both correspond to backend OrderStatus.DELIVERED (the only
  // status the guest tip endpoint accepts) — see resolveResyncStatus. Once tipAmount is
  // defined (including an explicit 0), the picker is replaced by the confirmation below.
  const canTip = (isServed || isPayment) && order.tipAmount === undefined

  const tipForm = useTipOrderForm({
    sessionToken,
    subtotal: order.total,
    onSuccess: (result) => {
      // Patch using the value RETURNED BY THE SERVER, not the submitted input — the server
      // may have rounded or clamped it, and showing the typed value then correcting it
      // flickers on a money display. tipUpdatedAt uses local time (the server response
      // carries no updatedAt) so a same-instant reconcile from order:status-changed doesn't
      // redundantly re-apply the value this device just wrote.
      onOrderUpdate({ tipAmount: result.tipAmount, tipUpdatedAt: new Date().toISOString() })
    },
  })

  const currentIdx = STATUS_ORDER.indexOf(currentStatus)
  const elapsedMin = Math.floor(elapsed / 60000)
  const elapsedSec = Math.floor((elapsed % 60000) / 1000)
  const elapsedLabel = elapsedMin > 0 ? `${elapsedMin}m ${elapsedSec}s` : `${elapsedSec}s`

  if (isCancelled) {
    return (
      <TerminalScreen
        icon='❌'
        iconBg='rgba(239,68,68,0.12)'
        title={m.customer_order_cancelled_title()}
        orderId={order.orderId}
        tableNumber={order.tableNumber}
        onBackToMenu={onBackToMenu}
      />
    )
  }

  if (isPaymentFailed) {
    return (
      <TerminalScreen
        icon='⚠️'
        iconBg='rgba(239,68,68,0.12)'
        title={m.customer_payment_failed_title()}
        orderId={order.orderId}
        tableNumber={order.tableNumber}
        onBackToMenu={onBackToMenu}
      />
    )
  }

  if (isRefunded) {
    return (
      <TerminalScreen
        icon='💸'
        iconBg='rgba(99,102,241,0.12)'
        title={m.customer_order_refunded_title()}
        orderId={order.orderId}
        tableNumber={order.tableNumber}
        onBackToMenu={onBackToMenu}
      />
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
          {isPaid
            ? m.customer_all_done_title()
            : isServed
              ? m.customer_enjoy_meal_title()
              : m.customer_order_in_progress_title()}
        </h1>
        <p style={{ color: C.w40, fontSize: 13, margin: 0 }}>
          #{order.orderId.slice(0, 8).toUpperCase()} ·{' '}
          {m.customer_table({ name: order.tableNumber })}
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
              {getStatusHint()[currentStatus]}
            </p>
            <p style={{ color: C.w40, fontSize: 11, margin: 0 }}>
              {m.customer_waiting_time({ time: elapsedLabel })}
            </p>
          </div>
        </div>
      )}

      {/* Progress stepper */}
      <div style={{ padding: '24px 20px 0' }}>
        {getSteps().map((step, i, steps) => {
          const done = i < currentIdx || (isPaid && i === currentIdx)
          const active = i === currentIdx && !isPaid
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
              style={{ display: 'flex', gap: 16, minHeight: i < steps.length - 1 ? 72 : 'auto' }}
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
                {i < steps.length - 1 && (
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
                    {m.customer_in_progress()}
                  </p>
                )}
                {done && (
                  <p style={{ color: C.w40, fontSize: 11, margin: 0 }}>{m.customer_completed()}</p>
                )}
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
            {m.customer_table({ name: order.tableNumber })} · {order.paymentMethod}
          </span>
        </div>
        <h3 style={{ color: C.white, fontSize: 14, fontWeight: 700, margin: '0 0 10px' }}>
          {m.customer_order_details()}
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
          <span style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>
            {m.customer_total()}
          </span>
          <span style={{ color: C.amber, fontSize: 16, fontWeight: 800 }}>
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {canTip && (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: C.r16,
              padding: 16,
            }}
          >
            <h3 style={{ color: C.white, fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>
              {m.customer_tip_title()}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {tipForm.presetAmounts.map(({ percentage: p, amount }) => {
                const active = tipForm.mode === 'percentage' && tipForm.percentage === p
                return (
                  <button
                    key={p}
                    type='button'
                    onClick={() => tipForm.selectMode('percentage', p)}
                    style={{
                      padding: '10px 6px',
                      borderRadius: C.r12,
                      border: `1px solid ${active ? C.amber : C.border}`,
                      background: active ? 'rgba(249,115,22,0.10)' : 'transparent',
                      color: active ? C.amber : C.w60,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <span>{p}%</span>
                    <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>
                      {formatPrice(amount)}
                    </span>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                type='button'
                onClick={() => tipForm.selectMode('custom')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: C.r12,
                  border: `1px solid ${tipForm.mode === 'custom' ? C.amber : C.border}`,
                  background: tipForm.mode === 'custom' ? 'rgba(249,115,22,0.10)' : 'transparent',
                  color: tipForm.mode === 'custom' ? C.amber : C.w60,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {m.customer_tip_custom_label()}
              </button>
              <button
                type='button'
                onClick={() => tipForm.selectMode('none')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: C.r12,
                  border: `1px solid ${tipForm.mode === 'none' ? C.w40 : C.border}`,
                  background: tipForm.mode === 'none' ? C.w06 : 'transparent',
                  color: tipForm.mode === 'none' ? C.white : C.w60,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {m.customer_tip_no_tip()}
              </button>
            </div>

            {tipForm.mode === 'custom' && (
              <div style={{ marginTop: 10 }}>
                <input
                  type='text'
                  inputMode='decimal'
                  placeholder={m.customer_tip_custom_placeholder()}
                  {...tipForm.register('customAmount')}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: C.r12,
                    border: `1px solid ${tipForm.errors.customAmount ? C.red : C.border}`,
                    background: 'transparent',
                    color: C.white,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {(tipForm.errors.customAmount || tipForm.errors.percentage) && (
              <p style={{ color: C.red, fontSize: 12, margin: '8px 0 0' }}>
                {tipForm.errors.customAmount?.message ?? tipForm.errors.percentage?.message}
              </p>
            )}

            <button
              type='button'
              disabled={tipForm.isSubmitting}
              onClick={tipForm.submit}
              style={{
                width: '100%',
                marginTop: 12,
                padding: '14px',
                background: C.amberGrad,
                borderRadius: C.r16,
                border: 'none',
                color: '#fff',
                fontWeight: 800,
                fontSize: 15,
                cursor: tipForm.isSubmitting ? 'not-allowed' : 'pointer',
                opacity: tipForm.isSubmitting ? 0.7 : 1,
              }}
            >
              {tipForm.isSubmitting ? m.customer_tip_submitting() : m.customer_tip_submit()}
            </button>
          </div>
        )}

        {order.tipAmount !== undefined && (
          <div
            style={{
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.22)',
              borderRadius: C.r16,
              padding: '12px 16px',
              textAlign: 'center',
            }}
          >
            <p style={{ color: C.green, fontSize: 13, fontWeight: 700, margin: 0 }}>
              {m.customer_tip_added_confirmation({ amount: formatPrice(order.tipAmount) })}
            </p>
          </div>
        )}

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
          {m.customer_call_waiter()}
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
            {isCancelling ? m.customer_cancelling() : m.customer_cancel_order()}
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
            {m.customer_back_to_menu()}
          </button>
        </div>
      )}
    </div>
  )
}
