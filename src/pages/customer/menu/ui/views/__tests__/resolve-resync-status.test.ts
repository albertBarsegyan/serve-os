import { describe, expect, it } from 'vitest'
import type { OrderStatusChangedPayload } from '#/shared/realtime/events'
import { resolveResyncStatus } from '../order-view'

function basePayload(overrides: Partial<OrderStatusChangedPayload>): OrderStatusChangedPayload {
  return {
    orderId: 'order-1',
    status: 'DELIVERED',
    customerStatus: 'served',
    paymentStatus: 'UNPAID',
    previousStatus: null,
    tableId: 'table-1',
    tableName: '4',
    sessionToken: 'session-1',
    updatedAt: new Date().toISOString(),
    actor: { type: 'system', id: 'system' },
    ...overrides,
  }
}

describe('resolveResyncStatus', () => {
  it('resolves a served-but-unpaid DELIVERED order to "served"', () => {
    expect(resolveResyncStatus(basePayload({ status: 'DELIVERED', paymentStatus: 'UNPAID' }))).toBe(
      'served',
    )
  })

  it('resolves a DELIVERED order with a pending payment to "payment"', () => {
    expect(
      resolveResyncStatus(basePayload({ status: 'DELIVERED', paymentStatus: 'PENDING' })),
    ).toBe('payment')
  })

  it('resolves a DELIVERED order with a partial payment to "payment"', () => {
    expect(
      resolveResyncStatus(basePayload({ status: 'DELIVERED', paymentStatus: 'PARTIALLY_PAID' })),
    ).toBe('payment')
  })

  it('resolves a DELIVERED order that is already fully PAID to "paid"', () => {
    expect(resolveResyncStatus(basePayload({ status: 'DELIVERED', paymentStatus: 'PAID' }))).toBe(
      'paid',
    )
  })

  it('resolves a CLOSED order to "paid" (all done) regardless of paymentStatus wording', () => {
    expect(resolveResyncStatus(basePayload({ status: 'CLOSED', paymentStatus: 'PAID' }))).toBe(
      'paid',
    )
  })

  it('passes through non-ambiguous in-flow statuses unchanged', () => {
    expect(
      resolveResyncStatus(basePayload({ status: 'IN_KITCHEN', customerStatus: 'preparing' })),
    ).toBe('preparing')
    expect(resolveResyncStatus(basePayload({ status: 'READY', customerStatus: 'ready' }))).toBe(
      'ready',
    )
    expect(
      resolveResyncStatus(basePayload({ status: 'CONFIRMED', customerStatus: 'confirmed' })),
    ).toBe('confirmed')
  })

  it('passes through terminal statuses unchanged', () => {
    expect(
      resolveResyncStatus(basePayload({ status: 'CANCELLED', customerStatus: 'cancelled' })),
    ).toBe('cancelled')
    expect(
      resolveResyncStatus(
        basePayload({ status: 'PAYMENT_FAILED', customerStatus: 'payment_failed' }),
      ),
    ).toBe('payment_failed')
    expect(
      resolveResyncStatus(basePayload({ status: 'REFUNDED', customerStatus: 'refunded' })),
    ).toBe('refunded')
  })

  it('returns null for an unrecognized customerStatus rather than crashing the UI', () => {
    expect(resolveResyncStatus(basePayload({ customerStatus: 'made-up' }))).toBeNull()
  })
})
