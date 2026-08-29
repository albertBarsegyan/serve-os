import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { memo, useMemo } from 'react'
import { Badge } from '#/components/ui/badge'
import type { Order } from '#/features/platform/api/platform.types.ts'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'
import { type AdvanceStatus, COLUMN_THEME, type getColumns } from '../lib/kanban.ts'
import { OrderCard } from './order-card.tsx'

const EMPTY_STATE_COPY: Record<string, { title: () => string; hint: () => string }> = {
  queue: { title: m.admin_kitchen_empty_queue_title, hint: m.admin_kitchen_empty_queue_hint },
  preparing: {
    title: m.admin_kitchen_empty_preparing_title,
    hint: m.admin_kitchen_empty_preparing_hint,
  },
  ready: { title: m.admin_kitchen_empty_ready_title, hint: m.admin_kitchen_empty_ready_hint },
}

interface KanbanColumnProps {
  column: ReturnType<typeof getColumns>[number]
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
  const theme = COLUMN_THEME[column.key]

  return (
    <div className='flex flex-col space-y-4 overflow-hidden'>
      <div
        className={cn('flex items-center justify-between rounded-2xl px-4 py-3', theme.headerBg)}
      >
        <div className='flex items-center gap-2'>
          <theme.icon className={cn('h-5 w-5', theme.iconColor)} />
          <h3 className={cn('text-lg font-semibold', theme.headerText)}>{column.title}</h3>
        </div>
        <Badge variant='default' className={cn('rounded-full', theme.badge)}>
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
            <div
              className={cn(
                'mb-3 flex h-12 w-12 items-center justify-center rounded-full',
                theme.headerBg,
              )}
            >
              <theme.icon className={cn('h-5 w-5', theme.iconColor)} />
            </div>
            <p className='text-sm font-semibold'>{empty.title()}</p>
            <p className='mt-1 max-w-40 text-xs text-muted-foreground'>{empty.hint()}</p>
          </div>
        )}
        {isLoading && column.key === 'queue' && (
          <div className='text-sm text-muted-foreground'>{m.admin_kitchen_loading()}</div>
        )}
      </div>
    </div>
  )
})
