import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, ArrowRight, CheckCircle2, ChefHat, Clock } from 'lucide-react'

import { kitchenOrdersQueryOptions, orderQueryKeys } from '#/entities/order/api/query-options'
import type { Order, OrderStatus } from '#/entities/order/model/types'
import { updateOrderStatus } from '#/features/order/update-order-status/model/update-order-status'
import { cn } from '#/lib/utils'
import { getApiErrorMessage } from '#/shared/api/parse-api-error'
import { Badge } from '#/shared/ui/Badge'
import { Button } from '#/shared/ui/Button'
import { Card, CardContent, CardHeader } from '#/shared/ui/Card'

type Column = 'queue' | 'preparing' | 'ready'

function orderColumn(status: OrderStatus): Column {
  if (status === 'PENDING' || status === 'CONFIRMED') {
    return 'queue'
  }
  if (status === 'PREPARING') {
    return 'preparing'
  }
  if (status === 'READY') {
    return 'ready'
  }
  return 'queue'
}

function formatItemLines(order: Order): string[] {
  if (!order.items.length) {
    return ['(no line items)']
  }
  return order.items.map((l) => {
    const name = l.name ?? l.productId.slice(0, 8)
    return `${name} x${l.quantity}`
  })
}

const columns: {
  title: string
  key: Column
  icon: typeof AlertCircle
  color: string
}[] = [
  { title: 'Queue', key: 'queue', icon: AlertCircle, color: 'text-amber-500' },
  { title: 'Preparing', key: 'preparing', icon: ChefHat, color: 'text-blue-500' },
  { title: 'Ready', key: 'ready', icon: CheckCircle2, color: 'text-emerald-500' },
]

export function AdminKitchenContent() {
  const tenantId = '100'
  const queryClient = useQueryClient()
  const {
    data: orders = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(kitchenOrdersQueryOptions(tenantId))

  const updateStatus = useMutation({
    mutationFn: ({
      tenant: tid,
      orderId,
      status,
    }: {
      tenant: string
      orderId: string
      status: OrderStatus
    }) => updateOrderStatus(tid, orderId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderQueryKeys.kitchen(tenantId) })
      void queryClient.invalidateQueries({ queryKey: orderQueryKeys.business(tenantId) })
    },
  })

  const inKitchen = orders.filter(
    (o) =>
      o.status === 'PENDING' ||
      o.status === 'CONFIRMED' ||
      o.status === 'PREPARING' ||
      o.status === 'READY',
  )

  return (
    <div className='flex h-[calc(100vh-10rem)] flex-col space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-extrabold text-[var(--sea-ink)]'>Kitchen Display (KDS)</h1>
          <p className='text-[var(--sea-ink-soft)]'>
            Real-time kitchen flow. Status updates call{' '}
            <code className='rounded bg-[var(--surface)] px-1 text-xs'>
              PATCH /orders/:id/status
            </code>
            .
          </p>
          {!tenantId && (
            <p className='mt-2 text-sm text-amber-800'>
              Sign in or set <code className='rounded bg-amber-100 px-1'>VITE_DEV_BUSINESS_ID</code>
              .
            </p>
          )}
          {isError && (
            <p className='mt-2 text-sm text-red-700'>
              {getApiErrorMessage(error)}
              <button
                type='button'
                className='ml-2 font-semibold underline'
                onClick={() => {
                  void refetch()
                }}
              >
                Retry
              </button>
            </p>
          )}
        </div>
        <div className='flex items-center gap-3'>
          <Badge
            variant='outline'
            className='h-8 rounded-full bg-[var(--surface)] px-4 text-xs font-bold'
          >
            {inKitchen.length} active
          </Badge>
          <Button
            size='sm'
            variant='outline'
            type='button'
            className='rounded-full'
            onClick={() => {
              void refetch()
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className='grid flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-3'>
        {columns.map((col) => (
          <div key={col.key} className='flex flex-col space-y-4 overflow-hidden'>
            <div className='flex items-center justify-between px-2'>
              <div className='flex items-center gap-2'>
                <col.icon className={cn('h-5 w-5', col.color)} />
                <h3 className='text-lg font-bold'>{col.title}</h3>
              </div>
              <Badge variant='secondary' className='rounded-full'>
                {inKitchen.filter((o) => orderColumn(o.status) === col.key).length}
              </Badge>
            </div>

            <div className='flex-1 space-y-4 overflow-y-auto pr-2 pb-8 scrollbar-hide'>
              {inKitchen
                .filter((o) => orderColumn(o.status) === col.key)
                .map((order) => (
                  <Card
                    key={order.id}
                    className={cn(
                      'border-l-4 transition-all hover:shadow-lg',
                      order.status === 'PENDING' && orderColumn(order.status) === 'queue'
                        ? 'border-l-amber-500'
                        : 'border-l-transparent',
                    )}
                  >
                    <CardHeader className='flex flex-row items-center justify-between pb-2'>
                      <div className='flex flex-col'>
                        <span className='text-sm font-bold'>
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className='text-lg font-black text-[var(--brand-magenta)]'>
                          Table {order.table}
                        </span>
                      </div>
                      <div className='flex items-center gap-1.5 text-xs font-bold text-[var(--sea-ink-soft)]'>
                        <Clock className='h-3.5 w-3.5' />
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <ul className='space-y-2'>
                        {formatItemLines(order).map((line, i) => (
                          <li
                            key={`${order.id}-line-${i}`}
                            className='flex items-center gap-2 font-medium'
                          >
                            <div className='h-1.5 w-1.5 rounded-full bg-[var(--brand-rose)]' />
                            {line}
                          </li>
                        ))}
                      </ul>

                      <div className='pt-2'>
                        {col.key === 'queue' && (
                          <Button
                            type='button'
                            className='w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700'
                            disabled={updateStatus.isPending}
                            onClick={() => {
                              updateStatus.mutate({
                                tenant: tenantId,
                                orderId: order.id,
                                status: 'PREPARING',
                              })
                            }}
                          >
                            Start Preparing <ArrowRight className='ml-2 h-4 w-4' />
                          </Button>
                        )}
                        {col.key === 'preparing' && (
                          <Button
                            type='button'
                            className='w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700'
                            disabled={updateStatus.isPending}
                            onClick={() => {
                              updateStatus.mutate({
                                tenant: tenantId,
                                orderId: order.id,
                                status: 'READY',
                              })
                            }}
                          >
                            Mark as Ready <CheckCircle2 className='ml-2 h-4 w-4' />
                          </Button>
                        )}
                        {col.key === 'ready' && (
                          <Button
                            type='button'
                            variant='outline'
                            className='w-full rounded-xl border-emerald-500 text-emerald-600 hover:bg-emerald-50'
                            disabled={updateStatus.isPending}
                            onClick={() => {
                              updateStatus.mutate({
                                tenant: tenantId,
                                orderId: order.id,
                                status: 'DELIVERED',
                              })
                            }}
                          >
                            Served
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {!isPending &&
                inKitchen.filter((o) => orderColumn(o.status) === col.key).length === 0 && (
                  <div className='flex h-32 items-center justify-center rounded-[2rem] border-2 border-dashed border-[var(--line)] text-sm text-[var(--sea-ink-soft)]'>
                    No tickets
                  </div>
                )}
              {isPending && tenantId && inKitchen.length === 0 && col.key === 'queue' && (
                <div className='text-sm text-[var(--sea-ink-soft)]'>Loading…</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
