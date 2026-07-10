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
import {useEffect, useState} from 'react'
import {createPortal} from 'react-dom'
import {Badge} from '#/components/ui/badge'
import {Button} from '#/components/ui/button'
import {CreateStaffOrderDialog} from '#/features/order/create-staff-order/ui/CreateStaffOrderDialog'
import type {Order, OrderStatus, Payment, TableEntity,} from '#/features/platform/api/platform.types.ts'
import {
  useCloseSessionMutation,
  useConfirmOrderMutation,
  useConfirmPaymentMutation,
  useProcessCashPaymentMutation,
  useProcessPosPaymentMutation,
  useUpdateOrderStatusMutation,
} from '#/features/platform/model/platform-hooks.ts'
import {cn} from '#/lib/utils.ts'
import {m} from '#/paraglide/messages'
import {useBodyScrollLock} from '#/shared/libs/hooks/scroll-lock.ts'
import {showError, showSuccess} from '#/shared/libs/hooks/toast.ts'
import type {TablePermissions} from '#/shared/libs/hooks/use-table-permissions.ts'
import {getResponseErrorMessage} from '#/shared/libs/utils/http.utils.ts'
import {LazyImage} from '#/shared/ui/lazy-image.tsx' // ── Types ──────────────────────────────────────────────────────────────────────

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

function getStatusConfig(status: TableStatus): StatusConfig {
  switch (status) {
    case 'free':
      return {
        label: m.admin_tables_status_free_label(),
        description: m.admin_tables_status_free_description(),
        icon: Utensils,
        nextLabel: m.admin_tables_status_free_next(),
        pulse: false,
      }
    case 'new':
      return {
        label: m.admin_tables_status_new_label(),
        description: m.admin_tables_status_new_description(),
        icon: Sparkles,
        nextLabel: m.admin_tables_status_new_next(),
        pulse: false,
      }
    case 'confirmed':
      return {
        label: m.admin_tables_status_confirmed_label(),
        description: m.admin_tables_status_confirmed_description(),
        icon: Check,
        nextLabel: m.admin_tables_status_confirmed_next(),
        pulse: false,
      }
    case 'preparing':
      return {
        label: m.admin_tables_status_preparing_label(),
        description: m.admin_tables_status_preparing_description(),
        icon: ChefHat,
        nextLabel: m.admin_tables_status_preparing_next(),
        pulse: false,
      }
    case 'ready':
      return {
        label: m.admin_tables_status_ready_label(),
        description: m.admin_tables_status_ready_description(),
        icon: CheckCircle2,
        nextLabel: m.admin_tables_status_ready_next(),
        pulse: true,
      }
    case 'served':
      return {
        label: m.admin_tables_status_served_label(),
        description: m.admin_tables_status_served_description(),
        icon: Utensils,
        nextLabel: m.admin_tables_status_served_next(),
        pulse: false,
      }
    case 'payment':
      return {
        label: m.admin_tables_status_payment_label(),
        description: m.admin_tables_status_payment_description(),
        icon: CreditCard,
        nextLabel: m.admin_tables_status_payment_next(),
        pulse: true,
      }
    case 'paid':
      return {
        label: m.admin_tables_status_paid_label(),
        description: m.admin_tables_status_paid_description(),
        icon: CheckCircle2,
        nextLabel: m.admin_tables_status_paid_next(),
        pulse: false,
      }
  }
}

// ── Tone maps (literal Tailwind classes — no dynamic construction) ─────────────

const TONE_BADGE: Record<TableStatus, string> = {
  free: 'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-900/50 dark:text-slate-200 dark:border-slate-700',
  new: 'bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-700',
  confirmed:
    'bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700',
  preparing:
    'bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700',
  ready:
    'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700',
  served:
    'bg-teal-100 text-teal-800 border border-teal-200 dark:bg-teal-900/40 dark:text-teal-200 dark:border-teal-700',
  payment:
    'bg-orange-100 text-orange-900 border border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700',
  paid: 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-700',
}

const TONE_DOT: Record<TableStatus, string> = {
  free: 'bg-slate-500',
  new: 'bg-sky-500',
  confirmed: 'bg-indigo-500',
  preparing: 'bg-amber-500',
  ready: 'bg-emerald-500',
  served: 'bg-teal-500',
  payment: 'bg-orange-500',
  paid: 'bg-green-500',
}

const TONE_HERO: Record<TableStatus, string> = {
  free: 'bg-slate-50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-800',
  new: 'bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800',
  confirmed: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800',
  preparing: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
  ready: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
  served: 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800',
  payment: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
  paid: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
}

