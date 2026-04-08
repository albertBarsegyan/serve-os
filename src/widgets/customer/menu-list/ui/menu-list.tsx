import type { Product } from '#/entities/product/model/types'

interface MenuListProps {
  products: Product[]
  onAddToCart: (productId: string) => void
}

export function MenuList({ products, onAddToCart }: MenuListProps) {
  if (products.length === 0) {
    return <p className="text-sm text-[var(--sea-ink-soft)]">Menu is empty.</p>
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {products.map((product) => (
        <li
          key={product.id}
          className="island-shell flex items-center justify-between rounded-xl p-4"
        >
          <div>
            <p className="m-0 font-medium text-[var(--sea-ink)]">{product.name}</p>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
              ${product.price} - {product.category}
            </p>
          </div>
          <button
            type="button"
            className="rounded-md bg-[var(--lagoon-deep)] px-3 py-1.5 text-sm font-semibold text-white"
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
