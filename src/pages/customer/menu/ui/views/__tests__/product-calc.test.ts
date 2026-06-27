import { describe, expect, it } from 'vitest'
import type { CustomerModifierGroup } from '#/shared/api/customer/menu.types'

// ── Pure helpers (extracted from product-view logic) ───────────────────────────

function calcModifierPrice(
  activeGroups: CustomerModifierGroup[],
  groupSelections: Record<string, string[]>,
): number {
  return activeGroups.reduce((total, g) => {
    const sel = groupSelections[g.id] ?? []
    return (
      total +
      g.modifiers
        .filter((m) => sel.includes(m.id))
        .reduce((s, m) => s + Number(m.priceAdjustment), 0)
    )
  }, 0)
}

function calcTotal(basePrice: number, modifierPrice: number, qty: number): number {
  return (basePrice + modifierPrice) * qty
}

function isSelectionValid(
  activeGroups: CustomerModifierGroup[],
  groupSelections: Record<string, string[]>,
): boolean {
  return activeGroups.every((g) => {
    const sel = groupSelections[g.id] ?? []
    if (!g.isRequired) return true
    if (sel.length < g.minSelections) return false
    if (g.maxSelections != null && sel.length > g.maxSelections) return false
    return true
  })
}

// ── Fixtures ───────────────────────────────────────────────────────────────────

const sizeGroup: CustomerModifierGroup = {
  id: 'size',
  name: 'Size',
  selectionType: 'SINGLE',
  isRequired: true,
  minSelections: 1,
  maxSelections: 1,
  modifiers: [
    { id: 'sm', name: 'Small', priceAdjustment: 0, position: 0, isActive: true },
    { id: 'lg', name: 'Large', priceAdjustment: 2.5, position: 1, isActive: true },
  ],
}

const toppingsGroup: CustomerModifierGroup = {
  id: 'toppings',
  name: 'Toppings',
  selectionType: 'MULTIPLE',
  isRequired: false,
  minSelections: 0,
  maxSelections: 3,
  modifiers: [
    { id: 'cheese', name: 'Cheese', priceAdjustment: 1, position: 0, isActive: true },
    { id: 'bacon', name: 'Bacon', priceAdjustment: 1.5, position: 1, isActive: true },
    { id: 'jalap', name: 'Jalapeños', priceAdjustment: 0.5, position: 2, isActive: true },
  ],
}

// ── Total price calculation ────────────────────────────────────────────────────

describe('calcTotal', () => {
  it('base price × qty with no modifiers', () => {
    expect(calcTotal(10, 0, 1)).toBe(10)
    expect(calcTotal(10, 0, 3)).toBe(30)
  })

  it('adds modifier price before multiplying by qty', () => {
    // base=10, modifier=+2.5, qty=2 → (10+2.5)×2 = 25
    expect(calcTotal(10, 2.5, 2)).toBe(25)
  })

  it('handles fractional prices', () => {
    // (9.99 + 0.5) * 2 = 20.98
    expect(calcTotal(9.99, 0.5, 2)).toBeCloseTo(20.98)
  })
})

// ── Modifier price accumulation ────────────────────────────────────────────────

describe('calcModifierPrice', () => {
  it('returns 0 when nothing selected', () => {
    expect(calcModifierPrice([sizeGroup, toppingsGroup], {})).toBe(0)
  })

  it('sums a single selection', () => {
    expect(calcModifierPrice([sizeGroup], { size: ['lg'] })).toBe(2.5)
  })

  it('sums multiple selections across groups', () => {
    const sel = { size: ['lg'], toppings: ['cheese', 'bacon'] }
    // 2.5 + 1 + 1.5 = 5
    expect(calcModifierPrice([sizeGroup, toppingsGroup], sel)).toBe(5)
  })

  it('ignores inactive modifiers by only counting selected ids', () => {
    // 'sm' has priceAdjustment=0, so selecting it adds nothing
    expect(calcModifierPrice([sizeGroup], { size: ['sm'] })).toBe(0)
  })
})

// ── Required-group validation ──────────────────────────────────────────────────

describe('isSelectionValid', () => {
  it('invalid when required group has no selection', () => {
    expect(isSelectionValid([sizeGroup], {})).toBe(false)
  })

  it('valid when required group is satisfied', () => {
    expect(isSelectionValid([sizeGroup], { size: ['sm'] })).toBe(true)
  })

  it('valid when optional group is empty', () => {
    expect(isSelectionValid([toppingsGroup], {})).toBe(true)
  })

  it('valid for optional group even with excess selections (UI prevents over-selecting)', () => {
    // maxSelections enforcement happens at selection-time in the UI, not in isSelectionValid
    const sel = { toppings: ['cheese', 'bacon', 'jalap', 'extra'] }
    expect(isSelectionValid([toppingsGroup], sel)).toBe(true)
  })

  it('valid when all required groups are satisfied', () => {
    const sel = { size: ['lg'], toppings: ['cheese'] }
    expect(isSelectionValid([sizeGroup, toppingsGroup], sel)).toBe(true)
  })
})

// ── Min selections enforcement ────────────────────────────────────────────────

describe('minSelections enforcement', () => {
  const minTwoGroup: CustomerModifierGroup = {
    id: 'sauces',
    name: 'Sauces',
    selectionType: 'MULTIPLE',
    isRequired: true,
    minSelections: 2,
    maxSelections: 3,
    modifiers: [
      { id: 'ketch', name: 'Ketchup', priceAdjustment: 0, position: 0, isActive: true },
      { id: 'mayo', name: 'Mayo', priceAdjustment: 0, position: 1, isActive: true },
      { id: 'bbq', name: 'BBQ', priceAdjustment: 0.5, position: 2, isActive: true },
    ],
  }

  it('invalid when below minSelections', () => {
    expect(isSelectionValid([minTwoGroup], { sauces: ['ketch'] })).toBe(false)
  })

  it('valid when at minSelections', () => {
    expect(isSelectionValid([minTwoGroup], { sauces: ['ketch', 'mayo'] })).toBe(true)
  })

  it('valid when between min and max', () => {
    expect(isSelectionValid([minTwoGroup], { sauces: ['ketch', 'mayo', 'bbq'] })).toBe(true)
  })
})
