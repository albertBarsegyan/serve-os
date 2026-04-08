import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/setup')({
  component: AdminSetupRoute,
})

function AdminSetupRoute() {
  return (
    <main className='page-wrap px-4 py-10'>
      <section className='island-shell rounded-2xl p-6'>
        <p className='island-kicker mb-2'>Business Creation</p>
        <h1 className='mb-3 text-3xl font-bold text-[var(--sea-ink)]'>Restaurant Setup</h1>
        <p className='mb-6 text-sm text-[var(--sea-ink-soft)]'>
          Configure business profile, structure, and payments before going live.
        </p>

        <div className='grid gap-4 sm:grid-cols-2'>
          <article className='rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4'>
            <h2 className='mb-2 text-base font-semibold text-[var(--sea-ink)]'>
              1. Business Profile
            </h2>
            <ul className='m-0 space-y-1 pl-4 text-sm text-[var(--sea-ink-soft)]'>
              <li>Business type: Restaurant</li>
              <li>Name: Serve OS Kitchen</li>
              <li>Location: Downtown</li>
              <li>Currency: USD</li>
              <li>Working hours: 09:00 - 23:00</li>
            </ul>
          </article>

          <article className='rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4'>
            <h2 className='mb-2 text-base font-semibold text-[var(--sea-ink)]'>
              2. Structure Setup
            </h2>
            <ul className='m-0 space-y-1 pl-4 text-sm text-[var(--sea-ink-soft)]'>
              <li>Tables and QR codes</li>
              <li>Menu categories and products</li>
              <li>Staff roles: waiter, chef, admin</li>
              <li>Kitchen display screen enabled</li>
            </ul>
          </article>

          <article className='rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4'>
            <h2 className='mb-2 text-base font-semibold text-[var(--sea-ink)]'>
              3. Payment Methods
            </h2>
            <div className='flex flex-wrap gap-2'>
              {['Cash', 'POS', 'Online'].map((method) => (
                <span
                  key={method}
                  className='rounded-full border border-[var(--line)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--sea-ink)]'
                >
                  {method}
                </span>
              ))}
            </div>
          </article>

          <article className='rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4'>
            <h2 className='mb-2 text-base font-semibold text-[var(--sea-ink)]'>4. Activation</h2>
            <p className='m-0 text-sm text-[var(--sea-ink-soft)]'>
              System health check passed. Restaurant is ready to accept orders.
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}
