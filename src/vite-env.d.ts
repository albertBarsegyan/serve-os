/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_GTM_ID?: string
}

declare global {
  interface Window {
    __serveosRelayout?: () => void
    dataLayer: Record<string, unknown>[]
  }
}
