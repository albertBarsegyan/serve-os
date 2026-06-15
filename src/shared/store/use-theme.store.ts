import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

function applyTheme(theme: Theme, animate = false) {
  const root = document.documentElement
  if (animate) {
    root.classList.add('theme-transition')
    window.setTimeout(() => root.classList.remove('theme-transition'), 300)
  }
  root.classList.remove('light', 'dark')
  root.classList.add(theme)
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = theme
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',

      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },

      toggle: () => {
        const next = get().theme === 'light' ? 'dark' : 'light'
        applyTheme(next, true)
        set({ theme: next })
      },
    }),
    {
      name: 'theme',
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          applyTheme(state.theme)
        }
      },
    },
  ),
)

export default useThemeStore
