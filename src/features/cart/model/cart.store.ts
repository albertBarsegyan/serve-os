import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { lineTotal, unitPrice } from '#/shared/libs/utils/pricing.utils'

export interface CartModifier {
  groupId: string
  modifierId: string
  name: string
  priceAdjustment: number
  priceType: 'fixed' | 'adjustment'
}

export interface CartItem {
  id: string
  productId: string
  productName: string
  basePrice: number
  quantity: number
  notes: string
  selectedModifiers: CartModifier[]
}

export function cartItemUnitPrice(item: CartItem): number {
  return unitPrice(item.basePrice, item.selectedModifiers)
}

export function cartItemTotal(item: CartItem): number {
  return lineTotal(item)
}

function modifiersKey(modifiers: CartModifier[]): string {
  return modifiers
    .map((m) => m.modifierId)
    .sort()
    .join(',')
}

// Two cart entries are "the same line" if they'd produce an identical kitchen ticket
// line — same product, same modifier selection, same note.
function sameLine(a: Omit<CartItem, 'id'>, b: CartItem): boolean {
  return (
    a.productId === b.productId &&
    a.notes === b.notes &&
    modifiersKey(a.selectedModifiers) === modifiersKey(b.selectedModifiers)
  )
}

interface CartState {
  items: CartItem[]
  cartSessionId: string | null
  addItem: (item: Omit<CartItem, 'id'>) => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  // Clears the cart when the guest's table session changes (a different session than
  // the one the persisted cart belongs to) — called once the current session is known,
  // so a reload/back-navigation/language-switch within the same session keeps the cart,
  // but scanning into a genuinely different session doesn't inherit stale items.
  syncSession: (sessionId: string) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      cartSessionId: null,

      addItem: (item) =>
        set((state) => {
          const existingIndex = state.items.findIndex((i) => sameLine(item, i))
          if (existingIndex === -1) {
            return { items: [...state.items, { ...item, id: crypto.randomUUID() }] }
          }
          return {
            items: state.items.map((i, index) =>
              index === existingIndex ? { ...i, quantity: i.quantity + item.quantity } : i,
            ),
          }
        }),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),

      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      clearCart: () => set({ items: [] }),

      syncSession: (sessionId) => {
        if (get().cartSessionId !== sessionId) {
          set({ items: [], cartSessionId: sessionId })
        }
      },
    }),
    {
      name: 'c-cart',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ items: state.items, cartSessionId: state.cartSessionId }),
    },
  ),
)
