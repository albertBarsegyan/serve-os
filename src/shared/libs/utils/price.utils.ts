export function formatPrice(amount: number, currency = 'USD'): string {
  return Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}
