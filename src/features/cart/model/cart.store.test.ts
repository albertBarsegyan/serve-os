// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useCartStore } from './cart.store'

const baseItem = {
  productId: 'p1',
  productName: 'Burger',
  basePrice: 10,
  quantity: 1,
  notes: '',
  selectedModifiers: [],
}

describe('useCartStore', () => {
  beforeEach(() => {
    sessionStorage.clear()
    useCartStore.setState({ items: [], cartSessionId: null })
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('adds a new line for the first item', () => {
    useCartStore.getState().addItem(baseItem)
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0]?.quantity).toBe(1)
  })

  it('merges quantity into an existing line with the same product, notes, and modifiers', () => {
    useCartStore.getState().addItem(baseItem)
    useCartStore.getState().addItem({ ...baseItem, quantity: 2 })

    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0]?.quantity).toBe(3)
  })

  it('does not merge lines with different notes', () => {
    useCartStore.getState().addItem(baseItem)
    useCartStore.getState().addItem({ ...baseItem, notes: 'no onions' })

    expect(useCartStore.getState().items).toHaveLength(2)
  })

  it('does not merge lines with different modifier selections', () => {
    useCartStore.getState().addItem(baseItem)
    useCartStore.getState().addItem({
      ...baseItem,
      selectedModifiers: [
        {
          groupId: 'size',
          modifierId: 'large',
          name: 'Large',
          priceAdjustment: 2,
          priceType: 'adjustment',
        },
      ],
    })

    expect(useCartStore.getState().items).toHaveLength(2)
  })

  it('merges regardless of modifier selection order', () => {
    const modA = {
      groupId: 'toppings',
      modifierId: 'cheese',
      name: 'Cheese',
      priceAdjustment: 1,
      priceType: 'adjustment' as const,
    }
    const modB = {
      groupId: 'toppings',
      modifierId: 'bacon',
      name: 'Bacon',
      priceAdjustment: 2,
      priceType: 'adjustment' as const,
    }

    useCartStore.getState().addItem({ ...baseItem, selectedModifiers: [modA, modB] })
    useCartStore.getState().addItem({ ...baseItem, selectedModifiers: [modB, modA] })

    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0]?.quantity).toBe(2)
  })

  it('clears the cart when syncSession sees a different session id', () => {
    useCartStore.getState().syncSession('session-1')
    useCartStore.getState().addItem(baseItem)
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().cartSessionId).toBe('session-1')

    useCartStore.getState().syncSession('session-2')
    expect(useCartStore.getState().items).toHaveLength(0)
    expect(useCartStore.getState().cartSessionId).toBe('session-2')
  })

  it('keeps the cart when syncSession is called again with the same session id', () => {
    useCartStore.getState().syncSession('session-1')
    useCartStore.getState().addItem(baseItem)

    useCartStore.getState().syncSession('session-1')

    expect(useCartStore.getState().items).toHaveLength(1)
  })
})
