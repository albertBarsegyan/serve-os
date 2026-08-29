import { getLocale } from '#/paraglide/runtime'

const BCP47_BY_LOCALE: Record<string, string> = {
  en: 'en-US',
  hy: 'hy-AM',
  lv: 'lv-LV',
}

export function formatPrice(amount: number, currency = 'USD'): string {
  return Intl.NumberFormat(BCP47_BY_LOCALE[getLocale()] ?? 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}
