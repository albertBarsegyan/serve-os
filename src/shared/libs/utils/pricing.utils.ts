/**
 * Single source of truth for customer-order price math.
 *
 * Pure, side-effect-free, no React/store imports. All arithmetic happens in integer
 * minor units (cents) so float drift (0.1 + 0.2 !== 0.3) can never reach a total —
 * inputs are rounded to cents once on the way in, results are converted back to major
 * units (dollars) once on the way out.
 */

export type ModifierPriceType = 'fixed' | 'adjustment'

export interface PricingModifier {
  groupId: string
  priceAdjustment: number
  priceType: ModifierPriceType
}

export interface PricingLineItem {
  basePrice: number
  quantity: number
  selectedModifiers: readonly PricingModifier[]
}

function toMinorUnits(amount: number): number {
  return Math.round(amount * 100)
}

function toMajorUnits(minorUnits: number): number {
  return minorUnits / 100
}

/**
 * Net per-unit change a group of selected modifiers makes to `basePrice`.
 *
 * Within each modifier group: a "fixed" modifier replaces the running price for that
 * group instead of adding to it (e.g. Size: Large fixed $13 on a $10 product → $13);
 * "adjustment" modifiers always add on top (e.g. + Cheese $2). Groups are resolved in
 * the order their modifiers first appear in `modifiers`, matching how the product page
 * walks its modifier groups.
 */
export function modifiersUnitDelta(
  basePrice: number,
  modifiers: readonly PricingModifier[],
): number {
  const basePriceMinor = toMinorUnits(basePrice)

  const groupOrder: string[] = []
  const byGroup = new Map<string, PricingModifier[]>()
  for (const modifier of modifiers) {
    let group = byGroup.get(modifier.groupId)
    if (!group) {
      group = []
      byGroup.set(modifier.groupId, group)
      groupOrder.push(modifier.groupId)
    }
    group.push(modifier)
  }

  let priceMinor = basePriceMinor
  for (const groupId of groupOrder) {
    const groupModifiers = byGroup.get(groupId) ?? []
    const fixedModifier = groupModifiers.find((modifier) => modifier.priceType === 'fixed')
    if (fixedModifier) {
      priceMinor = toMinorUnits(fixedModifier.priceAdjustment)
    }
    for (const modifier of groupModifiers) {
      if (modifier.priceType === 'adjustment') {
        priceMinor += toMinorUnits(modifier.priceAdjustment)
      }
    }
  }

  return toMajorUnits(priceMinor - basePriceMinor)
}

/** Per-unit price after applying selected modifiers, never negative. */
export function unitPrice(basePrice: number, modifiers: readonly PricingModifier[]): number {
  const basePriceMinor = toMinorUnits(basePrice)
  const deltaMinor = toMinorUnits(modifiersUnitDelta(basePrice, modifiers))
  return toMajorUnits(Math.max(0, basePriceMinor + deltaMinor))
}

/** Line total for one cart line: unit price × quantity. */
export function lineTotal(item: PricingLineItem): number {
  const unitPriceMinor = toMinorUnits(unitPrice(item.basePrice, item.selectedModifiers))
  return toMajorUnits(unitPriceMinor * item.quantity)
}

/** Sum of line totals across the whole cart. */
export function cartSubtotal(items: readonly PricingLineItem[]): number {
  const totalMinor = items.reduce((sum, item) => sum + toMinorUnits(lineTotal(item)), 0)
  return toMajorUnits(totalMinor)
}

export { formatPrice } from './price.utils'
