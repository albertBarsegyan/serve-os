import { useRef } from 'react'
import { getSessionStorageItem, setSessionStorageItem } from '#/shared/libs/utils/storage.utils'

/**
 * Tracks which orderIds this device placed during the current table session, so the
 * session-room notification handler can tell "my order" apart from a table-mate's —
 * multiple guests scanning the same table's QR share one session/socket room, so
 * without this every guest's phone alerts for every order placed at the table.
 * Persisted to sessionStorage (not just React state) so it survives a reload.
 */
export function useMyOrders(sessionId: string) {
  const key = `c-my-orders-${sessionId}`
  const idsRef = useRef<Set<string> | null>(null)
  const loadedKeyRef = useRef<string | null>(null)

  function load(): Set<string> {
    if (idsRef.current && loadedKeyRef.current === key) return idsRef.current
    const raw = getSessionStorageItem(key)
    let ids: string[] = []
    if (raw) {
      try {
        ids = JSON.parse(raw) as string[]
      } catch {
        ids = []
      }
    }
    idsRef.current = new Set(ids)
    loadedKeyRef.current = key
    return idsRef.current
  }

  function markMyOrder(orderId: string) {
    const ids = load()
    ids.add(orderId)
    setSessionStorageItem(key, JSON.stringify([...ids]))
  }

  function isMyOrder(orderId: string): boolean {
    return load().has(orderId)
  }

  return { markMyOrder, isMyOrder }
}
