import type { Product } from '#/entities/product/model/types'
import { formatPrice } from '#/shared/libs/utils/price.utils'

interface MenuListProps {
  products: Product[]
  onAddToCart: (productId: string) => void
  currency?: string
}

export function MenuList({ products, onAddToCart, currency = 'USD' }: MenuListProps) {
  if (products.length === 0) {
    return <p className='text-sm text-[var(--sea-ink-soft)]'>Menu is empty.</p>
  }

  return (
    <ul className='grid gap-3 sm:grid-cols-2'>
      {products.map((product) => (
        <li
          key={product.id}
          className='island-shell flex items-center justify-between rounded-xl p-4'
        >
          <div>
            <p className='m-0 font-medium text-[var(--sea-ink)]'>{product.name}</p>
            <p className='m-0 text-sm text-[var(--sea-ink-soft)]'>
              {formatPrice(product.price, currency)} - {product.category}
            </p>
          </div>
          <button
            type='button'
            className='rounded-md bg-(--lagoon-deep) text-primary px-3 py-1.5 text-sm font-semibold'
            onClick={() => onAddToCart(product.id)}
            disabled={!product.available}
          >
            {product.available ? 'Add' : 'Unavailable'}
          </button>
        </li>
      ))}
    </ul>
  )
}
