import type { RosterStaffMember } from '#/features/staff-auth/api/staff-auth.types.ts'

interface StaffRosterGridProps {
  staff: RosterStaffMember[]
  onSelect: (member: RosterStaffMember) => void
}

export function StaffRosterGrid({ staff, onSelect }: StaffRosterGridProps) {
  if (staff.length === 0) {
    return (
      <p className='py-8 text-center text-sm text-muted-foreground'>
        No active staff members found.
      </p>
    )
  }

  return (
    <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
      {staff.map((member) => (
        <button
          key={member.id}
          type='button'
          onClick={() => onSelect(member)}
          className='flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        >
          <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted text-xl font-bold uppercase text-muted-foreground'>
            {member.displayName[0]}
          </div>
          <span className='text-sm font-semibold leading-tight'>{member.displayName}</span>
          <span className='rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground'>
            {member.role}
          </span>
        </button>
      ))}
    </div>
  )
}
