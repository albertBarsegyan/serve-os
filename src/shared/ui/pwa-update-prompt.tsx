import { useEffect } from 'react'
import { toast } from 'sonner'

// Dynamic import keeps virtual:pwa-register out of the Nitro SSR bundle entirely.
// The import only executes inside useEffect, which is browser-only.
export function PwaUpdatePrompt() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    import('virtual:pwa-register').then(({ registerSW }) => {
      let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined

      updateSW = registerSW({
        onNeedRefresh() {
          toast('Update available', {
            description: 'A new version of ServeOS is ready.',
            duration: Number.POSITIVE_INFINITY,
            action: {
              label: 'Reload',
              onClick: () => updateSW?.(true),
            },
          })
        },
        onOfflineReady() {
          toast.success('Ready to work offline', {
            description: 'App is cached and available offline.',
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
