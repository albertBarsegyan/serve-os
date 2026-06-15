/// <reference types="vite/client" />

// biome-ignore lint/correctness/noUnusedVariables: <vite inner usage>
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

declare global {
  interface Window {
    __serveosRelayout?: () => void
  }
}
