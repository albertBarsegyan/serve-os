import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Eye, Filter, Plus, Search } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
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
import { useOrderNotifications } from '#/features/notification'
import { CreateStaffOrderDialog } from '#/features/order/create-staff-order/ui/CreateStaffOrderDialog'
import type { OrderStatus } from '#/features/platform/api/platform.types.ts'
import {
  orderByIdQueryOptions,
  pagedOrdersQueryOptions,
} from '#/features/platform/lib/query-options.ts'
import {
  useConfirmOrderMutation,
  useProcessCashPaymentMutation,
  useProcessPosPaymentMutation,
  useRefundOrderMutation,
  useUpdateOrderStatusMutation,
} from '#/features/platform/model/platform-hooks.ts'
import { cn } from '#/lib/utils'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { useActiveBusiness } from '#/shared/libs/hooks/use-active-business.ts'
import { StaffPermission } from '#/shared/libs/permissions/index.ts'
import { usePermissions } from '#/shared/libs/permissions/use-permissions.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import { Modal } from '#/shared/ui/modal'
import { type PageLimit, PaginationControls } from '#/shared/ui/pagination-controls'

const ALL_STATUSES: OrderStatus[] = [
  'CREATED',
  'CONFIRMED',
  'IN_KITCHEN',
  'READY',
  'DELIVERED',
  'CLOSED',
  'CANCELLED',
  'PAYMENT_FAILED',
  'REFUNDED',
]

function statusBadgeVariant(
  status: OrderStatus,
): 'success' | 'info' | 'warning' | 'outline' | 'destructive' {
  switch (status) {
    case 'CLOSED':
      return 'success'
    case 'READY':
    case 'DELIVERED':
      return 'info'
    case 'IN_KITCHEN':
    case 'CONFIRMED':
      return 'warning'
    case 'PAYMENT_FAILED':
    case 'REFUNDED':
      return 'destructive'
    default:
      return 'outline'
  }
}

function formatStatus(s: string) {
  return s.replaceAll('_', ' ').toLowerCase()
}

// ── Order detail modal ────────────────────────────────────────────────────────

