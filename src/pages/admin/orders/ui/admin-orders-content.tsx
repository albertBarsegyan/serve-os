import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { ClipboardList, Eye, Loader2, Plus, Search } from 'lucide-react'
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
import { useOrderNotifications, useSelfMutationSuppression } from '#/features/notification'
import { CreateStaffOrderDialog } from '#/features/order/create-staff-order/ui/CreateStaffOrderDialog'
import { canCancelOrder } from '#/features/order/lib/can-cancel-order'
import type { Order, OrderStatus } from '#/features/platform/api/platform.types.ts'
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
import { m } from '#/paraglide/messages'
import { listOrders } from '#/shared/api/platform/platform-api.ts'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { useActiveBusiness } from '#/shared/libs/hooks/use-active-business.ts'
import { StaffPermission } from '#/shared/libs/permissions/index.ts'
import { usePermissions } from '#/shared/libs/permissions/use-permissions.ts'
import { downloadCsv, toCsv } from '#/shared/libs/utils/csv.utils.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import { useSocketConnectionStatus } from '#/shared/realtime/use-socket-connection-status'
import { Modal } from '#/shared/ui/modal'
import { PaginationControls } from '#/shared/ui/pagination-controls'
import { RealtimeStatusIndicator } from '#/shared/ui/realtime-status-indicator'

const routeApi = getRouteApi('/_admin/orders')

