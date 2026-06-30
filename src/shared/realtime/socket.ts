import { io, type Socket } from 'socket.io-client'

function resolveWsUrl(): string {
  // VITE_WS_URL takes priority; fall back to stripping /api from the API base URL
  const explicit = import.meta.env.VITE_WS_URL as string | undefined
  if (explicit) return explicit

  const apiBase =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4000/api'
  return apiBase.replace(/\/api\/?$/, '')
}

// Module-level singleton — only ever created on the client (guarded by SSR checks
// in every call site and in getSocket() itself).
let _socket: Socket | undefined

export function getSocket(): Socket {
  if (globalThis.window === undefined) {
    throw new Error('getSocket() must only be called client-side')
  }
  _socket ??= io(resolveWsUrl(), {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    // autoConnect false so callers control when the connection opens.
    autoConnect: false,
  })
  return _socket
}

/** Opens the connection if not already open. Safe to call multiple times. */
export function connectSocket(): void {
  const s = getSocket()
  if (!s.connected) s.connect()
}

/** Disconnects the singleton. Use on session-closed (F6). */
export function disconnectSocket(): void {
  _socket?.disconnect()
}
