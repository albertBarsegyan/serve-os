import {
  BellRing,
  Calendar,
  CalendarX,
  Edit2,
  Link2,
  Power,
  PowerOff,
  QrCode,
  Sparkles,
  Split,
  Trash2,
  Unlock,
  Utensils,
  X,
} from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Select } from '#/components/ui/select'
import { CreateStaffOrderDialog } from '#/features/order/create-staff-order/ui/CreateStaffOrderDialog'
import { canCancelOrder } from '#/features/order/lib/can-cancel-order'
import type {
  Order,
  Payment,
  SessionSummary,
  TableEntity,
} from '#/features/platform/api/platform.types.ts'
import {
  deriveStatus,
  getStatusConfig,
  LIFECYCLE,
  pickActiveOrder,
  type TableStatus,
  TONE_BADGE,
  TONE_BUTTON,
  TONE_DOT,
  TONE_HERO,
  TONE_ICON,
  TONE_STEPPER,
  URGENCY_RANK,
} from '#/features/platform/lib/table-status.ts'
import {
  useAcknowledgeWaiterMutation,
  useCloseSessionMutation,
  useConfirmOrderMutation,
  useConfirmPaymentMutation,
  useJoinSessionsMutation,
  useProcessCashPaymentMutation,
  useProcessPosPaymentMutation,
  useSplitSessionMutation,
  useUpdateOrderStatusMutation,
} from '#/features/platform/model/platform-hooks.ts'
import { cn } from '#/lib/utils.ts'
import { m } from '#/paraglide/messages'
import defaultTableImage from '#/shared/assets/table/default-table-image.webp'
import { useBodyScrollLock } from '#/shared/libs/hooks/scroll-lock.ts'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { useActiveBusiness } from '#/shared/libs/hooks/use-active-business.ts'
import type { TablePermissions } from '#/shared/libs/hooks/use-table-permissions.ts'
import { StaffPermission, StaffRole } from '#/shared/libs/permissions/index.ts'
import { usePermissions } from '#/shared/libs/permissions/use-permissions.ts'
import {
  isValidTwoDecimalAmount,
  normalizeDecimalInput,
} from '#/shared/libs/utils/decimal-input.utils'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import { LazyImage } from '#/shared/ui/lazy-image.tsx'

// ── Types ──────────────────────────────────────────────────────────────────────

// A table can now carry several of these concurrently (separate guest parties) — see
// TableSession.mergedIntoSessionId on the backend for how staff combine them for billing.
export interface SessionWithOrders {
  session: SessionSummary
  orders: Order[]
}

export interface AdminTableProps {
  table: TableEntity
  sessions: SessionWithOrders[]
  pendingPaymentByOrderId: Map<string, Payment>
  perms: TablePermissions
  handleToggleStatus: (table: TableEntity) => Promise<void>
  handleToggleReservation: (table: TableEntity) => Promise<void>
  openEditTable: (table: TableEntity) => void
  setDeletingTable: (table: TableEntity | null) => void
  setSelectedTable: (s: { label: string; qrCode: string } | null) => void
  setIsQrModalOpen: (open: boolean) => void
  isBusy: boolean
}

// ── Tip config ─────────────────────────────────────────────────────────────────
// Mirrors serve-os-backend/src/common/constants/tip.constants.ts —
// STAFF_TIP_ABSOLUTE_MAX_MAJOR_UNITS and STAFF_TIP_LOG_THRESHOLD_MAJOR_UNITS. Keep these
// numerically identical to the backend; no way to share the literal across the two repos.
// No subtotal-relative cap here on purpose — staff have legitimate over-cap cases (cash
// tips on comped bills, split-remainder corrections). Above the threshold we just ask for
// an extra confirmation tap instead of blocking the entry.
const STAFF_TIP_ABSOLUTE_MAX_MAJOR_UNITS = 10_000
const STAFF_TIP_SOFT_THRESHOLD_MAJOR_UNITS = 50

// ── Local formatters ─────────────────────────────────────────────────────────

/** Freshness label for activeOrder.updatedAt — a guest may tip from their own device while
 * this table's detail view is open, so staff need a cue that the tip total could be stale
 * before they close out the bill. */
function formatUpdatedAgo(updatedAt: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - new Date(updatedAt).getTime()) / 1000))
  if (seconds < 10) return m.admin_tables_updated_just_now()
  if (seconds < 60) return m.admin_tables_updated_seconds_ago({ seconds })
  return m.admin_tables_updated_minutes_ago({ minutes: Math.floor(seconds / 60) })
}

