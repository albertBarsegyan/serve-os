import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Edit2, Plus, Trash2 } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
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
import { m } from '#/paraglide/messages'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { useActiveBusiness } from '#/shared/libs/hooks/use-active-business.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import { Modal } from '#/shared/ui/modal'
import { SearchSelect } from '#/shared/ui/search-select'

type CreateGroupValues = z.infer<typeof createModifierGroupSchema>
type UpdateGroupValues = z.infer<typeof updateModifierGroupSchema>
type AddModifierValues = z.infer<typeof addModifierSchema>
type UpdateModifierValues = z.infer<typeof updateModifierSchema>

export function AdminModifiersPage() {
  const activeBusiness = useActiveBusiness()
  const businessId = activeBusiness?.id ?? ''
  const currency = activeBusiness?.currency ?? 'USD'

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
      showSuccess(m.admin_modifiers_group_created())
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
      showSuccess(m.admin_modifiers_group_updated())
      setEditingGroup(null)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const onDeleteGroup = async (groupId: string) => {
    try {
      await deleteGroupMutation.mutateAsync({ businessId, groupId })
      showSuccess(m.admin_modifiers_group_deleted())
      if (selectedGroupId === groupId) setSelectedGroupId(null)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const onAddModifier = async (values: AddModifierValues) => {
    if (!selectedGroupId) return
    try {
      await addModifierMutation.mutateAsync({ businessId, groupId: selectedGroupId, data: values })
      showSuccess(m.admin_modifiers_modifier_added())
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
      showSuccess(m.admin_modifiers_modifier_updated())
      setEditingModifier(null)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const onDeleteModifier = async (modifierId: string) => {
    if (!selectedGroupId) return
    try {
      await deleteModifierMutation.mutateAsync({ businessId, groupId: selectedGroupId, modifierId })
      showSuccess(m.admin_modifiers_modifier_deleted())
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>{m.admin_modifiers_heading()}</h1>
          <p className='text-muted-foreground'>{m.admin_modifiers_subheading()}</p>
        </div>
        <Button size='sm' className='rounded-full' onClick={() => setIsCreateGroupOpen(true)}>
          <Plus className='mr-2 h-4 w-4' /> {m.admin_modifiers_new_group()}
        </Button>
      </div>

      <div className='flex flex-col gap-6 lg:flex-row'>
        {/* Groups list */}
        <Card className='h-fit w-full lg:w-72'>
          <CardHeader>
            <CardTitle className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
              {m.admin_modifiers_groups_title()}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-1 p-2 pt-0'>
            {groupsQuery.isPending && (
              <p className='px-4 py-3 text-sm text-muted-foreground'>
                {m.admin_modifiers_loading()}
              </p>
            )}
            {!groupsQuery.isPending && groups.length === 0 && (
              <p className='px-4 py-3 text-sm text-muted-foreground'>
                {m.admin_modifiers_no_groups()}
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
                    {group.selectionType === 'SINGLE'
                      ? m.admin_modifiers_single()
                      : m.admin_modifiers_multi()}
                  </span>
                </button>
                <div className='flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100'>
                  <button
                    type='button'
                    className='rounded-lg p-1 hover:bg-background/60'
                    onClick={() => openEditGroup(group)}
                    title={m.admin_modifiers_edit_group_title()}
                  >
                    <Edit2 className='h-3.5 w-3.5' />
                  </button>
                  <button
                    type='button'
                    className='rounded-lg p-1 text-destructive hover:bg-destructive/10'
                    onClick={() => void onDeleteGroup(group.id)}
                    title={m.admin_modifiers_delete_group_title()}
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
                {selectedGroup
                  ? m.admin_modifiers_group_modifiers_title({ name: selectedGroup.name })
                  : m.admin_modifiers_select_group()}
              </CardTitle>
              {selectedGroupId && (
                <Button
                  size='sm'
                  className='rounded-full'
                  onClick={() => setIsAddModifierOpen(true)}
                >
                  <Plus className='mr-2 h-4 w-4' /> {m.admin_modifiers_add_modifier()}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            {!selectedGroupId ? (
              <div className='flex h-40 items-center justify-center text-sm text-muted-foreground'>
                {m.admin_modifiers_select_group_hint()}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='pl-8'>{m.admin_modifiers_col_name()}</TableHead>
                    <TableHead>{m.admin_modifiers_col_price()}</TableHead>
                    <TableHead>{m.admin_modifiers_col_position()}</TableHead>
                    <TableHead>{m.admin_modifiers_col_status()}</TableHead>
                    <TableHead className='pr-8 text-right'>
                      {m.admin_modifiers_col_actions()}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modifiersQuery.isPending && (
                    <TableRow>
                      <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
                        {m.admin_modifiers_loading_modifiers()}
                      </TableCell>
                    </TableRow>
                  )}

                  {!modifiersQuery.isPending && modifiers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
                        {m.admin_modifiers_no_modifiers()}
                      </TableCell>
                    </TableRow>
                  )}

                  {modifiers.map((modifier) => (
                    <TableRow key={modifier.id}>
                      <TableCell className='pl-8 font-bold'>{modifier.name}</TableCell>
                      <TableCell className='font-mono'>
                        {Number(modifier.priceAdjustment) === 0 && modifier.priceType !== 'fixed'
                          ? m.admin_modifiers_free()
                          : modifier.priceType === 'fixed'
                            ? formatPrice(Number(modifier.priceAdjustment), currency)
                            : `+${formatPrice(Number(modifier.priceAdjustment), currency)}`}
                        {modifier.priceType === 'fixed' && (
                          <span className='ml-1 text-xs text-muted-foreground'>
                            {m.admin_modifiers_fixed_suffix()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>{modifier.position}</TableCell>
                      <TableCell>
                        <Badge variant={modifier.isActive ? 'success' : 'outline'}>
                          {modifier.isActive
                            ? m.admin_modifiers_active()
                            : m.admin_modifiers_inactive()}
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
        title={m.admin_modifiers_create_group_title()}
        footer={
          <>
            <Button variant='ghost' onClick={() => setIsCreateGroupOpen(false)}>
              {m.admin_modifiers_cancel()}
            </Button>
            <Button
              disabled={createGroupMutation.isPending}
              onClick={() => void createGroupForm.handleSubmit(onCreateGroup)()}
            >
              {createGroupMutation.isPending
                ? m.admin_modifiers_creating()
                : m.admin_modifiers_create_btn()}
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
        title={m.admin_modifiers_edit_group_modal_title()}
        footer={
          <>
            <Button variant='ghost' onClick={() => setEditingGroup(null)}>
              {m.admin_modifiers_cancel()}
            </Button>
            <Button
              disabled={updateGroupMutation.isPending}
              onClick={() => void updateGroupForm.handleSubmit(onUpdateGroup)()}
            >
              {updateGroupMutation.isPending
                ? m.admin_modifiers_saving()
                : m.admin_modifiers_save()}
            </Button>
          </>
        }
      >
        <ModifierGroupForm
          form={updateGroupForm as UseFormReturn<UpdateGroupValues>}
          disableMultipleSelection={
            editingGroup?.modifiers?.some((modifier) => modifier.priceType === 'fixed') ?? false
          }
        />
      </Modal>

      {/* Add Modifier Modal */}
      <Modal
        isOpen={isAddModifierOpen}
        onClose={() => setIsAddModifierOpen(false)}
        title={m.admin_modifiers_add_modifier_modal_title()}
        footer={
          <>
            <Button variant='ghost' onClick={() => setIsAddModifierOpen(false)}>
              {m.admin_modifiers_cancel()}
            </Button>
            <Button
              disabled={addModifierMutation.isPending}
              onClick={() => void addModifierForm.handleSubmit(onAddModifier)()}
            >
              {addModifierMutation.isPending
                ? m.admin_modifiers_adding()
                : m.admin_modifiers_add_btn()}
            </Button>
          </>
        }
      >
        <ModifierForm
          form={addModifierForm as UseFormReturn<UpdateModifierValues>}
          allowFixedPrice={selectedGroup?.selectionType !== 'MULTIPLE'}
        />
      </Modal>

      {/* Edit Modifier Modal */}
      <Modal
        isOpen={Boolean(editingModifier)}
        onClose={() => setEditingModifier(null)}
        title={m.admin_modifiers_edit_modifier_modal_title()}
        footer={
          <>
            <Button variant='ghost' onClick={() => setEditingModifier(null)}>
              {m.admin_modifiers_cancel()}
            </Button>
            <Button
              disabled={updateModifierMutation.isPending}
              onClick={() => void updateModifierForm.handleSubmit(onUpdateModifier)()}
            >
              {updateModifierMutation.isPending
                ? m.admin_modifiers_saving()
                : m.admin_modifiers_save()}
            </Button>
          </>
        }
      >
        <ModifierForm
          form={updateModifierForm as UseFormReturn<UpdateModifierValues>}
          allowFixedPrice={selectedGroup?.selectionType !== 'MULTIPLE'}
        />
      </Modal>
    </div>
  )
}

function ModifierGroupForm({
  form,
  disableMultipleSelection = false,
}: Readonly<{
  form: UseFormReturn<UpdateGroupValues>
  disableMultipleSelection?: boolean
}>) {
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
          {m.admin_modifiers_group_name_label()}
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
          {m.admin_modifiers_selection_type_label()}
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
                { value: 'SINGLE', label: m.admin_modifiers_single_choice() },
                ...(disableMultipleSelection
                  ? []
                  : [{ value: 'MULTIPLE', label: m.admin_modifiers_multiple_choice() }]),
              ]}
              className='rounded-xl'
            />
          )}
        />
        {disableMultipleSelection && (
          <p className='text-xs text-muted-foreground'>
            {m.admin_modifiers_multiple_disabled_hint()}
          </p>
        )}
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-1'>
          <label
            htmlFor={minSelectionsId}
            className='text-xs font-semibold uppercase text-muted-foreground'
          >
            {m.admin_modifiers_min_selections_label()}
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
            {m.admin_modifiers_max_selections_label()}
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
          <label htmlFor={isRequiredId}>{m.admin_modifiers_required_label()}</label>
        </div>

        <div className='flex items-center gap-2 text-sm'>
          <input id={isActiveId} type='checkbox' {...form.register('isActive')} />
          <label htmlFor={isActiveId}>{m.admin_modifiers_active_label()}</label>
        </div>
      </div>
    </form>
  )
}

function ModifierForm({
  form,
  allowFixedPrice = true,
}: Readonly<{
  form: UseFormReturn<UpdateModifierValues>
  allowFixedPrice?: boolean
}>) {
  const nameId = useId()
  const priceTypeId = useId()
  const priceId = useId()
  const positionId = useId()
  const activeId = useId()
  const currency = useActiveBusiness()?.currency ?? 'USD'

  const priceType = form.watch('priceType') ?? 'adjustment'

  useEffect(() => {
    if (!allowFixedPrice && priceType === 'fixed') {
      form.setValue('priceType', 'adjustment')
    }
  }, [allowFixedPrice, priceType, form])

  return (
    <form className='space-y-4'>
      <div className='space-y-1'>
        <label htmlFor={nameId} className='text-xs font-semibold uppercase text-muted-foreground'>
          {m.admin_modifiers_name_label()}
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
          {m.admin_modifiers_price_type_label()}
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
                { value: 'adjustment', label: m.admin_modifiers_price_adjustment_option() },
                ...(allowFixedPrice
                  ? [{ value: 'fixed', label: m.admin_modifiers_fixed_price_option() }]
                  : []),
              ]}
              className='rounded-xl'
            />
          )}
        />
        {!allowFixedPrice && (
          <p className='text-xs text-muted-foreground'>
            {m.admin_modifiers_fixed_price_single_only_hint()}
          </p>
        )}
      </div>

      <div className='space-y-1'>
        <label htmlFor={priceId} className='text-xs font-semibold uppercase text-muted-foreground'>
          {priceType === 'fixed'
            ? m.admin_modifiers_fixed_price_label({ currency })
            : m.admin_modifiers_price_adjustment_label({ currency })}
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
          {m.admin_modifiers_position_field_label()}
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
          {m.admin_modifiers_active_label()}
        </label>
      </div>
    </form>
  )
}
