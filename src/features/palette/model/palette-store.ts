import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type PaletteStore = {
  palette: string
  setPalette: (palette: string) => void
}

function applyPalette(palette: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-palette', palette)
  }
}

export function initPalette() {
  if (typeof document === 'undefined') return
  try {
    const stored = localStorage.getItem('color-palette')
    const palette = (stored && JSON.parse(stored)?.state?.palette) || 'ocean'
    applyPalette(palette)
  } catch {
    applyPalette('ocean')
  }
}

export const usePaletteStore = create<PaletteStore>()(
  persist(
    (set) => ({
      palette: 'ocean',

      setPalette: (palette) => {
        applyPalette(palette)
        set({ palette })
      },
    }),
    {
      name: 'color-palette',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyPalette(state.palette)
        }
      },
    },
  ),
)
