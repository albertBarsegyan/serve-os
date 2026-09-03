import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Check, Copy, LayoutGrid, Plus, Upload, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useId, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Button } from '#/components/ui/button'
import { useOrderNotifications } from '#/features/notification'
import type { Order, Payment, TableEntity } from '#/features/platform/api/platform.types.ts'
import {
  activeSessionsQueryOptions,
  ordersQueryOptions,
  paymentsQueryOptions,
  tablesQueryOptions,
} from '#/features/platform/lib/query-options.ts'
import {
  createTableSchema,
  updateTableSchema,
} from '#/features/platform/lib/schemas/platform.schemas.ts'
import {
  useCreateTableMutation,
  useDeleteTableMutation,
  useSetTableReservationMutation,
  useToggleTableStatusMutation,
  useUpdateTableMutation,
  useUploadTableImageMutation,
} from '#/features/platform/model/platform-hooks.ts'
import { m } from '#/paraglide/messages'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { useSelectedBusinessId } from '#/shared/libs/hooks/use-active-business.ts'
import { useTablePermissions } from '#/shared/libs/hooks/use-table-permissions.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { useSocketConnectionStatus } from '#/shared/realtime/use-socket-connection-status'
import { ConfirmDeleteModal } from '#/shared/ui/confirm-delete-modal'
import { Modal } from '#/shared/ui/modal'
import { RealtimeStatusIndicator } from '#/shared/ui/realtime-status-indicator'
import type { SessionWithOrders } from './admin-table'
import { AdminTable } from './admin-table'

type CreateTableFormValues = z.infer<typeof createTableSchema>
type UpdateTableFormValues = z.infer<typeof updateTableSchema>

type FilterTab = 'all' | 'active' | 'inactive' | 'reserved' | 'available'

interface SelectedTable {
  label: string
  qrCode: string
}

interface ImageUploadFieldProps {
  value: string | null
  previewFile: File | null
  onChange: (file: File | null) => void
}

