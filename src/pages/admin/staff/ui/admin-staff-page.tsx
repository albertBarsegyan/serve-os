import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Copy, Edit2, LockOpen, Search, Trash2, UserPlus } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
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
import type { StaffMember, StaffRole } from '#/features/platform/api/platform.types.ts'
import { pagedStaffQueryOptions } from '#/features/platform/lib/query-options.ts'
import {
  createStaffWithInviteSchema,
  createStaffWithPasswordSchema,
  createStaffWithPinSchema,
  updateStaffSchema,
} from '#/features/platform/lib/schemas/platform.schemas.ts'
import {
  useCreateStaffWithInviteMutation,
  useCreateStaffWithPasswordMutation,
  useCreateStaffWithPinMutation,
  useRemoveStaffMutation,
  useUnlockStaffMutation,
  useUpdateStaffMutation,
} from '#/features/platform/model/platform-hooks.ts'
import { m } from '#/paraglide/messages'
import { ImageEntityType } from '#/shared/api/images/images.api'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { useActiveBusiness } from '#/shared/libs/hooks/use-active-business.ts'
import { StaffPermission } from '#/shared/libs/permissions/index.ts'
import { usePermissions } from '#/shared/libs/permissions/use-permissions.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { ConfirmDeleteModal } from '#/shared/ui/confirm-delete-modal'
import { ImageUpload } from '#/shared/ui/image-upload'
import { Modal } from '#/shared/ui/modal'
import { type PageLimit, PaginationControls } from '#/shared/ui/pagination-controls'
import { SearchSelect } from '#/shared/ui/search-select'

type InviteFormValues = z.infer<typeof createStaffWithInviteSchema>
type PasswordFormValues = z.infer<typeof createStaffWithPasswordSchema>
type PinFormValues = z.infer<typeof createStaffWithPinSchema>
type UpdateStaffFormValues = z.infer<typeof updateStaffSchema>

type CreateMode = 'invite' | 'password' | 'pin'

const roleOptions: StaffRole[] = ['MANAGER', 'WAITER', 'CASHIER', 'KITCHEN']

const roleSelectOptions = roleOptions.map((r) => ({ value: r, label: r }))

function isStaffLocked(member: StaffMember): boolean {
  if (!member.pinLockedUntil) return false
  return new Date(member.pinLockedUntil) > new Date()
}

