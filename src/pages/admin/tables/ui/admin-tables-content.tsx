import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import {
  Check,
  Copy,
  Edit2,
  LayoutGrid,
  Minus,
  Plus,
  QrCode,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useId, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import type { TableEntity } from '#/features/platform/api/platform.types.ts'
import { tablesQueryOptions } from '#/features/platform/lib/query-options.ts'
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
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { useTablePermissions } from '#/shared/libs/hooks/use-table-permissions.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { ConfirmDeleteModal } from '#/shared/ui/confirm-delete-modal'
import { LazyImage } from '#/shared/ui/lazy-image.tsx'
import { Modal } from '#/shared/ui/modal'

type CreateTableFormValues = z.infer<typeof createTableSchema>
type UpdateTableFormValues = z.infer<typeof updateTableSchema>

type FilterTab = 'all' | 'active' | 'inactive' | 'reserved' | 'available'

interface SelectedTable {
  label: string
  qrCode: string
}

function TableImagePlaceholder({ number }: { number: number }) {
  return (
    <div className='flex h-full w-full items-center justify-center bg-muted'>
      <div className='flex flex-col items-center gap-1 text-muted-foreground'>
        <LayoutGrid className='h-8 w-8' />
        <span className='text-lg font-bold'>{number}</span>
      </div>
    </div>
  )
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
      <p className='text-xs font-semibold uppercase text-muted-foreground'>Table Image</p>
      <div className='relative h-36 w-full overflow-hidden rounded-xl border border-dashed border-border bg-muted'>
        {previewUrl ? (
          <>
            <img src={previewUrl} alt='Table preview' className='h-full w-full object-cover' />
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
            <span className='text-xs'>Click to upload image</span>
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
          <Upload className='mr-2 h-3.5 w-3.5' /> Change image
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

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'available', label: 'Available' },
]

export function AdminTablesContent() {
  const skeletonCards = useMemo(() => ['sk-a', 'sk-b', 'sk-c', 'sk-d', 'sk-e', 'sk-f'], [])

  const perms = useTablePermissions()

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

  const { data: tables = [], isPending, isError, error, refetch } = useQuery(tablesQueryOptions())
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
      showSuccess('Table created')
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
      showSuccess('Table updated')
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
      showSuccess('Table removed')
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
      showSuccess(table.isActive ? 'Table deactivated' : 'Table activated')
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
      showSuccess(table.isReserved ? 'Table unreserved' : 'Table reserved')
    } catch (mutationError) {
      showError(getResponseErrorMessage(mutationError))
    }
  }

  const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/customer/menu/?id=${selectedTable?.qrCode}`

  const copyToClipboard = () => {
    globalThis.navigator.clipboard.writeText(qrUrl)
    showSuccess('QR code URL copied to clipboard')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isBusy =
    toggleStatusMutation.isPending ||
    setReservationMutation.isPending ||
    uploadImageMutation.isPending

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Tables</h1>
          <p className='text-muted-foreground'>Monitor table status and manage QR codes.</p>
        </div>
        {perms.canCreate && (
          <Button size='sm' className='rounded-full' onClick={() => setIsCreateOpen(true)}>
            <Plus className='mr-2 h-4 w-4' /> Add Table
          </Button>
        )}
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
          placeholder='Search by table number…'
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
            Retry
          </button>
        </div>
      )}

      {/* Skeletons */}
      {isPending && (
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
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
          <h3 className='mb-1 text-base font-semibold'>No tables yet</h3>
          <p className='mb-6 max-w-xs text-sm text-muted-foreground'>
            You don't have any tables yet. Start by adding your first table.
          </p>
          {perms.canCreate && (
            <Button size='sm' className='rounded-full' onClick={() => setIsCreateOpen(true)}>
              <Plus className='mr-2 h-4 w-4' /> Add your first table
            </Button>
          )}
        </div>
      )}

      {/* No results for filter */}
      {!isPending && tables.length > 0 && visibleTables.length === 0 && (
        <div className='py-12 text-center text-sm text-muted-foreground'>
          No tables match this filter.
        </div>
      )}

      {/* Table cards grid */}
      {!isPending && visibleTables.length > 0 && (
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
          {visibleTables.map((table) => {
            const isSessionReserved = Boolean(table.currentSessionId)
            const reservedLabel = isSessionReserved ? 'Guest Session' : 'Reserved by Staff'

            return (
              <Card
                key={table.id}
                className={`overflow-hidden rounded-2xl shadow-sm transition-all hover:shadow-md pt-0 ${
                  !table.isActive ? 'opacity-60 grayscale' : ''
                } ${table.isReserved ? 'ring-2 ring-amber-400/60' : ''}`}
              >
                {/* Image area */}
                <div className='relative h-44 w-full overflow-hidden bg-muted'>
                  {table.imageUrl ? (
                    <LazyImage
                      src={table.imageUrl}
                      alt={`Table ${table.number}`}
                      className='h-full w-full object-contain pt-4'
                    />
                  ) : (
                    <TableImagePlaceholder number={table.number} />
                  )}

                  <div className='absolute left-2 top-2 flex flex-col gap-1'>
                    <Badge
                      variant={table.isActive ? 'success' : 'outline'}
                      className='text-[10px] capitalize shadow'
                    >
                      {table.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {table.isReserved && (
                      <Badge variant='warning' className='text-[10px] shadow'>
                        {reservedLabel}
                      </Badge>
                    )}
                  </div>
                </div>

                <CardHeader className='px-3 pt-2 pb-0'>
                  <CardTitle className='text-base font-bold'>Table {table.number}</CardTitle>
                </CardHeader>

                <CardContent className='px-3 pb-3'>
                  <div className='mb-3 flex items-center gap-1.5 text-muted-foreground'>
                    <Users className='h-3.5 w-3.5' />
                    <span className='text-xs'>{table.capacity} seats</span>
                  </div>

                  {/* Action row */}
                  <div className='flex flex-wrap gap-1.5'>
                    {/* QR code — always visible */}
                    <Button
                      variant='outline'
                      size='icon'
                      className='h-7 w-7 rounded-lg'
                      title='QR Code'
                      onClick={() => {
                        setSelectedTable({ label: `Table ${table.number}`, qrCode: table.qrCode })
                        setIsQrModalOpen(true)
                      }}
                    >
                      <QrCode className='h-3.5 w-3.5' />
                    </Button>

                    {perms.canEdit && (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7 rounded-lg border border-border'
                        title='Edit table'
                        onClick={() => openEditTable(table)}
                      >
                        <Edit2 className='h-3.5 w-3.5' />
                      </Button>
                    )}

                    {perms.canToggleStatus && (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7 rounded-lg border border-border'
                        title={table.isActive ? 'Deactivate' : 'Activate'}
                        disabled={isBusy}
                        onClick={() => void handleToggleStatus(table)}
                      >
                        {table.isActive ? (
                          <Minus className='h-3.5 w-3.5' />
                        ) : (
                          <Plus className='h-3.5 w-3.5' />
                        )}
                      </Button>
                    )}

                    {perms.canManageReservation && (
                      <Button
                        variant={table.isReserved ? 'destructive' : 'outline'}
                        size='icon'
                        className='h-7 w-7 rounded-lg'
                        title={table.isReserved ? 'Unreserve' : 'Reserve'}
                        disabled={isBusy || isSessionReserved}
                        onClick={() => void handleToggleReservation(table)}
                      >
                        {table.isReserved ? (
                          <X className='h-3.5 w-3.5' />
                        ) : (
                          <Check className='h-3.5 w-3.5' />
                        )}
                      </Button>
                    )}

                    {perms.canDelete && (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7 rounded-lg border border-border text-destructive hover:bg-destructive/10'
                        title='Delete'
                        onClick={() => setDeletingTable(table)}
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingTable)}
        onClose={() => setDeletingTable(null)}
        onConfirm={() => void handleDelete()}
        name={deletingTable ? `Table ${deletingTable.number}` : ''}
        entityLabel='table'
        isPending={deleteTableMutation.isPending}
      />

      {/* Create modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false)
          setCreateImageFile(null)
        }}
        title='Create table'
        footer={
          <>
            <Button
              variant='ghost'
              onClick={() => {
                setIsCreateOpen(false)
                setCreateImageFile(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSubmit(onCreateSubmit)()}
              disabled={createTableMutation.isPending || uploadImageMutation.isPending}
            >
              {createTableMutation.isPending || uploadImageMutation.isPending
                ? 'Creating…'
                : 'Create'}
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
              Number
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
              Capacity
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
            <span>Active</span>
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
        title={`Edit Table ${editingTable?.number ?? ''}`}
        footer={
          <>
            <Button
              variant='ghost'
              onClick={() => {
                setEditingTable(null)
                setEditImageFile(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleEditSubmit(onEditSubmit)()}
              disabled={updateTableMutation.isPending || uploadImageMutation.isPending}
            >
              {updateTableMutation.isPending || uploadImageMutation.isPending ? 'Saving…' : 'Save'}
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
            <span>Active</span>
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
        title={`QR Code — ${selectedTable?.label ?? ''}`}
        footer={
          <Button
            variant='ghost'
            onClick={() => {
              setIsQrModalOpen(false)
              setCopied(false)
            }}
            className='rounded-full'
          >
            Close
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
              Scan to open the menu for this table
            </p>
          </div>

          <div className='w-full space-y-2'>
            <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
              Table URL
            </p>
            <div className='flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2'>
              <span className='min-w-0 flex-1 truncate text-xs text-foreground/70'>{qrUrl}</span>
              <Button
                size='icon'
                variant='ghost'
                className='h-7 w-7 shrink-0 rounded-lg hover:bg-background'
                onClick={copyToClipboard}
                title='Copy URL'
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
                  Copied!
                </>
              ) : (
                <>
                  <Copy className='mr-2 h-4 w-4' />
                  Copy QR code URL
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
