const TWO_DECIMAL_PLACES = /^\d+(\.\d{1,2})?$/

/** Comma is a valid decimal separator in several locales this app ships (e.g. hy, lv). */
export function normalizeDecimalInput(raw: string): string {
  return raw.trim().replace(',', '.')
}

/** True for a non-negative amount with at most 2 decimal places, already comma-normalized. */
export function isValidTwoDecimalAmount(normalized: string): boolean {
  return TWO_DECIMAL_PLACES.test(normalized)
}
