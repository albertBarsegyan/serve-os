import {useQuery} from '@tanstack/react-query'
import {AlertCircle, ArrowRight, CheckCircle2, ChefHat, Clock, Maximize2, Minimize2, Wifi, WifiOff,} from 'lucide-react'
import {useEffect, useRef, useState} from 'react'
import {Badge} from '#/components/ui/badge'
import {Button} from '#/components/ui/button'
import {Card, CardContent, CardHeader} from '#/components/ui/card'
import type {Order, OrderStatus} from '#/features/platform/api/platform.types.ts'
import {kitchenActiveOrdersQueryOptions} from '#/features/platform/lib/query-options.ts'
import {useUpdateOrderStatusMutation} from '#/features/platform/model/platform-hooks.ts'
import {cn} from '#/lib/utils'
import {showError} from '#/shared/libs/hooks/toast.ts'
import {useKitchenSocket} from '#/shared/libs/hooks/use-kitchen-socket.ts'
import {getResponseErrorMessage} from '#/shared/libs/utils/http.utils.ts'
import useActiveBusinessStore from '#/shared/store/use-active-business.store.ts'

type Column = 'queue' | 'preparing' | 'ready'

function orderColumn(status: OrderStatus): Column {
  if (status === 'CONFIRMED') return 'queue'
  if (status === 'IN_KITCHEN') return 'preparing'
  if (status === 'READY') return 'ready'
  return 'queue'
}

function formatItemLines(order: Order): string[] {
  if (!order.items.length) return ['(no line items)']
  return order.items.map((item) => {
    const name = item.product?.name ?? item.productId.slice(0, 8)
    return `${name} x${item.quantity}`
  })
}

const columns: { title: string; key: Column; icon: typeof AlertCircle; color: string }[] = [
  { title: 'Queue', key: 'queue', icon: AlertCircle, color: 'text-amber-500' },
  { title: 'Preparing', key: 'preparing', icon: ChefHat, color: 'text-blue-500' },
  { title: 'Ready', key: 'ready', icon: CheckCircle2, color: 'text-emerald-500' },
]

