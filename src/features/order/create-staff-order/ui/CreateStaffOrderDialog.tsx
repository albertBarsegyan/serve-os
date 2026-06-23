import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Minus, Plus, ShoppingCart, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '#/components/ui/button'
import { Select } from '#/components/ui/select'
import { tablesQueryOptions } from '#/features/platform/lib/query-options'
import { useCreateStaffOrderMutation } from '#/features/platform/model/platform-hooks'
import { fetchCustomerMenu } from '#/shared/api/customer/customer-api'
import type {
  CustomerCategory,
  CustomerModifierGroup,
  CustomerProduct,
} from '#/shared/api/customer/menu.types'
import { showError, showSuccess } from '#/shared/libs/hooks/toast'
import { useActiveBusiness } from '#/shared/libs/hooks/use-active-business.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import { Modal } from '#/shared/ui/modal'

// ── Types ─────────────────────────────────────────────────────────────────────

type OrderType = 'DINE_IN' | 'TAKEAWAY'
type PaymentMethod = 'CASH' | 'POS' | 'ONLINE'
type Step = 'setup' | 'menu' | 'review'

interface CartModifier {
  groupId: string
  modifierId: string
  name: string
  priceAdjustment: number
}

interface CartItem {
  id: string
  productId: string
  productName: string
  basePrice: number
  quantity: number
  notes: string
  selectedModifiers: CartModifier[]
}

function itemUnitPrice(item: CartItem): number {
  return item.basePrice + item.selectedModifiers.reduce((s, m) => s + Number(m.priceAdjustment), 0)
}

function itemTotal(item: CartItem): number {
  return itemUnitPrice(item) * item.quantity
}

// ── Modifier group selector ───────────────────────────────────────────────────

