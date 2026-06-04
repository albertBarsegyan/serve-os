import { Edit2, Eye, EyeOff, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
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
import { useGetCategories } from '#/entities/product/api/category-hooks'
import {
  useDeleteProduct,
  useGetProducts,
  useUpdateProduct,
} from '#/entities/product/api/product-hooks'
import { cn } from '#/lib/utils'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import useActiveBusinessStore from '#/shared/store/use-active-business.store'
import { ProductModal } from './product-modal'

export function ProductManagementContent() {
  const { active } = useActiveBusinessStore()
  const activeBusinessId = active?.id ?? ''
  const currency = active?.currency ?? 'USD'
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [productModalMode, setProductModalMode] = useState<'create' | 'edit'>('create')

  const { data: products = [], isPending: productsLoading } = useGetProducts(activeBusinessId || '')
  const { data: categories = [] } = useGetCategories(activeBusinessId || '')
  const updateMutation = useUpdateProduct()
  const deleteMutation = useDeleteProduct()

  const categoryOptions = useMemo(
    () =>
      categories
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((cat) => ({ id: cat.id, label: cat.name })),
    [categories],
  )

  const categoryLabels = useMemo(
    () => ['All', ...categoryOptions.map((cat) => cat.label)],
    [categoryOptions],
  )

  const filteredProducts = useMemo(() => {
    let filtered = products

    if (activeCategory !== 'All') {
      filtered = filtered.filter((product) => {
        const category = categoryOptions.find((opt) => opt.id === product.categoryId)
        return category?.label === activeCategory
      })
    }

    if (search.trim()) {
      const needle = search.trim().toLowerCase()
      filtered = filtered.filter((product) =>
        [product.name, product.description || '', product.price]
          .join(' ')
          .toLowerCase()
          .includes(needle),
      )
    }

    return filtered
  }, [products, activeCategory, categoryOptions, search])

  const handleOpenCreateModal = () => {
    setProductModalMode('create')
    setIsProductModalOpen(true)
  }

  const handleOpenEditModal = () => {
    setProductModalMode('edit')
    setIsProductModalOpen(true)
  }

  const handleToggleAvailability = async (productId: string, current: boolean) => {
    try {
      await updateMutation.mutateAsync({
        businessId: activeBusinessId || '',
        productId,
        payload: { isFeatured: !current },
      })
      toast.success('Product updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update product')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteMutation.mutateAsync({
        businessId: activeBusinessId || '',
        productId,
      })
      toast.success('Product deleted')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete product')
    }
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Product Management</h1>
          <p className='text-muted-foreground'>
            Create and manage your products with variants, dietary flags, and allergens.
          </p>
        </div>
        <Button size='sm' className='rounded-full' onClick={handleOpenCreateModal}>
          <Plus className='mr-2 h-4 w-4' /> Add Product
        </Button>
      </div>

      <div className='flex flex-col gap-6 lg:flex-row'>
        {/* Categories Sidebar */}
        <Card className='h-fit w-full lg:w-64'>
          <CardHeader>
            <CardTitle className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-1 p-2 pt-0'>
            {categoryLabels.map((category) => (
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

        {/* Products Table */}
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
                  onChange={(e) => setSearch(e.target.value)}
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
                  <TableHead>Variants</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className='pr-8 text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
                      Loading products...
                    </TableCell>
                  </TableRow>
                )}

                {!productsLoading && filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
                      No products found.
                    </TableCell>
                  </TableRow>
                )}

                {filteredProducts.map((product) => {
                  const category = categoryOptions.find((opt) => opt.id === product.categoryId)
                  return (
                    <TableRow key={product.id}>
                      <TableCell className='pl-8 font-bold'>{product.name}</TableCell>
                      <TableCell>{category?.label || 'Uncategorized'}</TableCell>
                      <TableCell className='font-mono'>
                        {formatPrice(Number(product.price), currency)}
                      </TableCell>
                      <TableCell>{product.variants.length}</TableCell>
                      <TableCell>
                        <Badge variant={product.isFeatured ? 'success' : 'outline'}>
                          {product.isFeatured ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell className='pr-8 text-right'>
                        <div className='flex justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='rounded-full'
                            onClick={() => handleToggleAvailability(product.id, product.isFeatured)}
                          >
                            {product.isFeatured ? (
                              <Eye className='h-4 w-4' />
                            ) : (
                              <EyeOff className='h-4 w-4 text-muted-foreground' />
                            )}
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='rounded-full'
                            onClick={handleOpenEditModal}
                          >
                            <Edit2 className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive'
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={deleteMutation.isPending}
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

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        mode={productModalMode}
      />
    </div>
  )
}