export function AdminStaffPage() {
  const { isOwner, hasPermission } = usePermissions()
  const canUnlock = isOwner() || hasPermission(StaffPermission.STAFF_MANAGE)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<PageLimit>(20)
  const [createMode, setCreateMode] = useState<CreateMode | null>(null)
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null)
  const [editingAvatarUrl, setEditingAvatarUrl] = useState<string | null>(null)
  const [deletingMember, setDeletingMember] = useState<StaffMember | null>(null)

  const emailId = useId()
  const roleId = useId()
  const displayNameId = useId()
  const passwordId = useId()
  const pinId = useId()
  const editNameId = useId()
  const editRoleId = useId()
  const editActiveId = useId()
  const displayNameId2 = useId()
  const emailId2 = useId()
  const roleId2 = useId()
  const displayNameId3 = useId()
  const roleId3 = useId()

  const activeBusiness = useActiveBusiness()
  const activeBusinessId = activeBusiness?.id ?? ''

  const { data: pagedStaff, isPending } = useQuery(
    pagedStaffQueryOptions(activeBusinessId, page, limit),
  )
  const staffMembers = pagedStaff?.data ?? []

  const createWithInviteMutation = useCreateStaffWithInviteMutation()
  const createWithPasswordMutation = useCreateStaffWithPasswordMutation()
  const createWithPinMutation = useCreateStaffWithPinMutation()

  const updateStaffMutation = useUpdateStaffMutation()
  const removeStaffMutation = useRemoveStaffMutation()
  const unlockStaffMutation = useUnlockStaffMutation()

  const staffSignInLink = `${globalThis.location.origin}/b/${activeBusiness?.slug}/staff-login`

  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(createStaffWithInviteSchema),
    defaultValues: { displayName: '', email: '', role: 'WAITER' as StaffRole },
  })

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(createStaffWithPasswordSchema),
    defaultValues: {
      displayName: '',
      role: 'WAITER' as StaffRole,
      email: '',
      temporaryPassword: '',
    },
  })

  const pinForm = useForm<PinFormValues>({
    resolver: zodResolver(createStaffWithPinSchema),
    defaultValues: { displayName: '', role: 'WAITER' as StaffRole, pin: '' },
  })

  const editForm = useForm<UpdateStaffFormValues>({
    resolver: zodResolver(updateStaffSchema),
  })

  const filteredStaff = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return staffMembers

    return staffMembers.filter((member) =>
      [member.displayName, member.email, member.role]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [search, staffMembers])

  const closeModal = () => {
    setCreateMode(null)
    inviteForm.reset()

    passwordForm.reset()
    pinForm.reset()
  }

  const openEditMember = (member: StaffMember) => {
    setEditingMember(member)
    setEditingAvatarUrl(member.avatarUrl ?? null)
    editForm.reset({
      displayName: member.displayName,
      role: member.role,
      isActive: member.isActive,
    })
  }

  const onInviteSubmit = async (values: InviteFormValues) => {
    try {
      await createWithInviteMutation.mutateAsync({ businessId: activeBusinessId, data: values })
      showSuccess(m.admin_staff_invite_sent())
      closeModal()
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    try {
      const payload = { ...values, email: values.email || undefined }
      await createWithPasswordMutation.mutateAsync({ businessId: activeBusinessId, data: payload })
      showSuccess(m.admin_staff_member_created())
      closeModal()
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const onPinSubmit = async (values: PinFormValues) => {
    try {
      await createWithPinMutation.mutateAsync({ businessId: activeBusinessId, data: values })
      showSuccess(m.admin_staff_member_created())
      closeModal()
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const onEditSubmit = async (values: UpdateStaffFormValues) => {
    if (!editingMember) return
    try {
      await updateStaffMutation.mutateAsync({
        businessId: activeBusinessId,
        staffId: editingMember.id,
        data: { ...values, avatarUrl: editingAvatarUrl },
      })
      showSuccess(m.admin_staff_member_updated())
      setEditingMember(null)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const handleRemoveStaff = async () => {
    if (!deletingMember) return
    try {
      await removeStaffMutation.mutateAsync({
        businessId: activeBusinessId,
        staffId: deletingMember.id,
      })
      showSuccess(m.admin_staff_member_removed())
      setDeletingMember(null)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const handleUnlockStaff = async (member: StaffMember) => {
    try {
      await unlockStaffMutation.mutateAsync({
        businessId: activeBusinessId,
        staffId: member.id,
      })
      showSuccess(m.admin_staff_unlocked({ name: member.displayName }))
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(staffSignInLink)
    showSuccess(m.admin_staff_link_copied())
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>{m.admin_staff_heading()}</h1>
          <p className='text-muted-foreground'>{m.admin_staff_subheading()}</p>
          <p className='flex items-center gap-2'>
            <span className='text-sm text-muted-foreground'>
              {m.admin_staff_signin_link_label()}
            </span>
            <Button onClick={copyLink} variant='ghost' size='sm'>
              <Copy className='h-4 w-4 mr-1.5' />
              {m.admin_staff_copy_link()}
            </Button>
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            className='rounded-full'
            onClick={() => setCreateMode('pin')}
          >
            {m.admin_staff_add_by_pin()}
          </Button>
          <Button
            variant='outline'
            size='sm'
            className='rounded-full'
            onClick={() => setCreateMode('password')}
          >
            {m.admin_staff_add_by_password()}
          </Button>
          <Button size='sm' className='rounded-full' onClick={() => setCreateMode('invite')}>
            <UserPlus className='mr-2 h-4 w-4' /> {m.admin_staff_invite_by_email()}
          </Button>
        </div>
      </div>

      <Card className='overflow-hidden'>
        <CardHeader className='border-b border-border'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <CardTitle>{m.admin_staff_members_title()}</CardTitle>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <input
                type='text'
                placeholder={m.admin_staff_search_placeholder()}
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
                <TableHead className='pl-8'>{m.admin_staff_col_name()}</TableHead>
                <TableHead>{m.admin_staff_col_employee_id()}</TableHead>
                <TableHead>{m.admin_staff_col_email()}</TableHead>
                <TableHead>{m.admin_staff_col_role()}</TableHead>
                <TableHead>{m.admin_staff_col_status()}</TableHead>
                <TableHead className='pr-8 text-right'>{m.admin_staff_col_actions()}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending && (
                <TableRow>
                  <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
                    {m.admin_staff_loading()}
                  </TableCell>
                </TableRow>
              )}

              {!isPending && filteredStaff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
                    {m.admin_staff_none_found()}
                  </TableCell>
                </TableRow>
              )}

              {filteredStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className='pl-8'>
                    <div className='flex items-center gap-3'>
                      <div className='flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-bold uppercase'>
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.displayName}
                            className='h-full w-full object-cover'
                          />
                        ) : (
                          (member.displayName[0] ?? '?')
                        )}
                      </div>
                      <span className='font-bold'>
                        {member.displayName || member.id.slice(0, 8)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      type='button'
                      title={m.admin_staff_copy_id_title()}
                      onClick={() => {
                        navigator.clipboard.writeText(member.employeeId)
                        showSuccess(m.admin_staff_id_copied())
                      }}
                      className='flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                    >
                      {member.employeeId}
                      <Copy className='h-3 w-3 shrink-0' />
                    </button>
                  </TableCell>
                  <TableCell className='text-muted-foreground'>{member.email ?? '-'}</TableCell>
                  <TableCell>{member.role}</TableCell>

                  <TableCell>
                    <div className='flex flex-wrap items-center gap-1.5'>
                      <Badge
                        variant={member.isActive ? 'success' : 'outline'}
                        className='capitalize'
                      >
                        {member.isActive
                          ? m.admin_staff_status_active()
                          : m.admin_staff_status_inactive()}
                      </Badge>
                      {isStaffLocked(member) && (
                        <Badge variant='destructive' className='capitalize'>
                          {m.admin_staff_pin_locked()}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className='pr-8 text-right'>
                    <div className='flex justify-end gap-1'>
                      {canUnlock && isStaffLocked(member) && (
                        <Button
                          variant='ghost'
                          size='icon'
                          className='rounded-full text-amber-500 hover:bg-amber-500/10 hover:text-amber-600'
                          title={m.admin_staff_unlock_pin_title()}
                          disabled={unlockStaffMutation.isPending}
                          onClick={() => void handleUnlockStaff(member)}
                        >
                          <LockOpen className='h-4 w-4' />
                        </Button>
                      )}
                      <Button
                        variant='ghost'
                        size='icon'
                        className='rounded-full'
                        title={m.admin_staff_edit_title()}
                        onClick={() => openEditMember(member)}
                      >
                        <Edit2 className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='rounded-full text-red-500 hover:bg-red-500/10 hover:text-red-600'
                        title={m.admin_staff_remove_title()}
                        onClick={() => setDeletingMember(member)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pagedStaff && pagedStaff.total > 0 && (
            <PaginationControls
              page={page}
              limit={limit}
              total={pagedStaff.total}
              totalPages={pagedStaff.totalPages}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l)
                setPage(1)
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit staff modal */}
      <Modal
        isOpen={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
        title={m.admin_staff_edit_modal_title()}
        footer={
          <>
            <Button variant='ghost' onClick={() => setEditingMember(null)}>
              {m.admin_staff_cancel()}
            </Button>
            <Button
              disabled={updateStaffMutation.isPending}
              onClick={() => void editForm.handleSubmit(onEditSubmit)()}
            >
              {updateStaffMutation.isPending ? m.admin_staff_saving() : m.admin_staff_save()}
            </Button>
          </>
        }
      >
        <form className='space-y-4'>
          <ImageUpload
            value={editingAvatarUrl}
            onChange={setEditingAvatarUrl}
            entityType={ImageEntityType.STAFF_AVATAR}
            entityId={editingMember?.id}
            label={m.admin_staff_profile_photo()}
            previewShape='circle'
          />
          <div className='space-y-1'>
            <label
              htmlFor={editNameId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              {m.admin_staff_display_name_label()}
            </label>
            <input
              id={editNameId}
              type='text'
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...editForm.register('displayName')}
            />
            {editForm.formState.errors.displayName && (
              <p className='text-xs text-red-600'>
                {editForm.formState.errors.displayName.message}
              </p>
            )}
          </div>

          <div className='space-y-1'>
            <label
              htmlFor={editRoleId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              {m.admin_staff_role_form_label()}
            </label>
            <Controller
              name='role'
              control={editForm.control}
              render={({ field }) => (
                <SearchSelect
                  id={editRoleId}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  options={roleSelectOptions}
                  className='rounded-xl'
                />
              )}
            />
          </div>

          <label htmlFor={editActiveId} className='flex items-center gap-2 text-sm'>
            <input
              id={editActiveId}
              type='checkbox'
              className='h-4 w-4 rounded border border-input accent-primary'
              {...editForm.register('isActive')}
            />
            <span>{m.admin_staff_active_label()}</span>
          </label>
        </form>
      </Modal>

      {/* Invite by email modal */}
      <Modal
        isOpen={createMode === 'invite'}
        onClose={closeModal}
        title={m.admin_staff_invite_modal_title()}
        footer={
          <>
            <Button variant='ghost' onClick={closeModal}>
              {m.admin_staff_cancel()}
            </Button>
            <Button
              disabled={createWithInviteMutation.isPending}
              onClick={() => void inviteForm.handleSubmit(onInviteSubmit)()}
            >
              {createWithInviteMutation.isPending
                ? m.admin_staff_sending()
                : m.admin_staff_send_invite()}
            </Button>
          </>
        }
      >
        <form className='space-y-4'>
          <div className='space-y-1'>
            <label
              htmlFor={displayNameId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              {m.admin_staff_display_name_label()}
            </label>
            <input
              id={displayNameId}
              type='text'
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...inviteForm.register('displayName')}
            />
            {inviteForm.formState.errors.displayName && (
              <p className='text-xs text-red-600'>
                {inviteForm.formState.errors.displayName.message}
              </p>
            )}
          </div>
          <div className='space-y-1'>
            <label
              htmlFor={emailId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              {m.admin_staff_email_label()}
            </label>
            <input
              id={emailId}
              type='email'
              placeholder='staff@example.com'
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...inviteForm.register('email')}
            />
            {inviteForm.formState.errors.email && (
              <p className='text-xs text-red-600'>{inviteForm.formState.errors.email.message}</p>
            )}
          </div>
          <div className='space-y-1'>
            <label
              htmlFor={roleId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              {m.admin_staff_role_form_label()}
            </label>
            <Controller
              name='role'
              control={inviteForm.control}
              render={({ field }) => (
                <SearchSelect
                  id={roleId}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  options={roleSelectOptions}
                  className='rounded-xl'
                />
              )}
            />
          </div>
        </form>
      </Modal>

      {/* Create with password modal */}
      <Modal
        isOpen={createMode === 'password'}
        onClose={closeModal}
        title={m.admin_staff_password_modal_title()}
        footer={
          <>
            <Button variant='ghost' onClick={closeModal}>
              {m.admin_staff_cancel()}
            </Button>
            <Button
              disabled={createWithPasswordMutation.isPending}
              onClick={() => void passwordForm.handleSubmit(onPasswordSubmit)()}
            >
              {createWithPasswordMutation.isPending
                ? m.admin_staff_creating()
                : m.admin_staff_create()}
            </Button>
          </>
        }
      >
        <form className='space-y-4 mb-24'>
          <div className='space-y-1'>
            <label
              htmlFor={displayNameId2}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              {m.admin_staff_display_name_label()}
            </label>
            <input
              id={displayNameId2}
              type='text'
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...passwordForm.register('displayName')}
            />
            {passwordForm.formState.errors.displayName && (
              <p className='text-xs text-red-600'>
                {passwordForm.formState.errors.displayName.message}
              </p>
            )}
          </div>
          <div className='space-y-1'>
            <label
              htmlFor={emailId2}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              {m.admin_staff_email_optional_label()}
            </label>
            <input
              id={emailId2}
              type='email'
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...passwordForm.register('email')}
            />
          </div>
          <div className='space-y-1'>
            <label
              htmlFor={roleId2}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              {m.admin_staff_role_form_label()}
            </label>
            <Controller
              name='role'
              control={passwordForm.control}
              render={({ field }) => (
                <SearchSelect
                  id={roleId2}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  options={roleSelectOptions}
                  className='rounded-xl'
                />
              )}
            />
          </div>
          <div className='space-y-1'>
            <label
              htmlFor={passwordId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              {m.admin_staff_temp_password_label()}
            </label>
            <input
              id={passwordId}
              type='password'
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...passwordForm.register('temporaryPassword')}
            />
            {passwordForm.formState.errors.temporaryPassword && (
              <p className='text-xs text-red-600'>
                {passwordForm.formState.errors.temporaryPassword.message}
              </p>
            )}
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingMember)}
        onClose={() => setDeletingMember(null)}
        onConfirm={() => void handleRemoveStaff()}
        name={deletingMember?.displayName ?? ''}
        entityLabel={m.admin_staff_entity_label()}
        isPending={removeStaffMutation.isPending}
      />

      {/* Create with PIN modal */}
      <Modal
        isOpen={createMode === 'pin'}
        onClose={closeModal}
        title={m.admin_staff_pin_modal_title()}
        footer={
          <>
            <Button variant='ghost' onClick={closeModal}>
              {m.admin_staff_cancel()}
            </Button>
            <Button
              disabled={createWithPinMutation.isPending}
              onClick={() => void pinForm.handleSubmit(onPinSubmit)()}
            >
              {createWithPinMutation.isPending ? m.admin_staff_creating() : m.admin_staff_create()}
            </Button>
          </>
        }
      >
        <form className='space-y-4 h-full mb-24'>
          <div className='space-y-1'>
            <label
              htmlFor={displayNameId3}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              {m.admin_staff_display_name_label()}
            </label>
            <input
              id={displayNameId3}
              type='text'
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...pinForm.register('displayName')}
            />
            {pinForm.formState.errors.displayName && (
              <p className='text-xs text-red-600'>{pinForm.formState.errors.displayName.message}</p>
            )}
          </div>
          <div className='space-y-1'>
            <label
              htmlFor={roleId3}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              {m.admin_staff_role_form_label()}
            </label>
            <Controller
              name='role'
              control={pinForm.control}
              render={({ field }) => (
                <SearchSelect
                  id={roleId3}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  options={roleSelectOptions}
                  className='rounded-xl'
                />
              )}
            />
          </div>
          <div className='space-y-1'>
            <label
              htmlFor={pinId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              {m.admin_staff_pin_label()}
            </label>
            <input
              id={pinId}
              type='password'
              inputMode='numeric'
              maxLength={4}
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...pinForm.register('pin')}
            />
            {pinForm.formState.errors.pin && (
              <p className='text-xs text-red-600'>{pinForm.formState.errors.pin.message}</p>
            )}
          </div>
        </form>
      </Modal>
    </div>
  )
}