/** How long ago a session opened — shown on each session card so staff can spot a guest
 * party that's been sitting a while. */
function formatOpenedAgo(openedAt: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - new Date(openedAt).getTime()) / 60000))
  if (minutes < 1) return m.admin_tables_opened_just_now()
  if (minutes < 60) return m.admin_tables_opened_minutes_ago({ minutes })
  return m.admin_tables_opened_hours_ago({ hours: Math.floor(minutes / 60) })
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

// ── Session card (one per active session at this table) ────────────────────────

interface SessionCardProps {
  table: TableEntity
  session: SessionSummary
  orders: Order[]
  otherSessions: SessionWithOrders[]
  pendingPaymentByOrderId: Map<string, Payment>
  currency: string
  businessId: string
}

function SessionCard({
  table,
  session,
  orders,
  otherSessions,
  pendingPaymentByOrderId,
  currency,
  businessId,
}: Readonly<SessionCardProps>) {
  const [showPaymentChoice, setShowPaymentChoice] = useState(false)
  const [tipInput, setTipInput] = useState('')
  const [tipError, setTipError] = useState<string | null>(null)
  const [pendingLargeTip, setPendingLargeTip] = useState<{
    method: 'cash' | 'pos'
    amount: number
  } | null>(null)
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false)
  const [joinTargetId, setJoinTargetId] = useState('')
  const tipInputId = useId()
  const joinSelectId = useId()

  const activeOrder = pickActiveOrder(orders)
  const pendingPayment = activeOrder ? (pendingPaymentByOrderId.get(activeOrder.id) ?? null) : null
  const status = deriveStatus(activeOrder, pendingPayment)
  const config = getStatusConfig(status)
  const StatusIcon = config.icon

  const confirmOrderMutation = useConfirmOrderMutation()
  const updateStatusMutation = useUpdateOrderStatusMutation()
  const cashMutation = useProcessCashPaymentMutation()
  const posMutation = useProcessPosPaymentMutation()
  const confirmPaymentMutation = useConfirmPaymentMutation()
  const closeSessionMutation = useCloseSessionMutation()
  const joinSessionsMutation = useJoinSessionsMutation()
  const splitSessionMutation = useSplitSessionMutation()

  const isActionBusy =
    confirmOrderMutation.isPending ||
    updateStatusMutation.isPending ||
    cashMutation.isPending ||
    posMutation.isPending ||
    confirmPaymentMutation.isPending ||
    closeSessionMutation.isPending ||
    joinSessionsMutation.isPending ||
    splitSessionMutation.isPending

  const { isOwner, hasPermission, staffRole } = usePermissions()
  const canManageTips = isOwner() || hasPermission(StaffPermission.TIPS_MANAGE)
  const canCancelActiveOrder =
    activeOrder !== null &&
    canCancelOrder(activeOrder.status, { isOwner: isOwner(), staffRole: staffRole() })
  const currentTip = activeOrder ? Number(activeOrder.tipAmount) : 0

  // activeOrder === null, not orders.length === 0: a session whose only order is
  // CANCELLED/PAYMENT_FAILED/REFUNDED has orders.length > 0 but no active order — pickActiveOrder
  // can never produce a new one for it on its own, so it needs the same "no active order, offer
  // to force-close" treatment as a session with zero orders, not a dead end with no way out.
  const isStuck = activeOrder === null

  const role = staffRole()
  const canConfirmOrder = isOwner() || role === StaffRole.WAITER || role === StaffRole.MANAGER
  const canAdvanceKitchenStatus =
    isOwner() ||
    role === StaffRole.WAITER ||
    role === StaffRole.MANAGER ||
    role === StaffRole.CASHIER ||
    role === StaffRole.KITCHEN
  const canTakePayment = isOwner() || hasPermission(StaffPermission.PAYMENT_TAKE)
  // Mirrors TableSessionsService.closeSession's staff role check on the backend exactly —
  // CASHIER/KITCHEN get a disabled button here instead of a 403 from the API.
  const canCloseSession = isOwner() || role === StaffRole.WAITER || role === StaffRole.MANAGER

  function canPerformPrimaryAction(s: TableStatus): boolean {
    switch (s) {
      case 'new':
        return canConfirmOrder
      case 'confirmed':
      case 'preparing':
      case 'ready':
        return canAdvanceKitchenStatus
      case 'served':
      case 'payment':
        return canTakePayment
      case 'paid':
        return canCloseSession
      case 'free':
        return true
    }
  }

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const guestLabel = session.customerName?.trim() || m.admin_tables_guest_label()
  const isMerged = Boolean(session.mergedIntoSessionId)
  const joinCandidates = otherSessions.filter(
    (s) => s.session.id !== session.id && !s.session.mergedIntoSessionId,
  )

  async function handlePrimaryAction() {
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
            businessId,
          })
          showSuccess(m.admin_tables_kitchen_preparing())
          break
        case 'preparing':
          await updateStatusMutation.mutateAsync({
            orderId: activeOrder.id,
            data: { status: 'READY' },
            businessId,
          })
          showSuccess(m.admin_tables_order_ready())
          break
        case 'ready':
          await updateStatusMutation.mutateAsync({
            orderId: activeOrder.id,
            data: { status: 'DELIVERED' },
            businessId,
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
          await closeSessionMutation.mutateAsync(session.id)
          showSuccess(m.admin_tables_table_available())
          break
        case 'free':
          break
      }
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  async function handleCancelOrder() {
    if (!activeOrder) return
    try {
      await updateStatusMutation.mutateAsync({
        orderId: activeOrder.id,
        data: { status: 'CANCELLED' },
        businessId,
      })
      showSuccess(m.admin_tables_order_cancelled())
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  async function handleForceClose() {
    try {
      await closeSessionMutation.mutateAsync(session.id)
      showSuccess(m.admin_tables_table_available())
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  async function submitPayment(method: 'cash' | 'pos', tipAmount?: number) {
    if (!activeOrder) return
    try {
      if (method === 'cash') {
        await cashMutation.mutateAsync({ orderId: activeOrder.id, data: { tipAmount } })
      } else {
        await posMutation.mutateAsync({ orderId: activeOrder.id, data: { tipAmount } })
      }
      showSuccess(m.admin_tables_payment_due_toast())
      setShowPaymentChoice(false)
      setTipInput('')
      setTipError(null)
      setPendingLargeTip(null)
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  async function confirmLargeTipAndPay() {
    if (!pendingLargeTip) return
    await submitPayment(pendingLargeTip.method, pendingLargeTip.amount)
  }

  async function handlePayment(method: 'cash' | 'pos') {
    if (!activeOrder) return

    let amount: number | undefined
    if (canManageTips && tipInput.trim()) {
      const normalized = normalizeDecimalInput(tipInput)
      if (!isValidTwoDecimalAmount(normalized)) {
        setTipError(m.admin_tables_tip_invalid_amount())
        return
      }
      amount = Number(normalized)
      if (amount < 0 || amount > STAFF_TIP_ABSOLUTE_MAX_MAJOR_UNITS) {
        setTipError(m.admin_tables_tip_out_of_range())
        return
      }
    }
    setTipError(null)

    if (amount !== undefined && amount >= STAFF_TIP_SOFT_THRESHOLD_MAJOR_UNITS) {
      setPendingLargeTip({ method, amount })
      return
    }

    await submitPayment(method, amount)
  }

  async function handleJoin() {
    if (!joinTargetId) return
    try {
      await joinSessionsMutation.mutateAsync({
        targetSessionId: joinTargetId,
        sourceSessionId: session.id,
      })
      showSuccess(m.admin_tables_joined_sessions())
      setJoinTargetId('')
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  async function handleSplit() {
    try {
      await splitSessionMutation.mutateAsync(session.id)
      showSuccess(m.admin_tables_split_sessions())
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  return (
    <div className='rounded-2xl border border-border p-4'>
      {/* Session header */}
      <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2.5'>
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
              TONE_HERO[status],
            )}
          >
            <StatusIcon className={cn('h-4.5 w-4.5', TONE_ICON[status])} />
          </div>
          <div>
            <p className='text-sm font-semibold'>{guestLabel}</p>
            <p className='text-xs text-muted-foreground'>
              {m.admin_tables_seated_label()} · {formatOpenedAgo(session.openedAt, now)}
            </p>
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {isMerged && <Badge variant='outline'>{m.admin_tables_joined_badge()}</Badge>}
          <StatusPill status={status} />
        </div>
      </div>
      <StatusStepper status={status} />

      {/* Join / split controls */}
      <div className='mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-muted/50 px-3 py-2'>
        {isMerged ? (
          <>
            <Link2 className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
            <span className='text-xs text-muted-foreground'>
              {m.admin_tables_joined_with_label()}
            </span>
            <Button
              size='sm'
              variant='ghost'
              className='ml-auto h-7 rounded-lg text-xs'
              disabled={splitSessionMutation.isPending}
              onClick={() => void handleSplit()}
            >
              <Split className='mr-1 h-3.5 w-3.5' />
              {m.admin_tables_split_action()}
            </Button>
          </>
        ) : joinCandidates.length > 0 ? (
          <>
            <label htmlFor={joinSelectId} className='text-xs text-muted-foreground shrink-0'>
              {m.admin_tables_join_with_label()}
            </label>
            <Select
              id={joinSelectId}
              value={joinTargetId}
              onChange={(e) => setJoinTargetId(e.target.value)}
              className='h-8 flex-1 text-xs'
            >
              <option value=''>{m.admin_tables_join_select_placeholder()}</option>
              {joinCandidates.map((c) => (
                <option key={c.session.id} value={c.session.id}>
                  {c.session.customerName?.trim() || m.admin_tables_guest_label()}
                </option>
              ))}
            </Select>
            <Button
              size='sm'
              variant='outline'
              className='h-8 rounded-lg text-xs'
              disabled={!joinTargetId || joinSessionsMutation.isPending}
              onClick={() => void handleJoin()}
            >
              <Link2 className='mr-1 h-3.5 w-3.5' />
              {m.admin_tables_join_action()}
            </Button>
          </>
        ) : (
          <span className='text-xs text-muted-foreground'>
            {m.admin_tables_no_other_sessions()}
          </span>
        )}
      </div>

      {/* Order items */}
      {activeOrder && (
        <div>
          <p className='mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
            {m.admin_orders_items_heading()}
          </p>
          <div className='divide-y divide-border rounded-xl border border-border'>
            {activeOrder.items.length === 0 && (
              <p className='px-4 py-3 text-sm text-muted-foreground'>{m.admin_orders_no_items()}</p>
            )}
            {activeOrder.items.map((item) => (
              <div key={item.id} className='flex items-center justify-between px-4 py-3'>
                {item.product?.imageUrl && (
                  <div className='flex items-center gap-2'>
                    <LazyImage width={60} src={item.product?.imageUrl} alt={item.product.name} />

                    <div>
                      <p className='text-lg font-medium'>
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
                  </div>
                )}

                <div className='text-right'>
                  <p className='text-md font-mono'>×{item.quantity}</p>
                  <p className='text-lg text-muted-foreground font-mono'>
                    {m.admin_orders_unit_price({
                      price: formatPrice(Number(item.unitPrice), currency),
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {Boolean(activeOrder.notes) && (
            <div className='flex mt-4 items-center text-lg justify-between rounded-xl text-green-300 bg-muted px-4 py-3'>
              {m.admin_orders_note({ notes: activeOrder.notes ?? '' })}
            </div>
          )}

          <div className='mt-3 flex items-center justify-between rounded-xl bg-muted px-4 py-3'>
            <span className='text-sm font-semibold text-[24px]'>
              {m.admin_orders_total_label()}
            </span>
            <span className='font-mono font-bold text-[24px]'>
              {formatPrice(Number(activeOrder.totalAmount), currency)}
            </span>
          </div>
          {currentTip > 0 && (
            <div className='mt-1.5 flex items-center justify-between px-4'>
              <span className='text-xs text-muted-foreground'>
                {m.admin_tables_current_tip_label()} ·{' '}
                {formatUpdatedAgo(activeOrder.updatedAt, now)}
              </span>
              <span className='font-mono text-sm font-medium'>
                {formatPrice(currentTip, currency)}
              </span>
            </div>
          )}
        </div>
      )}

      {isStuck && (
        <div className='rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground'>
          {m.admin_tables_no_orders_yet()}
        </div>
      )}

      {/* Primary action */}
      {showPaymentChoice ? (
        <div className='mt-4 space-y-3 rounded-xl border border-border p-4'>
          <p className='text-sm font-medium text-muted-foreground'>
            {m.admin_tables_choose_payment_method()}
          </p>

          {activeOrder && (
            <p className='text-xs text-muted-foreground'>
              {m.admin_tables_current_tip_label()} · {formatPrice(currentTip, currency)} ·{' '}
              {formatUpdatedAgo(activeOrder.updatedAt, now)}
            </p>
          )}

          {canManageTips && !pendingLargeTip && (
            <div className='space-y-1.5'>
              <label htmlFor={tipInputId} className='text-sm text-muted-foreground'>
                {m.admin_tables_tip_amount_label()}
              </label>
              <input
                id={tipInputId}
                type='text'
                inputMode='decimal'
                placeholder='0.00'
                value={tipInput}
                onChange={(e) => {
                  setTipInput(e.target.value)
                  setTipError(null)
                }}
                className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-mono'
              />
              {tipError && <p className='text-xs text-destructive'>{tipError}</p>}
            </div>
          )}

          {pendingLargeTip && (
            <div className='space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3'>
              <p className='text-sm font-medium text-amber-600 dark:text-amber-400'>
                {m.admin_tables_large_tip_confirm({
                  amount: formatPrice(pendingLargeTip.amount, currency),
                })}
              </p>
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  className='flex-1 rounded-lg'
                  onClick={() => setPendingLargeTip(null)}
                >
                  {m.admin_tables_cancel()}
                </Button>
                <Button
                  size='sm'
                  className='flex-1 rounded-lg'
                  disabled={cashMutation.isPending || posMutation.isPending}
                  onClick={() => void confirmLargeTipAndPay()}
                >
                  {m.admin_tables_large_tip_confirm_button()}
                </Button>
              </div>
            </div>
          )}

          {!pendingLargeTip && (
            <div className='flex gap-3'>
              <Button
                variant='outline'
                className='h-12 flex-1 rounded-xl'
                disabled={cashMutation.isPending || posMutation.isPending}
                onClick={() => void handlePayment('cash')}
              >
                {cashMutation.isPending ? m.admin_tables_processing() : m.admin_tables_cash()}
              </Button>
              <Button
                className='h-12 flex-1 rounded-xl'
                disabled={cashMutation.isPending || posMutation.isPending}
                onClick={() => void handlePayment('pos')}
              >
                {posMutation.isPending ? m.admin_tables_processing() : m.admin_tables_pos()}
              </Button>
            </div>
          )}

          <Button
            variant='ghost'
            size='sm'
            className='w-full'
            onClick={() => {
              setShowPaymentChoice(false)
              setTipInput('')
              setTipError(null)
              setPendingLargeTip(null)
            }}
          >
            {m.admin_tables_cancel()}
          </Button>
        </div>
      ) : (
        activeOrder && (
          <Button
            className={cn(
              'mt-4 h-14 w-full rounded-xl border-0 text-base font-semibold',
              TONE_BUTTON[status],
            )}
            disabled={
              isActionBusy ||
              (status === 'payment' && !pendingPayment) ||
              !canPerformPrimaryAction(status)
            }
            onClick={() => void handlePrimaryAction()}
          >
            {isActionBusy ? '…' : config.nextLabel}
          </Button>
        )
      )}

      {/* Session-scoped actions */}
      <div className='mt-4 grid grid-cols-3 gap-3'>
        <ActionButton
          icon={Sparkles}
          label={m.admin_tables_add_order_action()}
          onClick={() => setIsCreateOrderOpen(true)}
        />
        {isStuck && (
          <ActionButton
            icon={Unlock}
            label={m.admin_tables_force_close_action()}
            disabled={isActionBusy || !canCloseSession}
            onClick={() => void handleForceClose()}
          />
        )}
        {activeOrder && canCancelActiveOrder && (
          <ActionButton
            icon={X}
            label={m.admin_tables_cancel_order_action()}
            disabled={isActionBusy}
            onClick={() => void handleCancelOrder()}
            className='border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive'
          />
        )}
      </div>

      <CreateStaffOrderDialog
        selectedTableId={table.id}
        sessionId={session.id}
        open={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
      />
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AdminTable({
  table,
  sessions,
  pendingPaymentByOrderId,
  perms,
  handleToggleStatus,
  handleToggleReservation,
  openEditTable,
  setDeletingTable,
  setSelectedTable,
  setIsQrModalOpen,
  isBusy,
}: Readonly<AdminTableProps>) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false)

  const activeBusiness = useActiveBusiness()
  const currency = activeBusiness?.currency ?? 'USD'
  const businessId = activeBusiness?.id ?? ''

  const acknowledgeWaiterMutation = useAcknowledgeWaiterMutation()

  // Backend-persisted truth (TableSession.waiterCallActive), kept live by the
  // order:call-waiter / order:waiter-acknowledged socket handlers invalidating the sessions
  // query — not component state, so every staff device shows the same call/ack state.
  const sessionsWithActiveCall = sessions.filter((s) => s.session.waiterCallActive)
  const effectiveWaiterCalled = sessionsWithActiveCall.length > 0
  const isSessionReserved = sessions.length > 0
  const reservedLabel = isSessionReserved
    ? m.admin_tables_guest_session()
    : m.admin_tables_reserved_by_staff()

  // Card-preview status: the least-settled session represents the whole table, so a
  // fully-paid session never hides another guest party that's still mid-order.
  const cardStatus = sessions.reduce<TableStatus>((worst, { orders }) => {
    const order = pickActiveOrder(orders)
    const pending = order ? (pendingPaymentByOrderId.get(order.id) ?? null) : null
    const status = deriveStatus(order, pending)
    return URGENCY_RANK[status] < URGENCY_RANK[worst] ? status : worst
  }, 'free')
  const config = getStatusConfig(cardStatus)

  useBodyScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  async function handleAcknowledge() {
    try {
      await Promise.all(
        sessionsWithActiveCall.map((s) => acknowledgeWaiterMutation.mutateAsync(s.session.id)),
      )
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  return (
    <>
      {/* ── Card (collapsed) ──────────────────────────────────────────────── */}
      <button
        type='button'
        onClick={() => setIsOpen(true)}
        className={cn(
          'group w-full overflow-hidden cursor-pointer rounded-2xl border border-border bg-card text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          !table.isActive && 'opacity-60 grayscale',
        )}
      >
        {/* Banner */}
        <div className='relative aspect-video w-full bg-muted'>
          <LazyImage
            src={table.imageUrl || defaultTableImage}
            alt={m.admin_tables_table_label({ number: table.number })}
            className='absolute inset-0'
            imgClassName='h-full w-full object-contain'
          />

          <div className='absolute bottom-2 left-2'>
            <StatusPill status={cardStatus} />
          </div>

          {sessions.length > 1 && (
            <div className='absolute bottom-2 right-2'>
              <Badge variant='outline' className='bg-background/80'>
                {m.admin_tables_session_count_badge({ count: sessions.length })}
              </Badge>
            </div>
          )}

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
              className='relative flex h-[92vh] max-h-[920px] w-[96vw] max-w-[1440px] animate-in fade-in zoom-in flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl duration-200'
            >
              {/* Close button */}
              <button
                type='button'
                aria-label={m.admin_tables_close_dialog_aria()}
                onClick={() => setIsOpen(false)}
                className='absolute cursor-pointer right-4 top-4 z-10 bg-red-600 flex h-11 w-11 items-center justify-center rounded-xl border border-border text-white shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
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
                    <StatusPill status={cardStatus} />
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
                      disabled={acknowledgeWaiterMutation.isPending}
                      onClick={() => void handleAcknowledge()}
                    >
                      {m.admin_tables_acknowledge()}
                    </Button>
                  </div>
                )}

                {/* Sessions */}
                <div>
                  <p className='mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                    {m.admin_tables_sessions_heading({ count: sessions.length })}
                  </p>

                  {sessions.length === 0 ? (
                    <div className={cn('rounded-2xl border p-5 text-center', TONE_HERO.free)}>
                      <Utensils className={cn('mx-auto mb-2 h-6 w-6', TONE_ICON.free)} />
                      <p className='text-sm text-muted-foreground'>
                        {m.admin_tables_no_active_sessions()}
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {sessions.map((entry) => (
                        <SessionCard
                          key={entry.session.id}
                          table={table}
                          session={entry.session}
                          orders={entry.orders}
                          otherSessions={sessions}
                          pendingPaymentByOrderId={pendingPaymentByOrderId}
                          currency={currency}
                          businessId={businessId}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Table-level actions */}
                <div>
                  <p className='mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                    {m.admin_tables_actions_label()}
                  </p>
                  <div className='grid grid-cols-3 gap-3 sm:grid-cols-4'>
                    {sessions.length === 0 && (
                      <ActionButton
                        icon={config.icon}
                        label={m.admin_tables_start_order_action()}
                        onClick={() => setIsCreateOrderOpen(true)}
                      />
                    )}

                    {effectiveWaiterCalled && (
                      <ActionButton
                        icon={BellRing}
                        label={m.admin_tables_clear_call()}
                        disabled={acknowledgeWaiterMutation.isPending}
                        onClick={() => void handleAcknowledge()}
                        className='border-amber-500/30 text-amber-400 bg-amber-500/5'
                      />
                    )}

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
