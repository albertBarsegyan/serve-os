import { create } from 'zustand'
import type { StateStorage } from 'zustand/middleware'
import { createJSONStorage, persist } from 'zustand/middleware'
import { getCookieValue } from '#/shared/libs/utils/cookie.utils.ts'

export interface ActiveBusiness {
  id: string
  name: string
  currency: string
  slug: string
}

export interface ActiveBusinessState {
  active: ActiveBusiness | null
  setActive: (business: ActiveBusiness | null) => void
  clear: () => void
}

const COOKIE_NAME = 'active-business'
const MAX_AGE = 365 * 24 * 60 * 60

const cookieStorage: StateStorage = {
  getItem(name) {
    if (typeof document === 'undefined') return null
    const raw = getCookieValue({ cookieName: name, cookieData: document.cookie })
    return raw ? decodeURIComponent(raw) : null
  },
  setItem(name, value) {
    if (typeof document === 'undefined') return
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${MAX_AGE}; samesite=lax`
  },
  removeItem(name) {
    if (typeof document === 'undefined') return
    document.cookie = `${name}=; path=/; max-age=0`
  },
}

const useActiveBusinessStore = create<ActiveBusinessState>()(
  persist(
    (set) => ({
      active: null,
      setActive: (business) => set({ active: business }),
      clear: () => set({ active: null }),
    }),
    {
      name: COOKIE_NAME,
      storage: createJSONStorage(() => cookieStorage),
      partialize: (s) => ({ active: s.active }),
      skipHydration: true,
    },
  ),
)

export default useActiveBusinessStore
