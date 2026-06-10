import {Clock} from 'lucide-react'
import {useEffect, useId, useState} from 'react'
import {Button} from '#/components/ui/button'
import {Checkbox} from '#/components/ui/checkbox'
import {Input} from '#/components/ui/input'
import {Label} from '#/components/ui/label'

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

interface WorkingHoursEntry {
  day: string
  open: string
  close: string
  enabled: boolean
}

interface WorkingHoursPickerProps {
  readonly value: string
  readonly onChange: (value: string) => void
}

export function WorkingHoursPicker({ value, onChange }: WorkingHoursPickerProps) {
  const pickerId = useId()

  // Parse existing JSON value or initialize empty state
  const parseWorkingHours = (): WorkingHoursEntry[] => {
    try {
      if (!value.trim()) {
        return DAYS_OF_WEEK.map((day) => ({
          day,
          open: '09:00',
          close: '22:00',
          enabled: false,
        }))
      }

      const parsed = JSON.parse(value)
      return DAYS_OF_WEEK.map((day) => {
        const timeRange = parsed[day]
        const [open, close] = timeRange ? timeRange.split('-') : ['09:00', '22:00']

        return {
          day,
          open: open || '09:00',
          close: close || '22:00',
          enabled: Boolean(timeRange),
        }
      })
    } catch {
      return DAYS_OF_WEEK.map((day) => ({
        day,
        open: '09:00',
        close: '22:00',
        enabled: false,
      }))
    }
  }

  const [hours, setHours] = useState<WorkingHoursEntry[]>(parseWorkingHours())

  useEffect(() => {
    setHours(parseWorkingHours())
  }, [value])

  // Serialize hours to JSON
  const serializeHours = (entries: WorkingHoursEntry[]): string => {
    const obj: Record<string, string> = {}

    entries.forEach(({ day, open, close, enabled }) => {
      if (enabled && open && close) {
        obj[day] = `${open}-${close}`
      }
    })

    return Object.keys(obj).length ? JSON.stringify(obj) : ''
  }

  const updateDay = (index: number, updates: Partial<WorkingHoursEntry>) => {
    const newHours = [...hours]
    newHours[index] = { ...newHours[index], ...updates }
    setHours(newHours)
    onChange(serializeHours(newHours))
  }

  const setAllDays = (enabled: boolean) => {
    const newHours = hours.map((h) => ({ ...h, enabled }))
    setHours(newHours)
    onChange(serializeHours(newHours))
  }

  const configuredDays = hours.filter((h) => h.enabled).length
  const allConfigured = hours.length > 0 && hours.every((h) => h.enabled)

  return (
    <div className='space-y-4 rounded-xl border border-border bg-card p-4'>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <Clock className='h-5 w-5 text-primary' />
          <span className='text-sm font-semibold text-foreground'>Working Hours</span>
        </div>
        <span className='text-xs text-muted-foreground'>
          {configuredDays > 0 &&
            `${configuredDays} day${configuredDays === 1 ? '' : 's'} configured`}
        </span>
      </div>

      {/* Quick select buttons */}
      <div className='flex gap-2 border-t border-border pt-4'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => setAllDays(true)}
          className={allConfigured ? 'bg-primary/10 text-primary' : ''}
        >
          All days
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => setAllDays(false)}
          className={configuredDays === 0 ? 'bg-destructive/10 text-destructive' : ''}
        >
          Clear all
        </Button>
      </div>

      {/* Days grid */}
      <div className='space-y-3 border-t border-border pt-4'>
        {hours.map((entry, index) => (
          <div key={entry.day} className='min-h-10 flex items-center gap-3'>
            <Checkbox
              id={`${pickerId}-${entry.day}`}
              checked={entry.enabled}
              onChange={(e) => updateDay(index, { enabled: e.currentTarget.checked })}
              className='mt-0.5'
            />
            <Label
              htmlFor={`${pickerId}-${entry.day}`}
              className='min-w-24 cursor-pointer text-sm font-medium text-foreground'
            >
              {DAY_LABELS[entry.day]}
            </Label>

            {entry.enabled && (
              <div className='ml-auto flex items-center gap-2'>
                <div className='flex items-center gap-2'>
                  <Input
                    type='time'
                    value={entry.open}
                    onChange={(e) => updateDay(index, { open: e.target.value })}
                    className='w-fit h-9 rounded-lg px-2 text-sm'
                  />
                  <span className='text-xs text-muted-foreground'>to</span>
                  <Input
                    type='time'
                    value={entry.close}
                    onChange={(e) => updateDay(index, { close: e.target.value })}
                    className='h-9 w-fit rounded-lg px-2 text-sm'
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hidden input for form submission */}
      <input type='hidden' value={value} onChange={() => {}} />
    </div>
  )
}