export function AdminKitchenContent() {
  const businessId = useActiveBusinessStore((s) => s.active?.id ?? '')
  const [isConnected, setIsConnected] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = () => {
    if (isFullscreen) {
      containerRef.current?.requestFullscreen()
    } else {
      void document.exitFullscreen()
    }
  }

  useKitchenSocket(businessId, setIsConnected)

  const {
    data: orders = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(kitchenActiveOrdersQueryOptions())

  const updateStatusMutation = useUpdateOrderStatusMutation()

  // Kitchen endpoint returns CONFIRMED, IN_KITCHEN, READY orders only
  const activeOrders = orders.filter((o) =>
    (['CONFIRMED', 'IN_KITCHEN', 'READY'] as OrderStatus[]).includes(o.status),
  )

  const advance = (orderId: string, status: Exclude<OrderStatus, 'CREATED' | 'CONFIRMED'>) => {
    updateStatusMutation.mutate(
      { orderId, data: { status } },
      { onError: (err) => showError(getResponseErrorMessage(err)) },
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col space-y-8',
        isFullscreen ? 'h-screen bg-background p-8' : 'h-[calc(100vh-10rem)]',
      )}
    >
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Kitchen Display (KDS)</h1>
          <p className='text-muted-foreground'>Real-time kitchen flow.</p>
          {!businessId && (
            <p className='mt-2 text-sm text-amber-700'>
              No active business selected. Please select a business first.
            </p>
          )}
          {isError && (
            <p className='mt-2 text-sm text-destructive'>
              {getResponseErrorMessage(error)}
              <button
                type='button'
                className='ml-2 font-semibold underline'
                onClick={() => refetch()}
              >
                Retry
              </button>
            </p>
          )}
        </div>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
            {isConnected ? (
              <Wifi className='h-3.5 w-3.5 text-emerald-500' />
            ) : (
              <WifiOff className='h-3.5 w-3.5 text-amber-500' />
            )}
            <span>{isConnected ? 'Live' : 'Polling'}</span>
          </div>
          <Badge variant='outline' className='h-8 rounded-full bg-muted px-4 text-xs font-semibold'>
            {activeOrders.length} active
          </Badge>
          <Button
            size='sm'
            variant='outline'
            type='button'
            className='rounded-full'
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button
            size='sm'
            variant='outline'
            type='button'
            className='rounded-full'
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className='h-4 w-4' /> : <Maximize2 className='h-4 w-4' />}
          </Button>
        </div>
      </div>

      <div className='grid flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-3'>
        {columns.map((col) => (
          <div key={col.key} className='flex flex-col space-y-4 overflow-hidden'>
            <div className='flex items-center justify-between px-2'>
              <div className='flex items-center gap-2'>
                <col.icon className={cn('h-5 w-5', col.color)} />
                <h3 className='text-lg font-semibold'>{col.title}</h3>
              </div>
              <Badge variant='default' className='rounded-full'>
                {activeOrders.filter((o) => orderColumn(o.status) === col.key).length}
              </Badge>
            </div>

            <div className='flex-1 space-y-4 overflow-y-auto pb-8 pr-2'>
              {activeOrders
                .filter((o) => orderColumn(o.status) === col.key)
                .map((order) => (
                  <Card key={order.id} className={cn('border transition-all hover:shadow-lg')}>
                    <CardHeader className='flex flex-row items-center justify-between pb-2'>
                      <div className='flex flex-col'>
                        <span className='text-sm font-bold'>
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className='text-lg font-semibold text-primary'>
                          {order.table ? `Table ${order.table.number}` : order.type}
                        </span>
                      </div>
                      <div className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
                        <Clock className='h-3.5 w-3.5' />
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <ul className='space-y-2'>
                        {formatItemLines(order).map((line) => (
                          <li
                            key={`${order.id}-${line}`}
                            className='flex items-center gap-2 font-medium'
                          >
                            <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                            {line}
                          </li>
                        ))}
                      </ul>

                      <div className='pt-2'>
                        {col.key === 'queue' && (
                          <Button
                            type='button'
                            className='w-full rounded-xl'
                            disabled={updateStatusMutation.isPending}
                            onClick={() => advance(order.id, 'IN_KITCHEN')}
                          >
                            Start Preparing <ArrowRight className='ml-2 h-4 w-4' />
                          </Button>
                        )}
                        {col.key === 'preparing' && (
                          <Button
                            type='button'
                            className='w-full rounded-xl'
                            disabled={updateStatusMutation.isPending}
                            onClick={() => advance(order.id, 'READY')}
                          >
                            Mark as Ready <CheckCircle2 className='ml-2 h-4 w-4' />
                          </Button>
                        )}
                        {col.key === 'ready' && (
                          <Button
                            type='button'
                            variant='outline'
                            className='w-full rounded-xl border-emerald-500 text-emerald-600'
                            disabled={updateStatusMutation.isPending}
                            onClick={() => advance(order.id, 'DELIVERED')}
                          >
                            Served
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {!isPending &&
                activeOrders.filter((o) => orderColumn(o.status) === col.key).length === 0 && (
                  <div className='flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-10 text-center'>
                    <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
                      <col.icon className={cn('h-5 w-5', col.color)} />
                    </div>
                    <p className='text-sm font-semibold'>
                      {col.key === 'queue' && 'No orders waiting'}
                      {col.key === 'preparing' && 'Nothing in progress'}
                      {col.key === 'ready' && 'Nothing ready yet'}
                    </p>
                    <p className='mt-1 max-w-[10rem] text-xs text-muted-foreground'>
                      {col.key === 'queue' && 'New orders will appear here'}
                      {col.key === 'preparing' && 'Orders you start will show here'}
                      {col.key === 'ready' && 'Completed orders will show here'}
                    </p>
                  </div>
                )}
              {isPending && col.key === 'queue' && (
                <div className='text-sm text-muted-foreground'>Loading…</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