function ImageUploadField({ value, previewFile, onChange }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUrl = previewFile ? URL.createObjectURL(previewFile) : value

  return (
    <div className='space-y-2'>
      <p className='text-xs font-semibold uppercase text-muted-foreground'>
        {m.admin_tables_image_label()}
      </p>
      <div className='relative h-50 w-full overflow-hidden rounded-xl border border-dashed border-border bg-muted'>
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt={m.admin_tables_preview_alt()}
              className='h-full w-full object-cover'
            />
            <button
              type='button'
              onClick={() => onChange(null)}
              className='absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground shadow hover:bg-background'
            >
              <X className='h-3.5 w-3.5' />
            </button>
          </>
        ) : (
          <button
            type='button'
            onClick={() => inputRef.current?.click()}
            className='flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground transition-colors hover:text-foreground'
          >
            <Upload className='h-6 w-6' />
            <span className='text-xs'>{m.admin_tables_click_to_upload()}</span>
          </button>
        )}
      </div>
      {previewUrl && (
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='w-full rounded-xl'
          onClick={() => inputRef.current?.click()}
        >
          <Upload className='mr-2 h-3.5 w-3.5' /> {m.admin_tables_change_image()}
        </Button>
      )}
      <input
        ref={inputRef}
        type='file'
        accept='image/jpeg,image/png,image/webp,image/svg+xml'
        className='hidden'
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null
          onChange(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

function filterTables(tables: TableEntity[], tab: FilterTab, search: string): TableEntity[] {
  const q = search.trim().toLowerCase()
  return tables.filter((t) => {
    if (q && !String(t.number).includes(q)) return false
    if (tab === 'active') return t.isActive
    if (tab === 'inactive') return !t.isActive
    if (tab === 'reserved') return t.isReserved
    if (tab === 'available') return !t.isReserved && t.isActive
    return true
  })
}

function getFilterTabs(): { value: FilterTab; label: string }[] {
  return [
    { value: 'all', label: m.admin_tables_filter_all() },
    { value: 'active', label: m.admin_tables_filter_active() },
    { value: 'inactive', label: m.admin_tables_filter_inactive() },
    { value: 'reserved', label: m.admin_tables_filter_reserved() },
    { value: 'available', label: m.admin_tables_filter_available() },
  ]
}

export function AdminTablesContent() {
  const FILTER_TABS = useMemo(() => getFilterTabs(), [])
  const skeletonCards = useMemo(() => ['sk-a', 'sk-b', 'sk-c', 'sk-d', 'sk-e', 'sk-f'], [])

  const perms = useTablePermissions()
  const businessId = useSelectedBusinessId() ?? ''

  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<TableEntity | null>(null)
  const [deletingTable, setDeletingTable] = useState<TableEntity | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<SelectedTable | null>(null)
  const [copied, setCopied] = useState(false)

  const [createImageFile, setCreateImageFile] = useState<File | null>(null)
  const [editImageFile, setEditImageFile] = useState<File | null>(null)

  const numberId = useId()
  const capacityId = useId()
  const editNumberId = useId()
  const editCapacityId = useId()
  const editActiveId = useId()

  const {
    data: tables = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(tablesQueryOptions(businessId))
  const visibleTables = filterTables(tables, activeTab, search)

  const createTableMutation = useCreateTableMutation()
  const updateTableMutation = useUpdateTableMutation()
  const deleteTableMutation = useDeleteTableMutation()
  const toggleStatusMutation = useToggleTableStatusMutation()
  const setReservationMutation = useSetTableReservationMutation()
  const uploadImageMutation = useUploadTableImageMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTableFormValues>({
    resolver: zodResolver(createTableSchema),
    defaultValues: { number: 1, capacity: 2, isActive: true },
  })

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateTableFormValues>({
    resolver: zodResolver(updateTableSchema),
  })

  const onCreateSubmit = async (values: CreateTableFormValues) => {
    try {
      const created = await createTableMutation.mutateAsync(values)
      if (createImageFile) {
        await uploadImageMutation.mutateAsync({ tableId: created.id, file: createImageFile })
      }
      showSuccess(m.admin_tables_created())
      setCreateImageFile(null)
      reset({ number: values.number + 1, capacity: 2, isActive: true })
      setIsCreateOpen(false)
    } catch (mutationError) {
      showError(getResponseErrorMessage(mutationError))
    }
  }

  const openEditTable = (table: TableEntity) => {
    setEditingTable(table)
    setEditImageFile(null)
    resetEdit({ number: table.number, capacity: table.capacity, isActive: table.isActive })
  }

  const onEditSubmit = async (values: UpdateTableFormValues) => {
    if (!editingTable) return
    try {
      await updateTableMutation.mutateAsync({ tableId: editingTable.id, data: values })
      if (editImageFile) {
        await uploadImageMutation.mutateAsync({ tableId: editingTable.id, file: editImageFile })
      }
      showSuccess(m.admin_tables_updated())
      setEditingTable(null)
      setEditImageFile(null)
    } catch (mutationError) {
      showError(getResponseErrorMessage(mutationError))
    }
  }

  const handleDelete = async () => {
    if (!deletingTable) return
    try {
      await deleteTableMutation.mutateAsync(deletingTable.id)
      showSuccess(m.admin_tables_removed())
      setDeletingTable(null)
    } catch (mutationError) {
      showError(getResponseErrorMessage(mutationError))
    }
  }

  const handleToggleStatus = async (table: TableEntity) => {
    try {
      await toggleStatusMutation.mutateAsync({
        tableId: table.id,
        data: { isActive: !table.isActive },
      })
      showSuccess(table.isActive ? m.admin_tables_deactivated() : m.admin_tables_activated())
    } catch (mutationError) {
      showError(getResponseErrorMessage(mutationError))
    }
  }

  const handleToggleReservation = async (table: TableEntity) => {
    try {
      await setReservationMutation.mutateAsync({
        tableId: table.id,
        data: { isReserved: !table.isReserved },
      })
      showSuccess(table.isReserved ? m.admin_tables_unreserved() : m.admin_tables_reserved_toast())
    } catch (mutationError) {
      showError(getResponseErrorMessage(mutationError))
    }
  }

  const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/customer/menu/?id=${selectedTable?.qrCode}`

  const copyToClipboard = () => {
    globalThis.navigator.clipboard.writeText(qrUrl)
    showSuccess(m.admin_tables_qr_url_copied())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isBusy =
    toggleStatusMutation.isPending ||
    setReservationMutation.isPending ||
    uploadImageMutation.isPending

  const { data: allOrders = [] } = useQuery(ordersQueryOptions(businessId))
  const { data: allPayments = [] } = useQuery(paymentsQueryOptions(businessId))
  const { data: activeSessions = [] } = useQuery(activeSessionsQueryOptions(businessId))

  // Joins business:<businessId> and keeps orders/payments/sessions/tables in sync as
  // socket events land — waiter-call state now lives on the session itself
  // (SessionSummary.waiterCallActive), so no page-local tracking is needed here.
  useOrderNotifications({ room: 'business', id: businessId })
  const isRealtimeConnected = useSocketConnectionStatus(!!businessId)

  // A table can carry several concurrent sessions (separate guest parties) — group every
  // active session, and every order placed into one, by tableId so each table's card gets
  // one entry per session instead of collapsing to a single order table-wide.
  const sessionsWithOrdersByTableId = useMemo(() => {
    const ordersBySessionId = new Map<string, Order[]>()
    for (const order of allOrders) {
      if (!order.tableSessionId) continue
      const list = ordersBySessionId.get(order.tableSessionId)
      if (list) {
        list.push(order)
      } else {
        ordersBySessionId.set(order.tableSessionId, [order])
      }
    }

    const map = new Map<string, SessionWithOrders[]>()
    for (const session of activeSessions) {
      const entry: SessionWithOrders = { session, orders: ordersBySessionId.get(session.id) ?? [] }
      const list = map.get(session.tableId)
      if (list) {
        list.push(entry)
      } else {
        map.set(session.tableId, [entry])
      }
    }
    return map
  }, [allOrders, activeSessions])

  const pendingPaymentByOrderId = useMemo(() => {
    const map = new Map<string, Payment>()
    for (const payment of allPayments) {
      if (payment.status === 'PENDING') {
        map.set(payment.orderId, payment)
      }
    }
    return map
  }, [allPayments])

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>{m.admin_tables_heading()}</h1>
          <p className='text-muted-foreground'>{m.admin_tables_subheading()}</p>
        </div>
        <div className='flex items-center gap-3'>
          <RealtimeStatusIndicator isConnected={isRealtimeConnected} />
          {perms.canCreate && (
            <Button size='sm' className='rounded-full' onClick={() => setIsCreateOpen(true)}>
              <Plus className='mr-2 h-4 w-4' /> {m.admin_tables_add_table()}
            </Button>
          )}
        </div>
      </div>

      {/* Filter + search bar */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <div className='flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1'>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type='button'
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          type='search'
          placeholder={m.admin_tables_search_placeholder()}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='h-9 flex-1 rounded-xl border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring'
        />
      </div>

      {/* Error */}
      {isError && (
        <div className='rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive'>
          {getResponseErrorMessage(error)}
          <button
            type='button'
            className='ml-2 font-semibold underline'
            onClick={() => void refetch()}
          >
            {m.admin_tables_retry()}
          </button>
        </div>
      )}

      {/* Skeletons */}
      {isPending && (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {skeletonCards.map((id) => (
            <div key={id} className='h-64 animate-pulse rounded-2xl bg-muted' />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isPending && tables.length === 0 && (
        <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center'>
          <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
            <LayoutGrid className='h-6 w-6 text-muted-foreground' />
          </div>
          <h3 className='mb-1 text-base font-semibold'>{m.admin_tables_empty_title()}</h3>
          <p className='mb-6 max-w-xs text-sm text-muted-foreground'>
            {m.admin_tables_empty_description()}
          </p>
          {perms.canCreate && (
            <Button size='sm' className='rounded-full' onClick={() => setIsCreateOpen(true)}>
              <Plus className='mr-2 h-4 w-4' /> {m.admin_tables_add_first()}
            </Button>
          )}
        </div>
      )}

      {/* No results for filter */}
      {!isPending && tables.length > 0 && visibleTables.length === 0 && (
        <div className='py-12 text-center text-sm text-muted-foreground'>
          {m.admin_tables_no_match_filter()}
        </div>
      )}

      {/* Table cards grid */}
      {!isPending && visibleTables.length > 0 && (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {visibleTables.map((table) => (
            <AdminTable
              key={table.id}
              table={table}
              sessions={sessionsWithOrdersByTableId.get(table.id) ?? []}
              pendingPaymentByOrderId={pendingPaymentByOrderId}
              perms={perms}
              handleToggleStatus={handleToggleStatus}
              handleToggleReservation={handleToggleReservation}
              openEditTable={openEditTable}
              setDeletingTable={setDeletingTable}
              setSelectedTable={setSelectedTable}
              setIsQrModalOpen={setIsQrModalOpen}
              isBusy={isBusy}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingTable)}
        onClose={() => setDeletingTable(null)}
        onConfirm={() => void handleDelete()}
        name={deletingTable ? m.admin_tables_table_label({ number: deletingTable.number }) : ''}
        entityLabel={m.admin_tables_entity_label()}
        isPending={deleteTableMutation.isPending}
      />

      {/* Create modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false)
          setCreateImageFile(null)
        }}
        title={m.admin_tables_create_modal_title()}
        footer={
          <>
            <Button
              variant='ghost'
              onClick={() => {
                setIsCreateOpen(false)
                setCreateImageFile(null)
              }}
            >
              {m.admin_tables_cancel()}
            </Button>
            <Button
              onClick={() => void handleSubmit(onCreateSubmit)()}
              disabled={createTableMutation.isPending || uploadImageMutation.isPending}
            >
              {createTableMutation.isPending || uploadImageMutation.isPending
                ? m.admin_tables_creating()
                : m.admin_tables_create_btn()}
            </Button>
          </>
        }
      >
        <form className='space-y-4'>
          <ImageUploadField
            value={null}
            previewFile={createImageFile}
            onChange={setCreateImageFile}
          />

          <div className='space-y-2'>
            <label
              htmlFor={numberId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              {m.admin_tables_number_label()}
            </label>
            <input
              id={numberId}
              type='number'
              min={1}
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...register('number', { valueAsNumber: true })}
            />
            {errors.number && <p className='text-xs text-red-600'>{errors.number.message}</p>}
          </div>

          <div className='space-y-2'>
            <label
              htmlFor={capacityId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              {m.admin_tables_capacity_label()}
            </label>
            <input
              id={capacityId}
              type='number'
              min={1}
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...register('capacity', { valueAsNumber: true })}
            />
            {errors.capacity && <p className='text-xs text-red-600'>{errors.capacity.message}</p>}
          </div>

          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              className='h-4 w-4 rounded border border-input accent-primary'
              {...register('isActive')}
            />
            <span>{m.admin_tables_active()}</span>
          </label>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={Boolean(editingTable)}
        onClose={() => {
          setEditingTable(null)
          setEditImageFile(null)
        }}
        title={m.admin_tables_edit_modal_title({ number: editingTable?.number ?? 0 })}
        footer={
          <>
            <Button
              variant='ghost'
              onClick={() => {
                setEditingTable(null)
                setEditImageFile(null)
              }}
            >
              {m.admin_tables_cancel()}
            </Button>
            <Button
              onClick={() => void handleEditSubmit(onEditSubmit)()}
              disabled={updateTableMutation.isPending || uploadImageMutation.isPending}
            >
              {updateTableMutation.isPending || uploadImageMutation.isPending
                ? m.admin_tables_saving()
                : m.admin_tables_save()}
            </Button>
          </>
        }
      >
        <form className='space-y-4'>
          <ImageUploadField
            value={editingTable?.imageUrl ?? null}
            previewFile={editImageFile}
            onChange={setEditImageFile}
          />

          <div className='space-y-2'>
            <label
              htmlFor={editNumberId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              Number
            </label>
            <input
              id={editNumberId}
              type='number'
              min={1}
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...registerEdit('number', { valueAsNumber: true })}
            />
            {editErrors.number && (
              <p className='text-xs text-red-600'>{editErrors.number.message}</p>
            )}
          </div>

          <div className='space-y-2'>
            <label
              htmlFor={editCapacityId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              Capacity
            </label>
            <input
              id={editCapacityId}
              type='number'
              min={1}
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...registerEdit('capacity', { valueAsNumber: true })}
            />
            {editErrors.capacity && (
              <p className='text-xs text-red-600'>{editErrors.capacity.message}</p>
            )}
          </div>

          <label htmlFor={editActiveId} className='flex items-center gap-2 text-sm'>
            <input
              id={editActiveId}
              type='checkbox'
              className='h-4 w-4 rounded border border-input accent-primary'
              {...registerEdit('isActive')}
            />
            <span>{m.admin_tables_active()}</span>
          </label>
        </form>
      </Modal>

      {/* QR modal */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => {
          setIsQrModalOpen(false)
          setCopied(false)
        }}
        title={m.admin_tables_qr_modal_title({ label: selectedTable?.label ?? '' })}
        footer={
          <Button
            variant='ghost'
            onClick={() => {
              setIsQrModalOpen(false)
              setCopied(false)
            }}
            className='rounded-full'
          >
            {m.admin_tables_close()}
          </Button>
        }
      >
        <div className='flex flex-col items-center gap-6 py-2'>
          <div className='rounded-2xl border border-border bg-white p-5 shadow-sm'>
            <QRCodeSVG value={qrUrl} size={200} level='M' includeMargin={false} />
          </div>

          <div className='text-center'>
            <p className='text-base font-semibold'>{selectedTable?.label}</p>
            <p className='mt-0.5 text-xs text-muted-foreground'>
              {m.admin_tables_scan_instruction()}
            </p>
          </div>

          <div className='w-full space-y-2'>
            <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
              {m.admin_tables_table_url_label()}
            </p>
            <div className='flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2'>
              <span className='min-w-0 flex-1 truncate text-xs text-foreground/70'>{qrUrl}</span>
              <Button
                size='icon'
                variant='ghost'
                className='h-7 w-7 shrink-0 rounded-lg hover:bg-background'
                onClick={copyToClipboard}
                title={m.admin_tables_copy_url_title()}
              >
                {copied ? (
                  <Check className='h-3.5 w-3.5 text-green-500' />
                ) : (
                  <Copy className='h-3.5 w-3.5' />
                )}
              </Button>
            </div>
            <Button variant='outline' className='w-full rounded-xl' onClick={copyToClipboard}>
              {copied ? (
                <>
                  <Check className='mr-2 h-4 w-4 text-green-500' />
                  {m.admin_tables_copied()}
                </>
              ) : (
                <>
                  <Copy className='mr-2 h-4 w-4' />
                  {m.admin_tables_copy_qr_url()}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
