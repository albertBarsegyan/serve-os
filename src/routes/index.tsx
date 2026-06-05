import { createFileRoute, redirect } from '@tanstack/react-router'
import { BarChart3, ChefHat, CreditCard, LayoutDashboard, QrCode, Zap } from 'lucide-react'
import Footer from '#/components/footer.tsx'
import Header from '#/components/header.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Card, CardContent } from '#/components/ui/card'
import { getPostAuthDestination } from '#/features/business/lib/utils/business-routing.ts'
import darkImage from '#/shared/assets/illustrations/dark.png'
import lightImage from '#/shared/assets/illustrations/light.png'
import { sharedRoutePathname } from '#/shared/libs/constants/route-pathname/shared.ts'
import useThemeStore from '#/shared/store/use-theme.store.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'
import { LazyImage } from '#/shared/ui/lazy-image.tsx'

export const Route = createFileRoute('/')({
  component: LandingPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
  beforeLoad: ({ location, context }) => {
    if (location.pathname === sharedRoutePathname.HOME && context.authUser)
      throw redirect({ to: getPostAuthDestination(context.authUser) })
  },
})

function LandingPage() {
  const theme = useThemeStore((s) => s.theme)

  const imagePath = theme === 'light' ? lightImage : darkImage

  return (
    <div className='min-h-screen bg-(--header-bg) text-foreground'>
      <Header />

      <main>
        <section className='py-6 sm:py-12'>
          <LazyImage
            className='page-wrap flex items-center justify-center rounded-2xl overflow-hidden w-full h-auto'
            src={imagePath}
            alt='hero'
          />
        </section>

        {/* Features Grid */}
        <section className='py-24 sm:py-32' id='features'>
          <div className='page-wrap px-4'>
            <div className='mb-16 text-center'>
              <h2 className='mb-4 text-3xl font-black tracking-tight sm:text-5xl'>
                Everything you need to scale.
              </h2>
              <p className='mx-auto max-w-2xl font-medium text-muted-foreground sm:text-lg'>
                Powerful tools for guests, service staff, and management. All working together in
                perfect sync.
              </p>
            </div>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {[
                {
                  icon: <QrCode className='h-6 w-6' />,
                  title: 'QR-Based Ordering',
                  desc: 'Contactless menus and instant ordering. Perfect for tables, bar stools, or VIP booths.',
                },
                {
                  icon: <ChefHat className='h-6 w-6' />,
                  title: 'Service Display (KDS)',
                  desc: 'Real-time order tracking for kitchen and bars. Eliminate paper tickets forever.',
                },
                {
                  icon: <LayoutDashboard className='h-6 w-6' />,
                  title: 'Staff Dashboard',
                  desc: 'Empower your floor staff with area management and instant payment processing.',
                },
                {
                  icon: <BarChart3 className='h-6 w-6' />,
                  title: 'Advanced Analytics',
                  desc: 'Deep insights into your sales, staff performance, and inventory in real-time.',
                },
                {
                  icon: <CreditCard className='h-6 w-6' />,
                  title: 'Unified Payments',
                  desc: 'Accept cash, card, or online payments. Everything is automatically synced.',
                },
                {
                  icon: <Zap className='h-6 w-6' />,
                  title: 'Real-time Engine',
                  desc: 'Powered by WebSockets for sub-second updates across all your venue devices.',
                },
              ].map((feature, i) => (
                <Card key={i} className='group transition-all hover:shadow-xl hover:-translate-y-1'>
                  <CardContent className='pt-8'>
                    <div className='mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white'>
                      {feature.icon}
                    </div>
                    <h3 className='mb-3 text-xl font-bold'>{feature.title}</h3>
                    <p className='leading-relaxed text-muted-foreground'>{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className='py-24 sm:py-32'>
          <div className='page-wrap px-4'>
            <div className='mb-16 text-center'>
              <h2 className='mb-4 text-3xl font-black tracking-tight sm:text-5xl'>
                Simple flow. Better service.
              </h2>
              <p className='mx-auto max-w-2xl font-medium text-muted-foreground sm:text-lg'>
                ServeOS connects every touchpoint of the guest experience.
              </p>
            </div>
            <div className='relative grid grid-cols-1 gap-12 lg:grid-cols-4'>
              {[
                { step: '01', title: 'Guest Scans', desc: 'Scan QR at table, bar, or booth.' },
                {
                  step: '02',
                  title: 'Order Sent',
                  desc: 'Order goes instantly to bar or kitchen.',
                },
                {
                  step: '03',
                  title: 'Staff Delivers',
                  desc: 'Staff serves items as they are ready.',
                },
                { step: '04', title: 'Instant Pay', desc: 'Secure payment on phone or via staff.' },
              ].map((item, i) => (
                <div key={i} className='relative flex flex-col items-center text-center'>
                  <div className='mb-6 flex h-16 w-16 items-center justify-center rounded-full z-10 text-xl font-black text-primary bg-secondary shadow-lg border border-border'>
                    {item.step}
                  </div>
                  <h3 className='mb-2 text-xl font-bold'>{item.title}</h3>
                  <p className='text-sm font-medium text-muted-foreground'>{item.desc}</p>
                  {i < 3 && (
                    <div className='absolute top-8 left-1/2 hidden h-0.5 w-full bg-border lg:block' />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof / Stats */}
        <section className='bg-foreground py-24 text-background sm:py-32'>
          <div className='page-wrap px-4'>
            <div className='grid grid-cols-1 gap-12 text-center md:grid-cols-3'>
              <div>
                <p className='mb-2 text-5xl font-black text-primary'>35%</p>
                <p className='text-lg font-bold'>Faster Service</p>
                <p className='text-sm opacity-60'>Average reduction in turn-around time</p>
              </div>
              <div>
                <p className='mb-2 text-5xl font-black text-primary'>90%</p>
                <p className='text-lg font-bold'>Error Reduction</p>
                <p className='text-sm opacity-60'>Decrease in manual ordering mistakes</p>
              </div>
              <div>
                <p className='mb-2 text-5xl font-black text-primary'>10k+</p>
                <p className='text-lg font-bold'>Orders Daily</p>
                <p className='text-sm opacity-60'>Processed through the ServeOS engine</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className='py-24 sm:py-32'>
          <div className='page-wrap px-4'>
            <div className='relative overflow-hidden rounded-[3rem] bg-primary px-8 py-20 text-center text-white dark:text-black shadow-2xl sm:px-16 sm:py-32'>
              <div className='relative z-10'>
                <h2 className='mb-6 text-4xl font-black tracking-tight sm:text-6xl'>
                  Ready to transform your <br /> venue experience?
                </h2>
                <p className='mx-auto mb-10 max-w-2xl text-lg font-medium opacity-80 sm:text-xl'>
                  Join hundreds of venues using ServeOS to deliver faster service and increase guest
                  satisfaction.
                </p>
                <div className='flex flex-wrap justify-center gap-4'>
                  <Button
                    size='lg'
                    className='rounded-full bg-secondary text-primary hover:bg-secondary/90'
                  >
                    Get Started Now
                  </Button>
                </div>
              </div>
              {/* Decoration */}
              <div className='absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl' />
              <div className='absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl' />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
