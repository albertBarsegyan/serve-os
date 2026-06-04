import { AlertCircle, Edit, Loader, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '#/components/ui/button'
import {
  useBusinessesQuery,
  useDeleteBusinessMutation,
} from '#/features/business/model/business-hooks'
import { showError, showSuccess } from '#/shared/libs/hooks/toast'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils'
import { Modal } from '#/shared/ui/modal'
import { BusinessForm } from './business-form'

type BusinessFormMode = 'add' | 'edit'

export function AdminBusinessesPage() {
  const [formMode, setFormMode] = useState<BusinessFormMode | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const businessesQuery = useBusinessesQuery({ enabled: true })
  const deleteBusinessMutation = useDeleteBusinessMutation()

  const handleOpenForm = useCallback((mode: BusinessFormMode, businessId?: string) => {
    setFormMode(mode)
    if (businessId) {
      setSelectedBusinessId(businessId)
    }
  }, [])

  const handleCloseForm = useCallback(() => {
    setFormMode(null)
    setSelectedBusinessId(null)
  }, [])

  const handleDeleteClick = (businessId: string) => {
    setDeleteTargetId(businessId)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return

    try {
      await deleteBusinessMutation.mutateAsync(deleteTargetId)
      showSuccess('Business deleted successfully')
      setIsDeleteConfirmOpen(false)
      setDeleteTargetId(null)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const businesses = businessesQuery.data ?? []
  const isLoading = businessesQuery.isLoading

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className='flex items-center justify-center py-12'>
          <Loader className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      )
    }

    if (businesses.length === 0) {
      return (
        <div className='rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center'>
          <AlertCircle className='mx-auto h-12 w-12 text-muted-foreground/50' />
          <h3 className='mt-4 text-lg font-semibold text-foreground'>No businesses yet</h3>
          <p className='mt-2 text-sm text-muted-foreground'>
            Create your first business to get started.
          </p>
          <Button className='mt-6 rounded-full' onClick={() => handleOpenForm('add')}>
            <Plus className='mr-2 h-4 w-4' /> Create First Business
          </Button>
        </div>
      )
    }

    return (
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {businesses.map((business) => (
          <div
            key={business.id}
            className='rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md'
          >
            <div className='mb-4 flex items-start justify-between'>
              <div className='flex-1'>
                <h3 className='font-semibold text-foreground'>{business.name}</h3>
                <p className='text-xs text-muted-foreground'>{business.type}</p>
              </div>
              <div
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  business.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {business.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div className='mb-6 space-y-2 text-sm text-muted-foreground'>
              <p>📍 {business.location}</p>
              <p>💰 {business.currency}</p>
              <p className='text-xs'>Created {new Date(business.createdAt).toLocaleDateString()}</p>
            </div>

            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                className='flex-1 rounded-lg'
                onClick={() => handleOpenForm('edit', business.id)}
              >
                <Edit className='mr-2 h-4 w-4' /> Edit
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='flex-1 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive'
                onClick={() => handleDeleteClick(business.id)}
                disabled={deleteBusinessMutation.isPending}
              >
                <Trash2 className='mr-2 h-4 w-4' /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Businesses</h1>
          <p className='text-muted-foreground'>Manage all your registered businesses.</p>
        </div>
        <Button size='sm' className='rounded-full' onClick={() => handleOpenForm('add')}>
          <Plus className='mr-2 h-4 w-4' /> Add Business
        </Button>
      </div>

      {renderContent()}

      {formMode && (
        <BusinessForm mode={formMode} businessId={selectedBusinessId} onClose={handleCloseForm} />
      )}

      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title='Delete Business'
        footer={
          <>
            <Button variant='ghost' onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleConfirmDelete}
              disabled={deleteBusinessMutation.isPending}
            >
              {deleteBusinessMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete this business? This action cannot be undone.</p>
      </Modal>
    </div>
  )
}