export const ALL_STATUSES: OrderStatus[] = [
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

function matchesSearch(order: Order, needle: string) {
  const tableLabel = order.tableId ? `table ${order.tableId}` : 'table -'
  return [order.id, order.status, tableLabel].join(' ').toLowerCase().includes(needle)
}

// ── Order detail modal ────────────────────────────────────────────────────────

function OrderDetailModal({
  businessId,
  orderId,
  onClose,
  currency,
  markSelfMutated,
}: Readonly<{
  businessId: string
  orderId: string
  onClose: () => void
  currency: string
  markSelfMutated: (orderId: string) => void
}>) {
  const { isOwner, hasPermission, staffRole } = usePermissions()

  const { data: order, isPending, isError } = useQuery(orderByIdQueryOptions(businessId, orderId))

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
    order != null && canCancelOrder(order.status, { isOwner: isOwner(), staffRole: staffRole() })
  const canRefund =
    (isOwner() || hasPermission(StaffPermission.PAYMENT_REFUND)) && order?.status === 'CLOSED'

  const refund = async () => {
    try {
      await refundMutation.mutateAsync({ orderId, data: {} })
      markSelfMutated(orderId)
      showSuccess(m.admin_orders_refund_success())
      onClose()
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  const pay = async (method: 'cash' | 'pos') => {
    try {
      if (method === 'cash') {
        await cashMutation.mutateAsync({ orderId, data: {} })
      } else {
        await posMutation.mutateAsync({ orderId, data: {} })
      }
      markSelfMutated(orderId)
      showSuccess(
        m.admin_orders_payment_processed({
          method:
            method === 'cash'
              ? m.admin_orders_payment_method_cash()
              : m.admin_orders_payment_method_pos(),
        }),
      )
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
      title={m.admin_orders_order_number({ id: orderId.slice(0, 8).toUpperCase() })}
      footer={
        <Button variant='ghost' onClick={onClose}>
          {m.admin_orders_close()}
        </Button>
      }
    >
      {isPending && (
        <p className='py-8 text-center text-sm text-muted-foreground'>
          {m.admin_orders_loading_order()}
        </p>
      )}
      {isError && (
        <p className='py-8 text-center text-sm text-destructive'>
          {m.admin_orders_failed_load_order()}
        </p>
      )}
      {order && (
        <div className='space-y-6'>
          <div className='flex flex-wrap gap-3 text-sm items-center'>
            <span className='flex items-center gap-1.5'>
              <span className='text-muted-foreground'>{m.admin_orders_status_label()}</span>
              <Badge variant={statusBadgeVariant(order.status)} className='capitalize'>
                {formatStatus(order.status)}
              </Badge>
            </span>
            <span className='flex items-center gap-1.5'>
              <span className='text-muted-foreground'>{m.admin_orders_payment_label()}</span>
              <Badge
                variant={order.paymentStatus === 'PAID' ? 'success' : 'outline'}
                className='capitalize'
              >
                {order.paymentStatus.toLowerCase()}
              </Badge>
            </span>
            <span className='text-muted-foreground'>
              {m.admin_orders_table_label()}{' '}
              <span className='font-medium text-foreground'>
                {order.table
                  ? m.admin_orders_table_number({ number: order.table.number })
                  : order.tableId
                    ? order.tableId.slice(0, 8)
                    : '—'}
              </span>
            </span>
            <span className='text-muted-foreground'>
              {m.admin_orders_type_label()}{' '}
              <span className='font-medium text-foreground capitalize'>
                {order.type.toLowerCase()}
              </span>
            </span>
          </div>

          <div>
            <p className='mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
              {m.admin_orders_items_heading()}
            </p>
            <div className='divide-y divide-border rounded-xl border border-border'>
              {order.items.length === 0 && (
                <p className='px-4 py-3 text-sm text-muted-foreground'>
                  {m.admin_orders_no_items()}
                </p>
              )}
              {order.items.map((item) => (
                <div key={item.id} className='flex items-center justify-between px-4 py-3'>
                  <div>
                    <p className='text-sm font-medium'>
                      {item.product?.name ?? item.productId.slice(0, 8)}
                    </p>
                    {item.notes && (
                      <p className='text-xs text-muted-foreground'>
                        {m.admin_orders_note({ notes: item.notes })}
                      </p>
                    )}
                    {item.selectedModifiers?.length > 0 && (
                      <p className='text-xs text-muted-foreground'>
                        +{item.selectedModifiers.map((mod) => mod.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-mono'>×{item.quantity}</p>
                    <p className='text-xs text-muted-foreground font-mono'>
                      {m.admin_orders_unit_price({
                        price: formatPrice(Number(item.unitPrice), currency),
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {Boolean(order.notes) && (
            <div className='flex items-center text-lg justify-between rounded-xl text-green-300 bg-muted px-4 py-3'>
              {m.admin_orders_note({ notes: order.notes ?? '' })}
            </div>
          )}

          <div className='flex items-center justify-between rounded-xl bg-muted px-4 py-3'>
            <span className='text-[24px] font-semibold'>{m.admin_orders_total_label()}</span>
            <span className='font-mono font-bold text-[24px]'>
              {formatPrice(Number(order.totalAmount), currency)}
            </span>
          </div>

          {canPay && (
            <div className='space-y-3 rounded-xl border border-border p-4'>
              <p className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                {m.admin_orders_process_payment()}
              </p>
              <div className='flex gap-3'>
                <Button
                  className='flex-1 rounded-xl'
                  variant='secondary'
                  disabled={isBusy}
                  onClick={() => void pay('cash')}
                >
                  {cashMutation.isPending
                    ? m.admin_orders_processing()
                    : m.admin_orders_pay_with_cash()}
                </Button>
                <Button
                  className='flex-1 rounded-xl'
                  disabled={isBusy}
                  onClick={() => void pay('pos')}
                >
                  {posMutation.isPending
                    ? m.admin_orders_processing()
                    : m.admin_orders_pay_with_pos()}
                </Button>
              </div>
            </div>
          )}

          {order.paymentStatus === 'PAID' && (
            <p className='rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700'>
              {m.admin_orders_already_paid()}
            </p>
          )}

          {canCancel && (
            <div className='rounded-xl border border-destructive/20 p-4'>
              <p className='mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                {m.admin_orders_cancel_order()}
              </p>
              <Button
                variant='outline'
                className='w-full rounded-xl border-destructive text-destructive hover:bg-destructive/10'
                disabled={isBusy}
                onClick={async () => {
                  try {
                    await cancelMutation.mutateAsync({
                      orderId,
                      data: { status: 'CANCELLED' },
                      businessId,
                    })
                    markSelfMutated(orderId)
                    showSuccess(m.admin_orders_order_cancelled())
                    onClose()
                  } catch (err) {
                    showError(getResponseErrorMessage(err))
                  }
                }}
              >
                {cancelMutation.isPending
                  ? m.admin_orders_cancelling()
                  : m.admin_orders_cancel_order()}
              </Button>
            </div>
          )}

          {canRefund && (
            <div className='rounded-xl border border-destructive/20 p-4'>
              <p className='mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                {m.admin_orders_refund_order()}
              </p>
              <Button
                variant='outline'
                className='w-full rounded-xl border-destructive text-destructive hover:bg-destructive/10'
                disabled={isBusy}
                onClick={() => void refund()}
              >
                {refundMutation.isPending
                  ? m.admin_orders_refunding()
                  : m.admin_orders_refund_order()}
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
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const { status: activeFilter, q: searchText, page, limit } = search

  const [detailOrderId, setDetailOrderId] = useState<string | null>(null)
  const [addOrderOpen, setAddOrderOpen] = useState(false)
  const [pendingOrderIds, setPendingOrderIds] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)
  const activeBusiness = useActiveBusiness()
  const currency = activeBusiness?.currency ?? 'USD'
  const businessId = activeBusiness?.id ?? ''
  const { isOwner, hasPermission } = usePermissions()
  const canAddOrder = isOwner() || hasPermission(StaffPermission.ORDER_CREATE)
  const { markSelfMutated, isSelfMutated } = useSelfMutationSuppression()

  useOrderNotifications({ room: 'business', id: businessId, isSelfMutated })
  const isRealtimeConnected = useSocketConnectionStatus(!!businessId)

  const updateSearch = (patch: Partial<typeof search>) => {
    void navigate({
      search: (prev) => ({ ...prev, ...patch }),
      replace: true,
    })
  }

  const statusFilter = activeFilter === 'all' ? undefined : activeFilter
  const {
    data: pagedOrders,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(
    pagedOrdersQueryOptions(
      businessId,
      page,
      limit,
      statusFilter ? { status: statusFilter } : undefined,
    ),
  )

  const orders = pagedOrders?.data ?? []

  const filteredOrders = useMemo(() => {
    const needle = searchText.trim().toLowerCase()
    if (!needle) return orders
    return orders.filter((order) => matchesSearch(order, needle))
  }, [orders, searchText])

  const handleFilterChange = (status: OrderStatus | 'all') => {
    updateSearch({ status, page: 1 })
  }

  const handleSearch = (value: string) => {
    updateSearch({ q: value, page: 1 })
  }

  const handleExportCsv = async () => {
    setIsExporting(true)
    try {
      const allOrders = await listOrders(statusFilter ? { status: statusFilter } : undefined)
      const needle = searchText.trim().toLowerCase()
      const rows = (
        needle ? allOrders.filter((order) => matchesSearch(order, needle)) : allOrders
      ).map((order) => [
        order.id,
        order.table
          ? m.admin_orders_table_number({ number: order.table.number })
          : (order.tableId ?? ''),
        formatStatus(order.status),
        order.paymentStatus,
        order.type,
        order.items.length,
        Number(order.totalAmount).toFixed(2),
        order.createdAt,
      ])

      const csv = toCsv(
        [
          m.admin_orders_table_head_order_id(),
          m.admin_orders_table_head_table(),
          m.admin_orders_table_head_status(),
          m.admin_orders_csv_payment_status(),
          m.admin_orders_csv_type(),
          m.admin_orders_table_head_items(),
          m.admin_orders_csv_total_currency({ currency }),
          m.admin_orders_csv_created_at(),
        ],
        rows,
      )
      downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}.csv`, csv)
      showSuccess(m.admin_orders_export_success({ count: rows.length }))
    } catch (err) {
      showError(getResponseErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  // READY → DELIVERED only exists for DINE_IN orders (backend OrderTransitionService);
  // takeaway/delivery orders go straight from READY to CLOSED via the payment flow instead.
  const getNextStatus = (
    order: Order,
  ): 'IN_KITCHEN' | 'READY' | 'DELIVERED' | 'CLOSED' | undefined => {
    switch (order.status) {
      case 'CONFIRMED':
        return 'IN_KITCHEN'
      case 'IN_KITCHEN':
        return 'READY'
      case 'READY':
        return order.type === 'DINE_IN' ? 'DELIVERED' : undefined
      case 'DELIVERED':
        return 'CLOSED'
      default:
        return undefined
    }
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
      markSelfMutated(orderId)
      showSuccess(m.admin_orders_order_confirmed())
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
      await updateMutation.mutateAsync({ orderId, data: { status }, businessId })
      markSelfMutated(orderId)
      showSuccess(m.admin_orders_status_updated())
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
          <h1 className='text-3xl font-semibold tracking-tight'>{m.admin_orders_heading()}</h1>
          <p className='text-muted-foreground'>{m.admin_orders_subtitle()}</p>
        </div>
        <div className='flex items-center gap-3'>
          <RealtimeStatusIndicator isConnected={isRealtimeConnected} />
          <Button
            disabled={!pagedOrders?.total || isExporting}
            size='sm'
            className='rounded-full'
            type='button'
            onClick={() => void handleExportCsv()}
          >
            {isExporting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {isExporting ? m.admin_orders_exporting() : m.admin_orders_export_csv()}
          </Button>
          {canAddOrder && (
            <Button
              size='sm'
              className='rounded-full'
              type='button'
              onClick={() => setAddOrderOpen(true)}
            >
              <Plus className='mr-2 h-4 w-4' /> {m.admin_orders_add_order()}
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
            {m.admin_orders_retry()}
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
                  {status === 'all' ? m.admin_orders_filter_all() : formatStatus(status)}
                </button>
              ))}
            </div>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <input
                type='text'
                placeholder={m.admin_orders_search_placeholder()}
                className='h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-64'
                value={searchText}
                onChange={(event) => handleSearch(event.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='pl-8'>{m.admin_orders_table_head_order_id()}</TableHead>
                <TableHead>{m.admin_orders_table_head_table()}</TableHead>
                <TableHead>{m.admin_orders_table_head_status()}</TableHead>
                <TableHead>{m.admin_orders_table_head_items()}</TableHead>
                <TableHead>{m.admin_orders_table_head_total()}</TableHead>
                {/*<TableHead>{m.admin_orders_table_head_total()}</TableHead>*/}
                <TableHead>Notes</TableHead>
                <TableHead className='pr-8 text-right'>
                  {m.admin_orders_table_head_actions()}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending && (
                <TableRow>
                  <TableCell colSpan={6} className='h-32 text-center text-muted-foreground'>
                    {m.admin_orders_loading_orders()}
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
                      <h3 className='mb-1 text-base font-semibold'>
                        {m.admin_orders_empty_heading()}
                      </h3>
                      <p className='max-w-xs text-sm text-muted-foreground'>
                        {m.admin_orders_empty_description()}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isPending && orders.length > 0 && filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className='h-32 text-center text-muted-foreground'>
                    {m.admin_orders_no_search_results()}
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
                      ? m.admin_orders_table_number({ number: order.table.number })
                      : order.tableId
                        ? `#${order.tableId.slice(0, 6)}`
                        : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(order.status)} className='capitalize'>
                      {formatStatus(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{m.admin_orders_items_count({ count: order.items.length })}</TableCell>
                  <TableCell className='font-bold'>
                    {formatPrice(Number(order.totalAmount), currency)}
                  </TableCell>
                  <TableCell>{order.notes}</TableCell>

                  <TableCell className='w-60 min-w-60 pr-8 text-right'>
                    <div className='flex justify-end gap-2'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='rounded-full'
                        type='button'
                        title={m.admin_orders_view_details_title()}
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
                          {pendingOrderIds.has(order.id)
                            ? m.admin_orders_confirming()
                            : m.admin_orders_confirm()}
                        </Button>
                      )}
                      {order.status !== 'CREATED' && getNextStatus(order) && (
                        <Button
                          variant='secondary'
                          size='sm'
                          type='button'
                          className='rounded-full'
                          disabled={pendingOrderIds.has(order.id)}
                          onClick={() => {
                            const next = getNextStatus(order)
                            if (next) void moveOrderForward(order.id, next)
                          }}
                        >
                          {pendingOrderIds.has(order.id)
                            ? '…'
                            : m.admin_orders_to_status({
                                status: String(getNextStatus(order))
                                  .toLowerCase()
                                  .replaceAll('_', ' '),
                              })}
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
              onPageChange={(p) => updateSearch({ page: p })}
              onLimitChange={(l) => updateSearch({ limit: l, page: 1 })}
            />
          )}
        </CardContent>
      </Card>

      {detailOrderId && (
        <OrderDetailModal
          businessId={businessId}
          orderId={detailOrderId}
          onClose={() => setDetailOrderId(null)}
          currency={currency}
          markSelfMutated={markSelfMutated}
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
