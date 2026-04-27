import { createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  BarChart3,
  ChefHat,
  CreditCard,
  LayoutDashboard,
  QrCode,
  Zap,
} from 'lucide-react'
import Footer from '#/components/footer.tsx'
import Header from '#/components/header.tsx'
import { Button } from '#/shared/ui/Button'
import { Card, CardContent } from '#/shared/ui/Card'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  return (
    <div className='min-h-screen bg-[#F8F9FD] text-[#2D2D2D]'>
      <Header />

      <main>
        {/* Hero Section */}
        <section className='relative overflow-hidden px-4 pt-20 pb-24 sm:pt-32 sm:pb-32'>
          <div className='page-wrap relative z-10'>
            <div className='flex flex-col items-center text-center'>
              <div className='animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-[#E8EBFD] bg-white px-4 py-1.5 text-xs font-bold text-[#5D5FEF] shadow-sm'>
                <span className='flex h-2 w-2 rounded-full bg-[#5D5FEF]' />
                Next-Gen Hospitality OS
              </div>
              <h1 className='animate-fade-in-up mb-6 text-5xl font-black leading-[1.1] tracking-tighter sm:text-7xl lg:text-8xl'>
                Run Your Venue <br />
                <span className='text-[#5D5FEF]'>on Autopilot.</span>
              </h1>
              <p className='animate-fade-in-up mb-10 max-w-2xl text-lg font-medium text-[#666] sm:text-xl'>
                QR ordering, real-time service flow, and seamless payments — all in one unified
                system. Built for bars, clubs, restaurants, and modern hospitality venues.
              </p>
              <div className='animate-fade-in-up flex flex-wrap justify-center gap-4'>
                <Button size='lg' className='rounded-full shadow-lg shadow-[#5D5FEF]/20'>
                  Get Started <ArrowRight className='ml-2 h-5 w-5' />
                </Button>
                <Button variant='outline' size='lg' className='rounded-full bg-white'>
                  Watch Demo
                </Button>
              </div>
            </div>

            {/* Hero Mockup Placeholder */}
            <div className='animate-fade-in-up mt-20'>
              <div className='relative mx-auto max-w-5xl rounded-[2.5rem] border border-[#E8EBFD] bg-white p-4 shadow-2xl'>
                <div className='aspect-[16/9] overflow-hidden rounded-[2rem] bg-[#F5F5F5] flex items-center justify-center'>
                  <div className='grid grid-cols-3 gap-8 p-12 w-full'>
                    <div className='h-64 rounded-2xl bg-white border border-[#E8EBFD] shadow-sm flex flex-col p-6 gap-4'>
                      <div className='h-8 w-24 rounded-lg bg-[#F5F5F5]' />
                      <div className='space-y-2'>
                        <div className='h-4 w-full rounded bg-[#F5F5F5]' />
                        <div className='h-4 w-2/3 rounded bg-[#F5F5F5]' />
                      </div>
                      <div className='mt-auto h-10 w-full rounded-xl bg-[#5D5FEF]/10' />
                    </div>
                    <div className='h-64 rounded-2xl bg-white border border-[#E8EBFD] shadow-md flex flex-col p-6 gap-4 scale-110 relative z-10'>
                      <div className='flex items-center justify-between'>
                        <div className='h-8 w-32 rounded-lg bg-[#5D5FEF]/20' />
                        <div className='h-6 w-6 rounded-full bg-[#5D5FEF]' />
                      </div>
                      <div className='space-y-3 mt-4'>
                        <div className='h-10 w-full rounded-xl bg-[#F5F5F5]' />
                        <div className='h-10 w-full rounded-xl bg-[#F5F5F5]' />
                        <div className='h-10 w-full rounded-xl bg-[#F5F5F5]' />
                      </div>
                    </div>
                    <div className='h-64 rounded-2xl bg-white border border-[#E8EBFD] shadow-sm flex flex-col p-6 gap-4'>
                      <div className='h-8 w-20 rounded-lg bg-[#F5F5F5]' />
                      <div className='mt-4 flex items-center justify-center flex-1'>
                        <div className='h-24 w-24 rounded-full border-8 border-[#5D5FEF]/10 border-t-[#5D5FEF]' />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Background Decoration */}
          <div className='pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden opacity-50'>
            <div className='h-[800px] w-[800px] rounded-full bg-[radial-gradient(circle,#5D5FEF10,transparent_70%)] blur-3xl' />
          </div>
        </section>

        {/* Features Grid */}
        <section className='bg-white py-24 sm:py-32' id='features'>
          <div className='page-wrap px-4'>
            <div className='mb-16 text-center'>
              <h2 className='mb-4 text-3xl font-black tracking-tight sm:text-5xl'>
                Everything you need to scale.
              </h2>
              <p className='mx-auto max-w-2xl font-medium text-[#666] sm:text-lg'>
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
                    <div className='mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5D5FEF]/10 text-[#5D5FEF] transition-colors group-hover:bg-[#5D5FEF] group-hover:text-white'>
                      {feature.icon}
                    </div>
                    <h3 className='mb-3 text-xl font-bold'>{feature.title}</h3>
                    <p className='leading-relaxed text-[#666]'>{feature.desc}</p>
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
              <p className='mx-auto max-w-2xl font-medium text-[#666] sm:text-lg'>
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
                  <div className='mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white text-xl font-black text-[#5D5FEF] shadow-lg border border-[#E8EBFD]'>
                    {item.step}
                  </div>
                  <h3 className='mb-2 text-xl font-bold'>{item.title}</h3>
                  <p className='text-sm font-medium text-[#666]'>{item.desc}</p>
                  {i < 3 && (
                    <div className='absolute top-8 left-1/2 hidden h-0.5 w-full bg-[#E8EBFD] lg:block' />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof / Stats */}
        <section className='bg-[#2D2D2D] py-24 text-white sm:py-32'>
          <div className='page-wrap px-4'>
            <div className='grid grid-cols-1 gap-12 text-center md:grid-cols-3'>
              <div>
                <p className='mb-2 text-5xl font-black text-[#5D5FEF]'>35%</p>
                <p className='text-lg font-bold'>Faster Service</p>
                <p className='text-sm opacity-60'>Average reduction in turn-around time</p>
              </div>
              <div>
                <p className='mb-2 text-5xl font-black text-[#5D5FEF]'>90%</p>
                <p className='text-lg font-bold'>Error Reduction</p>
                <p className='text-sm opacity-60'>Decrease in manual ordering mistakes</p>
              </div>
              <div>
                <p className='mb-2 text-5xl font-black text-[#5D5FEF]'>10k+</p>
                <p className='text-lg font-bold'>Orders Daily</p>
                <p className='text-sm opacity-60'>Processed through the ServeOS engine</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className='py-24 sm:py-32'>
          <div className='page-wrap px-4'>
            <div className='relative overflow-hidden rounded-[3rem] bg-[#5D5FEF] px-8 py-20 text-center text-white shadow-2xl sm:px-16 sm:py-32'>
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
                    className='rounded-full bg-white text-[#5D5FEF] hover:bg-[#F5F5F5]'
                  >
                    Get Started Now
                  </Button>
                  <Button
                    size='lg'
                    variant='outline'
                    className='rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20'
                  >
                    Contact Sales
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
