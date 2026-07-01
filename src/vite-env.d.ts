/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_GTM_ID?: string
  readonly VITE_SITE_URL?: string
}

declare global {
  interface Window {
    __serveosRelayout?: () => void
    dataLayer: Record<string, unknown>[]
  }
}
