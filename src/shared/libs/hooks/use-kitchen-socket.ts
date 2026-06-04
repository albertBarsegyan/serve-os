import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'
import { platformQueryKeys } from '#/features/platform/lib/constants/platform-query-keys.ts'

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4000/api'
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, '')

export function useKitchenSocket(
  businessId: string,
  onConnectionChange?: (connected: boolean) => void,
) {
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!businessId) return

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      onConnectionChange?.(true)
      socket.emit('join-kitchen', businessId)
      socket.emit('join-business', businessId)
    })

    socket.on('disconnect', () => {
      onConnectionChange?.(false)
    })

    socket.on('connect_error', () => {
      onConnectionChange?.(false)
    })

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.kitchenOrders() })
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'orders'] })
    }

    socket.on('order.created', invalidate)
    socket.on('order.confirmed', invalidate)
    socket.on('order.in_kitchen', invalidate)
    socket.on('order.ready', invalidate)
    socket.on('order.delivered', invalidate)
    socket.on('order.closed', invalidate)
    socket.on('order.cancelled', invalidate)

    return () => {
      socket.disconnect()
      socketRef.current = null
      onConnectionChange?.(false)
    }
  }, [businessId, queryClient, onConnectionChange])
}
