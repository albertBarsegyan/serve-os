import { createFileRoute } from '@tanstack/react-router'
import { ErrorBoundary } from '#/shared/ui/ErrorBoundary'

export const Route = createFileRoute('/staff/')({
  component: StaffHome,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})

function StaffHome() {
  const flowSteps = [
    'Receive order',
    'Confirm order',
    'Handle payment',
    'Send to kitchen',
    'Deliver food',
  ]

  return (
    <main className="page-wrap px-4 py-10">
      <section className="island-shell rounded-2xl p-6">
        <p className="island-kicker mb-2">Staff App</p>
        <h1 className="mb-3 text-3xl font-bold text-[var(--sea-ink)]">
          Waiter Workspace
        </h1>
        <p className="mb-5 text-sm text-[var(--sea-ink-soft)]">
          Live order handling from confirmation to delivery.
        </p>
        <ul className="mb-5 grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm sm:grid-cols-2">
          {flowSteps.map((step, index) => (
            <li key={step} className="text-[var(--sea-ink-soft)]">
              {index + 1}. {step}
            </li>
          ))}
        </ul>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[rgba(23,58,64,0.12)]">
                <th className="py-2">Order</th>
                <th className="py-2">Table</th>
                <th className="py-2">Payment</th>
                <th className="py-2">State</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['ord-101', 'T-3', 'cash', 'confirmed', 'Send to kitchen'],
                ['ord-102', 'T-7', 'pos', 'payment pending', 'Confirm payment'],
                ['ord-103', 'T-2', 'online', 'kitchen ready', 'Deliver food'],
              ].map(([order, table, payment, state, action]) => (
                <tr key={order} className="border-b border-[rgba(23,58,64,0.08)]">
                  <td className="py-2">{order}</td>
                  <td className="py-2">{table}</td>
                  <td className="py-2 uppercase">{payment}</td>
                  <td className="py-2 capitalize">{state}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      className="rounded-md bg-[var(--lagoon-deep)] px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      {action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
