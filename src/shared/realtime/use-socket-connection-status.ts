import { useEffect, useState } from 'react'
import { getSocket } from './socket'

/**
 * Tracks the shared socket's connect/disconnect state so a page can tell the user
 * when it has silently stopped receiving live updates (e.g. after a network blip or
 * a backgrounded tab) instead of looking falsely up to date — the underlying data
 * can sit stale well past the moment a disconnect happens (5-minute query staleTime,
 * refetchOnWindowFocus off), so nothing else would otherwise surface this.
 */
export function useSocketConnectionStatus(enabled: boolean): boolean {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (globalThis.window === undefined || !enabled) return

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
  }, [enabled])

  return isConnected
}
