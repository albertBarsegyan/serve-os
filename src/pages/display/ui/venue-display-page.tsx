import { useQuery } from '@tanstack/react-query'
import { isHTTPError } from 'ky'
import { ChefHat, Utensils, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ThemeSwitcher } from '#/components/theme-switcher.tsx'
import { PaletteSwitcher } from '#/features/palette/ui/PaletteSwitcher.tsx'
import { displaySnapshotQueryOptions } from '#/shared/api/display/public-display-api'
import type { DisplayOrderPayload } from '#/shared/realtime/events'
import { getSocket } from '#/shared/realtime/socket'
import { useDisplayRealtime } from '#/shared/realtime/use-display-realtime'

function OrderTicket({ order }: Readonly<{ order: DisplayOrderPayload }>) {
  return (
    <div className='rounded-2xl border border-border bg-card p-5 shadow-sm'>
      <p className='mb-3 text-lg font-bold text-foreground'>
        {order.tableNumber !== null ? `Table ${order.tableNumber}` : 'Takeaway'}
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
}: Readonly<{ title: string; icon: React.ReactNode; orders: DisplayOrderPayload[] }>) {
  return (
    <section className='flex min-h-0 flex-1 flex-col'>
      <div className='mb-4 flex items-center gap-2'>
        {icon}
        <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
        <span className='ml-1 rounded-full bg-muted px-3 py-0.5 text-sm font-semibold text-muted-foreground'>
          {orders.length}
        </span>
      </div>
      <div className='grid flex-1 auto-rows-min grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3'>
        {orders.length === 0 ? (
          <p className='text-muted-foreground'>Nothing here right now.</p>
        ) : (
          orders.map((order) => <OrderTicket key={order.orderId} order={order} />)
        )}
      </div>
    </section>
  )
}

export function VenueDisplayPage({ token }: Readonly<{ token: string }>) {
  const [isConnected, setIsConnected] = useState(false)

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

  const { data, isPending, isError, error } = useQuery(displaySnapshotQueryOptions(token))

  const isInvalidToken = isError && isHTTPError(error) && error.response.status === 404

  if (isInvalidToken) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-8 text-center'>
        <WifiOff className='h-10 w-10 text-muted-foreground' />
        <h1 className='text-2xl font-bold'>This display link isn't valid</h1>
        <p className='max-w-md text-muted-foreground'>
          It may have been regenerated or revoked. Ask your manager for a fresh link from Settings →
          TV Displays.
        </p>
      </div>
    )
  }

  return (
    <div className='flex h-screen flex-col gap-6 overflow-hidden bg-background p-8 text-foreground'>
      <header className='flex shrink-0 items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Orders</h1>
          <div></div>
        </div>
        <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
          <PaletteSwitcher />
          <ThemeSwitcher />

          {isConnected ? (
            <Wifi className='h-4 w-4 text-emerald-500' />
          ) : (
            <WifiOff className='h-4 w-4 text-amber-500' />
          )}
          <span>{isConnected ? 'Live' : 'Reconnecting…'}</span>
        </div>
      </header>

      {isPending ? (
        <div className='flex flex-1 items-center justify-center text-muted-foreground'>
          Loading…
        </div>
      ) : isError ? (
        <div className='flex flex-1 items-center justify-center text-muted-foreground'>
          Couldn't load orders — retrying automatically.
        </div>
      ) : (
        <div className='grid min-h-0 flex-1 grid-cols-1 gap-8 md:grid-cols-2'>
          <DisplayColumn
            title='Preparing'
            icon={<ChefHat className='h-6 w-6 text-amber-500' />}
            orders={data?.preparing ?? []}
          />
          <DisplayColumn
            title='Ready'
            icon={<Utensils className='h-6 w-6 text-emerald-500' />}
            orders={data?.ready ?? []}
          />
        </div>
      )}
    </div>
  )
}