function ModifierGroupRow({
  group,
  selections,
  onChange,
  currency,
}: {
  group: CustomerModifierGroup
  selections: string[]
  onChange: (ids: string[]) => void
  currency: string
}) {
  const active = group.modifiers.filter((m) => m.isActive)

  return (
    <div className='border-t border-border pt-3'>
      <div className='mb-2 flex items-center gap-2'>
        <span className='text-sm font-semibold'>{group.name}</span>
        {group.isRequired ? (
          <span className='rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive'>
            Required
          </span>
        ) : (
          <span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
            Optional
          </span>
        )}
      </div>
      <div className='space-y-1.5'>
        {active.map((mod) => {
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
              className='flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-accent'
            >
              <div className='flex items-center gap-2.5'>
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center border-2 transition-colors ${
                    isSingle ? 'rounded-full' : 'rounded'
                  } ${checked ? 'border-primary bg-primary' : 'border-input bg-background'}`}
                  onClick={toggle}
                  aria-hidden='true'
                >
                  {checked && (
                    <svg
                      className='h-2.5 w-2.5 text-primary-foreground'
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
                <span className='text-sm'>{mod.name}</span>
              </div>
              {mod.priceAdjustment !== 0 && (
                <span className='text-xs font-medium text-muted-foreground'>
                  {mod.priceAdjustment > 0 ? '+' : ''}
                  {formatPrice(mod.priceAdjustment, currency)}
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

// ── Product detail panel ──────────────────────────────────────────────────────

function ProductDetailPanel({
  product,
  onBack,
  onAdd,
  currency,
}: {
  product: CustomerProduct
  onBack: () => void
  onAdd: (modifiers: CartModifier[], notes: string, qty: number) => void
  currency: string
}) {
  const [groupSelections, setGroupSelections] = useState<Record<string, string[]>>({})
  const [notes, setNotes] = useState('')
  const [qty, setQty] = useState(1)

  // biome-ignore lint/correctness/useExhaustiveDependencies: product.id is a trigger, not used inside effect body
  useEffect(() => {
    setGroupSelections({})
    setNotes('')
    setQty(1)
  }, [product.id])

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

  function handleAdd() {
    if (!isValid) return
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
    <div className='flex h-full flex-col'>
      <button
        type='button'
        onClick={onBack}
        className='mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
      >
        <ChevronLeft className='h-4 w-4' /> Back to menu
      </button>

      <div className='flex-1 overflow-y-auto space-y-4 pr-1'>
        <div>
          <h3 className='text-lg font-bold'>{product.name}</h3>
          <p className='text-base font-semibold text-primary'>
            {formatPrice(product.price, currency)}
          </p>
          {product.description && (
            <p className='mt-1 text-sm text-muted-foreground'>{product.description}</p>
          )}
        </div>

        {activeGroups.map((g) => (
          <ModifierGroupRow
            key={g.id}
            group={g}
            selections={groupSelections[g.id] ?? []}
            onChange={(ids) => setGroupSelections((prev) => ({ ...prev, [g.id]: ids }))}
            currency={currency}
          />
        ))}

        <div className='border-t border-border pt-3 px-2'>
          <label className='mb-1 block text-sm font-medium' htmlFor='staff-item-notes'>
            Item notes <span className='font-normal text-muted-foreground'>(optional)</span>
          </label>
          <textarea
            id='staff-item-notes'
            rows={2}
            className='w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
            placeholder='E.g. no onions, extra sauce…'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className='mt-4 flex items-center gap-3 border-t border-border pt-4'>
        <div className='flex items-center gap-2 rounded-lg border border-input px-1 py-1'>
          <button
            type='button'
            className='flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent disabled:opacity-40'
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
          >
            <Minus className='h-3.5 w-3.5' />
          </button>
          <span className='w-6 text-center text-sm font-semibold'>{qty}</span>
          <button
            type='button'
            className='flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent'
            onClick={() => setQty((q) => q + 1)}
          >
            <Plus className='h-3.5 w-3.5' />
          </button>
        </div>
        <Button className='flex-1 rounded-xl' disabled={!isValid} onClick={handleAdd}>
          Add to order · {formatPrice(unitPrice * qty, currency)}
        </Button>
      </div>
    </div>
  )
}

// ── Step 1: Order setup ───────────────────────────────────────────────────────

function SetupStep({
  orderType,
  onOrderTypeChange,
  tableId,
  onTableIdChange,
  customerName,
  onCustomerNameChange,
  onNext,
}: Readonly<{
  orderType: OrderType
  onOrderTypeChange: (t: OrderType) => void
  tableId: string
  onTableIdChange: (id: string) => void
  customerName: string
  onCustomerNameChange: (n: string) => void
  onNext: () => void
}>) {
  const { data: tables = [], isPending: tablesLoading } = useQuery(tablesQueryOptions())
  const activeTables = tables.filter((t) => t.isActive)

  const canContinue = orderType === 'TAKEAWAY' || (orderType === 'DINE_IN' && Boolean(tableId))

  return (
    <div className='space-y-6'>
      <div>
        <p className='mb-2 text-sm font-medium'>Order type</p>
        <div className='grid grid-cols-2 gap-3'>
          {(['DINE_IN', 'TAKEAWAY'] as const).map((t) => (
            <button
              key={t}
              type='button'
              onClick={() => onOrderTypeChange(t)}
              className={`rounded-xl border py-3 text-sm font-semibold transition-all ${
                orderType === t
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-accent'
              }`}
            >
              {t === 'DINE_IN' ? '🍽 Dine In' : '🥡 Takeaway'}
            </button>
          ))}
        </div>
      </div>

      {orderType === 'DINE_IN' && (
        <div>
          <label className='mb-1.5 block text-sm font-medium' htmlFor='staff-order-table'>
            Table <span className='text-destructive'>*</span>
          </label>
          {tablesLoading ? (
            <p className='text-sm text-muted-foreground'>Loading tables…</p>
          ) : activeTables.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No active tables found.</p>
          ) : (
            <Select
              id='staff-order-table'
              value={tableId}
              onChange={(e) => onTableIdChange(e.target.value)}
            >
              <option value=''>Select a table…</option>
              {activeTables.map((t) => (
                <option key={t.id} value={t.id}>
                  Table {t.number} (capacity: {t.capacity})
                </option>
              ))}
            </Select>
          )}
        </div>
      )}

      <div>
        <label className='mb-1.5 block text-sm font-medium' htmlFor='staff-order-customer'>
          Customer name <span className='text-muted-foreground font-normal'>(optional)</span>
        </label>
        <input
          id='staff-order-customer'
          type='text'
          className='h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
          placeholder='E.g. John Doe'
          value={customerName}
          onChange={(e) => onCustomerNameChange(e.target.value)}
        />
      </div>

      <div className='flex justify-end pt-2'>
        <Button onClick={onNext} disabled={!canContinue} className='rounded-xl px-6'>
          Select items →
        </Button>
      </div>
    </div>
  )
}

// ── Step 2: Menu browsing ─────────────────────────────────────────────────────

function MenuStep({
  businessId,
  items,
  onAddItem,
  onBack,
  onNext,
  currency,
}: Readonly<{
  businessId: string
  items: CartItem[]
  onAddItem: (item: Omit<CartItem, 'id'>) => void
  onBack: () => void
  onNext: () => void
  currency: string
}>) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<CustomerProduct | null>(null)

  const {
    data: categories = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ['customer-menu', businessId],
    queryFn: () => fetchCustomerMenu(businessId),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(businessId),
  })

  const effectiveCategory = activeCategoryId ?? categories[0]?.id ?? null
  const products =
    categories.find((c: CustomerCategory) => c.id === effectiveCategory)?.products ?? []

  const cartCount = items.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = useMemo(() => items.reduce((s, i) => s + itemTotal(i), 0), [items])

  function handleProductAdd(modifiers: CartModifier[], notes: string, qty: number) {
    if (!selectedProduct) return
    onAddItem({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      basePrice: selectedProduct.price,
      quantity: qty,
      notes,
      selectedModifiers: modifiers,
    })
    setSelectedProduct(null)
  }

  if (selectedProduct) {
    return (
      <ProductDetailPanel
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
        onAdd={handleProductAdd}
        currency={currency}
      />
    )
  }

  return (
    <div className='flex h-full flex-col'>
      <div className='mb-4 flex items-center justify-between'>
        <button
          type='button'
          onClick={onBack}
          className='flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
        >
          <ChevronLeft className='h-4 w-4' /> Back
        </button>
        {cartCount > 0 && (
          <button
            type='button'
            onClick={onNext}
            className='flex items-center gap-2 rounded-xl border border-primary bg-primary/5 px-3 py-1.5 text-sm font-semibold text-primary'
          >
            <ShoppingCart className='h-4 w-4' />
            {cartCount} item{cartCount === 1 ? '' : 's'} · {formatPrice(cartTotal, currency)}
          </button>
        )}
      </div>

      {isPending && <p className='py-8 text-center text-sm text-muted-foreground'>Loading menu…</p>}
      {isError && <p className='py-8 text-center text-sm text-destructive'>Could not load menu.</p>}

      {!(isPending || isError) && (
        <>
          {/* Category tabs */}
          <div className='mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none'>
            {categories.map((cat: CustomerCategory) => {
              const active = cat.id === effectiveCategory
              return (
                <button
                  key={cat.id}
                  type='button'
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>

          {/* Product grid */}
          <div className='flex-1 overflow-y-auto space-y-2 pr-1'>
            {products.length === 0 ? (
              <p className='py-8 text-center text-sm text-muted-foreground'>
                No items in this category.
              </p>
            ) : (
              products.map((product: CustomerProduct) => (
                <div
                  key={product.id}
                  className='flex items-start gap-3 rounded-xl border border-border bg-card p-3'
                >
                  {product.imageUrls?.[0] && (
                    <img
                      src={product.imageUrls[0]}
                      alt={product.name}
                      className='h-14 w-14 shrink-0 rounded-lg object-cover'
                    />
                  )}
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-semibold'>{product.name}</p>
                    {product.description && (
                      <p className='mt-0.5 line-clamp-1 text-xs text-muted-foreground'>
                        {product.description}
                      </p>
                    )}
                    <div className='mt-2 flex items-center justify-between gap-2'>
                      <span className='text-sm font-bold text-primary'>
                        {formatPrice(product.price, currency)}
                      </span>
                      <Button
                        size='sm'
                        variant='secondary'
                        className='rounded-xl text-secondary'
                        disabled={!product.isAvailable}
                        onClick={() => setSelectedProduct(product)}
                      >
                        {product.isAvailable ? 'Add' : 'Unavailable'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <div className='mt-4 flex justify-end border-t border-border pt-4'>
        <Button onClick={onNext} disabled={items.length === 0} className='rounded-xl px-6'>
          Review order ({items.length}) →
        </Button>
      </div>
    </div>
  )
}

// ── Step 3: Review + payment ──────────────────────────────────────────────────

function ReviewStep({
  items,
  orderType,
  tableNumber,
  customerName,
  notes,
  onNotesChange,
  paymentMethod,
  onPaymentMethodChange,
  onUpdateQty,
  onRemoveItem,
  onBack,
  onSubmit,
  isSubmitting,
  currency,
}: Readonly<{
  items: CartItem[]
  orderType: OrderType
  tableNumber?: number
  customerName: string
  notes: string
  onNotesChange: (v: string) => void
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (m: PaymentMethod) => void
  onUpdateQty: (id: string, qty: number) => void
  onRemoveItem: (id: string) => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
  currency: string
}>) {
  const total = useMemo(() => items.reduce((s, i) => s + itemTotal(i), 0), [items])

  return (
    <div className='flex h-full flex-col'>
      <button
        type='button'
        onClick={onBack}
        className='mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
      >
        <ChevronLeft className='h-4 w-4' /> Back to menu
      </button>

      <div className='flex-1 overflow-y-auto space-y-4 pr-1'>
        {/* Order summary header */}
        <div className='rounded-xl bg-muted px-4 py-3 text-sm'>
          <span className='font-semibold'>{orderType === 'DINE_IN' ? 'Dine In' : 'Takeaway'}</span>
          {tableNumber && <span className='text-muted-foreground'> · Table {tableNumber}</span>}
          {customerName && <span className='text-muted-foreground'> · {customerName}</span>}
        </div>

        {/* Items */}
        <div className='space-y-2'>
          {items.map((item) => (
            <div key={item.id} className='rounded-xl border border-border p-3'>
              <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-semibold truncate'>{item.productName}</p>
                  {item.selectedModifiers.length > 0 && (
                    <p className='mt-0.5 text-xs text-muted-foreground truncate'>
                      {item.selectedModifiers.map((m) => m.name).join(', ')}
                    </p>
                  )}
                  {item.notes && (
                    <p className='mt-0.5 text-xs italic text-muted-foreground'>"{item.notes}"</p>
                  )}
                </div>
                <div className='text-right shrink-0'>
                  <p className='text-sm font-semibold'>{formatPrice(itemTotal(item), currency)}</p>
                  <p className='text-xs text-muted-foreground'>
                    {formatPrice(itemUnitPrice(item), currency)} ea
                  </p>
                </div>
              </div>
              <div className='mt-2 flex items-center justify-between'>
                <div className='flex items-center gap-1.5 rounded-lg border border-input px-1 py-0.5'>
                  <button
                    type='button'
                    className='flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent'
                    onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                  >
                    <Minus className='h-3 w-3' />
                  </button>
                  <span className='w-5 text-center text-xs font-semibold'>{item.quantity}</span>
                  <button
                    type='button'
                    className='flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent'
                    onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                  >
                    <Plus className='h-3 w-3' />
                  </button>
                </div>
                <button
                  type='button'
                  className='flex items-center gap-1 text-xs text-destructive hover:text-destructive/80'
                  onClick={() => onRemoveItem(item.id)}
                >
                  <X className='h-3 w-3' /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className='flex items-center justify-between rounded-xl bg-muted px-4 py-3'>
          <span className='text-sm font-semibold'>Total</span>
          <span className='font-mono font-bold'>{formatPrice(total, currency)}</span>
        </div>

        {/* Payment method */}
        <div>
          <p className='mb-2 text-sm font-medium'>Payment method</p>
          <div className='grid grid-cols-3 gap-2'>
            {(
              [
                { value: 'CASH', label: '💵 Cash' },
                { value: 'POS', label: '💳 Card' },
                { value: 'ONLINE', label: '📱 Online' },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                type='button'
                onClick={() => onPaymentMethodChange(value)}
                className={`rounded-xl border py-2.5 text-sm font-medium transition-all ${
                  paymentMethod === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Order notes */}
        <div className='px-2'>
          <label className='mb-1.5 block text-sm font-medium' htmlFor='staff-order-notes'>
            Order notes <span className='font-normal text-muted-foreground'>(optional)</span>
          </label>
          <textarea
            id='staff-order-notes'
            rows={2}
            className='w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
            placeholder='E.g. birthday table, customer has nut allergy…'
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>
      </div>

      <div className='mt-4 border-t border-border pt-4'>
        <Button
          className='w-full rounded-xl'
          disabled={items.length === 0 || isSubmitting}
          onClick={onSubmit}
        >
          {isSubmitting ? 'Placing order…' : `Place order · ${formatPrice(total, currency)}`}
        </Button>
      </div>
    </div>
  )
}

// ── Main dialog ───────────────────────────────────────────────────────────────

export function CreateStaffOrderDialog({
  open,
  onClose,
}: Readonly<{
  open: boolean
  onClose: () => void
}>) {
  const activeBusiness = useActiveBusiness()
  const businessId = activeBusiness?.id ?? ''
  const currency = activeBusiness?.currency ?? 'USD'

  const [step, setStep] = useState<Step>('setup')
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN')
  const [tableId, setTableId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const { data: tables = [] } = useQuery(tablesQueryOptions())
  const selectedTable = tables.find((t) => t.id === tableId)

  const createOrderMutation = useCreateStaffOrderMutation()

  function reset() {
    setStep('setup')
    setOrderType('DINE_IN')
    setTableId('')
    setCustomerName('')
    setOrderNotes('')
    setPaymentMethod('CASH')
    setCartItems([])
  }

  function handleClose() {
    reset()
    onClose()
  }

  function addCartItem(item: Omit<CartItem, 'id'>) {
    setCartItems((prev) => [...prev, { ...item, id: crypto.randomUUID() }])
  }

  function updateQty(id: string, qty: number) {
    setCartItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
    )
  }

  function removeItem(id: string) {
    setCartItems((prev) => prev.filter((i) => i.id !== id))
  }

  async function handleSubmit() {
    try {
      await createOrderMutation.mutateAsync({
        type: orderType,
        tableId: orderType === 'DINE_IN' ? tableId : undefined,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes || undefined,
          selectedModifiers: item.selectedModifiers.map((m) => ({
            modifierId: m.modifierId,
            name: m.name,
            priceAdjustment: Number(m.priceAdjustment),
          })),
        })),
        customerName: customerName || undefined,
        notes: orderNotes || undefined,
      })
      showSuccess('Order placed successfully')
      handleClose()
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  const stepTitle: Record<Step, string> = {
    setup: 'New Order',
    menu: 'Select Items',
    review: 'Review Order',
  }

  return (
    <Modal isOpen={open} onClose={handleClose} title={stepTitle[step]}>
      <div className='min-h-105'>
        {step === 'setup' && (
          <SetupStep
            orderType={orderType}
            onOrderTypeChange={(t) => {
              setOrderType(t)
              setTableId('')
            }}
            tableId={tableId}
            onTableIdChange={setTableId}
            customerName={customerName}
            onCustomerNameChange={setCustomerName}
            onNext={() => setStep('menu')}
          />
        )}

        {step === 'menu' && (
          <MenuStep
            businessId={businessId}
            items={cartItems}
            onAddItem={addCartItem}
            onBack={() => setStep('setup')}
            onNext={() => setStep('review')}
            currency={currency}
          />
        )}

        {step === 'review' && (
          <ReviewStep
            items={cartItems}
            orderType={orderType}
            tableNumber={selectedTable?.number}
            customerName={customerName}
            notes={orderNotes}
            onNotesChange={setOrderNotes}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            onUpdateQty={updateQty}
            onRemoveItem={removeItem}
            onBack={() => setStep('menu')}
            onSubmit={() => void handleSubmit()}
            isSubmitting={createOrderMutation.isPending}
            currency={currency}
          />
        )}
      </div>
    </Modal>
  )
}
