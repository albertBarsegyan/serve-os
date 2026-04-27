import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { menuProductsQueryOptions } from '#/entities/product/api/query-options'
import { useAddToCart } from '#/features/cart/add-to-cart/model/use-add-to-cart'
import { useCustomerOrderFlow } from '#/features/customer/place-order/model/use-customer-order-flow'
import { getApiErrorMessage } from '#/shared/api/parse-api-error'
import { MenuList } from '#/widgets/customer/menu-list/ui/menu-list'

interface CustomerMenuContentProps {
	businessId: string
	tableId: string
	sessionToken: string
}

export function CustomerMenuContent({
	businessId,
	tableId,
	sessionToken,
}: CustomerMenuContentProps) {
	const { data: products = [], isPending, isError, error, refetch } = useQuery(
		menuProductsQueryOptions(businessId),
	)
	const { items, addToCart } = useAddToCart()
	const { placeOrder } = useCustomerOrderFlow()
	const [selectedPayment, setSelectedPayment] = useState<'cash' | 'pos' | 'online'>('cash')
	const [orderMessage, setOrderMessage] = useState<string | null>(null)
	const [orderError, setOrderError] = useState<string | null>(null)

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

	const missingContext = !businessId.trim() || !tableId.trim()

	return (
		<main className='page-wrap px-4 py-10'>
			<section className='island-shell rounded-2xl p-6'>
				<p className='island-kicker mb-2'>Customer App</p>
				<h1 className='mb-2 text-3xl font-bold text-[var(--sea-ink)]'>Menu</h1>
				<p className='mb-5 text-sm text-[var(--sea-ink-soft)]'>
					Business: <strong className='break-all'>{businessId || '—'}</strong>
					{' · '}
					Table: <strong>{tableId || '—'}</strong>
				</p>
				{missingContext && (
					<p className='mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900'>
						Add <code>businessId</code> and <code>tableId</code> to the URL, or set{' '}
						<code>VITE_DEV_BUSINESS_ID</code> / <code>VITE_DEV_DEFAULT_TABLE_ID</code> in{' '}
						<code>.env</code>.
					</p>
				)}
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
				{isPending && (
					<p className='text-sm text-[var(--sea-ink-soft)]' role='status'>
						Loading menu…
					</p>
				)}
				{isError && (
					<div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900'>
						<p className='m-0'>{getApiErrorMessage(error)}</p>
						<button
							type='button'
							className='mt-2 text-sm font-semibold text-red-800 underline'
							onClick={() => {
								void refetch()
							}}
						>
							Retry
						</button>
					</div>
				)}
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
				{orderMessage && (
					<p className='mt-3 text-sm font-medium text-emerald-700' role='status'>
						{orderMessage}
					</p>
				)}
				{orderError && (
					<p className='mt-3 text-sm font-medium text-red-700' role='alert'>
						{orderError}
					</p>
				)}
				<button
					type='button'
					className='mt-4 rounded-md bg-[var(--lagoon-deep)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55'
					disabled={cartCount === 0 || placeOrder.isPending || missingContext || isPending || isError}
					onClick={async () => {
						setOrderMessage(null)
						setOrderError(null)
						try {
							const order = await placeOrder.mutateAsync({
								businessId,
								tableId,
								sessionToken: sessionToken || undefined,
								items,
								paymentMethod: selectedPayment,
							})
							setOrderMessage(`Order placed! Reference: ${order.id.slice(0, 8).toUpperCase()}`)
						} catch (e) {
							setOrderError(await getApiErrorMessage(e))
						}
					}}
				>
					{placeOrder.isPending
						? 'Submitting…'
						: `Place Order (${selectedPayment === 'pos' ? 'POS' : selectedPayment === 'online' ? 'Online' : 'Cash'})`}
				</button>
			</section>
		</main>
	)
}
