import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ActiveBusiness {
  id: string
  name: string
  currency: string
}

export interface ActiveBusinessState {
  active: ActiveBusiness | null
  setActive: (business: ActiveBusiness | null) => void
  clear: () => void
}

const useActiveBusinessStore = create<ActiveBusinessState>()(
  persist(
    (set) => ({
      active: null,

      setActive: (business) =>
        set({
          active: business,
        }),

      clear: () =>
        set({
          active: null,
        }),
    }),
    {
      name: 'active-business',
    },
  ),
)

export default useActiveBusinessStore

