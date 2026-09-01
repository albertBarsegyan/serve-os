import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Edit2, Plus, Search, ShoppingBag, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import type { MenuCategory } from '#/features/platform/api/platform.types.ts'
import {
  menuCategoriesQueryOptions,
  pagedProductsQueryOptions,
} from '#/features/platform/lib/query-options.ts'
import {
  createMenuCategorySchema,
  updateMenuCategorySchema,
} from '#/features/platform/lib/schemas/platform.schemas.ts'
import {
  useCreateMenuCategoryMutation,
  useDeleteMenuCategoryMutation,
  useDeleteProductMutation,
  useSetProductAvailabilityMutation,
  useUpdateMenuCategoryMutation,
} from '#/features/platform/model/platform-hooks.ts'
import { ProductModal } from '#/features/product/ui/product-modal.tsx'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'
import { ImageEntityType } from '#/shared/api/images/images.api'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { useActiveBusiness } from '#/shared/libs/hooks/use-active-business.ts'
import { StaffPermission } from '#/shared/libs/permissions/index.ts'
import { usePermissions } from '#/shared/libs/permissions/use-permissions.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import { ConfirmDeleteModal } from '#/shared/ui/confirm-delete-modal'
import { ImageUpload } from '#/shared/ui/image-upload'
import { Modal } from '#/shared/ui/modal'
import { type PageLimit, PaginationControls } from '#/shared/ui/pagination-controls'

type CreateCategoryFormValues = z.infer<typeof createMenuCategorySchema>
type UpdateCategoryFormValues = z.infer<typeof updateMenuCategorySchema>

