import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { CLIENT_EVENTS, type MenuAvailabilityChangedPayload, SERVER_EVENTS } from './events'
import { connectSocket, getSocket } from './socket'

/**
 * Joins the `menu:<businessId>` Socket.IO room for a guest's open menu page and refetches the
 * public menu whenever a product's availability changes — without this, a guest keeps seeing an
 * item as orderable for up to the menu query's 5-minute staleTime after staff mark it out of
 * stock. No auth: the public menu itself is already served unauthenticated (GET /menu/customer),
 * so this feed leaks nothing the guest couldn't already fetch directly.
 * Must only be mounted client-side (useEffect guards SSR).
 */
export function useMenuRealtime(businessId: string): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (globalThis.window === undefined || !businessId) return

    const socket = getSocket()

    function join() {
      socket.emit(CLIENT_EVENTS.JOIN_MENU, businessId)
    }

    function leave() {
      socket.emit(CLIENT_EVENTS.LEAVE_MENU, businessId)
    }

    function onAvailabilityChanged(_payload: MenuAvailabilityChangedPayload) {
      void queryClient.invalidateQueries({ queryKey: ['customer-menu', businessId] })
    }

    socket.on('connect', join)
    socket.on(SERVER_EVENTS.MENU_AVAILABILITY_CHANGED, onAvailabilityChanged)

    if (socket.connected) {
      join()
    } else {
      connectSocket()
    }

    return () => {
      leave()
      socket.off('connect', join)
      socket.off(SERVER_EVENTS.MENU_AVAILABILITY_CHANGED, onAvailabilityChanged)
    }
  }, [businessId, queryClient])
}
