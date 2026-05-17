import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Edit2, Eye, EyeOff, Plus, Search, Trash2 } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import {
  createMenuCategorySchema,
  createProductSchema,
} from '#/features/platform/lib/schemas/platform.schemas.ts'
import {
  menuCategoriesQueryOptions,
  productsQueryOptions,
} from '#/features/platform/lib/query-options.ts'
import {
  useCreateMenuCategoryMutation,
  useCreateProductMutation,
  useDeleteProductMutation,
  useUpdateProductMutation,
} from '#/features/platform/model/platform-hooks.ts'
import { cn } from '#/lib/utils'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Modal } from '#/shared/ui/Modal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'

type CreateCategoryFormValues = z.infer<typeof createMenuCategorySchema>
type CreateProductFormValues = z.infer<typeof createProductSchema>

export function AdminMenuContent() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)

  const categoryNameId = useId()
  const categorySortOrderId = useId()
  const productNameId = useId()
  const productPriceId = useId()
  const productCategoryId = useId()

  const categoriesQuery = useQuery(menuCategoriesQueryOptions(true))
  const productsQuery = useQuery(productsQueryOptions())

  const createCategoryMutation = useCreateMenuCategoryMutation()
  const createProductMutation = useCreateProductMutation()
  const updateProductMutation = useUpdateProductMutation()
  const deleteProductMutation = useDeleteProductMutation()

  const {
    register: registerCategory,
    handleSubmit: handleCategorySubmit,
    reset: resetCategoryForm,
    formState: { errors: categoryErrors },
  } = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createMenuCategorySchema),
    defaultValues: { name: '', sortOrder: 0 },
  })

  const {
    register: registerProduct,
    handleSubmit: handleProductSubmit,
    reset: resetProductForm,
    formState: { errors: productErrors },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '0.00',
      categoryId: '',
      imageUrl: '',
      isAvailable: true,
      allergens: [],
      modifierGroupIds: [],
    },
  })

  const categoryOptions = useMemo(() => {
    const loaded = categoriesQuery.data ?? []
    return loaded
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => ({ id: category.id, label: category.name }))
  }, [categoriesQuery.data])

  const categories = useMemo(() => ['All', ...categoryOptions.map((category) => category.label)], [categoryOptions])

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
      [item.name, item.description ?? '', item.price].join(' ').toLowerCase().includes(needle),
    )
  }, [activeCategory, categoryOptions, products, search])

  const onCategorySubmit = async (values: CreateCategoryFormValues) => {
    try {
      await createCategoryMutation.mutateAsync(values)
      showSuccess('Category created')
      resetCategoryForm({ name: '', sortOrder: 0 })
      setIsCategoryModalOpen(false)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const onProductSubmit = async (values: CreateProductFormValues) => {
    try {
      const payload = {
        ...values,
        description: values.description?.trim() || undefined,
        imageUrl: values.imageUrl?.trim() || undefined,
        allergens: values.allergens?.length ? values.allergens : undefined,
        modifierGroupIds: values.modifierGroupIds?.length ? values.modifierGroupIds : undefined,
      }
      await createProductMutation.mutateAsync(payload)
      showSuccess('Product created')
      resetProductForm({
        name: '',
        description: '',
        price: '0.00',
        categoryId: categoryOptions[0]?.id ?? '',
        imageUrl: '',
        isAvailable: true,
        allergens: [],
        modifierGroupIds: [],
      })
      setIsProductModalOpen(false)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const toggleAvailability = async (productId: string, current: boolean) => {
    try {
      await updateProductMutation.mutateAsync({
        productId,
        data: { isAvailable: !current },
      })
      showSuccess('Product updated')
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
            Manage Categories
          </Button>
          <Button size='sm' className='rounded-full' onClick={() => setIsProductModalOpen(true)}>
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
            {categories.map((category) => (
              <button
                type='button'
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  'w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all',
                   activeCategory === category
                     ? 'bg-accent text-accent-foreground'
                     : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {category}
              </button>
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

                {!productsQuery.isPending && filteredItems.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
                      No products found.
                    </TableCell>
                  </TableRow>
                )}

                {filteredItems.map((item) => {
                  const category = categoryOptions.find((option) => option.id === item.categoryId)

                  return (
                    <TableRow key={item.id}>
                      <TableCell className='pl-8 font-bold'>{item.name}</TableCell>
                      <TableCell>{category?.label ?? 'Uncategorized'}</TableCell>
                      <TableCell className='font-mono'>${Number(item.price).toFixed(2)}</TableCell>
                      <TableCell>
                          <Badge variant={item.isAvailable ? 'success' : 'outline'} className='gap-1.5'>
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
                            onClick={() => {
                              void toggleAvailability(item.id, item.isAvailable)
                            }}
                          >
                            {item.isAvailable ? (
                              <Eye className='h-4 w-4' />
                            ) : (
                               <EyeOff className='h-4 w-4 text-muted-foreground' />
                            )}
                          </Button>
                          <Button variant='ghost' size='icon' className='rounded-full' disabled>
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
                void handleCategorySubmit(onCategorySubmit)()
              }}
            >
              {createCategoryMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <form className='space-y-4'>
          <div className='space-y-1'>
            <label htmlFor={categoryNameId} className='text-xs font-semibold uppercase text-muted-foreground'>
              Category name
            </label>
            <input
              id={categoryNameId}
              type='text'
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...registerCategory('name')}
            />
            {categoryErrors.name && <p className='text-xs text-red-600'>{categoryErrors.name.message}</p>}
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
              {...registerCategory('sortOrder', { valueAsNumber: true })}
            />
            {categoryErrors.sortOrder && (
              <p className='text-xs text-red-600'>{categoryErrors.sortOrder.message}</p>
            )}
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title='Create product'
        footer={
          <>
            <Button variant='ghost' onClick={() => setIsProductModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={createProductMutation.isPending}
              onClick={() => {
                void handleProductSubmit(onProductSubmit)()
              }}
            >
              {createProductMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <form className='space-y-4'>
          <div className='space-y-1'>
            <label htmlFor={productNameId} className='text-xs font-semibold uppercase text-muted-foreground'>
              Product name
            </label>
            <input
              id={productNameId}
              type='text'
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...registerProduct('name')}
            />
            {productErrors.name && <p className='text-xs text-red-600'>{productErrors.name.message}</p>}
          </div>

          <div className='space-y-1'>
            <label
              htmlFor={productCategoryId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              Category
            </label>
            <select
              id={productCategoryId}
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...registerProduct('categoryId')}
              defaultValue=''
            >
              <option value='' disabled>
                Select category
              </option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
            {productErrors.categoryId && (
              <p className='text-xs text-red-600'>{productErrors.categoryId.message}</p>
            )}
          </div>

          <div className='space-y-1'>
            <label htmlFor={productPriceId} className='text-xs font-semibold uppercase text-muted-foreground'>
              Price
            </label>
            <input
              id={productPriceId}
              type='text'
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...registerProduct('price')}
            />
            {productErrors.price && <p className='text-xs text-red-600'>{productErrors.price.message}</p>}
          </div>

          <label className='flex items-center gap-2 text-sm'>
            <input type='checkbox' {...registerProduct('isAvailable')} />
            <span>Available immediately</span>
          </label>
        </form>
      </Modal>
    </div>
  )
}