function OrderDetailModal({
  orderId,
  onClose,
  currency,
}: Readonly<{
  orderId: string
  onClose: () => void
  currency: string
}>) {
  const tipId = useId()
  const [tipAmount, setTipAmount] = useState('')
  const { isOwner, hasPermission } = usePermissions()

  const { data: order, isPending, isError } = useQuery(orderByIdQueryOptions(orderId))

  const cashMutation = useProcessCashPaymentMutation()
  const posMutation = useProcessPosPaymentMutation()
  const cancelMutation = useUpdateOrderStatusMutation()
  const refundMutation = useRefundOrderMutation()

  const isBusy =
    cashMutation.isPending ||
    posMutation.isPending ||
    cancelMutation.isPending ||
    refundMutation.isPending

  const canTakePayment = isOwner() || hasPermission(StaffPermission.PAYMENT_TAKE)
  const canCancel =
    (isOwner() || hasPermission(StaffPermission.ORDER_CANCEL)) &&
    order != null &&
    (['CREATED', 'CONFIRMED', 'IN_KITCHEN'] as OrderStatus[]).includes(order.status)
  const canRefund =
    (isOwner() || hasPermission(StaffPermission.PAYMENT_REFUND)) &&
    order != null &&
    order.status === 'CLOSED'

  const refund = async () => {
    try {
      await refundMutation.mutateAsync({ orderId, data: {} })
      showSuccess('Order refunded')
      onClose()
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  const parsedTip = Number(tipAmount) || 0

  const pay = async (method: 'cash' | 'pos') => {
    try {
      if (method === 'cash') {
        await cashMutation.mutateAsync({ orderId, data: { tipAmount: parsedTip || undefined } })
      } else {
        await posMutation.mutateAsync({ orderId, data: { tipAmount: parsedTip || undefined } })
      }
      showSuccess(`Payment processed via ${method === 'cash' ? 'Cash' : 'POS'}`)
      onClose()
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  const canPay =
    canTakePayment &&
    order?.paymentStatus === 'UNPAID' &&
    (order.status === 'DELIVERED' || order.status === 'READY' || order.status === 'CLOSED')

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Order #${orderId.slice(0, 8).toUpperCase()}`}
      footer={
        <Button variant='ghost' onClick={onClose}>
          Close
        </Button>
      }
    >
      {isPending && (
        <p className='py-8 text-center text-sm text-muted-foreground'>Loading order…</p>
      )}
      {isError && (
        <p className='py-8 text-center text-sm text-destructive'>Failed to load order.</p>
      )}
      {order && (
        <div className='space-y-6'>
          <div className='flex flex-wrap gap-3 text-sm items-center'>
            <span className='flex items-center gap-1.5'>
              <span className='text-muted-foreground'>Status:</span>
              <Badge variant={statusBadgeVariant(order.status)} className='capitalize'>
                {formatStatus(order.status)}
              </Badge>
            </span>
            <span className='flex items-center gap-1.5'>
              <span className='text-muted-foreground'>Payment:</span>
              <Badge
                variant={order.paymentStatus === 'PAID' ? 'success' : 'outline'}
                className='capitalize'
              >
                {order.paymentStatus.toLowerCase()}
              </Badge>
            </span>
            <span className='text-muted-foreground'>
              Table:{' '}
              <span className='font-medium text-foreground'>
                {order.table
                  ? `Table ${order.table.number}`
                  : order.tableId
                    ? order.tableId.slice(0, 8)
                    : '—'}
              </span>
            </span>
            <span className='text-muted-foreground'>
              Type:{' '}
              <span className='font-medium text-foreground capitalize'>
                {order.type.toLowerCase()}
              </span>
            </span>
          </div>

          <div>
            <p className='mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
              Items
            </p>
            <div className='divide-y divide-border rounded-xl border border-border'>
              {order.items.length === 0 && (
                <p className='px-4 py-3 text-sm text-muted-foreground'>No items.</p>
              )}
              {order.items.map((item) => (
                <div key={item.id} className='flex items-center justify-between px-4 py-3'>
                  <div>
                    <p className='text-sm font-medium'>
                      {item.product?.name ?? item.productId.slice(0, 8)}
                    </p>
                    {item.notes && (
                      <p className='text-xs text-muted-foreground'>Note: {item.notes}</p>
                    )}
                    {item.selectedModifiers?.length > 0 && (
                      <p className='text-xs text-muted-foreground'>
                        +{item.selectedModifiers.map((m) => m.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-mono'>×{item.quantity}</p>
                    <p className='text-xs text-muted-foreground font-mono'>
                      {formatPrice(Number(item.unitPrice), currency)} ea
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='flex items-center justify-between rounded-xl bg-muted px-4 py-3'>
            <span className='text-sm font-semibold'>Total</span>
            <span className='font-mono font-bold'>
              {formatPrice(Number(order.totalAmount), currency)}
            </span>
          </div>

          {canPay && (
            <div className='space-y-3 rounded-xl border border-border p-4'>
              <p className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                Process Payment
              </p>
              <div className='space-y-2'>
                <label htmlFor={tipId} className='text-sm text-muted-foreground'>
                  Tip amount (optional)
                </label>
                <input
                  id={tipId}
                  type='number'
                  min='0'
                  step='0.01'
                  placeholder='0.00'
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-mono'
                />
              </div>
              <div className='flex gap-3'>
                <Button
                  className='flex-1 rounded-xl'
                  variant='secondary'
                  disabled={isBusy}
                  onClick={() => void pay('cash')}
                >
                  {cashMutation.isPending ? 'Processing…' : 'Pay with Cash'}
                </Button>
                <Button
                  className='flex-1 rounded-xl'
                  disabled={isBusy}
                  onClick={() => void pay('pos')}
                >
                  {posMutation.isPending ? 'Processing…' : 'Pay with POS'}
                </Button>
              </div>
            </div>
          )}

          {order.paymentStatus === 'PAID' && (
            <p className='rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700'>
              This order has already been paid.
            </p>
          )}

          {canCancel && (
            <div className='rounded-xl border border-destructive/20 p-4'>
              <p className='mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                Cancel Order
              </p>
              <Button
                variant='outline'
                className='w-full rounded-xl border-destructive text-destructive hover:bg-destructive/10'
                disabled={isBusy}
                onClick={async () => {
                  try {
                    await cancelMutation.mutateAsync({ orderId, data: { status: 'CANCELLED' } })
                    showSuccess('Order cancelled')
                    onClose()
                  } catch (err) {
                    showError(getResponseErrorMessage(err))
                  }
                }}
              >
                {cancelMutation.isPending ? 'Cancelling…' : 'Cancel Order'}
              </Button>
            </div>
          )}

          {canRefund && (
            <div className='rounded-xl border border-destructive/20 p-4'>
              <p className='mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                Refund Order
              </p>
              <Button
                variant='outline'
                className='w-full rounded-xl border-destructive text-destructive hover:bg-destructive/10'
                disabled={isBusy}
                onClick={() => void refund()}
              >
                {refundMutation.isPending ? 'Refunding…' : 'Refund Order'}
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminOrdersContent() {
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<PageLimit>(20)
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null)
  const [addOrderOpen, setAddOrderOpen] = useState(false)
  const [pendingOrderIds, setPendingOrderIds] = useState<Set<string>>(new Set())
  const activeBusiness = useActiveBusiness()
  const currency = activeBusiness?.currency ?? 'USD'
  const businessId = activeBusiness?.id ?? ''
  const { isOwner, hasPermission } = usePermissions()
  const canAddOrder = isOwner() || hasPermission(StaffPermission.ORDER_CREATE)

  useOrderNotifications({ room: 'business', id: businessId })

  const statusFilter = activeFilter === 'all' ? undefined : activeFilter
  const {
    data: pagedOrders,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(
    pagedOrdersQueryOptions(page, limit, statusFilter ? { status: statusFilter } : undefined),
  )

  const orders = pagedOrders?.data ?? []

  const filteredOrders = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return orders
    return orders.filter((order) => {
      const tableLabel = order.tableId ? `table ${order.tableId}` : 'table -'
      return [order.id, order.status, tableLabel].join(' ').toLowerCase().includes(needle)
    })
  }, [orders, search])

  const handleFilterChange = (status: OrderStatus | 'all') => {
    setActiveFilter(status)
    setPage(1)
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const nextStatus: Partial<
    Record<OrderStatus, 'IN_KITCHEN' | 'READY' | 'DELIVERED' | 'CLOSED' | 'CANCELLED'>
  > = {
    CONFIRMED: 'IN_KITCHEN',
    IN_KITCHEN: 'READY',
    READY: 'DELIVERED',
    DELIVERED: 'CLOSED',
  }

  const confirmMutation = useConfirmOrderMutation()
  const updateMutation = useUpdateOrderStatusMutation()

  const markPending = (orderId: string) => setPendingOrderIds((prev) => new Set([...prev, orderId]))
  const clearPending = (orderId: string) =>
    setPendingOrderIds((prev) => {
      const next = new Set(prev)
      next.delete(orderId)
      return next
    })

  const confirmOrderAction = async (orderId: string) => {
    markPending(orderId)
    try {
      await confirmMutation.mutateAsync(orderId)
      showSuccess('Order confirmed')
    } catch (mutationError) {
      showError(getResponseErrorMessage(mutationError))
    } finally {
      clearPending(orderId)
    }
  }

  const moveOrderForward = async (
    orderId: string,
    status: 'IN_KITCHEN' | 'READY' | 'DELIVERED' | 'CLOSED' | 'CANCELLED',
  ) => {
    markPending(orderId)
    try {
      await updateMutation.mutateAsync({ orderId, data: { status } })
      showSuccess('Order status updated')
    } catch (mutationError) {
      showError(getResponseErrorMessage(mutationError))
    } finally {
      clearPending(orderId)
    }
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Orders</h1>
          <p className='text-muted-foreground'>
            Manage and track all restaurant orders in real-time.
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Button variant='outline' size='sm' className='rounded-full' type='button'>
            <Filter className='mr-2 h-4 w-4' /> Filter
          </Button>
          <Button disabled={!pagedOrders?.total} size='sm' className='rounded-full' type='button'>
            Export CSV
          </Button>
          {canAddOrder && (
            <Button
              size='sm'
              className='rounded-full'
              type='button'
              onClick={() => setAddOrderOpen(true)}
            >
              <Plus className='mr-2 h-4 w-4' /> Add Order
            </Button>
          )}
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
              {(['all', ...ALL_STATUSES] as const).map((status) => (
                <button
                  type='button'
                  key={status}
                  onClick={() => handleFilterChange(status)}
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
                placeholder='Search this page…'
                className='h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-64'
                value={search}
                onChange={(event) => handleSearch(event.target.value)}
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
              {!isPending && orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className='py-16'>
                    <div className='flex flex-col items-center justify-center text-center'>
                      <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
                        <ClipboardList className='h-6 w-6 text-muted-foreground' />
                      </div>
                      <h3 className='mb-1 text-base font-semibold'>No orders yet</h3>
                      <p className='max-w-xs text-sm text-muted-foreground'>
                        Orders will appear here once customers start placing them.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isPending && orders.length > 0 && filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className='h-32 text-center text-muted-foreground'>
                    No orders match your search.
                  </TableCell>
                </TableRow>
              )}
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className='pl-8 font-bold'>
                    #{order.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    {order.table
                      ? `Table ${order.table.number}`
                      : order.tableId
                        ? `#${order.tableId.slice(0, 6)}`
                        : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(order.status)} className='capitalize'>
                      {formatStatus(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.items.length} items</TableCell>
                  <TableCell className='font-bold'>
                    {formatPrice(Number(order.totalAmount), currency)}
                  </TableCell>
                  <TableCell className='pr-8 text-right'>
                    <div className='flex justify-end gap-2'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='rounded-full'
                        type='button'
                        title='View order details'
                        onClick={() => setDetailOrderId(order.id)}
                      >
                        <Eye className='h-4 w-4' />
                      </Button>
                      {order.status === 'CREATED' && (
                        <Button
                          variant='default'
                          size='sm'
                          type='button'
                          className='rounded-full'
                          disabled={pendingOrderIds.has(order.id)}
                          onClick={() => void confirmOrderAction(order.id)}
                        >
                          {pendingOrderIds.has(order.id) ? 'Confirming…' : 'Confirm'}
                        </Button>
                      )}
                      {order.status !== 'CREATED' && nextStatus[order.status] && (
                        <Button
                          variant='secondary'
                          size='sm'
                          type='button'
                          className='rounded-full'
                          disabled={pendingOrderIds.has(order.id)}
                          onClick={() => {
                            const next = nextStatus[order.status]
                            if (next) void moveOrderForward(order.id, next)
                          }}
                        >
                          {pendingOrderIds.has(order.id)
                            ? '…'
                            : `To ${String(nextStatus[order.status]).toLowerCase().replaceAll('_', ' ')}`}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pagedOrders && pagedOrders.total > 0 && (
            <PaginationControls
              page={page}
              limit={limit}
              total={pagedOrders.total}
              totalPages={pagedOrders.totalPages}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l)
                setPage(1)
              }}
            />
          )}
        </CardContent>
      </Card>

      {detailOrderId && (
        <OrderDetailModal
          orderId={detailOrderId}
          onClose={() => setDetailOrderId(null)}
          currency={currency}
        />
      )}

      <CreateStaffOrderDialog
        selectedTableId=''
        open={addOrderOpen}
        onClose={() => setAddOrderOpen(false)}
      />
    </div>
  )
}
