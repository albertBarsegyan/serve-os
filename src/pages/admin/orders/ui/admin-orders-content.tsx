import { useQuery } from '@tanstack/react-query'
import { Eye, Filter, MoreHorizontal, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { OrderStatus } from '#/features/platform/api/platform.types.ts'
import { ordersQueryOptions } from '#/features/platform/lib/query-options.ts'
import { useUpdateOrderStatusMutation } from '#/features/platform/model/platform-hooks.ts'
import { cn } from '#/lib/utils'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader } from '#/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'

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
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  const {
    data: orders = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(ordersQueryOptions())

  const filteredOrders = useMemo(() => {
    const byStatus = activeFilter === 'all' ? orders : orders.filter((order) => order.status === activeFilter)

    const needle = search.trim().toLowerCase()
    if (!needle) return byStatus

    return byStatus.filter((order) => {
      const tableLabel = order.tableId ? `table ${order.tableId}` : 'table -'
      return [order.id, order.status, tableLabel].join(' ').toLowerCase().includes(needle)
    })
  }, [activeFilter, orders, search])

  const nextStatus: Partial<
    Record<OrderStatus, 'PREPARING' | 'READY' | 'DELIVERED' | 'CLOSED' | 'CANCELLED'>
  > = {
    CONFIRMED: 'PREPARING',
    PREPARING: 'READY',
    READY: 'DELIVERED',
    DELIVERED: 'CLOSED',
  }

  const updateMutation = useUpdateOrderStatusMutation()

  const moveOrderForward = async (
    orderId: string,
    status: 'PREPARING' | 'READY' | 'DELIVERED' | 'CLOSED' | 'CANCELLED',
  ) => {
    try {
      await updateMutation.mutateAsync({
        orderId,
        data: { status },
      })
      showSuccess('Order status updated')
    } catch (mutationError) {
      showError(getResponseErrorMessage(mutationError))
    }
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Orders</h1>
          <p className='text-muted-foreground'>Manage and track all restaurant orders in real-time.</p>
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
        <div className='rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive'>
          {getResponseErrorMessage(error)}
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
          <CardHeader className='border-b border-border'>
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
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {status === 'all' ? 'All' : status.replaceAll('_', ' ').toLowerCase()}
                </button>
              ))}
            </div>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <input
                type='text'
                placeholder='Search orders...'
                className='h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-64'
                value={search}
                onChange={(event) => setSearch(event.target.value)}
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
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className='pr-8 text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending && (
                <TableRow>
                  <TableCell colSpan={6} className='h-32 text-center text-muted-foreground'>
                    Loading orders...
                  </TableCell>
                </TableRow>
              )}

              {!isPending && filteredOrders.length > 0
                ? filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className='pl-8 font-bold'>#{order.id.slice(0, 8).toUpperCase()}</TableCell>
                      <TableCell>{order.tableId ? `Table ${order.tableId.slice(0, 6)}` : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(order.status)} className='capitalize'>
                          {order.status.toLowerCase().replaceAll('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.items.length} items</TableCell>
                      <TableCell className='font-bold'>${Number(order.totalAmount).toFixed(2)}</TableCell>
                      <TableCell className='pr-8 text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button variant='ghost' size='icon' className='rounded-full' type='button'>
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
                                  void moveOrderForward(order.id, next)
                                }
                              }}
                            >
                              To {String(nextStatus[order.status]).toLowerCase()}
                            </Button>
                          )}
                          <Button variant='ghost' size='icon' className='rounded-full' type='button'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : !isPending && (
                    <TableRow>
                      <TableCell colSpan={6} className='h-32 text-center text-muted-foreground'>
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
