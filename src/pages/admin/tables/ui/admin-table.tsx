import {
  BellRing,
  Calendar,
  CalendarX,
  Check,
  CheckCircle2,
  ChefHat,
  CreditCard,
  Edit2,
  Power,
  PowerOff,
  QrCode,
  Sparkles,
  Trash2,
  Utensils,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { CreateStaffOrderDialog } from '#/features/order/create-staff-order/ui/CreateStaffOrderDialog'
import type {
  Order,
  OrderStatus,
  Payment,
  TableEntity,
} from '#/features/platform/api/platform.types.ts'
import {
  useCloseSessionMutation,
  useConfirmOrderMutation,
  useConfirmPaymentMutation,
  useProcessCashPaymentMutation,
  useProcessPosPaymentMutation,
  useUpdateOrderStatusMutation,
} from '#/features/platform/model/platform-hooks.ts'
import { cn } from '#/lib/utils.ts'
import { useBodyScrollLock } from '#/shared/libs/hooks/scroll-lock.ts'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import type { TablePermissions } from '#/shared/libs/hooks/use-table-permissions.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { LazyImage } from '#/shared/ui/lazy-image.tsx' // ── Types ──────────────────────────────────────────────────────────────────────

// ── Types ──────────────────────────────────────────────────────────────────────

export type TableStatus =
  | 'free'
  | 'new'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'payment'
  | 'paid'

export interface AdminTableProps {
  table: TableEntity
  activeOrder: Order | null
  pendingPayment: Payment | null
  perms: TablePermissions
  handleToggleStatus: (table: TableEntity) => Promise<void>
  handleToggleReservation: (table: TableEntity) => Promise<void>
  openEditTable: (table: TableEntity) => void
  setDeletingTable: (table: TableEntity | null) => void
  setSelectedTable: (s: { label: string; qrCode: string } | null) => void
  setIsQrModalOpen: (open: boolean) => void
  isBusy: boolean
  isSessionReserved: boolean
  reservedLabel: string
  waiterCalled: boolean
  onAcknowledgeWaiter: () => void
}

// ── Status config ──────────────────────────────────────────────────────────────

type StatusConfig = {
  label: string
  description: string
  icon: React.ElementType
  nextLabel: string
  pulse: boolean
}

const STATUS_CONFIG: Record<TableStatus, StatusConfig> = {
  free: {
    label: 'Available',
    description: 'Table is free and ready for guests',
    icon: Utensils,
    nextLabel: 'Start order',
    pulse: false,
  },
  new: {
    label: 'New order',
    description: 'Order placed, awaiting confirmation',
    icon: Sparkles,
    nextLabel: 'Confirm order',
    pulse: false,
  },
  confirmed: {
    label: 'Confirmed',
    description: 'Order confirmed, ready for kitchen',
    icon: Check,
    nextLabel: 'Start preparing',
    pulse: false,
  },
  preparing: {
    label: 'In the kitchen',
    description: 'Kitchen is working on this order',
    icon: ChefHat,
    nextLabel: 'Mark ready',
    pulse: false,
  },
  ready: {
    label: 'Ready to serve',
    description: 'Order ready — bring it to the table',
    icon: CheckCircle2,
    nextLabel: 'Mark served',
    pulse: true,
  },
  served: {
    label: 'Served',
    description: 'Food delivered, awaiting payment',
    icon: Utensils,
    nextLabel: 'Open payment',
    pulse: false,
  },
  payment: {
    label: 'Payment due',
    description: 'Payment initiated, awaiting confirmation',
    icon: CreditCard,
    nextLabel: 'Confirm payment',
    pulse: true,
  },
  paid: {
    label: 'Paid',
    description: 'Payment received — ready to close',
    icon: CheckCircle2,
    nextLabel: 'Close table',
    pulse: false,
  },
}

// ── Tone maps (literal Tailwind classes — no dynamic construction) ─────────────

const TONE_BADGE: Record<TableStatus, string> = {
  free: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  new: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
  confirmed: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
  preparing: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  ready: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  served: 'bg-teal-500/15 text-teal-300 border border-teal-500/30',
  payment: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
  paid: 'bg-green-500/15 text-green-300 border border-green-500/30',
}

const TONE_DOT: Record<TableStatus, string> = {
  free: 'bg-slate-400',
  new: 'bg-sky-400',
  confirmed: 'bg-indigo-400',
  preparing: 'bg-amber-400',
  ready: 'bg-emerald-400',
  served: 'bg-teal-400',
  payment: 'bg-orange-400',
  paid: 'bg-green-400',
}

const TONE_HERO: Record<TableStatus, string> = {
  free: 'bg-slate-500/10 border-slate-500/20',
  new: 'bg-sky-500/10 border-sky-500/20',
  confirmed: 'bg-indigo-500/10 border-indigo-500/20',
  preparing: 'bg-amber-500/10 border-amber-500/20',
  ready: 'bg-emerald-500/10 border-emerald-500/20',
  served: 'bg-teal-500/10 border-teal-500/20',
  payment: 'bg-orange-500/10 border-orange-500/20',
  paid: 'bg-green-500/10 border-green-500/20',
}

const TONE_ICON: Record<TableStatus, string> = {
  free: 'text-slate-400',
  new: 'text-sky-400',
  confirmed: 'text-indigo-400',
  preparing: 'text-amber-400',
  ready: 'text-emerald-400',
  served: 'text-teal-400',
  payment: 'text-orange-400',
  paid: 'text-green-400',
}

const TONE_BUTTON: Record<TableStatus, string> = {
  free: 'bg-slate-600 hover:bg-slate-700 text-white',
  new: 'bg-sky-600 hover:bg-sky-700 text-white',
  confirmed: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  preparing: 'bg-amber-600 hover:bg-amber-700 text-white',
  ready: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  served: 'bg-teal-600 hover:bg-teal-700 text-white',
  payment: 'bg-orange-600 hover:bg-orange-700 text-white',
  paid: 'bg-green-600 hover:bg-green-700 text-white',
}

const TONE_STEPPER: Record<TableStatus, string> = {
  free: 'bg-slate-400',
  new: 'bg-sky-400',
  confirmed: 'bg-indigo-400',
  preparing: 'bg-amber-400',
  ready: 'bg-emerald-400',
  served: 'bg-teal-400',
  payment: 'bg-orange-400',
  paid: 'bg-green-400',
}

const LIFECYCLE: TableStatus[] = [
  'free',
  'new',
  'confirmed',
  'preparing',
  'ready',
  'served',
  'payment',
  'paid',
]

// ── Status derivation ──────────────────────────────────────────────────────────

const ACTIVE_ORDER_STATUSES = new Set<OrderStatus>([
  'CREATED',
  'CONFIRMED',
  'IN_KITCHEN',
  'READY',
  'DELIVERED',
  'CLOSED',
])

function deriveStatus(order: Order | null, pendingPayment: Payment | null): TableStatus {
  if (!(order && ACTIVE_ORDER_STATUSES.has(order.status))) return 'free'
  switch (order.status) {
    case 'CREATED':
      return 'new'
    case 'CONFIRMED':
      return 'confirmed'
    case 'IN_KITCHEN':
      return 'preparing'
    case 'READY':
      return 'ready'
    case 'DELIVERED':
      if (order.paymentStatus === 'PAID') return 'paid'
      return pendingPayment ? 'payment' : 'served'
    case 'CLOSED':
      return 'paid'
    default:
      return 'free'
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: TableStatus }) {
  const { label, pulse } = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        TONE_BADGE[status],
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full shrink-0',
          TONE_DOT[status],
          pulse && 'animate-pulse',
        )}
      />
      {label}
    </span>
  )
}

