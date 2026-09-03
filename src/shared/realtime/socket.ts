import { io, type Socket } from 'socket.io-client'
import { CLIENT_EVENTS } from './events'

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

// ── Reference-counted room membership ──────────────────────────────────────────
//
// Multiple independent hooks can want the same room live at once on the one shared
// socket — e.g. a customer session page's shell (useSessionRealtime) and a nested
// order-detail view (useOrderNotifications) both joining the same `session:<token>`
// room. Socket.IO room membership belongs to the connection, not to any one JS
// listener, so naively emitting leave-* whenever any single hook unmounts would kick
// every other still-mounted subscriber out of the room too — only the last release
// should actually leave. Keyed by the socket instance (not the module singleton) so
// this stays test-friendly: each test's fake socket gets its own isolated counts.

export type RoomKind = 'session' | 'business' | 'kitchen'

const ROOM_EVENTS: Record<RoomKind, { join: string; leave: string }> = {
  session: { join: CLIENT_EVENTS.JOIN_SESSION, leave: CLIENT_EVENTS.LEAVE_SESSION },
  business: { join: CLIENT_EVENTS.JOIN_BUSINESS, leave: CLIENT_EVENTS.LEAVE_BUSINESS },
  kitchen: { join: CLIENT_EVENTS.JOIN_KITCHEN, leave: CLIENT_EVENTS.LEAVE_KITCHEN },
}

/** Ack shape returned by every join-* handler on the gateway. */
interface JoinAck {
  event: 'joined' | 'error'
  data?: string
}

interface RoomEntry {
  kind: RoomKind
  id: string
  count: number
  /** One per still-registered caller that asked to hear about a rejected join. */
  errorHandlers: Set<(message: string) => void>
}

interface RoomRegistry {
  rooms: Map<string, RoomEntry>
  connectHandlerBound: boolean
}

const registries = new WeakMap<Socket, RoomRegistry>()

function getRegistry(socket: Socket): RoomRegistry {
  let registry = registries.get(socket)
  if (!registry) {
    registry = { rooms: new Map(), connectHandlerBound: false }
    registries.set(socket, registry)
  }
  return registry
}

/**
 * Emits `join-*` for a room and fans the ack out to every caller currently
 * registered for it — a join can be rejected (stale/invalid token, revoked
 * permission) and, before this, that rejection reached no one: the client just sat
 * there believing it was subscribed while receiving nothing.
 */
function emitJoin(socket: Socket, room: RoomEntry): void {
  socket.emit(ROOM_EVENTS[room.kind].join, room.id, (ack?: JoinAck) => {
    if (ack?.event !== 'error') return
    for (const handler of room.errorHandlers) handler(ack.data ?? 'Unauthorized')
  })
}

/**
 * Registers interest in `<kind>:<id>` on `socket` and returns a release function.
 * The room is only actually joined (emits `join-*`) when the first caller registers
 * interest, re-joined on every reconnect for as long as anyone still wants it, and
 * only actually left (`leave-*`) once the last caller releases — so one hook
 * unmounting (or reacting to session-closed) never evicts a sibling hook that still
 * needs the same room. `onError` — if given — is invoked (on this and any later
 * reconnect attempt) whenever the server rejects the join.
 */
export function joinRoom(
  socket: Socket,
  kind: RoomKind,
  id: string,
  onError?: (message: string) => void,
): () => void {
  const registry = getRegistry(socket)
  const key = `${kind}:${id}`

  if (!registry.connectHandlerBound) {
    registry.connectHandlerBound = true
    socket.on('connect', () => {
      for (const room of registry.rooms.values()) emitJoin(socket, room)
    })
  }

  let entry = registry.rooms.get(key)
  if (!entry) {
    entry = { kind, id, count: 0, errorHandlers: new Set() }
    registry.rooms.set(key, entry)
  }
  entry.count += 1
  if (onError) entry.errorHandlers.add(onError)
  if (entry.count === 1 && socket.connected) emitJoin(socket, entry)

  let released = false
  return () => {
    if (released) return
    released = true
    const room = registry.rooms.get(key)
    if (!room) return
    if (onError) room.errorHandlers.delete(onError)
    room.count -= 1
    if (room.count <= 0) {
      registry.rooms.delete(key)
      socket.emit(ROOM_EVENTS[kind].leave, id)
    }
  }
}
