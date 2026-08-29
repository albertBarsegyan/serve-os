import { useQuery } from '@tanstack/react-query'
import { isHTTPError } from 'ky'
import { Building2, ChefHat, Maximize, Minimize, Utensils, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ThemeSwitcher } from '#/components/theme-switcher.tsx'
import { PaletteSwitcher } from '#/features/palette/ui/PaletteSwitcher.tsx'
import { cn } from '#/lib/utils.ts'
import { m } from '#/paraglide/messages'
import { displaySnapshotQueryOptions } from '#/shared/api/display/public-display-api'
import { useAutoCycleScroll } from '#/shared/libs/hooks/use-auto-cycle-scroll'
import type { DisplayOrderPayload } from '#/shared/realtime/events'
import { getSocket } from '#/shared/realtime/socket'
import { useDisplayRealtime } from '#/shared/realtime/use-display-realtime'

function OrderTicket({ order }: Readonly<{ order: DisplayOrderPayload }>) {
  return (
    <div className='rounded-2xl border border-border bg-card p-5 shadow-sm'>
      <p className='mb-3 text-lg font-bold text-foreground'>
        {order.tableNumber !== null
          ? m.customer_table({ name: String(order.tableNumber) })
          : m.staff_order_takeaway_label()}
      </p>
      <ul className='space-y-1.5'>
        {order.items.map((item, i) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: items have no stable id in this sanitized payload
            key={i}
            className='flex items-center justify-between gap-3 text-base text-muted-foreground'
          >
            <span className='truncate'>{item.name}</span>
            <span className='shrink-0 font-mono font-semibold text-foreground'>
              ×{item.quantity}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DisplayColumn({
  title,
  icon,
  orders,
  className,
}: Readonly<{
  title: string
  icon: React.ReactNode
  orders: DisplayOrderPayload[]
  className?: string
}>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  useAutoCycleScroll(scrollRef, [orders.length])

  return (
    <section className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div className='mb-4 flex items-center gap-2'>
        {icon}
        <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
        <span className='ml-1 rounded-full bg-muted px-3 py-0.5 text-sm font-semibold text-muted-foreground'>
          {orders.length}
        </span>
      </div>
      <div
        ref={scrollRef}
        className='grid flex-1 auto-rows-min grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3'
      >
        {orders.length === 0 ? (
          <p className='text-muted-foreground'>{m.display_no_orders_yet()}</p>
        ) : (
          orders.map((order) => <OrderTicket key={order.orderId} order={order} />)
        )}
      </div>
    </section>
  )
}

export function VenueDisplayPage({ token }: Readonly<{ token: string }>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useDisplayRealtime(token)

  useEffect(() => {
    if (globalThis.window === undefined) return
    const socket = getSocket()
    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)
    setIsConnected(socket.connected)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  useEffect(() => {
    if (globalThis.document === undefined) return
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement !== null)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  function toggleFullscreen() {
    if (globalThis.document === undefined) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void containerRef.current?.requestFullscreen()
    }
  }

  const { data, isPending, isError, error } = useQuery(displaySnapshotQueryOptions(token))

  const isInvalidToken = isError && isHTTPError(error) && error.response.status === 404

  if (isInvalidToken) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-8 text-center'>
        <WifiOff className='h-10 w-10 text-muted-foreground' />
        <h1 className='text-2xl font-bold'>{m.display_invalid_link_title()}</h1>
        <p className='max-w-md text-muted-foreground'>{m.display_invalid_link_body()}</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className='flex h-screen flex-col gap-6 overflow-hidden bg-background p-8 text-foreground'
    >
      <header className='flex shrink-0 items-center justify-between'>
        <div>
          <div id='businessInfo' className='flex items-center gap-2.5'>
            {data?.logoUrl ? (
              <img
                src={data.logoUrl}
                alt={data.businessName}
                className='h-9 w-9 shrink-0 rounded-lg object-cover'
              />
            ) : data?.businessName ? (
              <Building2 className='h-7 w-7 shrink-0 text-muted-foreground' />
            ) : null}
            {data?.businessName && (
              <span className='text-lg font-semibold text-foreground'>{data.businessName}</span>
            )}
          </div>
          <h1 className='text-3xl font-bold tracking-tight'>{m.display_orders_heading()}</h1>
        </div>
        {!isFullscreen && (
          <div id='controllers' className='flex items-center gap-1.5 text-sm text-muted-foreground'>
            <PaletteSwitcher />
            <ThemeSwitcher />
            <button
              type='button'
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? m.display_exit_fullscreen() : m.display_enter_fullscreen()}
              className='rounded-md p-1.5 hover:bg-muted'
            >
              {isFullscreen ? <Minimize className='h-4 w-4' /> : <Maximize className='h-4 w-4' />}
            </button>

            {isConnected ? (
              <Wifi className='h-4 w-4 text-emerald-500' />
            ) : (
              <WifiOff className='h-4 w-4 text-amber-500' />
            )}
            <span>{isConnected ? m.admin_kitchen_live() : m.display_reconnecting()}</span>
          </div>
        )}
      </header>

      {isPending ? (
        <div className='flex flex-1 items-center justify-center text-muted-foreground'>
          {m.shared_loading()}
        </div>
      ) : isError ? (
        <div className='flex flex-1 items-center justify-center text-muted-foreground'>
          {m.display_load_error()}
        </div>
      ) : (
        <div className='grid min-h-0 flex-1 grid-cols-2'>
          <DisplayColumn
            title={m.admin_kitchen_column_preparing()}
            icon={<ChefHat className='h-6 w-6 text-amber-500' />}
            orders={data?.preparing ?? []}
            className='pr-6'
          />
          <DisplayColumn
            title={m.admin_kitchen_column_ready()}
            icon={<Utensils className='h-6 w-6 text-emerald-500' />}
            orders={data?.ready ?? []}
            className='border-l border-border pl-6'
          />
        </div>
      )}
    </div>
  )
}
