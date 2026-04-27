import { ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '#/lib/utils'
import { Button } from '#/shared/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/ui/Card'

export function AdminDashboardPage() {
  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-extrabold'>Welcome back, John</h1>
        <p className='text-[var(--sea-ink-soft)]'>Here's what's happening at your venue today.</p>
      </div>

      <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
        {/* Revenue Card */}
        <Card className='lg:col-span-2'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle className='text-base text-[var(--sea-ink-soft)]'>Revenue</CardTitle>
              <div className='mt-2 flex items-baseline gap-4'>
                <span className='text-3xl font-black'>IDR 7.852.000</span>
                <span className='flex items-center text-xs font-bold text-emerald-500'>
                  <ArrowUp className='mr-1 h-3 w-3' /> 2.1%{' '}
                  <span className='ml-1 text-[var(--sea-ink-soft)] font-normal'>vs last week</span>
                </span>
              </div>
              <p className='mt-2 text-xs text-[var(--sea-ink-soft)]'>Sales from 1-12 Dec, 2020</p>
            </div>
            <Button
              variant='outline'
              size='sm'
              className='rounded-xl text-[#5D5FEF] border-[#E8EBFD] hover:bg-[#E8EBFD]'
            >
              View Report
            </Button>
          </CardHeader>
          <CardContent>
            {/* Bar Chart Mockup */}
            <div className='mt-4 flex h-48 items-end justify-between gap-2 px-4'>
              {[40, 60, 45, 70, 55, 85, 50, 65, 40, 60, 45, 75].map((height, i) => (
                <div key={i} className='group relative flex flex-1 flex-col items-center gap-2'>
                  <div
                    className={cn(
                      'w-full rounded-t-sm transition-all group-hover:bg-[#5D5FEF]',
                      i === 5 || i === 11 ? 'bg-[#5D5FEF]' : 'bg-[#C7C9FF]',
                    )}
                    style={{ height: `${height}%` }}
                  />
                  <span className='text-[10px] font-medium text-[#B0B0B0]'>
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
            <div className='mt-6 flex gap-6 px-4'>
              <div className='flex items-center gap-2'>
                <div className='h-2.5 w-2.5 rounded-full bg-[#5D5FEF]' />
                <span className='text-xs font-medium text-[var(--sea-ink-soft)]'>Last 6 days</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='h-2.5 w-2.5 rounded-full bg-[#E0E0E0]' />
                <span className='text-xs font-medium text-[var(--sea-ink-soft)]'>Last Week</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Time Card */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle className='text-base text-[var(--sea-ink-soft)]'>Order Time</CardTitle>
              <p className='mt-1 text-xs text-[var(--sea-ink-soft)]'>From 1-6 Dec, 2020</p>
            </div>
            <Button
              variant='outline'
              size='sm'
              className='rounded-xl text-[#5D5FEF] border-[#E8EBFD] hover:bg-[#E8EBFD]'
            >
              View Report
            </Button>
          </CardHeader>
          <CardContent className='flex flex-col items-center pt-4'>
            <div className='relative h-48 w-48'>
              {/* Donut Chart SVG */}
              <svg viewBox='0 0 100 100' className='h-full w-full -rotate-90'>
                <title>Restaurant app</title>
                <circle
                  cx='50'
                  cy='50'
                  r='40'
                  fill='transparent'
                  stroke='#E8EBFD'
                  strokeWidth='12'
                />
                <circle
                  cx='50'
                  cy='50'
                  r='40'
                  fill='transparent'
                  stroke='#5D5FEF'
                  strokeWidth='12'
                  strokeDasharray='251.2'
                  strokeDashoffset='150.72'
                  strokeLinecap='round'
                />
                <circle
                  cx='50'
                  cy='50'
                  r='40'
                  fill='transparent'
                  stroke='#A5A6F6'
                  strokeWidth='12'
                  strokeDasharray='251.2'
                  strokeDashoffset='220.08'
                  strokeLinecap='round'
                />
              </svg>
              {/* Tooltip mockup */}
              <div className='absolute right-[-20px] top-[10px] z-10 rounded-xl bg-[#2D2D2D] p-3 text-white shadow-xl'>
                <p className='text-[10px] font-medium opacity-60'>Afternoon</p>
                <p className='text-[10px]'>1pm - 4pm</p>
                <p className='mt-1 text-sm font-bold'>1.890 orders</p>
                <div className='absolute bottom-[-6px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-[#2D2D2D]' />
              </div>
            </div>
            <div className='mt-12 grid w-full grid-cols-3 gap-2'>
              <div className='flex flex-col items-center gap-1'>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full bg-[#5D5FEF]' />
                  <span className='text-[10px] font-bold'>Afternoon</span>
                </div>
                <span className='text-xs text-[var(--sea-ink-soft)]'>40%</span>
              </div>
              <div className='flex flex-col items-center gap-1'>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full bg-[#A5A6F6]' />
                  <span className='text-[10px] font-bold'>Evening</span>
                </div>
                <span className='text-xs text-[var(--sea-ink-soft)]'>32%</span>
              </div>
              <div className='flex flex-col items-center gap-1'>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full bg-[#E8EBFD]' />
                  <span className='text-[10px] font-bold'>Morning</span>
                </div>
                <span className='text-xs text-[var(--sea-ink-soft)]'>28%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Rating Card */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Your Rating</CardTitle>
            <CardDescription className='text-xs'>
              Lorem ipsum dolor sit amet, consectetur
            </CardDescription>
          </CardHeader>
          <CardContent className='flex h-64 items-center justify-center p-0'>
            <div className='relative h-48 w-64'>
              <div className='absolute bottom-0 left-0 flex h-32 w-32 flex-col items-center justify-center rounded-full bg-[#26C1C9] text-white'>
                <span className='text-xl font-black'>92%</span>
                <span className='text-[10px]'>Packaging</span>
              </div>
              <div className='absolute top-0 left-12 flex h-32 w-32 flex-col items-center justify-center rounded-full bg-[#7B79FF] text-white border-4 border-white'>
                <span className='text-xl font-black'>85%</span>
                <span className='text-[10px]'>Hygiene</span>
              </div>
              <div className='absolute bottom-4 right-0 flex h-36 w-36 flex-col items-center justify-center rounded-full bg-[#FF9F2D] text-white border-4 border-white'>
                <span className='text-2xl font-black'>85%</span>
                <span className='text-[10px]'>Food Taste</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Most Ordered Food Card */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Most Ordered Food</CardTitle>
            <CardDescription className='text-xs'>
              Adipiscing elit, sed do eiusmod tempor
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {[
              {
                name: 'Fresh Salad Bowl',
                price: 'IDR 45.000',
                img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&h=100&fit=crop',
              },
              {
                name: 'Chicken Noodles',
                price: 'IDR 75.000',
                img: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=100&h=100&fit=crop',
              },
              {
                name: 'Smoothie Fruits',
                price: 'IDR 45.000',
                img: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=100&h=100&fit=crop',
              },
              {
                name: 'Hot Chicken Wings',
                price: 'IDR 45.000',
                img: 'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?w=100&h=100&fit=crop',
              },
            ].map((item, i) => (
              <div key={i} className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='h-10 w-10 overflow-hidden rounded-lg'>
                    <img src={item.img} alt={item.name} className='h-full w-full object-cover' />
                  </div>
                  <span className='text-sm font-bold text-[#2D2D2D]'>{item.name}</span>
                </div>
                <span className='text-xs font-medium text-[var(--sea-ink-soft)]'>{item.price}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Order Card */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle className='text-base text-[var(--sea-ink-soft)]'>Order</CardTitle>
              <div className='mt-2 flex items-baseline gap-4'>
                <span className='text-3xl font-black'>2.568</span>
                <span className='flex items-center text-xs font-bold text-red-500'>
                  <ArrowDown className='mr-1 h-3 w-3' /> 2.1%{' '}
                  <span className='ml-1 text-[var(--sea-ink-soft)] font-normal'>vs last week</span>
                </span>
              </div>
              <p className='mt-2 text-xs text-[var(--sea-ink-soft)]'>Sales from 1-6 Dec, 2020</p>
            </div>
            <Button
              variant='outline'
              size='sm'
              className='rounded-xl text-[#5D5FEF] border-[#E8EBFD] hover:bg-[#E8EBFD]'
            >
              View Report
            </Button>
          </CardHeader>
          <CardContent className='pt-6'>
            {/* Line Chart Mockup */}
            <div className='relative h-32 w-full'>
              <svg viewBox='0 0 200 60' className='h-full w-full overflow-visible'>
                <title>Restaurant icon</title>
                <path
                  d='M0,40 L40,45 L80,35 L120,40 L160,30 L200,10'
                  fill='transparent'
                  stroke='#5D5FEF'
                  strokeWidth='2'
                />
                <path
                  d='M0,30 L40,25 L80,45 L120,35 L160,40 L200,20'
                  fill='transparent'
                  stroke='#E0E0E0'
                  strokeWidth='2'
                />
              </svg>
            </div>
            <div className='mt-4 flex justify-between px-2 text-[10px] font-medium text-[#B0B0B0]'>
              <span>01</span>
              <span>02</span>
              <span>03</span>
              <span>04</span>
              <span>05</span>
              <span>06</span>
            </div>
            <div className='mt-6 flex gap-6'>
              <div className='flex items-center gap-2'>
                <div className='h-2.5 w-2.5 rounded-full bg-[#5D5FEF]' />
                <span className='text-xs font-medium text-[var(--sea-ink-soft)]'>Last 6 days</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='h-2.5 w-2.5 rounded-full bg-[#E0E0E0]' />
                <span className='text-xs font-medium text-[var(--sea-ink-soft)]'>Last Week</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
