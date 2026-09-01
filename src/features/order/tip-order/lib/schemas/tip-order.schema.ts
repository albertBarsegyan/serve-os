import { z } from 'zod'
import { m } from '#/paraglide/messages'
import {
  isValidTwoDecimalAmount,
  normalizeDecimalInput,
} from '#/shared/libs/utils/decimal-input.utils'

export const TIP_PRESET_PERCENTAGES = [15, 18, 20] as const

// Mirrors serve-os-backend/src/common/constants/tip.constants.ts —
// GUEST_TIP_ABSOLUTE_MAX_MINOR_UNITS (100_000 cents) and GUEST_TIP_SUBTOTAL_MULTIPLIER_CAP (2).
// Keep these numerically identical to the backend; there's no way to share the literal
// constant across the two repos, so this comment is the cross-reference.
export const TIP_ABSOLUTE_MAX_MAJOR_UNITS = 1000
export const TIP_SUBTOTAL_MULTIPLIER_CAP = 2

export type TipMode = 'percentage' | 'custom' | 'none'

export { normalizeDecimalInput }

export function maxTipForSubtotal(subtotal: number): number {
  return Math.min(TIP_ABSOLUTE_MAX_MAJOR_UNITS, subtotal * TIP_SUBTOTAL_MULTIPLIER_CAP)
}

export function createTipFormSchema(maxAmountMajorUnits: number) {
  return z
    .object({
      mode: z.enum(['percentage', 'custom', 'none']),
      percentage: z.number().min(0).max(100).optional(),
      customAmount: z.string().optional(),
    })
    .refine((data) => data.mode !== 'percentage' || data.percentage !== undefined, {
      error: () => m.customer_tip_select_percentage_error(),
      path: ['percentage'],
    })
    .refine(
      (data) => {
        if (data.mode !== 'custom') return true
        const normalized = normalizeDecimalInput(data.customAmount ?? '')
        return isValidTwoDecimalAmount(normalized)
      },
      { error: () => m.customer_tip_invalid_amount_error(), path: ['customAmount'] },
    )
    .refine(
      (data) => {
        if (data.mode !== 'custom') return true
        const normalized = normalizeDecimalInput(data.customAmount ?? '')
        if (!isValidTwoDecimalAmount(normalized)) return true // reported by the previous check
        const value = Number(normalized)
        return value >= 0 && value <= maxAmountMajorUnits
      },
      { error: () => m.customer_tip_amount_out_of_range_error(), path: ['customAmount'] },
    )
}

export type TipFormValues = z.infer<ReturnType<typeof createTipFormSchema>>
