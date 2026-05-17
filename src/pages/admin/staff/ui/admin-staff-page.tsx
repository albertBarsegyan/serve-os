import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Search, Trash2, UserPlus } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { createStaffInviteSchema } from '#/features/platform/lib/schemas/platform.schemas.ts'
import { staffQueryOptions } from '#/features/platform/lib/query-options.ts'
import {
  useCreateStaffInviteMutation,
  useRemoveStaffMutation,
  useUpdateStaffRoleMutation,
} from '#/features/platform/model/platform-hooks.ts'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Modal } from '#/shared/ui/Modal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'

type InviteFormValues = z.infer<typeof createStaffInviteSchema>

const roleOptions = ['OWNER', 'ADMIN', 'WAITER', 'CHEF'] as const

export function AdminStaffPage() {
  const [search, setSearch] = useState('')
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  const emailId = useId()
  const roleId = useId()

  const { data: staffMembers = [], isPending } = useQuery(staffQueryOptions())

  const createInviteMutation = useCreateStaffInviteMutation()
  const updateRoleMutation = useUpdateStaffRoleMutation()
  const removeStaffMutation = useRemoveStaffMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(createStaffInviteSchema),
    defaultValues: {
      email: '',
      role: 'WAITER',
    },
  })

  const filteredStaff = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return staffMembers

    return staffMembers.filter((member) =>
      [member.firstName, member.lastName, member.email, member.role]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [search, staffMembers])

  const onInviteSubmit = async (values: InviteFormValues) => {
    try {
      await createInviteMutation.mutateAsync(values)
      showSuccess('Invite sent')
      reset({ email: '', role: 'WAITER' })
      setIsInviteOpen(false)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const changeRole = async (staffId: string, role: (typeof roleOptions)[number]) => {
    try {
      await updateRoleMutation.mutateAsync({ staffId, data: { role } })
      showSuccess('Role updated')
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const removeStaff = async (staffId: string) => {
    try {
      await removeStaffMutation.mutateAsync(staffId)
      showSuccess('Staff member removed')
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Staff Management</h1>
          <p className='text-muted-foreground'>Manage your team roles, permissions, and status.</p>
        </div>
        <Button size='sm' className='rounded-full' onClick={() => setIsInviteOpen(true)}>
          <UserPlus className='mr-2 h-4 w-4' /> Invite Staff Member
        </Button>
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
                    {[member.firstName, member.lastName].filter(Boolean).join(' ') || member.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>{member.email ?? '-'}</TableCell>
                  <TableCell>
                    <select
                      className='h-8 rounded-lg border border-input bg-background px-2 text-xs font-medium'
                      value={member.role}
                      onChange={(event) => {
                        const value = event.target.value as (typeof roleOptions)[number]
                        void changeRole(member.id, value)
                      }}
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <Badge variant='success' className='capitalize'>
                      active
                    </Badge>
                  </TableCell>
                  <TableCell className='pr-8 text-right'>
                    <div className='flex justify-end gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='rounded-full text-red-500 hover:bg-red-500/10 hover:text-red-600'
                        title='Remove'
                        onClick={() => {
                          void removeStaff(member.id)
                        }}
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

      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title='Invite staff member'
        footer={
          <>
            <Button variant='ghost' onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={createInviteMutation.isPending}
              onClick={() => {
                void handleSubmit(onInviteSubmit)()
              }}
            >
              {createInviteMutation.isPending ? 'Sending...' : 'Send invite'}
            </Button>
          </>
        }
      >
        <form className='space-y-4'>
          <div className='space-y-1'>
            <label htmlFor={emailId} className='text-xs font-semibold uppercase text-muted-foreground'>
              Email
            </label>
            <input
              id={emailId}
              type='email'
              placeholder='staff@example.com'
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...register('email')}
            />
            {errors.email && <p className='text-xs text-red-600'>{errors.email.message}</p>}
          </div>

          <div className='space-y-1'>
            <label htmlFor={roleId} className='text-xs font-semibold uppercase text-muted-foreground'>
              Role
            </label>
            <select
              id={roleId}
              className='h-10 w-full rounded-xl border border-input bg-background px-3 text-sm'
              {...register('role')}
            >
              <option value='ADMIN'>ADMIN</option>
              <option value='WAITER'>WAITER</option>
              <option value='CHEF'>CHEF</option>
            </select>
            {errors.role && <p className='text-xs text-red-600'>{errors.role.message}</p>}
          </div>
        </form>
      </Modal>
    </div>
  )
}
