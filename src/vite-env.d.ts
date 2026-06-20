/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

declare global {
  interface Window {
    __serveosRelayout?: () => void
  }
}
