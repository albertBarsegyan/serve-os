import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Edit2, Plus, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'
import { Controller, type UseFormReturn, useForm } from 'react-hook-form'
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
import type {
  Modifier,
  ModifierGroup,
  ModifierPriceType,
} from '#/features/platform/api/platform.types.ts'
import {
  modifierGroupsQueryOptions,
  modifiersQueryOptions,
} from '#/features/platform/lib/query-options.ts'
import {
  addModifierSchema,
  createModifierGroupSchema,
  updateModifierGroupSchema,
  updateModifierSchema,
} from '#/features/platform/lib/schemas/platform.schemas.ts'
import {
  useAddModifierToGroupMutation,
  useCreateModifierGroupMutation,
  useDeleteModifierGroupMutation,
  useDeleteModifierMutation,
  useUpdateModifierGroupMutation,
  useUpdateModifierMutation,
} from '#/features/platform/model/platform-hooks.ts'
import { cn } from '#/lib/utils'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import useActiveBusinessStore from '#/shared/store/use-active-business.store'
import { Modal } from '#/shared/ui/modal'
import { SearchSelect } from '#/shared/ui/search-select'

type CreateGroupValues = z.infer<typeof createModifierGroupSchema>
type UpdateGroupValues = z.infer<typeof updateModifierGroupSchema>
type AddModifierValues = z.infer<typeof addModifierSchema>
type UpdateModifierValues = z.infer<typeof updateModifierSchema>

