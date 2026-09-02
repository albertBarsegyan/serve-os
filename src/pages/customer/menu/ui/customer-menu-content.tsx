import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { menuQueryOptions } from '#/entities/menu/lib/menu-query-options'
import { sessionQueryOptions } from '#/entities/session/lib/session-query-options'
import type { CartModifier } from '#/features/cart/model/cart.store'
import { cartItemTotal, useCartStore } from '#/features/cart/model/cart.store'
import {
  useMyOrders,
  useOrderNotifications,
  useSelfMutationSuppression,
} from '#/features/notification'
import type { CustomerPaymentMethod } from '#/features/platform/api/platform.types'
import { m } from '#/paraglide/messages'
import { fetchRecentOrderForSession } from '#/shared/api/customer/customer-api'
import type { CustomerProduct } from '#/shared/api/customer/menu.types'
import { showSuccess } from '#/shared/libs/hooks/toast.ts'
import { cartSubtotal } from '#/shared/libs/utils/pricing.utils'
import {
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
} from '#/shared/libs/utils/storage.utils'
import { C } from './customer-theme'
import { CartView } from './views/cart-view'
import { MenuView } from './views/menu-view'
import type { OrderRecord } from './views/order-view'
import { OrderView } from './views/order-view'
import { PaymentView } from './views/payment-view'
import { ProductView } from './views/product-view'
import { SessionClosedView } from './views/session-closed-view'
import './styles.css'

// ── Types ──────────────────────────────────────────────────────────────────────
type AppView = 'menu' | 'product' | 'cart' | 'payment' | 'order'

export interface SharedOrderBanner {
  orderId: string
  label: string
}

type SharedOrderEvent =
  | 'created'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'cancelled'
  | 'paid'
  | 'payment-failed'
  | 'refunded'

/** Events past which there's nothing left for another device to be notified about. */
const TERMINAL_SHARED_ORDER_EVENTS = new Set<SharedOrderEvent>([
  'served',
  'cancelled',
  'paid',
  'payment-failed',
  'refunded',
])

/**
 * Pure state transition for the "someone else at this table placed/updated an order"
 * banner — pulled out of the component so it's unit-testable without rendering the
 * full customer app shell (menu query, cart store, theme, etc.).
 */
export function nextSharedOrderBanner(
  current: SharedOrderBanner | null,
  event: SharedOrderEvent,
  orderId: string,
  label: string,
): SharedOrderBanner | null {
  if (TERMINAL_SHARED_ORDER_EVENTS.has(event)) {
    return current?.orderId === orderId ? null : current
  }
  return { orderId, label }
}

// Order-tracking storage: keyed by orderId (stable across a table session churning to a
// new id once the previous order settles) rather than sessionId, and kept in localStorage
// (shared across tabs) rather than sessionStorage — a QR re-scan often opens in a new tab,
// which would otherwise start with no memory of the order the guest just placed.
function orderRecordKey(orderId: string): string {
  return `c-order-${orderId}`
}

