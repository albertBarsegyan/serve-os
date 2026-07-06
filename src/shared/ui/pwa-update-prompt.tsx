import { useEffect } from 'react'
import { toast } from 'sonner'
import { m } from '#/paraglide/messages'

// Dynamic import keeps virtual:pwa-register out of the Nitro SSR bundle entirely.
// The import only executes inside useEffect, which is browser-only.
export function PwaUpdatePrompt() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    import('virtual:pwa-register').then(({ registerSW }) => {
      let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined

      updateSW = registerSW({
        onNeedRefresh() {
          toast(m.shared_pwa_update_title(), {
            description: m.shared_pwa_update_description(),
            duration: Number.POSITIVE_INFINITY,
            action: {
              label: m.shared_pwa_update_reload(),
              onClick: () => updateSW?.(true),
            },
          })
        },
        onOfflineReady() {
          toast.success(m.shared_pwa_offline_title(), {
            description: m.shared_pwa_offline_description(),
            duration: 4000,
          })
        },
        onRegisteredSW(_swUrl, registration) {
          if (!registration) return
          // Poll for updates every hour while the tab is open
          setInterval(() => registration.update(), 60 * 60 * 1000)
        },
      })
    })
  }, [])

  return null
}
