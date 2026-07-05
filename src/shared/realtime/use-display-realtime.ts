import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { displaySnapshotQueryKey } from '#/shared/api/display/public-display-api'
import {
  CLIENT_EVENTS,
  type DisplayOrderPayload,
  type DisplayOrderRemovedPayload,
  type JoinAck,
  SERVER_EVENTS,
} from './events'
import { connectSocket, getSocket } from './socket'

/**
 * Joins the `display:<businessId>` Socket.IO room for a venue TV display and keeps the
 * TanStack Query cache in sync. Must only be mounted client-side (useEffect guards SSR).
 *
 * Unlike join-session (token-scoped leave) or join-kitchen/join-business (id passed in by
 * the caller), join-display resolves the businessId server-side from the token and only
 * returns it via the join ack — so the businessId used for leave-display is whatever the
 * last successful join told us, not something the caller already knows.
 */
export function useDisplayRealtime(token: string): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (globalThis.window === undefined || !token) return

    const socket = getSocket()
    const joinedBusinessIdRef = { current: null as string | null }

    function invalidateSnapshot() {
      void queryClient.invalidateQueries({ queryKey: displaySnapshotQueryKey(token) })
    }

    function join() {
      socket.emit(CLIENT_EVENTS.JOIN_DISPLAY, token, (ack: JoinAck) => {
        if (ack?.event === 'joined') {
          joinedBusinessIdRef.current = ack.data
          // A (re)connect may have missed broadcasts entirely while disconnected —
          // resync rather than trusting no transitions happened in the gap.
          invalidateSnapshot()
        }
      })
    }

    function leave() {
      if (joinedBusinessIdRef.current) {
        socket.emit(CLIENT_EVENTS.LEAVE_DISPLAY, joinedBusinessIdRef.current)
        joinedBusinessIdRef.current = null
      }
    }

    function onOrderUpdated(_payload: DisplayOrderPayload) {
      invalidateSnapshot()
    }

    function onOrderRemoved(_payload: DisplayOrderRemovedPayload) {
      invalidateSnapshot()
    }

    socket.on('connect', join)
    socket.on(SERVER_EVENTS.DISPLAY_ORDER_UPDATED, onOrderUpdated)
    socket.on(SERVER_EVENTS.DISPLAY_ORDER_REMOVED, onOrderRemoved)

    if (socket.connected) {
      join()
    } else {
      connectSocket()
    }

    return () => {
      leave()
      socket.off('connect', join)
      socket.off(SERVER_EVENTS.DISPLAY_ORDER_UPDATED, onOrderUpdated)
      socket.off(SERVER_EVENTS.DISPLAY_ORDER_REMOVED, onOrderRemoved)
    }
  }, [token, queryClient])
}
