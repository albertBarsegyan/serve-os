import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import type { CustomerOrderStatus } from '#/pages/customer/menu/ui/views/order-view'

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4000/api'
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, '')

const BACKEND_STATUS_MAP: Record<string, CustomerOrderStatus> = {
  CREATED: 'placed',
  CONFIRMED: 'confirmed',
  IN_KITCHEN: 'preparing',
  READY: 'ready',
  DELIVERED: 'served',
  CLOSED: 'served',
  CANCELLED: 'cancelled',
}

export function useOrderStatusSocket(sessionToken: string, orderId: string): CustomerOrderStatus {
  const [status, setStatus] = useState<CustomerOrderStatus>('placed')
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!sessionToken) return

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      // Use prop first; fall back to localStorage so the room is re-joined after
      // a network drop or tab restore even if React state was not yet restored.
      const effectiveToken = sessionToken || localStorage.getItem('customer_session_token') || ''
      if (effectiveToken) {
        socket.emit('join-session', effectiveToken)
      }
    })

    socket.on('order:status-changed', (payload: { orderId: string; status: string }) => {
      if (payload.orderId !== orderId) return
      const mapped = BACKEND_STATUS_MAP[payload.status]
      if (mapped) setStatus(mapped)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [sessionToken, orderId])

  return status
}
