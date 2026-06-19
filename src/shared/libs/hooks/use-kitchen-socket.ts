import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'
import { platformQueryKeys } from '#/features/platform/lib/constants/platform-query-keys.ts'

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4000/api'
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, '')

export interface OrderStatusChangedPayload {
  orderId: string
  status: string
  previousStatus: string | null
  tableId: string | null
  tableName: string | null
  sessionToken: string | null
  updatedAt: string
  actor: { type: string; id: string; role?: string }
}

export function useKitchenSocket(
  businessId: string,
  onConnectionChange?: (connected: boolean) => void,
  onOrderStatusChanged?: (payload: OrderStatusChangedPayload) => void,
) {
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)
  const onOrderStatusChangedRef = useRef(onOrderStatusChanged)
  onOrderStatusChangedRef.current = onOrderStatusChanged

  useEffect(() => {
    if (!businessId) return

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.kitchenOrders() })
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'orders'] })
    }

    socket.on('connect', () => {
      onConnectionChange?.(true)
      socket.emit('join-kitchen', businessId)
      socket.emit('join-business', businessId)
      // Re-fetch on reconnect so no events are missed during disconnect
      invalidate()
    })

    socket.on('disconnect', () => {
      onConnectionChange?.(false)
    })

    socket.on('connect_error', () => {
      onConnectionChange?.(false)
    })

    socket.on('order:status-changed', (payload: OrderStatusChangedPayload) => {
      invalidate()
      onOrderStatusChangedRef.current?.(payload)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      onConnectionChange?.(false)
    }
  }, [businessId, queryClient, onConnectionChange])
}
