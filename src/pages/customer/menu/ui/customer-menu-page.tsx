import { useMemo, useState } from 'react'
import type { Product } from '#/entities/product/model/types'
import { useAddToCart } from '#/features/cart/add-to-cart/model/use-add-to-cart'
import { MenuList } from '#/widgets/customer/menu-list/ui/menu-list'

interface CustomerMenuPageProps {
  tenantId: string
  products: Product[]
}

export function CustomerMenuPage({ tenantId, products }: CustomerMenuPageProps) {
  const { items, addToCart } = useAddToCart()
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'pos' | 'online'>('cash')

  const cartCount = items.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = useMemo(() => {
    const productMap = new Map(products.map((product) => [product.id, product]))
    return items.reduce((total, item) => {
      const product = productMap.get(item.productId)
      if (!product) {
        return total
      }

      return total + product.price * item.quantity
    }, 0)
  }, [items, products])

  return (
    <main className='page-wrap px-4 py-10'>
      <section className='island-shell rounded-2xl p-6'>
        <p className='island-kicker mb-2'>Customer App</p>
        <h1 className='mb-2 text-3xl font-bold text-[var(--sea-ink)]'>Menu</h1>
        <p className='mb-5 text-sm text-[var(--sea-ink-soft)]'>
          Tenant: <strong>{tenantId}</strong>
        </p>
        <ol className='mb-6 grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm sm:grid-cols-3'>
          {[
            'Scan QR and open app',
            'Browse menu and add to cart',
            'Place order and choose payment',
          ].map((step) => (
            <li key={step} className='text-[var(--sea-ink-soft)]'>
              {step}
            </li>
          ))}
        </ol>
        <MenuList products={products} onAddToCart={addToCart} />
        <div className='mt-6 grid gap-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:grid-cols-2'>
          <div>
            <h2 className='mb-2 text-lg font-semibold text-[var(--sea-ink)]'>Cart Summary</h2>
            <p className='m-0 text-sm text-[var(--sea-ink-soft)]'>
              Items: <strong>{cartCount}</strong> | Total: <strong>${cartTotal.toFixed(2)}</strong>
            </p>
          </div>
          <div>
            <h2 className='mb-2 text-lg font-semibold text-[var(--sea-ink)]'>Payment Method</h2>
            <div className='flex flex-wrap gap-2'>
              {[
                ['cash', 'Cash'],
                ['pos', 'POS terminal'],
                ['online', 'Online'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type='button'
                  className='rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--sea-ink)]'
                  onClick={() => setSelectedPayment(value as 'cash' | 'pos' | 'online')}
                  style={{
                    background:
                      selectedPayment === value ? 'var(--pill-selected-bg)' : 'transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          type='button'
          className='mt-4 rounded-md bg-[var(--lagoon-deep)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55'
          disabled={cartCount === 0}
        >
          Place Order ({selectedPayment})
        </button>
      </section>
    </main>
  )
}