function StatusStepper({ status }: { status: TableStatus }) {
  const currentIdx = LIFECYCLE.indexOf(status)
  return (
    <div className='mt-4 flex items-center gap-1'>
      {LIFECYCLE.map((step, idx) => (
        <div
          key={step}
          className={cn(
            'h-1 flex-1 rounded-full transition-colors',
            idx < currentIdx
              ? 'bg-foreground/20'
              : idx === currentIdx
                ? TONE_STEPPER[status]
                : 'bg-foreground/10',
          )}
        />
      ))}
    </div>
  )
}

interface ActionButtonProps {
  icon: React.ElementType
  label: string
  onClick: () => void
  disabled?: boolean
  className?: string
}

function ActionButton({ icon: Icon, label, onClick, disabled, className }: ActionButtonProps) {
  return (
    <button
      type='button'
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-20 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card px-2 py-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <Icon className='h-5 w-5 shrink-0' />
      <span className='text-center leading-tight'>{label}</span>
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AdminTable({
  table,
  activeOrder,
  pendingPayment,
  perms,
  handleToggleStatus,
  handleToggleReservation,
  openEditTable,
  setDeletingTable,
  setSelectedTable,
  setIsQrModalOpen,
  isBusy,
  isSessionReserved,
  reservedLabel,
  waiterCalled,
  onAcknowledgeWaiter,
}: Readonly<AdminTableProps>) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false)
  const [showPaymentChoice, setShowPaymentChoice] = useState(false)
  const [localWaiterCalled, setLocalWaiterCalled] = useState(false)

  const status = deriveStatus(activeOrder, pendingPayment)
  const config = STATUS_CONFIG[status]
  const StatusIcon = config.icon

  const confirmOrderMutation = useConfirmOrderMutation()
  const updateStatusMutation = useUpdateOrderStatusMutation()
  const cashMutation = useProcessCashPaymentMutation()
  const posMutation = useProcessPosPaymentMutation()
  const confirmPaymentMutation = useConfirmPaymentMutation()
  const closeSessionMutation = useCloseSessionMutation()

  const isActionBusy =
    confirmOrderMutation.isPending ||
    updateStatusMutation.isPending ||
    cashMutation.isPending ||
    posMutation.isPending ||
    confirmPaymentMutation.isPending ||
    closeSessionMutation.isPending

  const effectiveWaiterCalled = waiterCalled || localWaiterCalled
  const hasActiveOrder = activeOrder !== null && status !== 'free'

  useBodyScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  const handlePrimaryAction = async () => {
    if (status === 'free') {
      setIsCreateOrderOpen(true)
      return
    }
    if (!activeOrder) return
    try {
      switch (status) {
        case 'new':
          await confirmOrderMutation.mutateAsync(activeOrder.id)
          showSuccess('Order confirmed')
          break
        case 'confirmed':
          await updateStatusMutation.mutateAsync({
            orderId: activeOrder.id,
            data: { status: 'IN_KITCHEN' },
          })
          showSuccess('Kitchen is preparing the order')
          break
        case 'preparing':
          await updateStatusMutation.mutateAsync({
            orderId: activeOrder.id,
            data: { status: 'READY' },
          })
          showSuccess('Order is ready!')
          break
        case 'ready':
          await updateStatusMutation.mutateAsync({
            orderId: activeOrder.id,
            data: { status: 'DELIVERED' },
          })
          showSuccess('Order served')
          break
        case 'served':
          setShowPaymentChoice(true)
          break
        case 'payment':
          if (!pendingPayment) return
          await confirmPaymentMutation.mutateAsync({ paymentId: pendingPayment.id, data: {} })
          showSuccess('Payment confirmed')
          break
        case 'paid':
          if (!table.currentSessionId) return
          await closeSessionMutation.mutateAsync(table.currentSessionId)
          showSuccess('Table is now available')
          setIsOpen(false)
          break
      }
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  const handleCancelOrder = async () => {
    if (!activeOrder) return
    try {
      await updateStatusMutation.mutateAsync({
        orderId: activeOrder.id,
        data: { status: 'CANCELLED' },
      })
      showSuccess('Order was cancelled')
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  const handlePayment = async (method: 'cash' | 'pos') => {
    if (!activeOrder) return
    try {
      if (method === 'cash') {
        await cashMutation.mutateAsync({ orderId: activeOrder.id, data: {} })
      } else {
        await posMutation.mutateAsync({ orderId: activeOrder.id, data: {} })
      }
      showSuccess('Payment due')
      setShowPaymentChoice(false)
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  const handleAcknowledge = () => {
    onAcknowledgeWaiter()
    setLocalWaiterCalled(false)
  }

  return (
    <>
      {/* ── Card (collapsed) ──────────────────────────────────────────────── */}
      <button
        type='button'
        onClick={() => setIsOpen(true)}
        className={cn(
          'group w-full overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          !table.isActive && 'opacity-60 grayscale',
        )}
      >
        {/* Banner */}
        <div className='relative aspect-[4/3] w-full bg-muted'>
          {table.imageUrl ? (
            <LazyImage
              src={table.imageUrl}
              alt={`Table ${table.number}`}
              imgClassName='h-full w-full object-contain block'
            />
          ) : (
            <div
              className={cn('flex h-full w-full items-center justify-center', TONE_HERO[status])}
            >
              <span className={cn('text-4xl font-black opacity-30', TONE_ICON[status])}>
                {table.number}
              </span>
            </div>
          )}

          <div className='absolute bottom-2 left-2'>
            <StatusPill status={status} />
          </div>

          {effectiveWaiterCalled && (
            <div className='absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm'>
              <BellRing className='h-3.5 w-3.5' />
            </div>
          )}
        </div>

        {/* Body */}
        <div className='p-3'>
          <div className='flex items-start justify-between gap-1.5'>
            <span className='text-base font-bold'>Table {table.number}</span>
            <div className='flex shrink-0 flex-wrap justify-end gap-1'>
              <Badge
                variant={table.isActive ? 'success' : 'outline'}
                className='px-1.5 py-0 text-xs'
              >
                {table.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {table.isReserved && (
                <Badge variant='warning' className='px-1.5 py-0 text-xs'>
                  Reserved
                </Badge>
              )}
            </div>
          </div>
          <p className='mt-0.5 text-xs text-muted-foreground'>{table.capacity} seats</p>
        </div>
      </button>

      {/* ── Modal (near-fullscreen) ──────────────────────────────────────── */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className='fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4'>
            {/* Backdrop */}
            <button
              type='button'
              aria-label='Close table detail'
              className='fixed inset-0 bg-background/80 backdrop-blur-sm'
              onClick={() => setIsOpen(false)}
            />

            {/* Dialog */}
            <div
              role='dialog'
              aria-modal
              aria-label={`Table ${table.number} details`}
              className='relative flex h-[92vh] max-h-[920px] w-[96vw] max-w-3xl animate-in fade-in zoom-in flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl duration-200'
            >
              {/* Close button */}
              <button
                type='button'
                aria-label='Close dialog'
                onClick={() => setIsOpen(false)}
                className='absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              >
                <X className='h-6 w-6' />
              </button>

              {/* Scrollable body */}
              <div className='flex flex-1 flex-col gap-5 overflow-y-auto p-6 pb-8'>
                {/* Header */}
                <div className='pr-16'>
                  <h2 className='text-2xl font-bold'>Table {table.number}</h2>
                  <div className='mt-2 flex flex-wrap items-center gap-2'>
                    <Badge variant={table.isActive ? 'success' : 'outline'}>
                      {table.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {table.isReserved && <Badge variant='warning'>{reservedLabel}</Badge>}
                    <span className='text-sm text-muted-foreground'>{table.capacity} seats</span>
                  </div>
                </div>

                {/* Waiter alert */}
                {effectiveWaiterCalled && (
                  <div className='flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3'>
                    <div className='flex items-center gap-2 text-amber-400'>
                      <BellRing className='h-4 w-4 shrink-0' />
                      <span className='text-sm font-medium'>Table needs a waiter</span>
                    </div>
                    <Button
                      size='sm'
                      variant='outline'
                      className='shrink-0 rounded-lg border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
                      onClick={handleAcknowledge}
                    >
                      Acknowledge
                    </Button>
                  </div>
                )}

                {/* Status hero */}
                <div className={cn('rounded-2xl border p-5', TONE_HERO[status])}>
                  <p className='mb-4 text-xs font-semibold uppercase tracking-widest opacity-50'>
                    Order status
                  </p>
                  <div className='flex items-start gap-4'>
                    <div
                      className={cn(
                        'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border',
                        TONE_HERO[status],
                      )}
                    >
                      <StatusIcon className={cn('h-7 w-7', TONE_ICON[status])} />
                    </div>
                    <div>
                      <h3 className={cn('text-xl font-bold', TONE_ICON[status])}>{config.label}</h3>
                      <p className='mt-0.5 text-sm text-muted-foreground'>{config.description}</p>
                    </div>
                  </div>
                  <StatusStepper status={status} />
                </div>

                {/* Primary action */}
                {showPaymentChoice ? (
                  <div className='space-y-3 rounded-xl border border-border p-4'>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Choose payment method
                    </p>
                    <div className='flex gap-3'>
                      <Button
                        variant='outline'
                        className='h-12 flex-1 rounded-xl'
                        disabled={cashMutation.isPending || posMutation.isPending}
                        onClick={() => void handlePayment('cash')}
                      >
                        {cashMutation.isPending ? 'Processing…' : 'Cash'}
                      </Button>
                      <Button
                        className='h-12 flex-1 rounded-xl'
                        disabled={cashMutation.isPending || posMutation.isPending}
                        onClick={() => void handlePayment('pos')}
                      >
                        {posMutation.isPending ? 'Processing…' : 'POS'}
                      </Button>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full'
                      onClick={() => setShowPaymentChoice(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    className={cn(
                      'h-14 w-full rounded-xl border-0 text-base font-semibold',
                      TONE_BUTTON[status],
                    )}
                    disabled={
                      isActionBusy ||
                      (status === 'payment' && !pendingPayment) ||
                      (status === 'paid' && !table.currentSessionId)
                    }
                    onClick={() => void handlePrimaryAction()}
                  >
                    {isActionBusy ? '…' : config.nextLabel}
                  </Button>
                )}

                {/* Secondary actions */}
                <div>
                  <p className='mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                    Actions
                  </p>
                  <div className='grid grid-cols-3 gap-3 sm:grid-cols-4'>
                    <ActionButton
                      icon={BellRing}
                      label={effectiveWaiterCalled ? 'Clear call' : 'Call waiter'}
                      onClick={() => {
                        if (effectiveWaiterCalled) {
                          handleAcknowledge()
                        } else {
                          setLocalWaiterCalled(true)
                        }
                      }}
                      className={
                        effectiveWaiterCalled
                          ? 'border-amber-500/30 text-amber-400 bg-amber-500/5'
                          : ''
                      }
                    />

                    <ActionButton
                      icon={QrCode}
                      label='QR Code'
                      onClick={() => {
                        setSelectedTable({ label: `Table ${table.number}`, qrCode: table.qrCode })
                        setIsQrModalOpen(true)
                      }}
                    />

                    {perms.canEdit && (
                      <ActionButton
                        icon={Edit2}
                        label='Edit'
                        onClick={() => openEditTable(table)}
                      />
                    )}

                    {perms.canManageReservation && (
                      <ActionButton
                        icon={table.isReserved ? CalendarX : Calendar}
                        label={table.isReserved ? 'Unreserve' : 'Reserve'}
                        disabled={isBusy || isSessionReserved}
                        onClick={() => void handleToggleReservation(table)}
                      />
                    )}

                    {perms.canToggleStatus && (
                      <ActionButton
                        icon={table.isActive ? PowerOff : Power}
                        label={table.isActive ? 'Deactivate' : 'Activate'}
                        disabled={isBusy}
                        onClick={() => void handleToggleStatus(table)}
                      />
                    )}

                    {hasActiveOrder && (
                      <ActionButton
                        icon={X}
                        label='Cancel order'
                        disabled={isActionBusy}
                        onClick={() => void handleCancelOrder()}
                        className='border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive'
                      />
                    )}
                  </div>
                </div>

                {/* Danger row */}
                {perms.canDelete && (
                  <div className='mt-auto border-t border-border pt-5'>
                    <Button
                      variant='ghost'
                      className='w-full rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive'
                      onClick={() => {
                        setIsOpen(false)
                        setDeletingTable(table)
                      }}
                    >
                      <Trash2 className='mr-2 h-4 w-4' />
                      Delete table
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Start-order dialog for free tables */}
      <CreateStaffOrderDialog
        open={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
      />
    </>
  )
}
