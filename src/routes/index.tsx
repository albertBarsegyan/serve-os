import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const stages = [
    {
      title: '1. Business Creation',
      description: 'Owner creates a restaurant and sets profile details.',
      href: '/admin/setup',
      cta: 'Open setup',
    },
    {
      title: '2. Customer Flow',
      description: 'Customer scans QR, adds items, places an order, picks payment.',
      href: '/customer/menu',
      cta: 'Open customer app',
    },
    {
      title: '3. Staff Flow',
      description: 'Waiter confirms order, handles payment, and delivers food.',
      href: '/staff',
      cta: 'Open staff app',
    },
    {
      title: '4. Kitchen Flow',
      description: 'Kitchen receives order, prepares dishes, marks ready.',
      href: '/staff/kitchen',
      cta: 'Open kitchen screen',
    },
    {
      title: '5. Order Processing',
      description: 'Admin follows statuses from new to completed.',
      href: '/admin/orders',
      cta: 'Open admin orders',
    },
  ]

  return (
    <main className='page-wrap px-4 pb-8 pt-14'>
      <section className='island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14'>
        <div className='pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,var(--hero-blob),transparent_66%)]' />
        <div className='pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,var(--hero-blob-alt),transparent_66%)]' />
        <p className='island-kicker mb-3'>Restaurant System</p>
        <h1 className='display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl'>
          Full flow from setup to order closure.
        </h1>
        <p className='mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg'>
          This UI mirrors your architecture: business setup, customer ordering, staff operations,
          kitchen preparation, payment completion, and closure.
        </p>
        <div className='flex flex-wrap gap-3'>
          <a
            href='/admin/setup'
            className='rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[var(--accent-soft-hover)]'
          >
            Start Business Setup
          </a>
        </div>
      </section>

      <section className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {stages.map((stage, index) => (
          <article
            key={stage.title}
            className='island-shell feature-card rise-in rounded-2xl p-5'
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <h2 className='mb-2 text-base font-semibold text-[var(--sea-ink)]'>{stage.title}</h2>
            <p className='mb-3 text-sm text-[var(--sea-ink-soft)]'>{stage.description}</p>
            <a href={stage.href} className='text-sm font-semibold no-underline'>
              {stage.cta}
            </a>
          </article>
        ))}
      </section>

      <section className='island-shell mt-8 rounded-2xl p-6'>
        <p className='island-kicker mb-2'>Payment Flow</p>
        <ul className='m-0 list-disc space-y-2 pl-5 text-sm text-[var(--sea-ink-soft)]'>
          <li>Cash: waiter confirms the payment manually.</li>
          <li>POS: terminal is used then waiter confirms.</li>
          <li>Online: payment is confirmed automatically by bank gateway.</li>
        </ul>
      </section>
    </main>
  )
}
