import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader } from '#/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import type { OrderStatus } from '#/features/platform/api/platform.types.ts'
import { ordersQueryOptions } from '#/features/platform/lib/query-options.ts'
import { useUpdateOrderStatusMutation } from '#/features/platform/model/platform-hooks.ts'
import { cn } from '#/lib/utils'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { useActiveBusiness } from '#/shared/libs/hooks/use-active-business.ts'
import {
  type OrderStatusChangedPayload,
  useKitchenSocket,
} from '#/shared/libs/hooks/use-kitchen-socket.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_admin/staff/')({
  component: WaiterWorkspace,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})

function statusVariant(status: OrderStatus): 'success' | 'info' | 'warning' | 'outline' {
  if (status === 'CLOSED') return 'success'
  if (status === 'READY' || status === 'DELIVERED') return 'info'
  if (status === 'IN_KITCHEN' || status === 'CONFIRMED') return 'warning'
  return 'outline'
}

const WAITER_STATUSES: (OrderStatus | 'all')[] = [
  'all',
  'CREATED',
  'CONFIRMED',
  'IN_KITCHEN',
  'READY',
  'DELIVERED',
]

const WAITER_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  CREATED: 'CONFIRMED',
  READY: 'DELIVERED',
  DELIVERED: 'CLOSED',
}

function formatStatus(s: string) {
  return s
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function WaiterWorkspace() {
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const activeBusiness = useActiveBusiness()
  const currency = activeBusiness?.currency ?? 'USD'
  const businessId = activeBusiness?.id ?? ''

  useKitchenSocket(businessId, undefined, (payload: OrderStatusChangedPayload) => {
    if (payload.status === 'READY') {
      const label = payload.tableName ? `Table ${payload.tableName}` : 'An order'
      showSuccess(`${label} is ready to serve!`)
    }
  })

  const { data: orders = [], isPending, isError, error, refetch } = useQuery(ordersQueryOptions())

  const updateMutation = useUpdateOrderStatusMutation()

  const filteredOrders = useMemo(() => {
    const active = activeFilter === 'all' ? orders : orders.filter((o) => o.status === activeFilter)

    const needle = search.trim().toLowerCase()
    if (!needle) return active

    return active.filter((o) =>
      [o.id, o.status, o.tableId ?? ''].join(' ').toLowerCase().includes(needle),
    )
  }, [orders, activeFilter, search])

  const advance = async (orderId: string, status: OrderStatus) => {
    try {
      await updateMutation.mutateAsync({ orderId, data: { status } })
      showSuccess('Order updated')
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Waiter Workspace</h1>
          <p className='text-muted-foreground'>
            Live order handling — confirm, serve, and close orders.
          </p>
        </div>
      </div>

      {isError && (
        <div className='rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive'>
          {getResponseErrorMessage(error)}
          <button
            type='button'
            className='ml-2 font-semibold underline'
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </div>
      )}

      <Card>
        <CardHeader className='border-b border-border'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0'>
              {WAITER_STATUSES.map((status) => (
                <button
                  key={status}
                  type='button'
                  onClick={() => setActiveFilter(status)}
                  className={cn(
                    'uppercase whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                    activeFilter === status
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {status === 'all' ? 'All' : formatStatus(status)}
                </button>
              ))}
            </div>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <input
                type='text'
                placeholder='Search orders…'
                className='h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-64'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='pl-8'>Order</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='pr-8 text-right'>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending && (
                <TableRow>
                  <TableCell colSpan={6} className='h-32 text-center text-muted-foreground'>
                    Loading orders…
                  </TableCell>
                </TableRow>
              )}
              {!isPending && filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className='h-32 text-center text-muted-foreground'>
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
              {filteredOrders.map((order) => {
                const next = WAITER_NEXT[order.status]
                return (
                  <TableRow key={order.id}>
                    <TableCell className='pl-8 font-mono text-xs font-semibold'>
                      #{order.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      {order.table
                        ? `Table ${order.table.number}`
                        : order.tableId
                          ? `#${order.tableId.slice(0, 6)}`
                          : '—'}
                    </TableCell>
                    <TableCell>{order.items.length}</TableCell>
                    <TableCell className='font-mono font-semibold'>
                      {formatPrice(Number(order.totalAmount), currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(order.status)} className='capitalize'>
                        {formatStatus(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className='pr-8 text-right'>
                      {next && (
                        <Button
                          size='sm'
                          variant='secondary'
                          className='rounded-full'
                          disabled={updateMutation.isPending}
                          onClick={() => void advance(order.id, next)}
                        >
                          → {formatStatus(next)}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
