import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { memo, useMemo } from 'react'
import { Badge } from '#/components/ui/badge'
import type { Order } from '#/features/platform/api/platform.types.ts'
import { cn } from '#/lib/utils'
import type { AdvanceStatus, columns } from '../lib/kanban.ts'
import { OrderCard } from './order-card.tsx'

const EMPTY_STATE_COPY: Record<string, { title: string; hint: string }> = {
  queue: { title: 'No orders waiting', hint: 'New orders will appear here' },
  preparing: { title: 'Nothing in progress', hint: 'Orders you start will show here' },
  ready: { title: 'Nothing ready yet', hint: 'Completed orders will show here' },
}

interface KanbanColumnProps {
  column: (typeof columns)[number]
  orders: Order[]
  isLoading: boolean
  pendingOrderId: string | null
  onAdvance: (orderId: string, status: AdvanceStatus) => void
}

export const KanbanColumn = memo(function KanbanColumn({
  column,
  orders,
  isLoading,
  pendingOrderId,
  onAdvance,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key })
  const orderIds = useMemo(() => orders.map((order) => order.id), [orders])
  const empty = EMPTY_STATE_COPY[column.key]

  return (
    <div className='flex flex-col space-y-4 overflow-hidden'>
      <div className='flex items-center justify-between px-2'>
        <div className='flex items-center gap-2'>
          <column.icon className={cn('h-5 w-5', column.color)} />
          <h3 className='text-lg font-semibold'>{column.title}</h3>
        </div>
        <Badge variant='default' className='rounded-full'>
          {orders.length}
        </Badge>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-4 overflow-y-auto rounded-2xl pb-8 pr-2 transition-colors',
          isOver && 'bg-muted/50',
        )}
      >
        <SortableContext items={orderIds} strategy={verticalListSortingStrategy}>
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isMutating={pendingOrderId === order.id}
              onAdvance={onAdvance}
            />
          ))}
        </SortableContext>

        {!isLoading && orders.length === 0 && (
          <div className='flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-10 text-center'>
            <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
              <column.icon className={cn('h-5 w-5', column.color)} />
            </div>
            <p className='text-sm font-semibold'>{empty.title}</p>
            <p className='mt-1 max-w-[10rem] text-xs text-muted-foreground'>{empty.hint}</p>
          </div>
        )}
        {isLoading && column.key === 'queue' && (
          <div className='text-sm text-muted-foreground'>Loading…</div>
        )}
      </div>
    </div>
  )
})
