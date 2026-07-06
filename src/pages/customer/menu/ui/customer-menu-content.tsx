import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { CartModifier } from '#/features/cart/model/cart.store'
import { cartItemTotal, useCartStore } from '#/features/cart/model/cart.store'
import type { CustomerPaymentMethod } from '#/features/platform/api/platform.types'
import { m } from '#/paraglide/messages'
import { fetchCustomerMenu } from '#/shared/api/customer/customer-api'
import type { CustomerProduct } from '#/shared/api/customer/menu.types'
import { showSuccess } from '#/shared/libs/hooks/toast.ts'
import { C } from './customer-theme'
import { CartView } from './views/cart-view'
import { BottomNav, MenuView } from './views/menu-view'
import type { OrderRecord } from './views/order-view'
import { OrderView } from './views/order-view'
import { PaymentView } from './views/payment-view'
import { ProductView } from './views/product-view'
import './styles.css'

// ── Types ──────────────────────────────────────────────────────────────────────
type AppView = 'menu' | 'product' | 'cart' | 'payment' | 'order'

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
  sessionToken,
  tableName,
  businessName,
  businessLogoUrl,
  paymentMethods,
}: Readonly<CustomerMenuContentProps>) {
  // Persist sessionToken client-side so the WebSocket hook and session-resume
  // flow can access it even when the HttpOnly cookie has been cleared.
  useEffect(() => {
    if (sessionToken) {
      localStorage.setItem('customer_session_token', sessionToken)
    }
  }, [sessionToken])

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('c-theme')
    if (saved) return saved === 'dark'
    return globalThis.matchMedia('(prefers-color-scheme: dark)').matches
  })

  function toggleTheme() {
    setIsDark((prev) => {
      const next = !prev
      globalThis.localStorage.setItem('c-theme', next ? 'dark' : 'light')
      return next
    })
  }

  const [view, setView] = useState<AppView>('menu')
  const [selectedProduct, setSelectedProduct] = useState<CustomerProduct | null>(null)
  const [orderRecord, setOrderRecord] = useState<OrderRecord | null>(null)

  const { items, addItem, updateQuantity, removeItem, clearCart } = useCartStore()

  const menuQuery = useQuery({
    queryKey: ['customer-menu', businessId],
    queryFn: () => fetchCustomerMenu(businessId),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(businessId),
  })

  const categories = menuQuery.data ?? []
  const allProducts = categories.flatMap((c) => c.products)
  const cartCount = items.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = items.reduce((s, i) => s + cartItemTotal(i), 0)

  // Restore order progress from sessionStorage across refreshes
  const ssKey = `c-order-${sessionToken.slice(0, 12)}`

  useEffect(() => {
    const saved = sessionStorage.getItem(ssKey)
    if (saved) {
      try {
        const record = JSON.parse(saved) as OrderRecord
        setOrderRecord(record)
        setView('order')
      } catch {
        sessionStorage.removeItem(ssKey)
      }
    }
  }, [ssKey])

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
    sessionStorage.setItem(ssKey, JSON.stringify(record))
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
    sessionStorage.removeItem(ssKey)
    setOrderRecord(null)
    setView('menu')
    globalThis.window.location.reload()
  }

  const theme = isDark ? 'dark' : 'light'

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
        <div className='c-mobile-only'>
          <BottomNav active='home' onCart={() => {}} cartCount={0} />
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

  // ── App shell ───────────────────────────────────────────────────────────────
  return (
    <div className='c-app' data-theme={theme} style={{ background: C.bg }}>
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
