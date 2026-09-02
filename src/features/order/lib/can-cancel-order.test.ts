import { describe, expect, it } from 'vitest'
import { StaffRole } from '#/shared/libs/permissions'
import { canCancelOrder } from './can-cancel-order'

describe('canCancelOrder', () => {
  it('lets owner cancel any non-terminal status', () => {
    for (const status of ['CREATED', 'CONFIRMED', 'IN_KITCHEN', 'READY', 'DELIVERED'] as const) {
      expect(canCancelOrder(status, { isOwner: true, staffRole: null })).toBe(true)
    }
  })

  it('lets MANAGER cancel any non-terminal status', () => {
    for (const status of ['CREATED', 'CONFIRMED', 'IN_KITCHEN', 'READY', 'DELIVERED'] as const) {
      expect(canCancelOrder(status, { isOwner: false, staffRole: StaffRole.MANAGER })).toBe(true)
    }
  })

  it('lets WAITER cancel only from CREATED or CONFIRMED', () => {
    expect(canCancelOrder('CREATED', { isOwner: false, staffRole: StaffRole.WAITER })).toBe(true)
    expect(canCancelOrder('CONFIRMED', { isOwner: false, staffRole: StaffRole.WAITER })).toBe(true)
    for (const status of ['IN_KITCHEN', 'READY', 'DELIVERED'] as const) {
      expect(canCancelOrder(status, { isOwner: false, staffRole: StaffRole.WAITER })).toBe(false)
    }
  })

  it('never lets CASHIER or KITCHEN cancel', () => {
    for (const role of [StaffRole.CASHIER, StaffRole.KITCHEN]) {
      for (const status of ['CREATED', 'CONFIRMED', 'IN_KITCHEN'] as const) {
        expect(canCancelOrder(status, { isOwner: false, staffRole: role })).toBe(false)
      }
    }
  })

  it('never lets anyone cancel a terminal order, including owner/manager', () => {
    for (const status of ['CLOSED', 'CANCELLED', 'REFUNDED'] as const) {
      expect(canCancelOrder(status, { isOwner: true, staffRole: null })).toBe(false)
      expect(canCancelOrder(status, { isOwner: false, staffRole: StaffRole.MANAGER })).toBe(false)
    }
  })
})
