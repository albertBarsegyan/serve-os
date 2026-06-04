import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Edit2, Eye, EyeOff, Plus, Search, ShoppingBag, Trash2 } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import type { MenuCategory } from '#/features/platform/api/platform.types.ts'
import { menuCategoriesQueryOptions, productsQueryOptions } from '#/features/platform/lib/query-options.ts'
import {
  createMenuCategorySchema,
  updateMenuCategorySchema,
} from '#/features/platform/lib/schemas/platform.schemas.ts'
import {
  useCreateMenuCategoryMutation,
  useDeleteMenuCategoryMutation,
  useDeleteProductMutation,
  useUpdateMenuCategoryMutation,
} from '#/features/platform/model/platform-hooks.ts'
import { ProductModal } from '#/features/product/ui/product-modal.tsx'
import { cn } from '#/lib/utils'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import useActiveBusinessStore from '#/shared/store/use-active-business.store'
import { Modal } from '#/shared/ui/modal'

type CreateCategoryFormValues = z.infer<typeof createMenuCategorySchema>
type UpdateCategoryFormValues = z.infer<typeof updateMenuCategorySchema>

export function AdminMenuContent() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [productModalMode, setProductModalMode] = useState<'create' | 'edit'>('create')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  const categoryNameId = useId()
  const categoryDescriptionId = useId()
  const categorySortOrderId = useId()
  const editNameId = useId()
  const editDescriptionId = useId()
  const editSortOrderId = useId()

  const currency = useActiveBusinessStore((s) => s.active?.currency ?? 'USD')

  const categoriesQuery = useQuery(menuCategoriesQueryOptions(true))
  const productsQuery = useQuery(productsQueryOptions())

  const createCategoryMutation = useCreateMenuCategoryMutation()
  const updateCategoryMutation = useUpdateMenuCategoryMutation()
  const deleteCategoryMutation = useDeleteMenuCategoryMutation()
  const deleteProductMutation = useDeleteProductMutation()

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreateForm,
    formState: { errors: createErrors },
  } = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createMenuCategorySchema),
    defaultValues: { name: '', description: '', sortOrder: 0 },
  })

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEditForm,
    formState: { errors: editErrors },
  } = useForm<UpdateCategoryFormValues>({
    resolver: zodResolver(updateMenuCategorySchema),
  })

  const categoryOptions = useMemo(() => {
    const loaded = categoriesQuery.data ?? []
    return loaded
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => ({ id: category.id, label: category.name }))
  }, [categoriesQuery.data])

  const products = productsQuery.data ?? []

  const filteredItems = useMemo(() => {
    const byCategory =
      activeCategory === 'All'
        ? products
        : products.filter((item) => {
            const category = categoryOptions.find((option) => option.id === item.categoryId)
            return category?.label === activeCategory
          })

    const needle = search.trim().toLowerCase()
    if (!needle) return byCategory

    return byCategory.filter((item) =>
      [item.name, item.description ?? '', String(item.price)]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [activeCategory, categoryOptions, products, search])

  const onCategorySubmit = async (values: CreateCategoryFormValues) => {
    try {
      await createCategoryMutation.mutateAsync({
        ...values,
        description: values.description || null,
      })
      showSuccess('Category created')
      resetCreateForm({ name: '', description: '', sortOrder: 0 })
      setIsCategoryModalOpen(false)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const openEditCategory = (category: MenuCategory) => {
    setEditingCategory(category)
    resetEditForm({
      name: category.name,
      description: category.description ?? '',
      sortOrder: category.sortOrder,
    })
  }

  const onEditCategorySubmit = async (values: UpdateCategoryFormValues) => {
    if (!editingCategory) return
    try {
      await updateCategoryMutation.mutateAsync({
        categoryId: editingCategory.id,
        data: { ...values, description: values.description || null },
      })
      showSuccess('Category updated')
      setEditingCategory(null)
      if (activeCategory === editingCategory.name && values.name) {
        setActiveCategory(values.name)
      }
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const handleDeleteCategory = async (category: MenuCategory) => {
    try {
      await deleteCategoryMutation.mutateAsync(category.id)
      showSuccess('Category deleted')
      if (activeCategory === category.name) setActiveCategory('All')
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const removeProduct = async (productId: string) => {
    try {
      await deleteProductMutation.mutateAsync(productId)
      showSuccess('Product removed')
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const openCreateModal = () => {
    setProductModalMode('create')
    setSelectedProductId(null)
    setIsProductModalOpen(true)
  }

  const openEditModal = (productId: string) => {
    setProductModalMode('edit')
    setSelectedProductId(productId)
    setIsProductModalOpen(true)
  }

  const closeProductModal = () => {
    setIsProductModalOpen(false)
    setSelectedProductId(null)
    setProductModalMode('create')
  }

  const allCategoryData = categoriesQuery.data ?? []

  return (
    <div className='space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Menu Management</h1>
          <p className='text-muted-foreground'>
            Create and organize your digital menu categories and products.
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            size='sm'
            className='rounded-full'
            onClick={() => setIsCategoryModalOpen(true)}
          >
            Add Category
          </Button>
          <Button size='sm' className='rounded-full' onClick={openCreateModal}>
            <Plus className='mr-2 h-4 w-4' /> Add Product
          </Button>
        </div>
      </div>

      <div className='flex flex-col gap-6 lg:flex-row'>
        <Card className='h-fit w-full lg:w-64'>
          <CardHeader>
            <CardTitle className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-1 p-2 pt-0'>
            <button
              type='button'
              onClick={() => setActiveCategory('All')}
              className={cn(
                'w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all',
                activeCategory === 'All'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              All
            </button>
            {allCategoryData.map((category) => (
              <div key={category.id} className='group flex items-center gap-1'>
                <button
                  type='button'
                  onClick={() => setActiveCategory(category.name)}
                  className={cn(
                    'flex-1 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all',
                    activeCategory === category.name
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {category.name}
                </button>
                <div className='flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100'>
                  <button
                    type='button'
                    className='rounded-lg p-1 hover:bg-accent'
                    title='Edit category'
                    onClick={() => openEditCategory(category)}
                  >
                    <Edit2 className='h-3.5 w-3.5' />
                  </button>
                  <button
                    type='button'
                    className='rounded-lg p-1 text-destructive hover:bg-destructive/10'
                    title='Delete category'
                    onClick={() => void handleDeleteCategory(category)}
                    disabled={deleteCategoryMutation.isPending}
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className='flex-1 overflow-hidden'>
          <CardHeader className='border-b border-border'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <CardTitle>Products in {activeCategory}</CardTitle>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <input
                  type='text'
                  placeholder='Search products...'
                  className='h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-64'
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='pl-8'>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='pr-8 text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsQuery.isPending && (
                  <TableRow>
                    <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
                      Loading products...
                    </TableCell>
                  </TableRow>
                )}

                {!productsQuery.isPending && products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className='py-16'>
                      <div className='flex flex-col items-center justify-center text-center'>
                        <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
                          <ShoppingBag className='h-6 w-6 text-muted-foreground' />
                        </div>
                        <h3 className='mb-1 text-base font-semibold'>No products yet</h3>
                        <p className='mb-6 max-w-xs text-sm text-muted-foreground'>
                          You don't have any products yet. Start by adding your first product.
                        </p>
                        <Button size='sm' className='rounded-full' onClick={openCreateModal}>
                          <Plus className='mr-2 h-4 w-4' /> Add your first product
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!productsQuery.isPending && products.length > 0 && filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
                      No products match your search.
                    </TableCell>
                  </TableRow>
                )}

                {filteredItems.map((item) => {
                  const category = categoryOptions.find((option) => option.id === item.categoryId)

                  return (
                    <TableRow key={item.id}>
                      <TableCell className='pl-8 font-bold'>{item.name}</TableCell>
                      <TableCell>{category?.label ?? 'Uncategorized'}</TableCell>
                      <TableCell className='font-mono'>{formatPrice(Number(item.price), currency)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={item.isAvailable ? 'success' : 'outline'}
                          className='gap-1.5'
                        >
                          <div
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              item.isAvailable ? 'bg-emerald-500' : 'bg-muted-foreground',
                            )}
                          />
                          {item.isAvailable ? 'Available' : 'Hidden'}
                        </Badge>
                      </TableCell>
                      <TableCell className='pr-8 text-right'>
                        <div className='flex justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='rounded-full'
                            disabled
                            title='Availability toggle not yet supported by API'
                          >
                            {item.isAvailable ? (
                              <Eye className='h-4 w-4' />
                            ) : (
                              <EyeOff className='h-4 w-4 text-muted-foreground' />
                            )}
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='rounded-full'
                            onClick={() => openEditModal(item.id)}
                          >
                            <Edit2 className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive'
                            onClick={() => {
                              void removeProduct(item.id)
                            }}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create category modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title='Create category'
        footer={
          <>
            <Button variant='ghost' onClick={() => setIsCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={createCategoryMutation.isPending}
              onClick={() => {
                void handleCreateSubmit(onCategorySubmit)()
              }}
            >
              {createCategoryMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <form className='space-y-4'>
          <div className='space-y-1'>
            <label
              htmlFor={categoryNameId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              Category name
            </label>
            <input
              id={categoryNameId}
              type='text'
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...registerCreate('name')}
            />
            {createErrors.name && (
              <p className='text-xs text-red-600'>{createErrors.name.message}</p>
            )}
          </div>

          <div className='space-y-1'>
            <label
              htmlFor={categoryDescriptionId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              Description (optional)
            </label>
            <input
              id={categoryDescriptionId}
              type='text'
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...registerCreate('description')}
            />
          </div>

          <div className='space-y-1'>
            <label
              htmlFor={categorySortOrderId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              Sort order
            </label>
            <input
              id={categorySortOrderId}
              type='number'
              min={0}
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...registerCreate('sortOrder', { valueAsNumber: true })}
            />
            {createErrors.sortOrder && (
              <p className='text-xs text-red-600'>{createErrors.sortOrder.message}</p>
            )}
          </div>
        </form>
      </Modal>

      {/* Edit category modal */}
      <Modal
        isOpen={Boolean(editingCategory)}
        onClose={() => setEditingCategory(null)}
        title='Edit category'
        footer={
          <>
            <Button variant='ghost' onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button
              disabled={updateCategoryMutation.isPending}
              onClick={() => void handleEditSubmit(onEditCategorySubmit)()}
            >
              {updateCategoryMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <form className='space-y-4'>
          <div className='space-y-1'>
            <label
              htmlFor={editNameId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              Category name
            </label>
            <input
              id={editNameId}
              type='text'
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...registerEdit('name')}
            />
            {editErrors.name && (
              <p className='text-xs text-red-600'>{editErrors.name.message}</p>
            )}
          </div>

          <div className='space-y-1'>
            <label
              htmlFor={editDescriptionId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              Description (optional)
            </label>
            <input
              id={editDescriptionId}
              type='text'
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...registerEdit('description')}
            />
          </div>

          <div className='space-y-1'>
            <label
              htmlFor={editSortOrderId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              Sort order
            </label>
            <input
              id={editSortOrderId}
              type='number'
              min={0}
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...registerEdit('sortOrder', { valueAsNumber: true })}
            />
          </div>
        </form>
      </Modal>

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={closeProductModal}
        mode={productModalMode}
        productId={selectedProductId ?? undefined}
        initialData={
          productModalMode === 'edit' && selectedProductId
            ? products.find((p) => p.id === selectedProductId)
            : undefined
        }
      />
    </div>
  )
}
