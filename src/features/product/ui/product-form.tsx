import type { DragEndEvent } from '@dnd-kit/core'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { ImageIcon, Loader2, Plus, Trash2, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { useReorderProductImages } from '#/entities/product/api/product-hooks'
import type { ModifierGroup, ModifierPriceType } from '#/features/platform/api/platform.types'
import { modifierGroupsQueryOptions } from '#/features/platform/lib/query-options'
import {
  useAddModifierToGroupMutation,
  useCreateModifierGroupMutation,
} from '#/features/platform/model/platform-hooks'
import type {
  Allergen,
  DietaryFlag,
  ProductModifierGroup,
  ProductResponse,
} from '#/features/product/api/product.types'
import { allergens, dietaryFlags, servicePeriods } from '#/features/product/api/product.types'
import type {
  CreateProductFormData,
  UpdateProductFormData,
} from '#/features/product/lib/schemas/create-product-form.schema'
import { createProductFormSchema } from '#/features/product/lib/schemas/create-product-form.schema'
import { ImageEntityType, uploadImage } from '#/shared/api/images/images.api'
import { SearchSelect } from '#/shared/ui/search-select'

const ALLOWED_IMAGE_TYPES = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp']
const MAX_IMAGE_SIZE = 3 * 1024 * 1024 // 3 MB

interface NewGroupItem {
  id: string
  name: string
  priceType: ModifierPriceType
  priceAdjustment: string
}

interface NewGroupState {
  name: string
  selectionType: 'SINGLE' | 'MULTIPLE'
  isRequired: boolean
  items: NewGroupItem[]
}

interface ProductFormProps {
  businessId: string
  categories: Array<{ id: string; name: string }>
  onSubmit: (
    data: CreateProductFormData | UpdateProductFormData,
    modifierGroupIds: string[],
  ) => Promise<void>
  isLoading?: boolean
  initialData?: ProductResponse
  defaultCategoryId?: string
  mode: 'create' | 'edit'
}

export function ProductForm({
  businessId,
  categories,
  onSubmit,
  isLoading = false,
  initialData,
  defaultCategoryId,
  mode,
}: Readonly<ProductFormProps>) {
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Modifier groups local state
  const [attachedGroups, setAttachedGroups] = useState<ProductModifierGroup[]>(
    () => initialData?.modifierGroups ?? [],
  )
  const [activePanel, setActivePanel] = useState<'none' | 'select' | 'create'>('none')
  const [newGroup, setNewGroup] = useState<NewGroupState>({
    name: '',
    selectionType: 'SINGLE',
    isRequired: false,
    items: [],
  })

  const { data: allModifierGroups = [] } = useQuery(modifierGroupsQueryOptions(businessId))
  const createGroupMutation = useCreateModifierGroupMutation()
  const addModifierMutation = useAddModifierToGroupMutation()

  const availableGroups = allModifierGroups.filter(
    (g) => !attachedGroups.some((a) => a.id === g.id),
  )

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductFormSchema) as never,
    defaultValues: initialData
      ? {
          categoryId: initialData.categoryId,
          name: initialData.name,
          description: initialData.description,
          basePrice: initialData.price,
          compareAtPrice: initialData.compareAtPrice,
          slug: initialData.slug,
          sku: initialData.sku,
          prepTimeMinutes: initialData.prepTimeMinutes,
          availablePeriod: initialData.availablePeriod,
          sortOrder: initialData.sortOrder,
          isAvailable: initialData.isAvailable,
          isFeatured: initialData.isFeatured,
          dietaryFlags: (initialData.dietaryFlags as DietaryFlag[]) || [],
          allergens: (initialData.allergens as Allergen[]) || [],
          imageUrls: initialData.imageUrls || [],
        }
      : {
          categoryId: defaultCategoryId ?? '',
          name: '',
          description: null,
          basePrice: 0.01,
          compareAtPrice: null,
          slug: null,
          sku: null,
          prepTimeMinutes: undefined,
          availablePeriod: 'all_day',
          sortOrder: 0,
          isAvailable: true,
          isFeatured: false,
          dietaryFlags: [],
          allergens: [],
          imageUrls: [],
        },
  })

  const imageUrls = watch('imageUrls') ?? []
  const selectedDietaryFlags = (watch('dietaryFlags') ?? []) as DietaryFlag[]
  const selectedAllergens = (watch('allergens') ?? []) as Allergen[]

  const MAX_IMAGES = 4

  const reorderMutation = useReorderProductImages()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // IDs stable within a render: url + positional index avoids collisions on duplicate URLs
  const sortableIds = imageUrls.map((url, i) => `${url}__${i}`)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sortableIds.indexOf(String(active.id))
    const newIndex = sortableIds.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return

    const prev = [...imageUrls]
    const reordered = arrayMove(imageUrls, oldIndex, newIndex)
    setValue('imageUrls', reordered, { shouldDirty: true, shouldValidate: true })

    if (mode === 'edit' && initialData?.id) {
      reorderMutation.mutate(
        { businessId, productId: initialData.id, imageUrls: reordered },
        {
          onError: () => {
            setValue('imageUrls', prev, { shouldDirty: true })
            toast.error('Failed to save image order')
          },
        },
      )
    }
  }

  const handleImageFilesSelected = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      const remaining = MAX_IMAGES - imageUrls.length
      if (remaining <= 0) return

      const validFiles: File[] = []
      for (const file of Array.from(files).slice(0, remaining)) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          toast.error('Only SVG, PNG, JPG, JPEG, and WebP files are allowed')
          continue
        }
        if (file.size > MAX_IMAGE_SIZE) {
          toast.error('File size must be under 3 MB')
          continue
        }
        validFiles.push(file)
      }

      if (validFiles.length === 0) {
        if (imageInputRef.current) imageInputRef.current.value = ''
        return
      }

      setIsUploadingImage(true)
      try {
        const uploaded = await Promise.all(
          validFiles.map((f) => uploadImage(f, { entityType: ImageEntityType.BUSINESS_PRODUCT })),
        )
        setValue('imageUrls', [...imageUrls, ...uploaded.map((u) => u.url)], {
          shouldDirty: true,
          shouldValidate: true,
        })
      } catch {
        toast.error('Image upload failed')
      } finally {
        setIsUploadingImage(false)
        if (imageInputRef.current) imageInputRef.current.value = ''
      }
    },
    [imageUrls, setValue],
  )

  const handleRemoveImage = useCallback(
    (index: number) => {
      setValue(
        'imageUrls',
        imageUrls.filter((_, i) => i !== index),
        { shouldDirty: true, shouldValidate: true },
      )
    },
    [imageUrls, setValue],
  )

  const handleAttachGroup = useCallback((group: ModifierGroup) => {
    setAttachedGroups((prev) => [
      ...prev,
      {
        id: group.id,
        businessId: group.businessId,
        name: group.name,
        selectionType: group.selectionType,
        isRequired: group.isRequired,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        position: group.position,
        isActive: group.isActive,
        modifiers: group.modifiers.map((m) => ({
          id: m.id,
          groupId: m.groupId,
          name: m.name,
          priceAdjustment: m.priceAdjustment,
          priceType: m.priceType,
          position: m.position,
          isActive: m.isActive,
        })),
      },
    ])
    setActivePanel('none')
  }, [])

  const handleDetachGroup = useCallback((groupId: string) => {
    setAttachedGroups((prev) => prev.filter((g) => g.id !== groupId))
  }, [])

  const handleAddNewGroupItem = useCallback(() => {
    setNewGroup((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Math.random().toString(36).slice(2, 10),
          name: '',
          priceType: 'adjustment',
          priceAdjustment: '0',
        },
      ],
    }))
  }, [])

  const handleRemoveNewGroupItem = useCallback((itemId: string) => {
    setNewGroup((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== itemId) }))
  }, [])

  const handleNewGroupItemChange = useCallback(
    (itemId: string, field: 'name' | 'priceType' | 'priceAdjustment', value: string) => {
      setNewGroup((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)),
      }))
    },
    [],
  )

  const handleCreateAndAttach = useCallback(async () => {
    if (!newGroup.name.trim()) {
      toast.error('Group name is required')
      return
    }

    try {
      const created = await createGroupMutation.mutateAsync({
        businessId,
        data: {
          name: newGroup.name.trim(),
          selectionType: newGroup.selectionType,
          isRequired: newGroup.isRequired,
        },
      })

      const validItems = newGroup.items.filter((i) => i.name.trim())
      let addedModifiers: typeof created.modifiers = []

      if (validItems.length > 0) {
        const results = await Promise.allSettled(
          validItems.map((item) =>
            addModifierMutation.mutateAsync({
              businessId,
              groupId: created.id,
              data: {
                name: item.name.trim(),
                priceAdjustment: parseFloat(item.priceAdjustment) || 0,
                priceType: item.priceType,
              },
            }),
          ),
        )
        addedModifiers = results
          .filter(
            (r): r is PromiseFulfilledResult<(typeof created.modifiers)[number]> =>
              r.status === 'fulfilled',
          )
          .map((r) => r.value)
      }

      setAttachedGroups((prev) => [
        ...prev,
        {
          id: created.id,
          businessId: created.businessId,
          name: created.name,
          selectionType: created.selectionType,
          isRequired: created.isRequired,
          minSelections: created.minSelections,
          maxSelections: created.maxSelections,
          position: created.position,
          isActive: created.isActive,
          modifiers: addedModifiers.map((m) => ({
            id: m.id,
            groupId: m.groupId,
            name: m.name,
            priceAdjustment: m.priceAdjustment,
            priceType: m.priceType,
            position: m.position,
            isActive: m.isActive,
          })),
        },
      ])

      setNewGroup({ name: '', selectionType: 'SINGLE', isRequired: false, items: [] })
      setActivePanel('none')
      toast.success(`"${created.name}" created and attached`)
    } catch {
      toast.error('Failed to create modifier group')
    }
  }, [addModifierMutation, businessId, createGroupMutation, newGroup])

  const onSubmitHandler = async (data: CreateProductFormData | UpdateProductFormData) => {
    try {
      await onSubmit(
        data,
        attachedGroups.map((g) => g.id),
      )
      toast.success(
        mode === 'create' ? 'Product created successfully' : 'Product updated successfully',
      )
      if (mode === 'create') {
        reset()
        setAttachedGroups([])
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const isMutatingGroup = createGroupMutation.isPending || addModifierMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className='space-y-6'>
      {/* Category Selection */}
      <div>
        <Label htmlFor='categoryId'>Category *</Label>
        <Controller
          name='categoryId'
          control={control}
          render={({ field }) => (
            <SearchSelect
              id='categoryId'
              value={field.value || ''}
              onChange={field.onChange}
              options={[
                { value: '', label: 'Select a category' },
                ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
              ]}
            />
          )}
        />
        {errors.categoryId && (
          <p className='text-sm text-red-500 mt-1'>{errors.categoryId.message}</p>
        )}
      </div>

      {/* Product Name */}
      <div>
        <Label htmlFor='name'>Product Name *</Label>
        <Controller
          name='name'
          control={control}
          render={({ field }) => (
            <Input
              id='name'
              placeholder='e.g., Classic Burger'
              {...field}
              value={field.value || ''}
            />
          )}
        />
        {errors.name && <p className='text-sm text-red-500 mt-1'>{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor='description'>Description</Label>
        <Controller
          name='description'
          control={control}
          render={({ field }) => (
            <Textarea
              id='description'
              placeholder='Product description...'
              {...field}
              value={field.value || ''}
            />
          )}
        />
      </div>

      {/* Pricing Section */}
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='basePrice'>Base Price *</Label>
          <Controller
            name='basePrice'
            control={control}
            render={({ field }) => (
              <Input
                id='basePrice'
                type='number'
                step='0.01'
                min='0.01'
                placeholder='0.00'
                {...field}
                value={field.value || ''}
              />
            )}
          />
          {errors.basePrice && (
            <p className='text-sm text-red-500 mt-1'>{errors.basePrice.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor='compareAtPrice'>Compare at Price</Label>
          <Controller
            name='compareAtPrice'
            control={control}
            render={({ field: { onChange, value, ...rest } }) => (
              <Input
                id='compareAtPrice'
                type='number'
                step='0.01'
                min='0.01'
                placeholder='0.00'
                {...rest}
                value={value == null ? '' : String(value)}
                onChange={(e) => onChange(e.target.value === '' ? null : e.target.valueAsNumber)}
              />
            )}
          />
          {errors.compareAtPrice && (
            <p className='text-sm text-red-500 mt-1'>{errors.compareAtPrice.message}</p>
          )}
        </div>
      </div>

      {/* SKU and Slug */}
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='sku'>SKU</Label>
          <Controller
            name='sku'
            control={control}
            render={({ field }) => (
              <Input id='sku' placeholder='e.g., BURGER-001' {...field} value={field.value || ''} />
            )}
          />
        </div>

        <div>
          <Label htmlFor='slug'>Slug</Label>
          <Controller
            name='slug'
            control={control}
            render={({ field }) => (
              <Input
                id='slug'
                placeholder='auto-generated if left empty'
                {...field}
                value={field.value || ''}
              />
            )}
          />
          {errors.slug && <p className='text-sm text-red-500 mt-1'>{errors.slug.message}</p>}
        </div>
      </div>

      {/* Prep Time and Service Period */}
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='prepTimeMinutes'>Prep Time (minutes)</Label>
          <Controller
            name='prepTimeMinutes'
            control={control}
            render={({ field: { onChange, value, ...rest } }) => (
              <Input
                id='prepTimeMinutes'
                type='number'
                min='1'
                max='180'
                placeholder='12'
                {...rest}
                value={value == null ? '' : String(value)}
                onChange={(e) =>
                  onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)
                }
              />
            )}
          />
          {errors.prepTimeMinutes && (
            <p className='text-sm text-red-500 mt-1'>{errors.prepTimeMinutes.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor='availablePeriod'>Available Period</Label>
          <Controller
            name='availablePeriod'
            control={control}
            render={({ field }) => (
              <SearchSelect
                id='availablePeriod'
                value={field.value || 'all_day'}
                onChange={field.onChange}
                options={servicePeriods.map((p) => ({
                  value: p,
                  label: p.replace('_', ' ').toUpperCase(),
                }))}
              />
            )}
          />
        </div>
      </div>

      {/* Availability & Featured Toggles */}
      <div className='space-y-3'>
        <Controller
          name='isAvailable'
          control={control}
          render={({ field }) => (
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='isAvailable'
                checked={field.value ?? true}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              <Label htmlFor='isAvailable' className='cursor-pointer'>
                Available
              </Label>
            </div>
          )}
        />
        <Controller
          name='isFeatured'
          control={control}
          render={({ field }) => (
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='isFeatured'
                checked={field.value ?? false}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              <Label htmlFor='isFeatured' className='cursor-pointer'>
                Featured Product
              </Label>
            </div>
          )}
        />
      </div>

      {/* Dietary Flags */}
      <div>
        <div className='text-sm font-medium'>Dietary Flags</div>
        <div className='grid grid-cols-2 gap-3 mt-2'>
          {dietaryFlags.map((flag) => (
            <Controller
              key={flag}
              name='dietaryFlags'
              control={control}
              render={({ field }) => (
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id={`dietary-${flag}`}
                    checked={selectedDietaryFlags.includes(flag)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        field.onChange([...selectedDietaryFlags, flag])
                      } else {
                        field.onChange(selectedDietaryFlags.filter((f) => f !== flag))
                      }
                    }}
                  />
                  <Label htmlFor={`dietary-${flag}`} className='cursor-pointer'>
                    {flag.replace('_', ' ').toUpperCase()}
                  </Label>
                </div>
              )}
            />
          ))}
        </div>
      </div>

      {/* Allergens */}
      <div>
        <div className='text-sm font-medium'>Allergens</div>
        <div className='grid grid-cols-2 gap-3 mt-2'>
          {allergens.map((allergen) => (
            <Controller
              key={allergen}
              name='allergens'
              control={control}
              render={({ field }) => (
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id={`allergen-${allergen}`}
                    checked={selectedAllergens.includes(allergen)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        field.onChange([...selectedAllergens, allergen])
                      } else {
                        field.onChange(selectedAllergens.filter((a) => a !== allergen))
                      }
                    }}
                  />
                  <Label htmlFor={`allergen-${allergen}`} className='cursor-pointer'>
                    {allergen.replace('_', ' ').toUpperCase()}
                  </Label>
                </div>
              )}
            />
          ))}
        </div>
      </div>

      {/* Images */}
      <div>
        <div className='flex items-center justify-between mb-3'>
          <div className='text-sm font-medium'>
            Images
            <span className='ml-1.5 text-xs font-normal text-muted-foreground'>
              ({imageUrls.length}/{MAX_IMAGES}) · drag to reorder
            </span>
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            <div className='grid grid-cols-4 gap-2'>
              {imageUrls.map((url, index) => (
                <SortableImageItem
                  key={sortableIds[index]}
                  id={sortableIds[index]}
                  url={url}
                  index={index}
                  onRemove={() => handleRemoveImage(index)}
                />
              ))}

              {imageUrls.length < MAX_IMAGES && (
                <button
                  type='button'
                  disabled={isUploadingImage}
                  onClick={() => imageInputRef.current?.click()}
                  className='flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 cursor-pointer'
                >
                  {isUploadingImage ? (
                    <Loader2 className='h-5 w-5 animate-spin' />
                  ) : (
                    <>
                      <ImageIcon className='h-5 w-5' />
                      <span className='text-[10px] font-medium'>Add photo</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </SortableContext>
        </DndContext>

        <input
          ref={imageInputRef}
          type='file'
          accept='.svg,.png,.jpg,.jpeg,.webp'
          multiple
          className='hidden'
          onChange={(e) => void handleImageFilesSelected(e.target.files)}
        />
      </div>

      {/* Modifier Groups */}
      <div>
        <div className='text-sm font-medium mb-2'>Modifier Groups</div>

        {/* Attached groups list */}
        {attachedGroups.length > 0 && (
          <div className='space-y-2 mb-3'>
            {attachedGroups.map((group) => (
              <div
                key={group.id}
                className='flex items-center justify-between border rounded-lg px-3 py-2'
              >
                <div className='min-w-0'>
                  <span className='text-sm font-medium'>{group.name}</span>
                  <span className='text-xs text-muted-foreground ml-2'>
                    {group.selectionType === 'SINGLE' ? 'Single' : 'Multiple'}
                    {' · '}
                    {group.modifiers.length} option{group.modifiers.length !== 1 ? 's' : ''}
                    {group.isRequired ? ' · Required' : ''}
                  </span>
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => handleDetachGroup(group.id)}
                  className='text-red-500 hover:text-red-700 shrink-0 ml-2'
                >
                  <X className='w-4 h-4' />
                </Button>
              </div>
            ))}
          </div>
        )}

        {attachedGroups.length === 0 && activePanel === 'none' && (
          <p className='text-sm text-muted-foreground mb-2'>No modifier groups attached.</p>
        )}

        {/* Action buttons */}
        {activePanel === 'none' && (
          <div className='flex gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setActivePanel('select')}
              disabled={availableGroups.length === 0}
            >
              Attach Existing
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setActivePanel('create')}
              className='gap-1'
            >
              <Plus className='w-4 h-4' />
              Create New
            </Button>
          </div>
        )}

        {/* Select existing panel */}
        {activePanel === 'select' && (
          <div className='border rounded-lg p-3 space-y-2'>
            <div className='text-sm font-medium'>Select a modifier group to attach</div>
            <div className='space-y-1 max-h-48 overflow-y-auto'>
              {availableGroups.map((group) => (
                <button
                  key={group.id}
                  type='button'
                  className='w-full flex items-center justify-between px-2 py-1.5 rounded text-sm hover:bg-muted text-left'
                  onClick={() => handleAttachGroup(group)}
                >
                  <span className='font-medium'>{group.name}</span>
                  <span className='text-xs text-muted-foreground ml-2 shrink-0'>
                    {group.selectionType === 'SINGLE' ? 'Single' : 'Multiple'}
                    {' · '}
                    {group.modifiers.length} option{group.modifiers.length !== 1 ? 's' : ''}
                  </span>
                </button>
              ))}
            </div>
            <Button type='button' variant='ghost' size='sm' onClick={() => setActivePanel('none')}>
              Cancel
            </Button>
          </div>
        )}

        {/* Create new panel */}
        {activePanel === 'create' && (
          <div className='border rounded-lg p-3 space-y-3'>
            <div className='text-sm font-medium'>Create new modifier group</div>

            <div>
              <Label htmlFor='newGroupName'>Group name *</Label>
              <Input
                id='newGroupName'
                placeholder='e.g., Toppings, Sauce, Size'
                value={newGroup.name}
                onChange={(e) => setNewGroup((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor='newGroupSelectionType'>Selection type</Label>
              <SearchSelect
                id='newGroupSelectionType'
                value={newGroup.selectionType}
                onChange={(v) =>
                  setNewGroup((prev) => ({ ...prev, selectionType: v as 'SINGLE' | 'MULTIPLE' }))
                }
                options={[
                  { value: 'SINGLE', label: 'Single choice' },
                  { value: 'MULTIPLE', label: 'Multiple choice' },
                ]}
              />
            </div>

            <div className='flex items-center space-x-2'>
              <Checkbox
                id='newGroupIsRequired'
                checked={newGroup.isRequired}
                onChange={(e) => setNewGroup((prev) => ({ ...prev, isRequired: e.target.checked }))}
              />
              <Label htmlFor='newGroupIsRequired' className='cursor-pointer'>
                Required
              </Label>
            </div>

            {/* Options */}
            <div>
              <div className='flex items-center justify-between mb-1'>
                <div className='text-xs font-semibold uppercase text-muted-foreground'>Options</div>
                <button
                  type='button'
                  className='text-xs text-primary hover:underline'
                  onClick={handleAddNewGroupItem}
                >
                  + Add option
                </button>
              </div>

              {newGroup.items.length === 0 && (
                <p className='text-xs text-muted-foreground'>
                  Optionally add options now, or add them later on the Modifier Groups page.
                </p>
              )}

              {newGroup.items.map((item) => (
                <div key={item.id} className='flex gap-2 mt-1 items-center'>
                  <Input
                    placeholder='Option name'
                    value={item.name}
                    onChange={(e) => handleNewGroupItemChange(item.id, 'name', e.target.value)}
                  />
                  <SearchSelect
                    value={item.priceType}
                    onChange={(v) => handleNewGroupItemChange(item.id, 'priceType', v)}
                    options={[
                      { value: 'adjustment', label: '+Price' },
                      { value: 'fixed', label: 'Fixed' },
                    ]}
                    className='w-28 shrink-0'
                  />
                  <Input
                    type='number'
                    step='0.01'
                    min='0'
                    placeholder={item.priceType === 'fixed' ? '0.00' : '+0.00'}
                    className='w-24 shrink-0'
                    value={item.priceAdjustment}
                    onChange={(e) =>
                      handleNewGroupItemChange(item.id, 'priceAdjustment', e.target.value)
                    }
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='text-red-500 shrink-0'
                    onClick={() => handleRemoveNewGroupItem(item.id)}
                  >
                    <Trash2 className='w-4 h-4' />
                  </Button>
                </div>
              ))}
            </div>

            <div className='flex gap-2'>
              <Button
                type='button'
                size='sm'
                onClick={handleCreateAndAttach}
                disabled={!newGroup.name.trim() || isMutatingGroup}
              >
                {isMutatingGroup ? 'Creating...' : 'Create & Attach'}
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => {
                  setNewGroup({ name: '', selectionType: 'SINGLE', isRequired: false, items: [] })
                  setActivePanel('none')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button type='submit' disabled={isLoading} className='w-full'>
        {isLoading ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Update Product'}
      </Button>
    </form>
  )
}

// ── SortableImageItem ──────────────────────────────────────────────────────────

function SortableImageItem({
  id,
  url,
  index,
  onRemove,
}: {
  id: string
  url: string
  index: number
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      {...attributes}
      {...listeners}
      className={`relative aspect-square touch-none overflow-hidden rounded-xl border-2 bg-muted ${
        index === 0 ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-input'
      }`}
    >
      <img
        src={url}
        alt={`Product view ${index + 1}`}
        className='h-full w-full object-cover pointer-events-none select-none'
        draggable={false}
      />
      {index === 0 && (
        <div className='absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-500 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white'>
          Cover
        </div>
      )}
      <button
        type='button'
        onClick={onRemove}
        onPointerDown={(e) => e.stopPropagation()}
        className='absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors'
        aria-label='Remove image'
      >
        <X className='h-3 w-3' />
      </button>
    </div>
  )
}