export function AdminModifiersPage() {
  const businessId = useActiveBusinessStore((s) => s.active?.id ?? '')
  const currency = useActiveBusinessStore((s) => s.active?.currency ?? 'USD')

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null)
  const [isAddModifierOpen, setIsAddModifierOpen] = useState(false)
  const [editingModifier, setEditingModifier] = useState<Modifier | null>(null)

  const groupsQuery = useQuery(modifierGroupsQueryOptions(businessId))
  const modifiersQuery = useQuery(modifiersQueryOptions(businessId, selectedGroupId ?? ''))

  const createGroupMutation = useCreateModifierGroupMutation()
  const updateGroupMutation = useUpdateModifierGroupMutation()
  const deleteGroupMutation = useDeleteModifierGroupMutation()
  const addModifierMutation = useAddModifierToGroupMutation()
  const updateModifierMutation = useUpdateModifierMutation()
  const deleteModifierMutation = useDeleteModifierMutation()

  const createGroupForm = useForm<CreateGroupValues>({
    resolver: zodResolver(createModifierGroupSchema),
    defaultValues: {
      name: '',
      selectionType: 'SINGLE',
      isRequired: false,
      isActive: true,
    },
  })

  const updateGroupForm = useForm<UpdateGroupValues>({
    resolver: zodResolver(updateModifierGroupSchema),
  })

  const addModifierForm = useForm<AddModifierValues>({
    resolver: zodResolver(addModifierSchema),
    defaultValues: {
      name: '',
      priceType: 'adjustment',
      priceAdjustment: 0,
      isActive: true,
    },
  })

  const updateModifierForm = useForm<UpdateModifierValues>({
    resolver: zodResolver(updateModifierSchema),
  })

  const groups = groupsQuery.data ?? []
  const modifiers = modifiersQuery.data ?? []
  const selectedGroup = groups.find((g) => g.id === selectedGroupId)

  const openEditGroup = (group: ModifierGroup) => {
    setEditingGroup(group)
    updateGroupForm.reset({
      name: group.name,
      selectionType: group.selectionType,
      isRequired: group.isRequired,
      isActive: group.isActive,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections ?? undefined,
      position: group.position,
    })
  }

  const openEditModifier = (modifier: Modifier) => {
    setEditingModifier(modifier)
    updateModifierForm.reset({
      name: modifier.name,
      priceType: modifier.priceType,
      priceAdjustment: modifier.priceAdjustment,
      isActive: modifier.isActive,
      position: modifier.position,
    })
  }

  const onCreateGroup = async (values: CreateGroupValues) => {
    try {
      const created = await createGroupMutation.mutateAsync({ businessId, data: values })
      showSuccess('Modifier group created')
      createGroupForm.reset({
        name: '',
        selectionType: 'SINGLE',
        isRequired: false,
        isActive: true,
      })
      setIsCreateGroupOpen(false)
      setSelectedGroupId(created.id)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const onUpdateGroup = async (values: UpdateGroupValues) => {
    if (!editingGroup) return
    try {
      await updateGroupMutation.mutateAsync({
        businessId,
        groupId: editingGroup.id,
        data: values,
      })
      showSuccess('Modifier group updated')
      setEditingGroup(null)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const onDeleteGroup = async (groupId: string) => {
    try {
      await deleteGroupMutation.mutateAsync({ businessId, groupId })
      showSuccess('Modifier group deleted')
      if (selectedGroupId === groupId) setSelectedGroupId(null)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const onAddModifier = async (values: AddModifierValues) => {
    if (!selectedGroupId) return
    try {
      await addModifierMutation.mutateAsync({ businessId, groupId: selectedGroupId, data: values })
      showSuccess('Modifier added')
      addModifierForm.reset({
        name: '',
        priceType: 'adjustment',
        priceAdjustment: 0,
        isActive: true,
      })
      setIsAddModifierOpen(false)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const onUpdateModifier = async (values: UpdateModifierValues) => {
    if (!(editingModifier && selectedGroupId)) return
    try {
      await updateModifierMutation.mutateAsync({
        businessId,
        groupId: selectedGroupId,
        modifierId: editingModifier.id,
        data: values,
      })
      showSuccess('Modifier updated')
      setEditingModifier(null)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const onDeleteModifier = async (modifierId: string) => {
    if (!selectedGroupId) return
    try {
      await deleteModifierMutation.mutateAsync({ businessId, groupId: selectedGroupId, modifierId })
      showSuccess('Modifier deleted')
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Modifiers</h1>
          <p className='text-muted-foreground'>
            Create modifier groups and their options to let customers customize their orders.
          </p>
        </div>
        <Button size='sm' className='rounded-full' onClick={() => setIsCreateGroupOpen(true)}>
          <Plus className='mr-2 h-4 w-4' /> New Modifier Group
        </Button>
      </div>

      <div className='flex flex-col gap-6 lg:flex-row'>
        {/* Groups list */}
        <Card className='h-fit w-full lg:w-72'>
          <CardHeader>
            <CardTitle className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
              Groups
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-1 p-2 pt-0'>
            {groupsQuery.isPending && (
              <p className='px-4 py-3 text-sm text-muted-foreground'>Loading...</p>
            )}
            {!groupsQuery.isPending && groups.length === 0 && (
              <p className='px-4 py-3 text-sm text-muted-foreground'>
                No modifier groups yet. Create one to get started.
              </p>
            )}
            {groups.map((group) => (
              <div
                key={group.id}
                className={cn(
                  'group flex items-center justify-between rounded-xl px-3 py-2.5 transition-all',
                  selectedGroupId === group.id
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <button
                  type='button'
                  className='flex-1 text-left text-sm font-medium'
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <span>{group.name}</span>
                  <span className='ml-2 text-xs opacity-60'>
                    {group.selectionType === 'SINGLE' ? 'Single' : 'Multi'}
                  </span>
                </button>
                <div className='flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100'>
                  <button
                    type='button'
                    className='rounded-lg p-1 hover:bg-background/60'
                    onClick={() => openEditGroup(group)}
                    title='Edit group'
                  >
                    <Edit2 className='h-3.5 w-3.5' />
                  </button>
                  <button
                    type='button'
                    className='rounded-lg p-1 text-destructive hover:bg-destructive/10'
                    onClick={() => void onDeleteGroup(group.id)}
                    title='Delete group'
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Modifiers list */}
        <Card className='flex-1 overflow-hidden'>
          <CardHeader className='border-b border-border'>
            <div className='flex items-center justify-between'>
              <CardTitle>
                {selectedGroup ? `${selectedGroup.name} — Modifiers` : 'Select a group'}
              </CardTitle>
              {selectedGroupId && (
                <Button
                  size='sm'
                  className='rounded-full'
                  onClick={() => setIsAddModifierOpen(true)}
                >
                  <Plus className='mr-2 h-4 w-4' /> Add Modifier
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            {!selectedGroupId ? (
              <div className='flex h-40 items-center justify-center text-sm text-muted-foreground'>
                Select a modifier group on the left to manage its options.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='pl-8'>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='pr-8 text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modifiersQuery.isPending && (
                    <TableRow>
                      <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
                        Loading modifiers...
                      </TableCell>
                    </TableRow>
                  )}

                  {!modifiersQuery.isPending && modifiers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
                        No modifiers yet. Add one above.
                      </TableCell>
                    </TableRow>
                  )}

                  {modifiers.map((modifier) => (
                    <TableRow key={modifier.id}>
                      <TableCell className='pl-8 font-bold'>{modifier.name}</TableCell>
                      <TableCell className='font-mono'>
                        {Number(modifier.priceAdjustment) === 0 && modifier.priceType !== 'fixed'
                          ? 'Free'
                          : modifier.priceType === 'fixed'
                            ? formatPrice(Number(modifier.priceAdjustment), currency)
                            : `+${formatPrice(Number(modifier.priceAdjustment), currency)}`}
                        {modifier.priceType === 'fixed' && (
                          <span className='ml-1 text-xs text-muted-foreground'>(fixed)</span>
                        )}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>{modifier.position}</TableCell>
                      <TableCell>
                        <Badge variant={modifier.isActive ? 'success' : 'outline'}>
                          {modifier.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className='pr-8 text-right'>
                        <div className='flex justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='rounded-full'
                            onClick={() => openEditModifier(modifier)}
                          >
                            <Edit2 className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive'
                            onClick={() => void onDeleteModifier(modifier.id)}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Group Modal */}
      <Modal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        title='Create modifier group'
        footer={
          <>
            <Button variant='ghost' onClick={() => setIsCreateGroupOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={createGroupMutation.isPending}
              onClick={() => void createGroupForm.handleSubmit(onCreateGroup)()}
            >
              {createGroupMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </>
        }
      >
        <ModifierGroupForm form={createGroupForm as UseFormReturn<UpdateGroupValues>} />
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        isOpen={Boolean(editingGroup)}
        onClose={() => setEditingGroup(null)}
        title='Edit modifier group'
        footer={
          <>
            <Button variant='ghost' onClick={() => setEditingGroup(null)}>
              Cancel
            </Button>
            <Button
              disabled={updateGroupMutation.isPending}
              onClick={() => void updateGroupForm.handleSubmit(onUpdateGroup)()}
            >
              {updateGroupMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <ModifierGroupForm form={updateGroupForm as UseFormReturn<UpdateGroupValues>} />
      </Modal>

      {/* Add Modifier Modal */}
      <Modal
        isOpen={isAddModifierOpen}
        onClose={() => setIsAddModifierOpen(false)}
        title='Add modifier'
        footer={
          <>
            <Button variant='ghost' onClick={() => setIsAddModifierOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={addModifierMutation.isPending}
              onClick={() => void addModifierForm.handleSubmit(onAddModifier)()}
            >
              {addModifierMutation.isPending ? 'Adding...' : 'Add'}
            </Button>
          </>
        }
      >
        <ModifierForm form={addModifierForm as UseFormReturn<UpdateModifierValues>} />
      </Modal>

      {/* Edit Modifier Modal */}
      <Modal
        isOpen={Boolean(editingModifier)}
        onClose={() => setEditingModifier(null)}
        title='Edit modifier'
        footer={
          <>
            <Button variant='ghost' onClick={() => setEditingModifier(null)}>
              Cancel
            </Button>
            <Button
              disabled={updateModifierMutation.isPending}
              onClick={() => void updateModifierForm.handleSubmit(onUpdateModifier)()}
            >
              {updateModifierMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <ModifierForm form={updateModifierForm as UseFormReturn<UpdateModifierValues>} />
      </Modal>
    </div>
  )
}

function ModifierGroupForm({ form }: Readonly<{ form: UseFormReturn<UpdateGroupValues> }>) {
  const nameId = useId()
  const selectionTypeId = useId()
  const minSelectionsId = useId()
  const maxSelectionsId = useId()
  const isRequiredId = useId()
  const isActiveId = useId()

  return (
    <form className='space-y-4'>
      <div className='space-y-1'>
        <label htmlFor={nameId} className='text-xs font-semibold uppercase text-muted-foreground'>
          Group name
        </label>
        <input
          id={nameId}
          type='text'
          className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
          {...form.register('name')}
        />
        {form.formState.errors.name && (
          <p className='text-xs text-red-600'>{form.formState.errors.name.message as string}</p>
        )}
      </div>

      <div className='space-y-1'>
        <label
          htmlFor={selectionTypeId}
          className='text-xs font-semibold uppercase text-muted-foreground'
        >
          Selection type
        </label>
        <Controller
          name='selectionType'
          control={form.control}
          render={({ field }) => (
            <SearchSelect
              id={selectionTypeId}
              value={field.value ?? 'SINGLE'}
              onChange={field.onChange}
              options={[
                { value: 'SINGLE', label: 'Single choice' },
                { value: 'MULTIPLE', label: 'Multiple choice' },
              ]}
              className='rounded-xl'
            />
          )}
        />
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-1'>
          <label
            htmlFor={minSelectionsId}
            className='text-xs font-semibold uppercase text-muted-foreground'
          >
            Min selections
          </label>
          <input
            id={minSelectionsId}
            type='number'
            min={0}
            className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
            {...form.register('minSelections', {
              valueAsNumber: true,
            })}
          />
        </div>

        <div className='space-y-1'>
          <label
            htmlFor={maxSelectionsId}
            className='text-xs font-semibold uppercase text-muted-foreground'
          >
            Max selections
          </label>
          <input
            id={maxSelectionsId}
            type='number'
            min={1}
            className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
            {...form.register('maxSelections', {
              valueAsNumber: true,
            })}
          />
        </div>
      </div>

      <div className='flex gap-6'>
        <div className='flex items-center gap-2 text-sm'>
          <input id={isRequiredId} type='checkbox' {...form.register('isRequired')} />
          <label htmlFor={isRequiredId}>Required</label>
        </div>

        <div className='flex items-center gap-2 text-sm'>
          <input id={isActiveId} type='checkbox' {...form.register('isActive')} />
          <label htmlFor={isActiveId}>Active</label>
        </div>
      </div>
    </form>
  )
}

function ModifierForm({
  form,
}: Readonly<{
  form: UseFormReturn<UpdateModifierValues>
}>) {
  const nameId = useId()
  const priceTypeId = useId()
  const priceId = useId()
  const positionId = useId()
  const activeId = useId()
  const currency = useActiveBusinessStore((s) => s.active?.currency ?? 'USD')

  const priceType = form.watch('priceType') ?? 'adjustment'

  return (
    <form className='space-y-4'>
      <div className='space-y-1'>
        <label htmlFor={nameId} className='text-xs font-semibold uppercase text-muted-foreground'>
          Name
        </label>
        <input
          id={nameId}
          type='text'
          className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
          {...form.register('name')}
        />
        {form.formState.errors.name && (
          <p className='text-xs text-red-600'>{form.formState.errors.name.message as string}</p>
        )}
      </div>

      <div className='space-y-1'>
        <label
          htmlFor={priceTypeId}
          className='text-xs font-semibold uppercase text-muted-foreground'
        >
          Price type
        </label>
        <Controller
          name='priceType'
          control={form.control}
          render={({ field }) => (
            <SearchSelect
              id={priceTypeId}
              value={field.value ?? 'adjustment'}
              onChange={(v) => field.onChange(v as ModifierPriceType)}
              options={[
                { value: 'adjustment', label: 'Price adjustment (added to base price)' },
                { value: 'fixed', label: 'Fixed price (overrides base price)' },
              ]}
              className='rounded-xl'
            />
          )}
        />
      </div>

      <div className='space-y-1'>
        <label htmlFor={priceId} className='text-xs font-semibold uppercase text-muted-foreground'>
          {priceType === 'fixed' ? `Fixed price (${currency})` : `Price adjustment (${currency})`}
        </label>
        <input
          id={priceId}
          type='number'
          step='0.01'
          min='0'
          placeholder={priceType === 'fixed' ? '0.00' : '+0.00'}
          className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-mono'
          {...form.register('priceAdjustment', { valueAsNumber: true })}
        />
        {form.formState.errors.priceAdjustment && (
          <p className='text-xs text-red-600'>
            {form.formState.errors.priceAdjustment.message as string}
          </p>
        )}
      </div>

      <div className='space-y-1'>
        <label
          htmlFor={positionId}
          className='text-xs font-semibold uppercase text-muted-foreground'
        >
          Position
        </label>
        <input
          id={positionId}
          type='number'
          min={0}
          className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
          {...form.register('position', { valueAsNumber: true })}
        />
      </div>

      <div>
        <input id={activeId} type='checkbox' {...form.register('isActive')} />
        <label htmlFor={activeId} className='ml-2 text-sm'>
          Active
        </label>
      </div>
    </form>
  )
}
