import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import {
  type CartModifier,
  cartItemTotal,
  cartItemUnitPrice,
  useCartStore,
} from '#/features/cart/model/cart.store'
import {
  createCustomerOrder,
  createCustomerPayment,
  fetchCustomerMenu,
} from '#/shared/api/customer/customer-api'
import type { CustomerModifierGroup, CustomerProduct } from '#/shared/api/customer/menu.types'
import { formatPrice } from '#/shared/libs/utils/price.utils'

// ─── helpers ──────────────────────────────────────────────────────────────────

const DIETARY_LABELS: Record<string, string> = {
  vegan: 'Vegan',
  vegetarian: 'Veg',
  gluten_free: 'GF',
  dairy_free: 'DF',
}

type PaymentMethod = 'CASH' | 'POS' | 'ONLINE'

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────

function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-200 ${open ? 'visible' : 'invisible pointer-events-none'}`}
    >
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden='true'
      />
      <div
        className={`absolute bottom-0 left-0 right-0 max-h-[92dvh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className='mx-auto mt-3 h-1 w-10 rounded-full bg-gray-200' />
        {children}
      </div>
    </div>
  )
}

// ─── Modifier Group ───────────────────────────────────────────────────────────

function ModifierGroupRow({
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
    <div className='border-t border-gray-100 pt-4'>
      <div className='mb-2 flex items-center gap-2'>
        <span className='text-sm font-semibold text-gray-800'>{group.name}</span>
        {group.isRequired && (
          <span className='rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600'>
            Required
          </span>
        )}
        {!group.isRequired && (
          <span className='rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500'>
            Optional
          </span>
        )}
      </div>
      <div className='space-y-2'>
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
              className='flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5 transition-colors hover:bg-gray-50'
              style={{ background: checked ? 'var(--accent-soft)' : undefined }}
            >
              <div className='flex items-center gap-3'>
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-colors ${
                    isSingle ? 'rounded-full' : 'rounded-md'
                  } ${checked ? 'border-[var(--lagoon-deep)] bg-[var(--lagoon-deep)]' : 'border-gray-300 bg-white'}`}
                  onClick={toggle}
                  aria-hidden='true'
                >
                  {checked && (
                    <svg
                      className='h-3 w-3 text-white'
                      viewBox='0 0 12 12'
                      fill='currentColor'
                      aria-hidden='true'
                    >
                      <path
                        d='M10 3L5 9 2 6'
                        stroke='currentColor'
                        strokeWidth='2'
                        fill='none'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                  )}
                </div>
                <span className='text-sm text-gray-700'>{mod.name}</span>
              </div>
              {mod.priceAdjustment !== 0 && (
                <span className='text-xs font-medium text-gray-500'>
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

// ─── Product Sheet ────────────────────────────────────────────────────────────

interface ProductSheetProps {
  product: CustomerProduct | null
  onClose: () => void
  onAdd: (modifiers: CartModifier[], notes: string, qty: number) => void
}

function ProductSheet({ product, onClose, onAdd }: ProductSheetProps) {
  const [groupSelections, setGroupSelections] = useState<Record<string, string[]>>({})
  const [notes, setNotes] = useState('')
  const [qty, setQty] = useState(1)

  const open = product !== null

  // Reset state whenever a different product is opened
  const productId = product?.id
  useEffect(() => {
    setGroupSelections({})
    setNotes('')
    setQty(1)
  }, [productId])

  const activeGroups = (product?.modifierGroups ?? []).filter(
    (g) => g.modifiers.filter((m) => m.isActive).length > 0,
  )

  const isValid = useMemo(() => {
    if (!product) return false
    return activeGroups.every((g) => {
      const sel = groupSelections[g.id] ?? []
      return !g.isRequired || sel.length >= g.minSelections
    })
  }, [product, activeGroups, groupSelections])

  const modifierPrice = useMemo(() => {
    return activeGroups.reduce((total, g) => {
      const sel = groupSelections[g.id] ?? []
      return (
        total +
        g.modifiers.filter((m) => sel.includes(m.id)).reduce((s, m) => s + m.priceAdjustment, 0)
      )
    }, 0)
  }, [activeGroups, groupSelections])

  const unitPrice = (product?.price ?? 0) + modifierPrice
  const totalPrice = unitPrice * qty

  function handleAdd() {
    if (!(product && isValid)) return
    const modifiers: CartModifier[] = activeGroups.flatMap((g) =>
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
    onAdd(modifiers, notes, qty)
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      {product && (
        <div className='px-5 pb-8 pt-4'>
          {/* header */}
          <div className='mb-4 flex items-start justify-between gap-3'>
            <div className='flex-1'>
              <h2 className='text-xl font-bold text-gray-900'>{product.name}</h2>
              <p className='mt-0.5 text-base font-semibold' style={{ color: 'var(--lagoon-deep)' }}>
                {formatPrice(product.price)}
              </p>
            </div>
            <button
              type='button'
              onClick={onClose}
              className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200'
              aria-label='Close'
            >
              ×
            </button>
          </div>

          {product.description && (
            <p className='mb-4 text-sm text-gray-500'>{product.description}</p>
          )}

          {product.dietaryFlags.length > 0 && (
            <div className='mb-4 flex flex-wrap gap-1.5'>
              {product.dietaryFlags.map((flag) => (
                <span
                  key={flag}
                  className='rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700'
                >
                  {DIETARY_LABELS[flag] ?? flag}
                </span>
              ))}
            </div>
          )}

          {/* modifier groups */}
          <div className='space-y-4'>
            {activeGroups.map((g) => (
              <ModifierGroupRow
                key={g.id}
                group={g}
                selections={groupSelections[g.id] ?? []}
                onChange={(ids) => setGroupSelections((prev) => ({ ...prev, [g.id]: ids }))}
              />
            ))}
          </div>

          {/* notes */}
          <div className='mt-4 border-t border-gray-100 pt-4'>
            <label className='mb-1.5 block text-sm font-medium text-gray-700' htmlFor='item-notes'>
              Special requests
            </label>
            <textarea
              id='item-notes'
              rows={2}
              className='w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-[var(--lagoon-deep)] focus:outline-none'
              placeholder='E.g. no onions, extra sauce…'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* qty + add */}
          <div className='mt-5 flex items-center gap-4'>
            <div className='flex items-center gap-3 rounded-xl border border-gray-200 px-1 py-1'>
              <button
                type='button'
                className='flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40'
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
              >
                −
              </button>
              <span className='w-6 text-center text-sm font-semibold'>{qty}</span>
              <button
                type='button'
                className='flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold text-gray-600 hover:bg-gray-100'
                onClick={() => setQty((q) => q + 1)}
              >
                +
              </button>
            </div>

            <button
              type='button'
              disabled={!isValid}
              onClick={handleAdd}
              className='flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50'
              style={{ background: 'var(--lagoon-deep)' }}
            >
              Add to order · {formatPrice(totalPrice)}
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}

// ─── Cart Sheet ───────────────────────────────────────────────────────────────

interface CartSheetProps {
  open: boolean
  onClose: () => void
  sessionToken: string
  onSuccess: (orderId: string) => void
}

function CartSheet({ open, onClose, sessionToken, onSuccess }: CartSheetProps) {
  const { items, updateQuantity, removeItem, clearCart } = useCartStore()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')

  const subtotal = useMemo(() => items.reduce((s, i) => s + cartItemTotal(i), 0), [items])

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
            priceAdjustment: m.priceAdjustment,
          })),
        })),
      )
      await createCustomerPayment(order.id, paymentMethod, subtotal)
      return order
    },
    onSuccess: (order) => {
      clearCart()
      onSuccess(order.id)
    },
  })

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className='px-5 pb-8 pt-4'>
        <div className='mb-5 flex items-center justify-between'>
          <h2 className='text-lg font-bold text-gray-900'>Your order</h2>
          <button
            type='button'
            onClick={onClose}
            className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200'
            aria-label='Close'
          >
            ×
          </button>
        </div>

        {/* items */}
        <div className='space-y-3'>
          {items.map((item) => (
            <div key={item.id} className='rounded-xl border border-gray-100 p-3'>
              <div className='flex items-start justify-between gap-2'>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-semibold text-gray-900 truncate'>{item.productName}</p>
                  {item.selectedModifiers.length > 0 && (
                    <p className='mt-0.5 text-xs text-gray-500 truncate'>
                      {item.selectedModifiers.map((m) => m.name).join(', ')}
                    </p>
                  )}
                  {item.notes && (
                    <p className='mt-0.5 text-xs italic text-gray-400'>"{item.notes}"</p>
                  )}
                </div>
                <div className='text-right shrink-0'>
                  <p className='text-sm font-semibold text-gray-800'>
                    {formatPrice(cartItemTotal(item))}
                  </p>
                  <p className='text-xs text-gray-400'>{formatPrice(cartItemUnitPrice(item))} ea</p>
                </div>
              </div>
              <div className='mt-2.5 flex items-center justify-between'>
                <div className='flex items-center gap-2 rounded-lg border border-gray-200 px-1 py-0.5'>
                  <button
                    type='button'
                    className='flex h-6 w-6 items-center justify-center rounded text-sm font-bold text-gray-600 hover:bg-gray-100'
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span className='w-5 text-center text-xs font-semibold'>{item.quantity}</span>
                  <button
                    type='button'
                    className='flex h-6 w-6 items-center justify-center rounded text-sm font-bold text-gray-600 hover:bg-gray-100'
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  type='button'
                  className='text-xs text-red-400 hover:text-red-600'
                  onClick={() => removeItem(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* subtotal */}
        <div className='mt-4 flex items-center justify-between border-t border-gray-100 pt-4'>
          <span className='text-sm font-semibold text-gray-700'>Subtotal</span>
          <span className='text-base font-bold text-gray-900'>{formatPrice(subtotal)}</span>
        </div>

        {/* payment method */}
        <div className='mt-4'>
          <p className='mb-2 text-sm font-semibold text-gray-700'>Payment method</p>
          <div className='grid grid-cols-3 gap-2'>
            {(
              [
                { value: 'CASH', label: 'Cash' },
                { value: 'POS', label: 'Card' },
                { value: 'ONLINE', label: 'Online' },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                type='button'
                onClick={() => setPaymentMethod(value)}
                className='rounded-xl border py-2.5 text-sm font-medium transition-all'
                style={{
                  borderColor: paymentMethod === value ? 'var(--lagoon-deep)' : 'var(--line)',
                  background: paymentMethod === value ? 'var(--accent-soft)' : 'transparent',
                  color: paymentMethod === value ? 'var(--lagoon-deep)' : 'var(--sea-ink-soft)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* error */}
        {placeOrder.isError && (
          <p className='mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700'>
            Something went wrong. Please try again.
          </p>
        )}

        {/* confirm */}
        <button
          type='button'
          disabled={items.length === 0 || placeOrder.isPending}
          onClick={() => placeOrder.mutate()}
          className='mt-5 w-full rounded-xl py-3.5 text-sm font-bold text-white transition-opacity disabled:opacity-50'
          style={{ background: 'var(--lagoon-deep)' }}
        >
          {placeOrder.isPending ? 'Placing order…' : `Confirm order · ${formatPrice(subtotal)}`}
        </button>
      </div>
    </BottomSheet>
  )
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  onSelect,
}: {
  product: CustomerProduct
  onSelect: (p: CustomerProduct) => void
}) {
  return (
    <div className='flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm'>
      {product.imageUrls?.[0] && (
        <img
          src={product.imageUrls[0]}
          alt={product.name}
          className='h-16 w-16 shrink-0 rounded-xl object-cover'
        />
      )}
      <div className='min-w-0 flex-1'>
        <p className='text-sm font-semibold leading-tight text-gray-900'>{product.name}</p>
        {product.description && (
          <p className='mt-0.5 line-clamp-2 text-xs text-gray-500'>{product.description}</p>
        )}
        {product.dietaryFlags.length > 0 && (
          <div className='mt-1.5 flex flex-wrap gap-1'>
            {product.dietaryFlags.map((flag) => (
              <span
                key={flag}
                className='rounded-full bg-green-50 px-1.5 py-px text-[10px] font-medium text-green-700'
              >
                {DIETARY_LABELS[flag] ?? flag}
              </span>
            ))}
          </div>
        )}
        <div className='mt-2 flex items-center justify-between gap-2'>
          <span className='text-sm font-bold' style={{ color: 'var(--lagoon-deep)' }}>
            {formatPrice(product.price)}
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <s className='ml-1.5 text-xs font-normal text-gray-400'>
                {formatPrice(product.compareAtPrice)}
              </s>
            )}
          </span>
          <button
            type='button'
            disabled={!product.isAvailable}
            onClick={() => onSelect(product)}
            className='rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-opacity disabled:opacity-40'
            style={{ background: 'var(--lagoon-deep)' }}
          >
            {product.isAvailable ? 'Add' : 'Unavailable'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface CustomerMenuContentProps {
  businessId: string
  tableId: string
  sessionToken: string
  sessionId: string
  tableName: string
  businessName: string
}

export function CustomerMenuContent({
  businessId,
  sessionToken,
  tableName,
  businessName,
}: Readonly<CustomerMenuContentProps>) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<CustomerProduct | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null)

  const { items, addItem } = useCartStore()

  const menuQuery = useQuery({
    queryKey: ['customer-menu', businessId],
    queryFn: () => fetchCustomerMenu(businessId),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(businessId),
  })

  const categories = menuQuery.data ?? []

  // Default to first category once data loads
  const effectiveCategory = activeCategoryId ?? categories[0]?.id ?? null

  const products = categories.find((c) => c.id === effectiveCategory)?.products ?? []

  const cartCount = items.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = useMemo(() => items.reduce((s, i) => s + cartItemTotal(i), 0), [items])

  function handleProductAdd(modifiers: CartModifier[], notes: string, qty: number) {
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
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (confirmedOrderId) {
    return (
      <main className='flex min-h-dvh flex-col items-center justify-center px-6 text-center'>
        <div className='text-5xl mb-4'>🎉</div>
        <h1 className='text-2xl font-bold text-gray-900'>Order placed!</h1>
        <p className='mt-2 text-sm text-gray-500'>
          Reference{' '}
          <span className='font-mono font-semibold text-gray-700'>
            #{confirmedOrderId.slice(0, 8).toUpperCase()}
          </span>
        </p>
        <p className='mt-1 text-sm text-gray-500'>We'll get your food to you shortly.</p>
        <button
          type='button'
          className='mt-8 rounded-xl px-6 py-3 text-sm font-bold text-white'
          style={{ background: 'var(--lagoon-deep)' }}
          onClick={() => setConfirmedOrderId(null)}
        >
          Order more
        </button>
      </main>
    )
  }

  // ── Loading / error ─────────────────────────────────────────────────────────
  if (menuQuery.isPending) {
    return (
      <main className='flex min-h-dvh items-center justify-center'>
        <p className='text-sm text-gray-400'>Loading menu…</p>
      </main>
    )
  }

  if (menuQuery.isError) {
    return (
      <main className='flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center'>
        <p className='text-sm text-red-600'>Could not load menu. Please try again.</p>
        <button
          type='button'
          className='rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700'
          onClick={() => void menuQuery.refetch()}
        >
          Retry
        </button>
      </main>
    )
  }

  // ── Main layout ─────────────────────────────────────────────────────────────
  return (
    <>
      <main className='min-h-dvh bg-[var(--bg-base)]'>
        {/* sticky header */}
        <header className='sticky top-0 z-30 flex items-center gap-2 border-b border-[var(--line)] bg-white/90 px-4 py-3 backdrop-blur-sm'>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-base font-bold text-gray-900'>{businessName}</p>
            <p className='text-xs text-gray-500'>{tableName}</p>
          </div>
          {cartCount > 0 && (
            <button
              type='button'
              onClick={() => setCartOpen(true)}
              className='flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white'
              style={{ background: 'var(--lagoon-deep)' }}
            >
              <span>🛒</span>
              <span>{cartCount}</span>
            </button>
          )}
        </header>

        {/* category tabs */}
        {categories.length > 0 && (
          <nav className='sticky top-[57px] z-20 flex gap-2 overflow-x-auto bg-white/90 px-4 py-3 backdrop-blur-sm scrollbar-none border-b border-[var(--line)]'>
            {categories.map((cat) => {
              const active = cat.id === effectiveCategory
              return (
                <button
                  key={cat.id}
                  type='button'
                  onClick={() => setActiveCategoryId(cat.id)}
                  className='shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all'
                  style={{
                    background: active ? 'var(--lagoon-deep)' : 'var(--chip-bg)',
                    color: active ? 'white' : 'var(--sea-ink)',
                    border: active ? 'none' : '1px solid var(--chip-line)',
                  }}
                >
                  {cat.name}
                </button>
              )
            })}
          </nav>
        )}

        {/* product list */}
        <section className='px-4 py-4 pb-28 space-y-3'>
          {products.length === 0 ? (
            <p className='py-12 text-center text-sm text-gray-400'>No items in this category.</p>
          ) : (
            products.map((product) => (
              <ProductCard key={product.id} product={product} onSelect={setSelectedProduct} />
            ))
          )}
        </section>
      </main>

      {/* cart bar */}
      {cartCount > 0 && (
        <div className='fixed bottom-0 left-0 right-0 z-40 px-4 pb-5 pt-3'>
          <button
            type='button'
            onClick={() => setCartOpen(true)}
            className='flex w-full items-center justify-between rounded-2xl px-5 py-4 text-white shadow-lg'
            style={{ background: 'var(--lagoon-deep)' }}
          >
            <span className='flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold'>
              {cartCount}
            </span>
            <span className='text-sm font-bold'>View order</span>
            <span className='text-sm font-semibold opacity-90'>{formatPrice(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* product detail sheet */}
      <ProductSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdd={handleProductAdd}
      />

      {/* cart / checkout sheet */}
      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        sessionToken={sessionToken}
        onSuccess={(orderId) => {
          setCartOpen(false)
          setConfirmedOrderId(orderId)
        }}
      />
    </>
  )
}