export function AdminMenuContent() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<PageLimit>(20)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<MenuCategory | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<{ id: string; name: string } | null>(null)
  const [createImageUrl, setCreateImageUrl] = useState<string | null>(null)
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [productModalMode, setProductModalMode] = useState<'create' | 'edit'>('create')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [defaultCategoryId, setDefaultCategoryId] = useState<string | undefined>(undefined)

  const categoryNameId = useId()
  const categoryDescriptionId = useId()
  const categorySortOrderId = useId()
  const editNameId = useId()
  const editDescriptionId = useId()
  const editSortOrderId = useId()

  const activeBusiness = useActiveBusiness()
  const businessId = activeBusiness?.id ?? ''
  const currency = activeBusiness?.currency ?? 'USD'
  const { isOwner, hasPermission } = usePermissions()
  const canEditMenu = isOwner() || hasPermission(StaffPermission.MENU_EDIT)
  const canToggleAvailability = isOwner() || hasPermission(StaffPermission.MENU_AVAILABILITY)

  const categoriesQuery = useQuery(menuCategoriesQueryOptions(businessId, true))

  const activeCategoryData = useMemo(() => {
    if (activeCategory === 'All') return undefined
    return (categoriesQuery.data ?? []).find((c) => c.name === activeCategory)
  }, [activeCategory, categoriesQuery.data])

  // Categories are fetched with their products already included, so selecting a
  // category filters that data in memory instead of firing another request.
  const productsQuery = useQuery({
    ...pagedProductsQueryOptions(businessId, page, limit),
    enabled: activeCategory === 'All',
  })

  const pagedProducts = useMemo(() => {
    if (activeCategory === 'All') return productsQuery.data

    const categoryProducts = activeCategoryData?.products ?? []
    const total = categoryProducts.length
    const start = (page - 1) * limit

    return {
      data: categoryProducts.slice(start, start + limit),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    }
  }, [activeCategory, activeCategoryData, page, limit, productsQuery.data])

  const isProductsPending =
    activeCategory === 'All' ? productsQuery.isPending : categoriesQuery.isPending

  const createCategoryMutation = useCreateMenuCategoryMutation()
  const updateCategoryMutation = useUpdateMenuCategoryMutation()
  const deleteCategoryMutation = useDeleteMenuCategoryMutation()
  const deleteProductMutation = useDeleteProductMutation()
  const setAvailabilityMutation = useSetProductAvailabilityMutation()

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

  const products = pagedProducts?.data ?? []

  const filteredItems = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return products
    return products.filter((item) =>
      [item.name, item.description ?? '', String(item.price)]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [products, search])

  const onCategorySubmit = async (values: CreateCategoryFormValues) => {
    try {
      await createCategoryMutation.mutateAsync({
        ...values,
        description: values.description || null,
        imageUrl: createImageUrl,
      })
      showSuccess(m.admin_menu_category_created())
      resetCreateForm({ name: '', description: '', sortOrder: 0 })
      setCreateImageUrl(null)
      setIsCategoryModalOpen(false)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const openEditCategory = (category: MenuCategory) => {
    setEditingCategory(category)
    setEditImageUrl(category.imageUrl ?? null)
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
        data: { ...values, description: values.description || null, imageUrl: editImageUrl },
      })
      showSuccess(m.admin_menu_category_updated())
      setEditingCategory(null)
      if (activeCategory === editingCategory.name && values.name) {
        setActiveCategory(values.name)
      }
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return
    try {
      await deleteCategoryMutation.mutateAsync(deletingCategory.id)
      showSuccess(m.admin_menu_category_deleted())
      if (activeCategory === deletingCategory.name) {
        setActiveCategory('All')
        setPage(1)
      }
      setDeletingCategory(null)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const removeProduct = async () => {
    if (!deletingProduct) return
    try {
      await deleteProductMutation.mutateAsync(deletingProduct.id)
      showSuccess(m.admin_menu_product_removed())
      setDeletingProduct(null)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const openCreateModal = () => {
    setProductModalMode('create')
    setSelectedProductId(null)
    const categoryId =
      activeCategory !== 'All'
        ? categoryOptions.find((o) => o.label === activeCategory)?.id
        : undefined
    setDefaultCategoryId(categoryId)
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
    setDefaultCategoryId(undefined)
  }

  const allCategoryData = categoriesQuery.data ?? []

  return (
    <div className='space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>{m.admin_menu_heading()}</h1>
          <p className='text-muted-foreground'>{m.admin_menu_subheading()}</p>
        </div>
        {canEditMenu && (
          <div className='flex items-center gap-3'>
            <Button
              variant='outline'
              size='sm'
              className='rounded-full'
              onClick={() => setIsCategoryModalOpen(true)}
            >
              {m.admin_menu_add_category()}
            </Button>
            <Button size='sm' className='rounded-full' onClick={openCreateModal}>
              <Plus className='mr-2 h-4 w-4' /> {m.admin_menu_add_product()}
            </Button>
          </div>
        )}
      </div>

      <div className='flex flex-col gap-6 lg:flex-row'>
        <Card className='h-fit w-full lg:w-64'>
          <CardHeader>
            <CardTitle className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
              {m.admin_menu_categories_title()}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-1 p-2 pt-0'>
            <button
              type='button'
              onClick={() => {
                setActiveCategory('All')
                setPage(1)
              }}
              className={cn(
                'w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all',
                activeCategory === 'All'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {m.admin_menu_all_categories()}
            </button>
            {allCategoryData.map((category) => (
              <div key={category.id} className='group flex items-center gap-1'>
                <button
                  type='button'
                  onClick={() => {
                    setActiveCategory(category.name)
                    setPage(1)
                  }}
                  className={cn(
                    'flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all',
                    activeCategory === category.name
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {category.imageUrl && (
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      className='h-6 w-6 shrink-0 rounded-md object-cover'
                    />
                  )}
                  {category.name}
                </button>
                {canEditMenu && (
                  <div className='flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100'>
                    <button
                      type='button'
                      className='rounded-lg p-1 hover:bg-accent'
                      title={m.admin_menu_edit_category_title()}
                      onClick={() => openEditCategory(category)}
                    >
                      <Edit2 className='h-3.5 w-3.5' />
                    </button>
                    <button
                      type='button'
                      className='rounded-lg p-1 text-destructive hover:bg-destructive/10'
                      title={m.admin_menu_delete_category_title()}
                      onClick={() => setDeletingCategory(category)}
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className='flex-1 overflow-hidden'>
          <CardHeader className='border-b border-border'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <CardTitle>{m.admin_menu_products_in({ category: activeCategory })}</CardTitle>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <input
                  type='text'
                  placeholder={m.admin_menu_search_placeholder()}
                  className='h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-64'
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setPage(1)
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='pl-8'>{m.admin_menu_col_product_name()}</TableHead>
                  <TableHead>{m.admin_menu_col_category()}</TableHead>
                  <TableHead>{m.admin_menu_col_price()}</TableHead>
                  <TableHead>{m.admin_menu_col_status()}</TableHead>
                  <TableHead className='pr-8 text-right'>{m.admin_menu_col_actions()}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isProductsPending && (
                  <TableRow>
                    <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
                      {m.admin_menu_loading_products()}
                    </TableCell>
                  </TableRow>
                )}

                {!isProductsPending && products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className='py-16'>
                      <div className='flex flex-col items-center justify-center text-center'>
                        <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
                          <ShoppingBag className='h-6 w-6 text-muted-foreground' />
                        </div>
                        <h3 className='mb-1 text-base font-semibold'>
                          {m.admin_menu_no_products_title()}
                        </h3>
                        <p className='mb-6 max-w-xs text-sm text-muted-foreground'>
                          {canEditMenu
                            ? m.admin_menu_no_products_owner()
                            : m.admin_menu_no_products_viewer()}
                        </p>
                        {canEditMenu && (
                          <Button size='sm' className='rounded-full' onClick={openCreateModal}>
                            <Plus className='mr-2 h-4 w-4' /> {m.admin_menu_add_first_product()}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!isProductsPending && products.length > 0 && filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
                      {m.admin_menu_no_products_match()}
                    </TableCell>
                  </TableRow>
                )}

                {filteredItems.map((item) => {
                  const category = categoryOptions.find((option) => option.id === item.categoryId)

                  return (
                    <TableRow key={item.id}>
                      <TableCell className='pl-8 font-bold'>{item.name}</TableCell>
                      <TableCell>{category?.label ?? m.admin_menu_uncategorized()}</TableCell>
                      <TableCell className='font-mono'>
                        {formatPrice(Number(item.price), currency)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.isAvailable ? 'success' : 'outline'}
                          className='gap-1.5'
                        >
                          <div
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              item.isAvailable ? 'bg-white dark:bg-white' : 'bg-muted-foreground',
                            )}
                          />
                          {item.isAvailable ? m.admin_menu_available() : m.admin_menu_hidden()}
                        </Badge>
                      </TableCell>
                      <TableCell className='pr-8 text-right'>
                        <div className='flex justify-end gap-1'>
                          {canToggleAvailability && (
                            <Button
                              variant='ghost'
                              size='icon'
                              className='rounded-full'
                              title={
                                item.isAvailable
                                  ? m.admin_menu_mark_unavailable()
                                  : m.admin_menu_mark_available()
                              }
                              disabled={setAvailabilityMutation.isPending}
                              onClick={() =>
                                setAvailabilityMutation.mutate({
                                  productId: item.id,
                                  isAvailable: !item.isAvailable,
                                })
                              }
                            >
                              {item.isAvailable ? (
                                <ToggleRight className='h-4 w-4 text-emerald-500' />
                              ) : (
                                <ToggleLeft className='h-4 w-4 text-muted-foreground' />
                              )}
                            </Button>
                          )}
                          {canEditMenu && (
                            <>
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
                                onClick={() => setDeletingProduct({ id: item.id, name: item.name })}
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {pagedProducts && pagedProducts.total > 0 && (
              <PaginationControls
                page={page}
                limit={limit}
                total={pagedProducts.total}
                totalPages={pagedProducts.totalPages}
                onPageChange={setPage}
                onLimitChange={(l) => {
                  setLimit(l)
                  setPage(1)
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete category confirmation modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={() => void handleDeleteCategory()}
        name={deletingCategory?.name ?? ''}
        entityLabel={m.admin_menu_entity_label_category()}
        isPending={deleteCategoryMutation.isPending}
      />

      {/* Delete product confirmation modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        onConfirm={() => void removeProduct()}
        name={deletingProduct?.name ?? ''}
        entityLabel={m.admin_menu_entity_label_product()}
        isPending={deleteProductMutation.isPending}
      />

      {/* Create category modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={m.admin_menu_create_category_title()}
        footer={
          <>
            <Button variant='ghost' onClick={() => setIsCategoryModalOpen(false)}>
              {m.admin_menu_cancel()}
            </Button>
            <Button
              disabled={createCategoryMutation.isPending}
              onClick={() => {
                void handleCreateSubmit(onCategorySubmit)()
              }}
            >
              {createCategoryMutation.isPending ? m.admin_menu_saving() : m.admin_menu_save()}
            </Button>
          </>
        }
      >
        <form className='space-y-4'>
          <ImageUpload
            value={createImageUrl}
            onChange={setCreateImageUrl}
            entityType={ImageEntityType.BUSINESS_CATEGORY}
            label={m.admin_menu_category_image_label()}
            previewShape='square'
          />
          <div className='space-y-1'>
            <label
              htmlFor={categoryNameId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              {m.admin_menu_category_name_label()}
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
              {m.admin_menu_description_optional_label()}
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
              {m.admin_menu_sort_order_label()}
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
        title={m.admin_menu_edit_category_modal_title()}
        footer={
          <>
            <Button variant='ghost' onClick={() => setEditingCategory(null)}>
              {m.admin_menu_cancel()}
            </Button>
            <Button
              disabled={updateCategoryMutation.isPending}
              onClick={() => void handleEditSubmit(onEditCategorySubmit)()}
            >
              {updateCategoryMutation.isPending ? m.admin_menu_saving() : m.admin_menu_save()}
            </Button>
          </>
        }
      >
        <form className='space-y-4'>
          <ImageUpload
            value={editImageUrl}
            onChange={setEditImageUrl}
            entityType={ImageEntityType.BUSINESS_CATEGORY}
            label={m.admin_menu_category_image_label()}
            previewShape='square'
          />
          <div className='space-y-1'>
            <label
              htmlFor={editNameId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              {m.admin_menu_category_name_label()}
            </label>
            <input
              id={editNameId}
              type='text'
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...registerEdit('name')}
            />
            {editErrors.name && <p className='text-xs text-red-600'>{editErrors.name.message}</p>}
          </div>

          <div className='space-y-1'>
            <label
              htmlFor={editDescriptionId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              {m.admin_menu_description_optional_label()}
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
              {m.admin_menu_sort_order_label()}
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
        defaultCategoryId={defaultCategoryId}
        initialData={
          productModalMode === 'edit' && selectedProductId
            ? products.find((p) => p.id === selectedProductId)
            : undefined
        }
      />
    </div>
  )
}
