import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Copy, Edit2, Search, Trash2, UserPlus } from 'lucide-react'
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
import type { StaffMember, StaffRole } from '#/features/platform/api/platform.types.ts'
import { staffQueryOptions } from '#/features/platform/lib/query-options.ts'
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
  useUpdateStaffMutation,
  useUpdateStaffRoleMutation,
} from '#/features/platform/model/platform-hooks.ts'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import useActiveBusinessStore from '#/shared/store/use-active-business.store'
import { Modal } from '#/shared/ui/modal'

type InviteFormValues = z.infer<typeof createStaffWithInviteSchema>
type PasswordFormValues = z.infer<typeof createStaffWithPasswordSchema>
type PinFormValues = z.infer<typeof createStaffWithPinSchema>
type UpdateStaffFormValues = z.infer<typeof updateStaffSchema>

type CreateMode = 'invite' | 'password' | 'pin'

const roleOptions: StaffRole[] = ['MANAGER', 'WAITER', 'CASHIER', 'KITCHEN']
const allRoles: StaffRole[] = ['MANAGER', 'WAITER', 'CASHIER', 'KITCHEN']

export function AdminStaffPage() {
  const [search, setSearch] = useState('')
  const [createMode, setCreateMode] = useState<CreateMode | null>(null)
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null)

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

  const businessId = useActiveBusinessStore((s) => s.active?.id ?? '')

  const { data: staffMembers = [], isPending } = useQuery(staffQueryOptions(businessId))

  const createWithInviteMutation = useCreateStaffWithInviteMutation()
  const createWithPasswordMutation = useCreateStaffWithPasswordMutation()
  const createWithPinMutation = useCreateStaffWithPinMutation()
  const updateRoleMutation = useUpdateStaffRoleMutation()
  const updateStaffMutation = useUpdateStaffMutation()
  const removeStaffMutation = useRemoveStaffMutation()

  const staffSignInLink = `${window.location.origin}/staff-login?businessId=${businessId}`

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
    editForm.reset({
      displayName: member.displayName,
      role: member.role,
      isActive: member.isActive,
    })
  }

  const onInviteSubmit = async (values: InviteFormValues) => {
    try {
      await createWithInviteMutation.mutateAsync({ businessId, data: values })
      showSuccess('Invite sent')
      closeModal()
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    try {
      const payload = { ...values, email: values.email || undefined }
      await createWithPasswordMutation.mutateAsync({ businessId, data: payload })
      showSuccess('Staff member created')
      closeModal()
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const onPinSubmit = async (values: PinFormValues) => {
    try {
      await createWithPinMutation.mutateAsync({ businessId, data: values })
      showSuccess('Staff member created')
      closeModal()
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const onEditSubmit = async (values: UpdateStaffFormValues) => {
    if (!editingMember) return
    try {
      await updateStaffMutation.mutateAsync({
        businessId,
        staffId: editingMember.id,
        data: values,
      })
      showSuccess('Staff member updated')
      setEditingMember(null)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const changeRole = async (staffId: string, role: StaffRole) => {
    try {
      await updateRoleMutation.mutateAsync({ businessId, staffId, data: { role } })
      showSuccess('Role updated')
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const handleRemoveStaff = async (staffId: string) => {
    try {
      await removeStaffMutation.mutateAsync({ businessId, staffId })
      showSuccess('Staff member removed')
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(staffSignInLink)
    showSuccess('Sign-in link copied to clipboard')
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Staff Management</h1>
          <p className='text-muted-foreground'>Manage your team roles, permissions, and status.</p>
          <p className='flex items-center gap-2'>
            <span className='text-sm text-muted-foreground'>Staff sign-in link</span>
            <Button onClick={copyLink} variant='ghost' size='sm'>
              <Copy className='h-4 w-4 mr-1.5' />
              Copy link
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
            Add by PIN
          </Button>
          <Button
            variant='outline'
            size='sm'
            className='rounded-full'
            onClick={() => setCreateMode('password')}
          >
            Add by Password
          </Button>
          <Button size='sm' className='rounded-full' onClick={() => setCreateMode('invite')}>
            <UserPlus className='mr-2 h-4 w-4' /> Invite by Email
          </Button>
        </div>
      </div>

      <Card className='overflow-hidden'>
        <CardHeader className='border-b border-border'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <CardTitle>Staff Members</CardTitle>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <input
                type='text'
                placeholder='Search staff...'
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
                <TableHead className='pl-8'>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='pr-8 text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending && (
                <TableRow>
                  <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
                    Loading staff...
                  </TableCell>
                </TableRow>
              )}

              {!isPending && filteredStaff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
                    No staff members found.
                  </TableCell>
                </TableRow>
              )}

              {filteredStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className='pl-8 font-bold'>
                    {member.displayName || member.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>{member.email ?? '-'}</TableCell>
                  <TableCell>
                    <select
                      className='h-8 rounded-lg border border-input bg-background px-2 text-xs font-medium'
                      value={member.role}
                      onChange={(event) => {
                        void changeRole(member.id, event.target.value as StaffRole)
                      }}
                    >
                      {allRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.isActive ? 'success' : 'outline'} className='capitalize'>
                      {member.isActive ? 'active' : 'inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className='pr-8 text-right'>
                    <div className='flex justify-end gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='rounded-full'
                        title='Edit'
                        onClick={() => openEditMember(member)}
                      >
                        <Edit2 className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='rounded-full text-red-500 hover:bg-red-500/10 hover:text-red-600'
                        title='Remove'
                        onClick={() => void handleRemoveStaff(member.id)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit staff modal */}
      <Modal
        isOpen={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
        title='Edit staff member'
        footer={
          <>
            <Button variant='ghost' onClick={() => setEditingMember(null)}>
              Cancel
            </Button>
            <Button
              disabled={updateStaffMutation.isPending}
              onClick={() => void editForm.handleSubmit(onEditSubmit)()}
            >
              {updateStaffMutation.isPending ? 'Saving...' : 'Save'}
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
              Display name
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
              Role
            </label>
            <select
              id={editRoleId}
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...editForm.register('role')}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <label htmlFor={editActiveId} className='flex items-center gap-2 text-sm'>
            <input
              id={editActiveId}
              type='checkbox'
              className='h-4 w-4 rounded border border-input accent-primary'
              {...editForm.register('isActive')}
            />
            <span>Active</span>
          </label>
        </form>
      </Modal>

      {/* Invite by email modal */}
      <Modal
        isOpen={createMode === 'invite'}
        onClose={closeModal}
        title='Invite staff by email'
        footer={
          <>
            <Button variant='ghost' onClick={closeModal}>
              Cancel
            </Button>
            <Button
              disabled={createWithInviteMutation.isPending}
              onClick={() => void inviteForm.handleSubmit(onInviteSubmit)()}
            >
              {createWithInviteMutation.isPending ? 'Sending...' : 'Send invite'}
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
              Display name
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
              Email
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
              Role
            </label>
            <select
              id={roleId}
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...inviteForm.register('role')}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Create with password modal */}
      <Modal
        isOpen={createMode === 'password'}
        onClose={closeModal}
        title='Add staff with password'
        footer={
          <>
            <Button variant='ghost' onClick={closeModal}>
              Cancel
            </Button>
            <Button
              disabled={createWithPasswordMutation.isPending}
              onClick={() => void passwordForm.handleSubmit(onPasswordSubmit)()}
            >
              {createWithPasswordMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </>
        }
      >
        <form className='space-y-4'>
          <div className='space-y-1'>
            <label
              htmlFor={displayNameId2}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              Display name
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
              Email (optional)
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
              Role
            </label>
            <select
              id={roleId2}
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...passwordForm.register('role')}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className='space-y-1'>
            <label
              htmlFor={passwordId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              Temporary password
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

      {/* Create with PIN modal */}
      <Modal
        isOpen={createMode === 'pin'}
        onClose={closeModal}
        title='Add staff with PIN'
        footer={
          <>
            <Button variant='ghost' onClick={closeModal}>
              Cancel
            </Button>
            <Button
              disabled={createWithPinMutation.isPending}
              onClick={() => void pinForm.handleSubmit(onPinSubmit)()}
            >
              {createWithPinMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </>
        }
      >
        <form className='space-y-4'>
          <div className='space-y-1'>
            <label
              htmlFor={displayNameId3}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              Display name
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
              Role
            </label>
            <select
              id={roleId3}
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...pinForm.register('role')}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className='space-y-1'>
            <label
              htmlFor={pinId}
              className='text-xs font-semibold uppercase text-muted-foreground'
            >
              PIN (exactly 4 digits)
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
