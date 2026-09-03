import { Wifi, WifiOff } from 'lucide-react'
import { m } from '#/paraglide/messages'

/**
 * Small "Live"/"Reconnecting" indicator for pages that depend on the shared socket
 * for real-time updates (order boards, tables, staff) — without this, a disconnected
 * socket looks identical to a fully up-to-date page, since the underlying queries
 * simply stop being invalidated rather than erroring.
 */
export function RealtimeStatusIndicator({ isConnected }: { isConnected: boolean }) {
  return (
    <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
      {isConnected ? (
        <Wifi className='h-3.5 w-3.5 text-emerald-500' />
      ) : (
        <WifiOff className='h-3.5 w-3.5 text-amber-500' />
      )}
      <span>{isConnected ? m.shared_realtime_live() : m.shared_realtime_reconnecting()}</span>
    </div>
  )
}