const TONE_ICON: Record<TableStatus, string> = {
  free: 'text-slate-600 dark:text-slate-400',
  new: 'text-sky-600 dark:text-sky-400',
  confirmed: 'text-indigo-600 dark:text-indigo-400',
  preparing: 'text-amber-600 dark:text-amber-400',
  ready: 'text-emerald-600 dark:text-emerald-400',
  served: 'text-teal-600 dark:text-teal-400',
  payment: 'text-orange-600 dark:text-orange-400',
  paid: 'text-green-600 dark:text-green-400',
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
  free: 'bg-slate-500',
  new: 'bg-sky-500',
  confirmed: 'bg-indigo-500',
  preparing: 'bg-amber-500',
  ready: 'bg-emerald-500',
  served: 'bg-teal-500',
  payment: 'bg-orange-500',
  paid: 'bg-green-500',
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

function deriveStatus(
  order: Order | null,
  pendingPayment: Payment | null,
  currentSessionId: string | null,
): TableStatus {
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
      // refreshLifecycle auto-closes the session when the order reaches CLOSED.
      // If the session is already gone there is nothing left to close — show free.
      return currentSessionId ? 'paid' : 'free'
    default:
      return 'free'
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: TableStatus }) {
  const { label, pulse } = getStatusConfig(status)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-md font-semibold',
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

  const status = deriveStatus(activeOrder, pendingPayment, table.currentSessionId)
  const config = getStatusConfig(status)
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
          showSuccess(m.admin_tables_order_confirmed())
          break
        case 'confirmed':
          await updateStatusMutation.mutateAsync({
            orderId: activeOrder.id,
            data: { status: 'IN_KITCHEN' },
          })
          showSuccess(m.admin_tables_kitchen_preparing())
          break
        case 'preparing':
          await updateStatusMutation.mutateAsync({
            orderId: activeOrder.id,
            data: { status: 'READY' },
          })
          showSuccess(m.admin_tables_order_ready())
          break
        case 'ready':
          await updateStatusMutation.mutateAsync({
            orderId: activeOrder.id,
            data: { status: 'DELIVERED' },
          })
          showSuccess(m.admin_tables_order_served())
          break
        case 'served':
          setShowPaymentChoice(true)
          break
        case 'payment':
          if (!pendingPayment) return
          await confirmPaymentMutation.mutateAsync({ paymentId: pendingPayment.id, data: {} })
          showSuccess(m.admin_tables_payment_confirmed())
          break
        case 'paid':
          if (!table.currentSessionId) return
          await closeSessionMutation.mutateAsync(table.currentSessionId)
          showSuccess(m.admin_tables_table_available())
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
      showSuccess(m.admin_tables_order_cancelled())
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
      showSuccess(m.admin_tables_payment_due_toast())
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
        <div className='relative aspect-video w-full bg-muted'>
          {table.imageUrl ? (
            <LazyImage
              src={table.imageUrl}
              alt={m.admin_tables_table_label({ number: table.number })}
              className='absolute inset-0'
              imgClassName='h-full w-full object-contain'
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
        <div className='p-2'>
          <div className='flex items-start justify-between gap-1'>
            <span className='text-sm font-bold'>
              {m.admin_tables_table_label({ number: table.number })}
            </span>
            <div className='flex shrink-0 flex-wrap justify-end gap-1'>
              <Badge
                variant={table.isActive ? 'success' : 'outline'}
                className='px-1.5 py-0 text-xs'
              >
                {table.isActive ? m.admin_tables_active() : m.admin_tables_inactive()}
              </Badge>
              {table.isReserved && (
                <Badge variant='warning' className='px-1.5 py-0 text-xs'>
                  {m.admin_tables_reserved_badge()}
                </Badge>
              )}
            </div>
          </div>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            {m.admin_tables_seats_count({ capacity: table.capacity })}
          </p>
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
              aria-label={m.admin_tables_close_detail_aria()}
              className='fixed inset-0 bg-background/80 backdrop-blur-sm'
              onClick={() => setIsOpen(false)}
            />

            {/* Dialog */}
            <div
              role='dialog'
              aria-modal
              aria-label={m.admin_tables_detail_aria_label({ number: table.number })}
              className='relative flex h-[92vh] max-h-[920px] w-[96vw] max-w-3xl animate-in fade-in zoom-in flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl duration-200'
            >
              {/* Close button */}
              <button
                type='button'
                aria-label={m.admin_tables_close_dialog_aria()}
                onClick={() => setIsOpen(false)}
                className='absolute right-4 top-4 z-10 bg-red-600 flex h-11 w-11 items-center justify-center rounded-xl border border-border text-white shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              >
                <X className='h-6 w-6' />
              </button>

              {/* Scrollable body */}
              <div className='flex flex-1 flex-col gap-5 overflow-y-auto p-6 pb-8'>
                {/* Header */}
                <div className='pr-16'>
                  <h2 className='text-2xl font-bold'>
                    {m.admin_tables_table_label({ number: table.number })}
                  </h2>
                  <div className='mt-2 flex flex-wrap items-center gap-2'>
                    <Badge variant={table.isActive ? 'success' : 'outline'}>
                      {table.isActive ? m.admin_tables_active() : m.admin_tables_inactive()}
                    </Badge>
                    {table.isReserved && <Badge variant='warning'>{reservedLabel}</Badge>}
                    <span className='text-sm text-muted-foreground'>
                      {m.admin_tables_seats_count({ capacity: table.capacity })}
                    </span>
                  </div>
                </div>

                {/* Waiter alert */}
                {effectiveWaiterCalled && (
                  <div className='flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3'>
                    <div className='flex items-center gap-2 text-amber-400'>
                      <BellRing className='h-4 w-4 shrink-0' />
                      <span className='text-sm font-medium'>{m.admin_tables_needs_waiter()}</span>
                    </div>
                    <Button
                      size='sm'
                      variant='outline'
                      className='shrink-0 rounded-lg border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
                      onClick={handleAcknowledge}
                    >
                      {m.admin_tables_acknowledge()}
                    </Button>
                  </div>
                )}

                {/* Status hero */}
                <div className={cn('rounded-2xl border p-5', TONE_HERO[status])}>
                  <p className='mb-4 text-xs font-semibold uppercase tracking-widest opacity-50'>
                    {m.admin_tables_order_status_label()}
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
                      {m.admin_tables_choose_payment_method()}
                    </p>
                    <div className='flex gap-3'>
                      <Button
                        variant='outline'
                        className='h-12 flex-1 rounded-xl'
                        disabled={cashMutation.isPending || posMutation.isPending}
                        onClick={() => void handlePayment('cash')}
                      >
                        {cashMutation.isPending
                          ? m.admin_tables_processing()
                          : m.admin_tables_cash()}
                      </Button>
                      <Button
                        className='h-12 flex-1 rounded-xl'
                        disabled={cashMutation.isPending || posMutation.isPending}
                        onClick={() => void handlePayment('pos')}
                      >
                        {posMutation.isPending ? m.admin_tables_processing() : m.admin_tables_pos()}
                      </Button>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full'
                      onClick={() => setShowPaymentChoice(false)}
                    >
                      {m.admin_tables_cancel()}
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
                    {m.admin_tables_actions_label()}
                  </p>
                  <div className='grid grid-cols-3 gap-3 sm:grid-cols-4'>
                    <ActionButton
                      icon={BellRing}
                      label={
                        effectiveWaiterCalled
                          ? m.admin_tables_clear_call()
                          : m.admin_tables_call_waiter()
                      }
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
                      label={m.admin_tables_qr_code_action()}
                      onClick={() => {
                        setSelectedTable({
                          label: m.admin_tables_table_label({ number: table.number }),
                          qrCode: table.qrCode,
                        })
                        setIsQrModalOpen(true)
                      }}
                    />

                    {perms.canEdit && (
                      <ActionButton
                        icon={Edit2}
                        label={m.admin_tables_edit_action()}
                        onClick={() => openEditTable(table)}
                      />
                    )}

                    {perms.canManageReservation && (
                      <ActionButton
                        icon={table.isReserved ? CalendarX : Calendar}
                        label={
                          table.isReserved
                            ? m.admin_tables_unreserve_action()
                            : m.admin_tables_reserve_action()
                        }
                        disabled={isBusy || isSessionReserved}
                        onClick={() => void handleToggleReservation(table)}
                      />
                    )}

                    {perms.canToggleStatus && (
                      <ActionButton
                        icon={table.isActive ? PowerOff : Power}
                        label={
                          table.isActive
                            ? m.admin_tables_deactivate_action()
                            : m.admin_tables_activate_action()
                        }
                        disabled={isBusy}
                        onClick={() => void handleToggleStatus(table)}
                      />
                    )}

                    {hasActiveOrder && (
                      <ActionButton
                        icon={X}
                        label={m.admin_tables_cancel_order_action()}
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
                      {m.admin_tables_delete_table()}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      <CreateStaffOrderDialog
        selectedTableId={table.id}
        open={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
      />
    </>
  )
}
