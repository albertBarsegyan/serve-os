import { createFileRoute } from '@tanstack/react-router'
import { ErrorBoundary } from '#/shared/ui/ErrorBoundary'

export const Route = createFileRoute('/staff/kitchen')({
  component: KitchenRoute,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})

function KitchenRoute() {
  const kitchenOrders = [
    { id: 'ord-101', station: 'Grill', status: 'preparing' },
    { id: 'ord-104', station: 'Pizza', status: 'queued' },
    { id: 'ord-103', station: 'Dessert', status: 'ready' },
  ]

  return (
    <main className="page-wrap px-4 py-10">
      <section className="island-shell rounded-2xl p-6">
        <p className="island-kicker mb-2">Kitchen Flow</p>
        <h1 className="mb-3 text-3xl font-bold text-[var(--sea-ink)]">
          Kitchen Display
        </h1>
        <p className="mb-5 text-sm text-[var(--sea-ink-soft)]">
          Receive order, prepare food, and mark dishes as ready for pickup.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {kitchenOrders.map((order) => (
            <article
              key={order.id}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4"
            >
              <p className="m-0 text-xs font-semibold tracking-wide text-[var(--kicker)] uppercase">
                {order.station}
              </p>
              <h2 className="my-2 text-lg font-semibold text-[var(--sea-ink)]">
                {order.id}
              </h2>
              <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
                Status: <strong className="capitalize">{order.status}</strong>
              </p>
              <button
                type="button"
                className="mt-3 rounded-md bg-[var(--lagoon-deep)] px-3 py-1.5 text-xs font-semibold text-white"
              >
                Mark Ready
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
