import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowRight, CheckCircle2, Clock, GripVertical } from 'lucide-react'
import { memo } from 'react'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader } from '#/components/ui/card'
import type { Order } from '#/features/platform/api/platform.types.ts'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'
import { type AdvanceStatus, formatItemLines, orderColumn } from '../lib/kanban.ts'

interface OrderCardProps {
  order: Order
  isMutating: boolean
  onAdvance: (orderId: string, status: AdvanceStatus) => void
  overlay?: boolean
}

export const OrderCard = memo(function OrderCard({
  order,
  isMutating,
  onAdvance,
  overlay = false,
}: OrderCardProps) {
  const column = orderColumn(order.status)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: order.id,
    data: { column },
    disabled: overlay,
  })

  const style = overlay
    ? undefined
    : {
        transform: CSS.Translate.toString(transform),
        transition,
      }

  return (
    <Card
      ref={overlay ? undefined : setNodeRef}
      style={style}
      className={cn(
        'border transition-shadow hover:shadow-lg',
        isDragging && 'opacity-40',
        overlay && 'shadow-xl',
      )}
    >
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            className='cursor-grab touch-none text-muted-foreground active:cursor-grabbing'
            aria-label={m.admin_kitchen_drag_aria()}
            {...attributes}
            {...listeners}
          >
            <GripVertical className='h-4 w-4' />
          </button>
          <div className='flex flex-col'>
            <span className='text-sm font-bold'>#{order.id.slice(0, 8).toUpperCase()}</span>
            <span className='text-lg font-semibold text-primary'>
              {order.table
                ? m.admin_kitchen_table_number({ number: order.table.number })
                : order.type}
            </span>
          </div>
        </div>
        <div className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
          <Clock className='h-3.5 w-3.5' />
          {new Date(order.createdAt).toLocaleTimeString()}
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <ul className='space-y-2'>
          {formatItemLines(order).map((line) => (
            <li key={`${order.id}-${line}`} className='flex items-center gap-2 font-medium'>
              <div className='h-1.5 w-1.5 rounded-full bg-primary' />
              {line}
            </li>
          ))}
        </ul>

        <div className='pt-2'>
          {column === 'queue' && (
            <Button
              type='button'
              className='w-full rounded-xl'
              disabled={isMutating}
              onClick={() => onAdvance(order.id, 'IN_KITCHEN')}
            >
              {m.admin_kitchen_start_preparing()} <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
          )}
          {column === 'preparing' && (
            <Button
              type='button'
              className='w-full rounded-xl'
              disabled={isMutating}
              onClick={() => onAdvance(order.id, 'READY')}
            >
              {m.admin_kitchen_mark_ready()} <CheckCircle2 className='ml-2 h-4 w-4' />
            </Button>
          )}
          {column === 'ready' && (
            <Button
              type='button'
              variant='outline'
              className='w-full rounded-xl border-emerald-500 text-emerald-600'
              disabled={isMutating}
              onClick={() => onAdvance(order.id, 'DELIVERED')}
            >
              {m.admin_kitchen_served()}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
