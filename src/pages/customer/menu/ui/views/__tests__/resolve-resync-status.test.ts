import { describe, expect, it } from 'vitest'
import type { OrderStatusChangedPayload } from '#/shared/realtime/events'
import { resolveResyncStatus, shouldReconcileTip } from '../order-view'

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
    tipAmount: 0,
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

describe('shouldReconcileTip', () => {
  const t0 = '2026-01-01T00:00:00.000Z'
  const t1 = '2026-01-01T00:01:00.000Z'

  it('does not patch a never-asked tip on the very first resync (mount-time zero)', () => {
    // Regression: this exact case hid the tip picker permanently — the first
    // order:status-changed fires right after mount, before the guest touches anything,
    // and the backend always reports a real number (0) even when no tip was ever given.
    expect(shouldReconcileTip(undefined, undefined, { tipAmount: 0, updatedAt: t0 })).toBe(false)
  })

  it('reconciles a never-asked tip when the incoming payload reports a real tip', () => {
    // e.g. added from another device/tab, or by staff, before this device ever asked.
    expect(shouldReconcileTip(undefined, undefined, { tipAmount: 15, updatedAt: t0 })).toBe(true)
  })

  it('keeps syncing an already-recorded tip even when the incoming value is zero', () => {
    // Once a tip has been locally recorded (including an explicit 0), later resyncs must
    // still be allowed to keep it in sync — e.g. a refund zeroing it back out.
    expect(shouldReconcileTip(0, t0, { tipAmount: 0, updatedAt: t1 })).toBe(true)
  })

  it('rejects a stale payload older than what is already applied', () => {
    expect(shouldReconcileTip(20, t1, { tipAmount: 20, updatedAt: t0 })).toBe(false)
  })

  it('accepts a payload with no prior recorded updatedAt regardless of freshness', () => {
    expect(shouldReconcileTip(undefined, undefined, { tipAmount: 5, updatedAt: t0 })).toBe(true)
  })
})
