import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { MoreVertical, Plus, QrCode, Trash2, Users } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { createTableSchema } from '#/features/platform/lib/schemas/platform.schemas.ts'
import { tablesQueryOptions } from '#/features/platform/lib/query-options.ts'
import {
  useCreateTableMutation,
  useDeleteTableMutation,
} from '#/features/platform/model/platform-hooks.ts'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Modal } from '#/shared/ui/Modal'

type CreateTableFormValues = z.infer<typeof createTableSchema>

export function AdminTablesContent() {
  const skeletonCards = useMemo(
    () => ['table-skeleton-a', 'table-skeleton-b', 'table-skeleton-c', 'table-skeleton-d'],
    [],
  )

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<{
    label: string
    qrCode: string
  } | null>(null)

  const numberId = useId()
  const capacityId = useId()
  const qrCodeId = useId()

  const { data: tables = [], isPending, isError, error, refetch } = useQuery(tablesQueryOptions())

  const createTableMutation = useCreateTableMutation()
  const deleteTableMutation = useDeleteTableMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTableFormValues>({
    resolver: zodResolver(createTableSchema),
    defaultValues: {
      number: 1,
      capacity: 2,
      qrCode: '',
      isActive: true,
    },
  })

  const onCreateSubmit = async (values: CreateTableFormValues) => {
    try {
      await createTableMutation.mutateAsync(values)
      showSuccess('Table created')
      reset({ number: values.number + 1, capacity: 2, qrCode: '', isActive: true })
      setIsCreateOpen(false)
    } catch (mutationError) {
      showError(getResponseErrorMessage(mutationError))
    }
  }

  const handleDelete = async (tableId: string) => {
    try {
      await deleteTableMutation.mutateAsync(tableId)
      showSuccess('Table removed')
    } catch (mutationError) {
      showError(getResponseErrorMessage(mutationError))
    }
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Tables</h1>
          <p className='text-muted-foreground'>Monitor table status and manage QR codes.</p>
        </div>
        <Button size='sm' className='rounded-full' onClick={() => setIsCreateOpen(true)}>
          <Plus className='mr-2 h-4 w-4' /> Add Table
        </Button>
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

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {isPending &&
          skeletonCards.map((skeletonId) => (
            <Card key={skeletonId} className='overflow-hidden'>
              <CardContent className='h-40 animate-pulse rounded-xl bg-muted' />
            </Card>
          ))}

        {!isPending &&
          tables.map((table) => (
            <Card key={table.id} className='overflow-hidden transition-all hover:shadow-md'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-lg font-bold'>Table {table.number}</CardTitle>
                <Badge variant={table.isActive ? 'success' : 'outline'} className='capitalize'>
                  {table.isActive ? 'active' : 'inactive'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className='mb-6 flex items-center gap-2 text-muted-foreground'>
                  <Users className='h-4 w-4' />
                  <span className='text-sm font-medium'>Capacity: {table.capacity} guests</span>
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex-1 rounded-xl'
                    onClick={() => {
                      setSelectedTable({
                        label: `Table ${table.number}`,
                        qrCode: table.qrCode,
                      })
                      setIsQrModalOpen(true)
                    }}
                  >
                    <QrCode className='mr-2 h-4 w-4' /> QR Code
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='rounded-xl border border-border text-destructive hover:bg-destructive/10'
                    onClick={() => {
                      void handleDelete(table.id)
                    }}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title='Create table'
        footer={
          <>
            <Button variant='ghost' onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleSubmit(onCreateSubmit)()
              }}
              disabled={createTableMutation.isPending}
            >
              {createTableMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </>
        }
      >
        <form className='space-y-4'>
          <div className='space-y-2'>
            <label htmlFor={numberId} className='text-xs font-semibold uppercase text-muted-foreground'>
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
            <label htmlFor={capacityId} className='text-xs font-semibold uppercase text-muted-foreground'>
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

          <div className='space-y-2'>
            <label htmlFor={qrCodeId} className='text-xs font-semibold uppercase text-muted-foreground'>
              QR code token
            </label>
            <input
              id={qrCodeId}
              type='text'
              placeholder='table-12-qr'
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...register('qrCode')}
            />
            {errors.qrCode && <p className='text-xs text-red-600'>{errors.qrCode.message}</p>}
          </div>

          <label className='flex items-center gap-2 text-sm'>
            <input type='checkbox' className='h-4 w-4 rounded border border-input accent-primary' {...register('isActive')} />
            <span>Active</span>
          </label>
        </form>
      </Modal>

      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title={`QR Code for ${selectedTable?.label ?? ''}`}
        footer={
          <Button onClick={() => setIsQrModalOpen(false)} className='rounded-full'>
            Close
          </Button>
        }
      >
        <div className='space-y-3 py-2 text-sm text-muted-foreground'>
          <p>Table token:</p>
          <code className='inline-block rounded-lg bg-muted px-3 py-2 text-xs'>
            {selectedTable?.qrCode ?? '—'}
          </code>
          <p>Use this token to generate and print your QR asset in your backend/ops tooling.</p>
          <div className='flex items-center gap-2 text-xs'>
            <MoreVertical className='h-3 w-3' />
            <span>Static QR preview disabled for deterministic rendering.</span>
          </div>
        </div>
      </Modal>
    </div>
  )
}
