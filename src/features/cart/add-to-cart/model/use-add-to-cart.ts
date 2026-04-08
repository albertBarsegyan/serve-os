import { useState } from 'react'

interface CartItem {
  productId: string
  quantity: number
}

export function useAddToCart() {
  const [items, setItems] = useState<CartItem[]>([])

  function addToCart(productId: string) {
    setItems((previous) => {
      const existing = previous.find((item) => item.productId === productId)
      if (!existing) {
        return [...previous, { productId, quantity: 1 }]
      }

      return previous.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      )
    })
  }

  return {
    items,
    addToCart,
  }
}
