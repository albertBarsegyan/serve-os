import { create } from 'zustand'

export interface CartModifier {
  groupId: string
  modifierId: string
  name: string
  priceAdjustment: number
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
  return item.basePrice + item.selectedModifiers.reduce((s, m) => s + Number(m.priceAdjustment), 0)
}

export function cartItemTotal(item: CartItem): number {
  return cartItemUnitPrice(item) * item.quantity
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()((set) => ({
  items: [],

  addItem: (item) =>
    set((state) => ({
      items: [...state.items, { ...item, id: crypto.randomUUID() }],
    })),

  updateQuantity: (id, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.id !== id)
          : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    })),

  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  clearCart: () => set({ items: [] }),
}))
