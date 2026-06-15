import { Button } from '#/components/ui/button'
import { useGetCategories } from '#/entities/product/api/category-hooks'
import {
  useCreateProduct,
  useGetProduct,
  useUpdateProduct,
} from '#/entities/product/api/product-hooks'
import { useSyncProductModifierGroupsMutation } from '#/features/platform/model/platform-hooks'
import type { ProductResponse } from '#/features/product/api/product.types'
import type {
  CreateProductFormData,
  UpdateProductFormData,
} from '#/features/product/lib/schemas/create-product-form.schema'
import { ProductForm } from '#/features/product/ui/product-form'
import useActiveBusinessStore from '#/shared/store/use-active-business.store'
import { Modal } from '#/shared/ui/modal'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  productId?: string
  defaultCategoryId?: string
  initialData?: ProductResponse
}

export function ProductModal({
  isOpen,
  onClose,
  mode,
  productId,
  defaultCategoryId,
}: Readonly<ProductModalProps>) {
  const { active } = useActiveBusinessStore()
  const activeBusinessId = active?.id ?? ''
  const { data: categories = [] } = useGetCategories(activeBusinessId)
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const syncModifierGroupsMutation = useSyncProductModifierGroupsMutation()

  const { data: fetchedProduct, isPending: isProductPending } = useGetProduct(
    activeBusinessId,
    productId ?? '',
  )
  const isLoadingEditData = mode === 'edit' && !!productId && isProductPending && !fetchedProduct

  const handleSubmit = async (
    data: CreateProductFormData | UpdateProductFormData,
    modifierGroupIds: string[],
  ) => {
    if (!activeBusinessId) {
      throw new Error('No active business selected')
    }

    let savedProductId: string

    if (mode === 'create') {
      const created = await createMutation.mutateAsync({
        businessId: activeBusinessId,
        payload: data as CreateProductFormData,
      })
      savedProductId = created.id
    } else if (mode === 'edit' && productId) {
      await updateMutation.mutateAsync({
        businessId: activeBusinessId,
        productId,
        payload: data as UpdateProductFormData,
      })
      savedProductId = productId
    } else {
      return
    }

    await syncModifierGroupsMutation.mutateAsync({
      productId: savedProductId,
      groupIds: modifierGroupIds,
    })

    onClose()
  }

  const isLoading =
    createMutation.isPending || updateMutation.isPending || syncModifierGroupsMutation.isPending

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create Product' : 'Edit Product'}
      footer={
        <div className='flex gap-2 justify-end'>
          <Button variant='ghost' onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      {isLoadingEditData ? (
        <div className='flex h-40 items-center justify-center text-sm text-muted-foreground'>
          Loading product…
        </div>
      ) : (
        <ProductForm
          businessId={activeBusinessId}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          initialData={mode === 'edit' ? fetchedProduct : undefined}
          defaultCategoryId={mode === 'create' ? defaultCategoryId : undefined}
          mode={mode}
        />
      )}
    </Modal>
  )
}
