import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/shared/ui/Card'
import { Button } from '#/shared/ui/Button'
import { Badge } from '#/shared/ui/Badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/shared/ui/Table'
import { Plus, Search, UserPlus, MoreVertical, Edit2, Trash2, Key } from 'lucide-react'

export function AdminStaffPage() {
  const staffMembers = [
    { id: 1, name: 'John Doe', email: 'john@serveos.com', role: 'Owner', status: 'active' },
    { id: 2, name: 'Sarah Chef', email: 'sarah@serveos.com', role: 'Chef', status: 'active' },
    { id: 3, name: 'Mike Waiter', email: 'mike@serveos.com', role: 'Staff', status: 'active' },
    { id: 4, name: 'Anna Kitchen', email: 'anna@serveos.com', role: 'Chef', status: 'disabled' },
    { id: 5, name: 'Chris Service', email: 'chris@serveos.com', role: 'Staff', status: 'active' },
  ]

  return (
    <div className='space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-extrabold'>Staff Management</h1>
          <p className='text-[var(--sea-ink-soft)]'>Manage your team roles, permissions, and status.</p>
        </div>
        <Button size='sm' className='rounded-full'>
          <UserPlus className='mr-2 h-4 w-4' /> Add Staff Member
        </Button>
      </div>

      <Card className='overflow-hidden'>
        <CardHeader className='border-b border-[var(--line)]'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <CardTitle>Staff Members</CardTitle>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sea-ink-soft)]' />
              <input 
                type='text' 
                placeholder='Search staff...' 
                className='h-10 w-full rounded-full border border-[var(--line)] bg-[var(--bg-base)] pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-magenta)] sm:w-64'
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
              {staffMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className='pl-8 font-bold'>{member.name}</TableCell>
                  <TableCell className='text-[var(--sea-ink-soft)]'>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant='secondary' className='rounded-lg px-2 py-0.5'>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.status === 'active' ? 'success' : 'outline'} className='capitalize'>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className='pr-8 text-right'>
                    <div className='flex justify-end gap-1'>
                      <Button variant='ghost' size='icon' className='rounded-full' title='Reset Password'>
                        <Key className='h-4 w-4' />
                      </Button>
                      <Button variant='ghost' size='icon' className='rounded-full' title='Edit'>
                        <Edit2 className='h-4 w-4' />
                      </Button>
                      <Button variant='ghost' size='icon' className='rounded-full text-red-500 hover:bg-red-500/10 hover:text-red-600' title='Delete'>
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
    </div>
  )
}