// tableId doesn't churn the way sessionId does, so it's a stable pointer to "the order
// this device most recently tracked at this table" — used to find the record above
// without already knowing its orderId.
function orderPointerKey(tableId: string): string {
  return `c-order-latest-${tableId}`
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface CustomerMenuContentProps {
  businessId: string
  tableId: string
  sessionToken: string
  sessionId: string
  tableName: string
  businessName: string
  businessLogoUrl: string | null
  paymentMethods: CustomerPaymentMethod[]
}

export function CustomerMenuContent({
  businessId,
  tableId,
  sessionToken,
  sessionId,
  tableName,
  businessName,
  businessLogoUrl,
  paymentMethods,
}: Readonly<CustomerMenuContentProps>) {
  // Deterministic initial value on both server and first client render — the real
  // preference (saved or system) is only known client-side, so it's resolved after
  // mount instead of inside the initializer to avoid a hydration mismatch.
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const saved = getLocalStorageItem('c-theme')
    if (saved) {
      setIsDark(saved === 'dark')
      return
    }
    setIsDark(globalThis.matchMedia('(prefers-color-scheme: dark)').matches)
  }, [])

  function toggleTheme() {
    setIsDark((prev) => {
      const next = !prev
      setLocalStorageItem('c-theme', next ? 'dark' : 'light')
      return next
    })
  }

  const [view, setView] = useState<AppView>('menu')
  const [selectedProduct, setSelectedProduct] = useState<CustomerProduct | null>(null)
  const [orderRecord, setOrderRecord] = useState<OrderRecord | null>(null)
  const [sharedOrder, setSharedOrder] = useState<SharedOrderBanner | null>(null)

  const { items, addItem, updateQuantity, removeItem, clearCart, syncSession } = useCartStore()

  // Keeps the persisted cart scoped to this table session — a reload/back-navigation/
  // language-switch within the same session keeps the cart, but a genuinely different
  // session (new table, or an old session that churned) starts with an empty one.
  useEffect(() => {
    syncSession(sessionId)
  }, [sessionId, syncSession])

  // Suppresses the generic "New order received" toast for the device that placed the
  // order itself — see handleOrderSuccess, which marks its own order right after checkout.
  const { markSelfMutated, isSelfMutated } = useSelfMutationSuppression()

  // Every guest at a table shares one session/room — without this, every order placed
  // by anyone at the table plays a sound/toast on every other guest's phone too. The
  // quiet sharedOrder banner below still reflects table-wide progress; this only gates
  // the noisy default toast/sound.
  const { markMyOrder, isMyOrder } = useMyOrders(sessionId)

  // Mounted here (not just inside OrderView) so a guest still browsing the menu/cart on
  // their own phone learns live that their own order (tracked via isMyOrder) progressed
  // — other guests' orders still update the shared banner below, just silently.
  useOrderNotifications({
    room: 'session',
    id: sessionToken,
    shouldNotify: isMyOrder,
    isSelfMutated,
    handlers: {
      'order:created': (p) => {
        if (isSelfMutated(p.orderId)) return
        setSharedOrder((prev) =>
          nextSharedOrderBanner(prev, 'created', p.orderId, m.customer_step_order_placed()),
        )
      },
      'order:confirmed': (p) => {
        if (isSelfMutated(p.orderId)) return
        setSharedOrder((prev) =>
          nextSharedOrderBanner(prev, 'confirmed', p.orderId, m.customer_step_confirmed()),
        )
      },
      'order:preparing': (p) => {
        if (isSelfMutated(p.orderId)) return
        setSharedOrder((prev) =>
          nextSharedOrderBanner(prev, 'preparing', p.orderId, m.customer_step_preparing()),
        )
      },
      'order:ready': (p) => {
        if (isSelfMutated(p.orderId)) return
        setSharedOrder((prev) =>
          nextSharedOrderBanner(prev, 'ready', p.orderId, m.customer_step_ready()),
        )
      },
      'order:served': (p) => {
        setSharedOrder((prev) => nextSharedOrderBanner(prev, 'served', p.orderId, ''))
      },
      'order:cancelled': (p) => {
        setSharedOrder((prev) => nextSharedOrderBanner(prev, 'cancelled', p.orderId, ''))
      },
      'order:paid': (p) => {
        setSharedOrder((prev) => nextSharedOrderBanner(prev, 'paid', p.orderId, ''))
      },
      'order:payment-failed': (p) => {
        setSharedOrder((prev) => nextSharedOrderBanner(prev, 'payment-failed', p.orderId, ''))
      },
      'order:refunded': (p) => {
        setSharedOrder((prev) => nextSharedOrderBanner(prev, 'refunded', p.orderId, ''))
      },
    },
  })

  // Same query options the route loader preloads with, so SSR and the client share
  // one cache entry (key/queryFn/staleTime) instead of racing a second fetch.
  const menuQuery = useQuery(menuQueryOptions(businessId))

  const sessionStatusQuery = useQuery(sessionQueryOptions(sessionToken))
  const isSessionClosed = sessionStatusQuery.data?.session === null

  const categories = menuQuery.data ?? []
  const allProducts = categories.flatMap((c) => c.products)
  const cartCount = items.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = cartSubtotal(items)

  // Restore order-tracking progress across refreshes, new tabs, and session churn (see
  // orderRecordKey/orderPointerKey above). If this device has no local record at all —
  // storage was cleared, or a QR re-scan opened a context that never had it — fall back
  // to asking the backend for the still-active session's most recent order rather than
  // leaving the guest stuck on the plain menu with an order already in flight.
  useEffect(() => {
    let cancelled = false
    const pointedOrderId = getLocalStorageItem(orderPointerKey(tableId))
    if (pointedOrderId) {
      const saved = getLocalStorageItem(orderRecordKey(pointedOrderId))
      if (saved) {
        try {
          const record = JSON.parse(saved) as OrderRecord
          setOrderRecord(record)
          setView('order')
          return
        } catch {
          removeLocalStorageItem(orderRecordKey(pointedOrderId))
          removeLocalStorageItem(orderPointerKey(tableId))
        }
      }
    }

    fetchRecentOrderForSession(sessionToken)
      .then((record) => {
        if (cancelled) return
        setLocalStorageItem(orderRecordKey(record.orderId), JSON.stringify(record))
        setLocalStorageItem(orderPointerKey(tableId), record.orderId)
        setOrderRecord(record)
        setView('order')
      })
      .catch(() => {
        // No order for this session (404), or a transient network error — fall through
        // to the plain menu grid, same as a guest who genuinely hasn't ordered yet.
      })

    return () => {
      cancelled = true
    }
  }, [tableId, sessionToken])

  function handleProductAdd(qty: number, modifiers: CartModifier[], notes: string) {
    if (!selectedProduct) return
    addItem({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      basePrice: selectedProduct.price,
      quantity: qty,
      notes,
      selectedModifiers: modifiers,
    })
    setSelectedProduct(null)
    setView('menu')
  }

  function handleProductAddAndNext(qty: number, modifiers: CartModifier[], notes: string) {
    if (!selectedProduct) return
    addItem({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      basePrice: selectedProduct.price,
      quantity: qty,
      notes,
      selectedModifiers: modifiers,
    })
    setSelectedProduct(null)
    setView('cart')
  }

  function handleOrderSuccess(orderId: string, total: number) {
    const record: OrderRecord = {
      orderId,
      items: items.map((i) => ({
        name: i.productName,
        qty: i.quantity,
        price: cartItemTotal(i),
      })),
      total,
      tableNumber: tableName,
      placedAt: Date.now(),
      paymentMethod: 'ONLINE',
    }
    setLocalStorageItem(orderRecordKey(orderId), JSON.stringify(record))
    setLocalStorageItem(orderPointerKey(tableId), orderId)
    markSelfMutated(orderId)
    markMyOrder(orderId)
    setOrderRecord(record)
    clearCart()
    setView('order')
  }

  function handleQuickAdd(product: CustomerProduct) {
    const hasRequired = product.modifierGroups.some(
      (g) => g.isRequired && g.modifiers.some((m) => m.isActive),
    )
    if (hasRequired) {
      setSelectedProduct(product)
      setView('product')
      return
    }
    addItem({
      productId: product.id,
      productName: product.name,
      basePrice: product.price,
      quantity: 1,
      notes: '',
      selectedModifiers: [],
    })
    showSuccess(m.customer_item_added({ name: product.name }))
  }

  function handleBackToMenu() {
    if (orderRecord) {
      removeLocalStorageItem(orderRecordKey(orderRecord.orderId))
      removeLocalStorageItem(orderPointerKey(tableId))
    }
    setOrderRecord(null)
    setView('menu')
  }

  // Patches fields into orderRecord (state + localStorage) — OrderView has no query of
  // its own to invalidate; see the TODO on OrderViewProps.onOrderUpdate.
  function handleOrderUpdate(patch: Partial<OrderRecord>) {
    setOrderRecord((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      setLocalStorageItem(orderRecordKey(next.orderId), JSON.stringify(next))
      return next
    })
  }

  const theme = isDark ? 'dark' : 'light'
  // ── Session closed ──────────────────────────────────────────────────────────
  // Only pre-empts the browsing views — 'payment' and 'order' already resolve their own
  // terminal states from more specific order-lifecycle events (paid/cancelled/refunded).
  if (isSessionClosed && (view === 'menu' || view === 'product' || view === 'cart')) {
    return (
      <div className='c-app' data-theme={theme}>
        <SessionClosedView
          tableName={tableName}
          onRetry={() => globalThis.window.location.reload()}
        />
      </div>
    )
  }

  // ── Loading / error ─────────────────────────────────────────────────────────
  if (menuQuery.isPending && view !== 'order') {
    return (
      <div
        className='c-app'
        data-theme={theme}
        style={{
          background: C.bg,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: '24px 16px',
            maxWidth: 600,
            width: '100%',
            margin: '0 auto',
          }}
        >
          {/* Header skeleton */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Skeleton w={42} h={42} r='50%' />
            <div style={{ flex: 1 }}>
              <Skeleton w='40%' h={10} r={6} mb={6} />
              <Skeleton w='70%' h={14} r={6} />
            </div>
            <Skeleton w={42} h={42} r='50%' />
          </div>
          <Skeleton w='100%' h={44} r={12} />
          <Skeleton w='100%' h={118} r={20} />
          <div style={{ display: 'flex', gap: 14, overflow: 'hidden' }}>
            {[1, 2, 3, 4].map((k) => (
              <div key={k} style={{ flexShrink: 0, textAlign: 'center' }}>
                <Skeleton w={60} h={60} r='50%' mb={8} />
                <Skeleton w={50} h={10} r={5} />
              </div>
            ))}
          </div>
          {[1, 2, 3].map((k) => (
            <Skeleton key={k} w='100%' h={96} r={16} />
          ))}
        </div>
      </div>
    )
  }

  if (menuQuery.isError && view !== 'order') {
    return (
      <div
        className='c-app'
        data-theme={theme}
        style={{
          background: C.bg,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 48 }}>😕</span>
        <p style={{ color: C.white, fontSize: 16, fontWeight: 700, margin: 0 }}>
          {m.customer_menu_load_error()}
        </p>
        <p style={{ color: C.w40, fontSize: 13, margin: 0 }}>{m.customer_check_connection()}</p>
        <button
          type='button'
          onClick={() => void menuQuery.refetch()}
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
          {m.customer_retry()}
        </button>
      </div>
    )
  }

  if (categories.length === 0 && view !== 'order') {
    return (
      <div
        className='c-app'
        data-theme={theme}
        style={{
          background: C.bg,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 360,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 48 }}>🍽️</span>

          <p
            style={{
              color: C.white,
              fontSize: 18,
              fontWeight: 700,
              margin: 0,
            }}
          >
            No menu available
          </p>

          <p
            style={{
              color: C.w40,
              fontSize: 14,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            This table doesn't have a menu available right now. Please check back later or ask a
            staff member for assistance.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='c-app' data-theme={theme} style={{ background: C.bg }}>
      {sharedOrder && (view === 'menu' || view === 'product' || view === 'cart') && (
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 16px',
            background: 'rgba(249,115,22,0.14)',
            borderBottom: `1px solid ${C.amber}`,
            color: C.white,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span>{m.customer_shared_order_notice({ status: sharedOrder.label })}</span>
          <button
            type='button'
            onClick={() => setSharedOrder(null)}
            aria-label={m.customer_dismiss()}
            style={{
              background: 'transparent',
              border: 'none',
              color: C.white,
              fontSize: 16,
              lineHeight: 1,
              cursor: 'pointer',
              padding: 4,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      )}

      {view === 'menu' && (
        <MenuView
          businessName={businessName}
          businessLogoUrl={businessLogoUrl}
          tableName={tableName}
          categories={categories}
          cartCount={cartCount}
          cartTotal={cartTotal}
          isDark={isDark}
          toggleTheme={toggleTheme}
          onProductSelect={(p) => {
            setSelectedProduct(p)
            setView('product')
          }}
          onQuickAdd={handleQuickAdd}
          onCartOpen={() => setView('cart')}
        />
      )}

      {view !== 'menu' && (
        <div className='c-view-wrapper'>
          {view === 'product' && selectedProduct && (
            <ProductView
              product={selectedProduct}
              cartCount={cartCount}
              onBack={() => setView('menu')}
              onGoToCart={() => setView('cart')}
              onAdd={handleProductAdd}
              onAddAndNext={handleProductAddAndNext}
            />
          )}

          {view === 'cart' && (
            <CartView
              items={items}
              products={allProducts}
              tableName={tableName}
              onBack={() => setView('menu')}
              onOrderNow={() => setView('payment')}
              onUpdateQty={updateQuantity}
              onRemove={removeItem}
            />
          )}

          {view === 'payment' && (
            <PaymentView
              items={items}
              tableName={tableName}
              sessionToken={sessionToken}
              paymentMethods={paymentMethods}
              onBack={() => setView('cart')}
              onSuccess={handleOrderSuccess}
            />
          )}

          {view === 'order' && orderRecord && (
            <OrderView
              order={orderRecord}
              sessionToken={sessionToken}
              onBackToMenu={handleBackToMenu}
              onOrderUpdate={handleOrderUpdate}
            />
          )}
        </div>
      )}
    </div>
  )
}

function Skeleton({
  w,
  h,
  r,
  mb,
}: Readonly<{
  w: number | string
  h: number
  r: number | string
  mb?: number
}>) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: `linear-gradient(90deg, ${C.card} 25%, ${C.card2} 50%, ${C.card} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
        marginBottom: mb,
        flexShrink: 0,
      }}
    />
  )
}
