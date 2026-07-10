import { type RefObject, useEffect } from 'react'

const STEP_INTERVAL_MS = 9_000
const BOTTOM_PAUSE_MS = 3_500
const BOTTOM_TOLERANCE_PX = 2

/**
 * Auto-scrolls an unattended (kiosk/TV) scroll container so every child eventually
 * becomes visible: steps down by one viewport height on an interval, pauses at the
 * bottom, then smooth-scrolls back to the top and repeats. No-ops if the content
 * doesn't overflow. Restarts whenever `deps` changes, since that can change whether
 * the container overflows at all.
 */
export function useAutoCycleScroll(
  ref: RefObject<HTMLElement | null>,
  deps: readonly unknown[],
): void {
  useEffect(() => {
    const el = ref.current
    if (!el || el.scrollHeight <= el.clientHeight) return

    let timeoutId: ReturnType<typeof setTimeout>

    function step() {
      const node = ref.current
      if (!node) return

      const maxScroll = node.scrollHeight - node.clientHeight
      const atBottom = node.scrollTop >= maxScroll - BOTTOM_TOLERANCE_PX

      if (atBottom) {
        node.scrollTo({ top: 0, behavior: 'smooth' })
        timeoutId = setTimeout(step, STEP_INTERVAL_MS)
        return
      }

      const nextTop = Math.min(node.scrollTop + node.clientHeight, maxScroll)
      const reachesBottom = nextTop >= maxScroll - BOTTOM_TOLERANCE_PX
      node.scrollTo({ top: nextTop, behavior: 'smooth' })
      timeoutId = setTimeout(step, reachesBottom ? BOTTOM_PAUSE_MS : STEP_INTERVAL_MS)
    }

    timeoutId = setTimeout(step, STEP_INTERVAL_MS)

    return () => clearTimeout(timeoutId)
    // biome-ignore lint/correctness/useExhaustiveDependencies: <deps are correct array, rerender when reference changes>
  }, deps)
}
