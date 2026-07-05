import { useCallback, useRef } from 'react'

/** Long enough to cover a REST round trip + the server's socket broadcast of the same
 * change echoing back to the actor's own room membership; short enough that a genuinely
 * new event for the same order a few seconds later isn't mistaken for an echo. */
const SUPPRESSION_WINDOW_MS = 6000

/**
 * Tracks order IDs the current client just mutated via REST, so the realtime layer can
 * skip re-toasting/re-alerting the same actor for the broadcast echo of their own action
 * (the backend broadcasts lifecycle events to the whole room, including the sender).
 * Cache invalidation still runs either way — this only suppresses the toast/sound.
 */
export function useSelfMutationSuppression() {
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const markSelfMutated = useCallback((orderId: string) => {
    const existing = timersRef.current.get(orderId)
    if (existing) clearTimeout(existing)
    const timer = setTimeout(() => timersRef.current.delete(orderId), SUPPRESSION_WINDOW_MS)
    timersRef.current.set(orderId, timer)
  }, [])

  const isSelfMutated = useCallback((orderId: string) => timersRef.current.has(orderId), [])

  return { markSelfMutated, isSelfMutated }
}
