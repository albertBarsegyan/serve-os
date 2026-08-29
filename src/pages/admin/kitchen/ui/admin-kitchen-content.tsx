import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useQuery } from '@tanstack/react-query'
import { Maximize2, Minimize2, Wifi, WifiOff } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { useOrderNotifications } from '#/features/notification'
import type { Order } from '#/features/platform/api/platform.types.ts'
import { kitchenActiveOrdersQueryOptions } from '#/features/platform/lib/query-options.ts'
import { useUpdateOrderStatusMutation } from '#/features/platform/model/platform-hooks.ts'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'
import { showError } from '#/shared/libs/hooks/toast.ts'
import { useSelectedBusinessId } from '#/shared/libs/hooks/use-active-business.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { getSocket } from '#/shared/realtime/socket'
import {
  type AdvanceStatus,
  COLUMN_KEYS,
  type Column,
  FORWARD_TRANSITIONS,
  getColumns,
  groupOrdersByColumn,
} from '../lib/kanban.ts'
import { KanbanColumn } from './kanban-column.tsx'
import { OrderCard } from './order-card.tsx'

export function AdminKitchenContent() {
  const businessId = useSelectedBusinessId() ?? ''
  const [isConnected, setIsConnected] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = () => {
    if (isFullscreen) {
      void document.exitFullscreen()
    } else {
      containerRef.current?.requestFullscreen()
    }
  }

  useOrderNotifications({ room: 'kitchen', id: businessId })

  useEffect(() => {
    if (globalThis.window === undefined || !businessId) return
    const socket = getSocket()
    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)
    setIsConnected(socket.connected)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [businessId])

  const {
    data: queryOrders = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(kitchenActiveOrdersQueryOptions())

  const isDraggingRef = useRef(false)
  const [displayOrders, setDisplayOrders] = useState<Order[]>(queryOrders)

  useEffect(() => {
    if (isDraggingRef.current) return
    setDisplayOrders(queryOrders)
  }, [queryOrders])

  const updateStatusMutation = useUpdateOrderStatusMutation()
  const mutate = updateStatusMutation.mutate

  const advance = useCallback(
    (orderId: string, status: AdvanceStatus) => {
      mutate(
        { orderId, data: { status } },
        { onError: (err) => showError(getResponseErrorMessage(err)) },
      )
    },
    [mutate],
  )

  const pendingOrderId =
    updateStatusMutation.isPending && updateStatusMutation.variables
      ? updateStatusMutation.variables.orderId
      : null

  const groupedOrders = useMemo(() => groupOrdersByColumn(displayOrders), [displayOrders])
  const activeCount =
    groupedOrders.queue.length + groupedOrders.preparing.length + groupedOrders.ready.length

  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const activeOrder = useMemo(
    () => displayOrders.find((order) => order.id === activeOrderId) ?? null,
    [displayOrders, activeOrderId],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    isDraggingRef.current = true
    setActiveOrderId(String(event.active.id))
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      isDraggingRef.current = false
      setActiveOrderId(null)
      // Catch up on any real-time updates that arrived (and were deferred) mid-drag.
      setDisplayOrders(queryOrders)

      if (!over) return

      const sourceColumn = active.data.current?.column as Column | undefined
      const overId = over.id
      const targetColumn = COLUMN_KEYS.has(overId as Column)
        ? (overId as Column)
        : (over.data.current?.column as Column | undefined)

      if (!(sourceColumn && targetColumn) || sourceColumn === targetColumn) return

      // Only forward, adjacent-column transitions are valid — anything else snaps back.
      const transition = FORWARD_TRANSITIONS[sourceColumn]
      if (transition?.to !== targetColumn) return

      advance(String(active.id), transition.status)
    },
    [advance, queryOrders],
  )

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col space-y-8',
        isFullscreen ? 'h-screen bg-background p-8' : 'h-[calc(100vh-10rem)]',
      )}
    >
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>{m.admin_kitchen_heading()}</h1>
          <p className='text-muted-foreground'>{m.admin_kitchen_subtitle()}</p>
          {!businessId && isConnected && (
            <p className='mt-2 text-sm text-amber-700'>{m.admin_kitchen_no_business()}</p>
          )}
          {isError && (
            <p className='mt-2 text-sm text-destructive'>
              {getResponseErrorMessage(error)}
              <button
                type='button'
                className='ml-2 font-semibold underline'
                onClick={() => refetch()}
              >
                {m.admin_kitchen_retry()}
              </button>
            </p>
          )}
        </div>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
            {isConnected ? (
              <Wifi className='h-3.5 w-3.5 text-emerald-500' />
            ) : (
              <WifiOff className='h-3.5 w-3.5 text-amber-500' />
            )}
            <span>{isConnected ? m.admin_kitchen_live() : m.admin_kitchen_polling()}</span>
          </div>
          <Badge variant='outline' className='h-8 rounded-full bg-muted px-4 text-xs font-semibold'>
            {m.admin_kitchen_active_count({ count: activeCount })}
          </Badge>
          <Button
            size='sm'
            variant='outline'
            type='button'
            className='rounded-full'
            onClick={() => refetch()}
          >
            {m.admin_kitchen_refresh()}
          </Button>
          <Button
            size='sm'
            variant='outline'
            type='button'
            className='rounded-full'
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className='h-4 w-4' /> : <Maximize2 className='h-4 w-4' />}
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className='grid flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-3'>
          {getColumns().map((col) => (
            <KanbanColumn
              key={col.key}
              column={col}
              orders={groupedOrders[col.key]}
              isLoading={isPending}
              pendingOrderId={pendingOrderId}
              onAdvance={advance}
            />
          ))}
        </div>

        <DragOverlay>
          {activeOrder ? (
            <div className='w-80'>
              <OrderCard order={activeOrder} isMutating={false} onAdvance={advance} overlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
