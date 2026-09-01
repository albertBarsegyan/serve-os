import { describe, expect, it } from 'vitest'
import type { PricingModifier } from './pricing.utils'
import { cartSubtotal, lineTotal, modifiersUnitDelta, unitPrice } from './pricing.utils'

const adjustment = (groupId: string, priceAdjustment: number): PricingModifier => ({
  groupId,
  priceAdjustment,
  priceType: 'adjustment',
})

const fixed = (groupId: string, priceAdjustment: number): PricingModifier => ({
  groupId,
  priceAdjustment,
  priceType: 'fixed',
})

describe('modifiersUnitDelta', () => {
  it('is 0 with no modifiers', () => {
    expect(modifiersUnitDelta(10, [])).toBe(0)
  })

  it('sums adjustment modifiers across groups', () => {
    const modifiers = [adjustment('toppings', 2), adjustment('sauces', 1.5)]
    expect(modifiersUnitDelta(10, modifiers)).toBe(3.5)
  })

  it('treats a fixed modifier as a replacement, not an addition', () => {
    // Pizza $10 + Large fixed $13 → delta is +3, not +13
    expect(modifiersUnitDelta(10, [fixed('size', 13)])).toBe(3)
  })

  it('applies adjustment modifiers on top of a fixed replacement in the same group', () => {
    // Large fixed $13, but group also has an adjustment modifier selected: $13 + $2 = $15
    const modifiers = [fixed('size', 13), adjustment('size', 2)]
    expect(modifiersUnitDelta(10, modifiers)).toBe(5)
  })

  it('handles a negative-price modifier (discount-style)', () => {
    expect(modifiersUnitDelta(10, [adjustment('promo', -2)])).toBe(-2)
  })

  it('handles a zero-price modifier', () => {
    expect(modifiersUnitDelta(10, [adjustment('size', 0)])).toBe(0)
  })
})

describe('unitPrice', () => {
  it('equals basePrice with no modifiers', () => {
    expect(unitPrice(10, [])).toBe(10)
  })

  it('adds modifier deltas onto the base price', () => {
    const modifiers = [adjustment('toppings', 2), adjustment('toppings', 1.5)]
    expect(unitPrice(10, modifiers)).toBe(13.5)
  })

  it('replaces the base price for a fixed modifier', () => {
    expect(unitPrice(10, [fixed('size', 13)])).toBe(13)
  })

  it('never goes negative even if discounts exceed the base price', () => {
    expect(unitPrice(5, [adjustment('promo', -20)])).toBe(0)
  })

  it('avoids float drift across repeated adjustment modifiers', () => {
    // Naive `10 + 0.1 + 0.1 + 0.1` in JS floats is 10.299999999999999
    const modifiers = [adjustment('a', 0.1), adjustment('a', 0.1), adjustment('a', 0.1)]
    expect(unitPrice(10, modifiers)).toBe(10.3)
  })
})

describe('lineTotal', () => {
  it('is unit price with quantity 1 and no modifiers', () => {
    expect(lineTotal({ basePrice: 10, quantity: 1, selectedModifiers: [] })).toBe(10)
  })

  it('multiplies unit price by quantity', () => {
    expect(
      lineTotal({
        basePrice: 10,
        quantity: 2,
        selectedModifiers: [adjustment('toppings', 2.5)],
      }),
    ).toBe(25)
  })

  it('avoids float drift when quantity multiplication would naively drift', () => {
    // Naive `10.1 * 3` in JS floats is 30.299999999999997
    expect(lineTotal({ basePrice: 10.1, quantity: 3, selectedModifiers: [] })).toBe(30.3)
  })

  it('applies fixed-modifier replacement before multiplying by quantity', () => {
    expect(
      lineTotal({
        basePrice: 10,
        quantity: 2,
        selectedModifiers: [fixed('size', 13)],
      }),
    ).toBe(26)
  })
})

describe('cartSubtotal', () => {
  it('is 0 for an empty cart', () => {
    expect(cartSubtotal([])).toBe(0)
  })

  it('sums line totals across multiple cart lines', () => {
    const items = [
      { basePrice: 10, quantity: 1, selectedModifiers: [] },
      { basePrice: 5, quantity: 2, selectedModifiers: [adjustment('toppings', 1)] },
    ]
    // 10 + (5 + 1) * 2 = 22
    expect(cartSubtotal(items)).toBe(22)
  })

  it('avoids float drift across many lines with fractional prices', () => {
    const items = Array.from({ length: 3 }, () => ({
      basePrice: 10,
      quantity: 1,
      selectedModifiers: [adjustment('a', 0.1)],
    }))
    // Naive summation of 10.1 three times drifts to 30.299999999999997
    expect(cartSubtotal(items)).toBe(30.3)
  })
})
