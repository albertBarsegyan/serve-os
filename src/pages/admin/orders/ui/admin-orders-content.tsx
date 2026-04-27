import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Filter, MoreHorizontal, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { orderQueryKeys, ordersQueryOptions } from '#/entities/order/api/query-options'
import type { OrderStatus } from '#/entities/order/model/types'
import { updateOrderStatus } from '#/features/order/update-order-status/model/update-order-status'
import { cn } from '#/lib/utils'
import { getApiErrorMessage } from '#/shared/api/parse-api-error'
import { Badge } from '#/shared/ui/Badge'
import { Button } from '#/shared/ui/Button'
import { Card, CardContent, CardHeader } from '#/shared/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/shared/ui/Table'

const ALL_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'DELIVERED',
  'CLOSED',
  'CANCELLED',
]

function statusBadgeVariant(status: OrderStatus): 'success' | 'info' | 'warning' | 'outline' {
  switch (status) {
    case 'CLOSED':
      return 'success'
    case 'READY':
    case 'DELIVERED':
      return 'info'
    case 'PREPARING':
    case 'CONFIRMED':
      return 'warning'
    default:
      return 'outline'
  }
}

export function AdminOrdersContent() {
  const tenantId = '100'
  const queryClient = useQueryClient()
  const {
    data: orders = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(ordersQueryOptions(tenantId))

  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all')

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') {
      return orders
    }
    return orders.filter((o) => o.status === activeFilter)
  }, [activeFilter, orders])

  const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
    PENDING: 'CONFIRMED',
    CONFIRMED: 'PREPARING',
    PREPARING: 'READY',
    READY: 'DELIVERED',
    DELIVERED: 'CLOSED',
  }

  const updateMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      updateOrderStatus(tenantId, orderId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderQueryKeys.business(tenantId) })
    },
  })

  return (
    <div className='space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-extrabold'>Orders</h1>
          <p className='text-[var(--sea-ink-soft)]'>
            Manage and track all restaurant orders in real-time.
          </p>
          {!tenantId && (
            <p className='mt-2 text-sm text-amber-800'>
              Sign in or set <code className='rounded bg-amber-100 px-1'>VITE_DEV_BUSINESS_ID</code>{' '}
              to load orders.
            </p>
          )}
        </div>
        <div className='flex items-center gap-3'>
          <Button variant='outline' size='sm' className='rounded-full' type='button'>
            <Filter className='mr-2 h-4 w-4' /> Filter
          </Button>
          <Button size='sm' className='rounded-full' type='button' variant='secondary'>
            Export CSV
          </Button>
        </div>
      </div>

      {isError && (
        <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900'>
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
        </div>
      )}

      <Card>
        <CardHeader className='border-b border-[var(--line)]'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0'>
              {(['all', ...ALL_STATUSES] as const).map((status) => (
                <button
                  type='button'
                  key={status}
                  onClick={() => setActiveFilter(status)}
                  className={cn(
                    'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                    activeFilter === status
                      ? 'bg-[var(--sea-ink)] text-white'
                      : 'text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)]',
                  )}
                >
                  {status === 'all' ? 'All' : status.replace(/_/g, ' ').toLowerCase()}
                </button>
              ))}
            </div>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sea-ink-soft)]' />
              <input
                type='text'
                placeholder='Search orders...'
                className='h-10 w-full rounded-full border border-[var(--line)] bg-[var(--bg-base)] pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-magenta)] sm:w-64'
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='pl-8'>Order ID</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className='pr-8 text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending && !orders.length && tenantId && (
                <TableRow>
                  <TableCell colSpan={7} className='h-32 text-center text-[var(--sea-ink-soft)]'>
                    Loading orders…
                  </TableCell>
                </TableRow>
              )}
              {!isPending && filteredOrders.length > 0
                ? filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className='pl-8 font-bold'>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>Table {order.table}</TableCell>
                      <TableCell>Guest</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(order.status)} className='capitalize'>
                          {order.status.toLowerCase().replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.items.length} items</TableCell>
                      <TableCell className='font-bold'>${order.total.toFixed(2)}</TableCell>
                      <TableCell className='pr-8 text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='rounded-full'
                            type='button'
                          >
                            <Eye className='h-4 w-4' />
                          </Button>
                          {nextStatus[order.status] && (
                            <Button
                              variant='secondary'
                              size='sm'
                              type='button'
                              className='rounded-full'
                              disabled={updateMutation.isPending}
                              onClick={() => {
                                const next = nextStatus[order.status]
                                if (next) {
                                  updateMutation.mutate({ orderId: order.id, status: next })
                                }
                              }}
                            >
                              To {String(nextStatus[order.status]).toLowerCase()}
                            </Button>
                          )}
                          <Button
                            variant='ghost'
                            size='icon'
                            className='rounded-full'
                            type='button'
                          >
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : !isPending && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className='h-32 text-center text-[var(--sea-ink-soft)]'
                      >
                        No orders found.
                      </TableCell>
                    </TableRow>
                  )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
