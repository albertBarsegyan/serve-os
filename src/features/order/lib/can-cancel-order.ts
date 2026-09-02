import type { OrderStatus } from '#/features/platform/api/platform.types'
import { StaffRole } from '#/shared/libs/permissions'

const TERMINAL_STATUSES: OrderStatus[] = ['CLOSED', 'CANCELLED', 'REFUNDED']
const WAITER_CANCELLABLE_STATUSES: OrderStatus[] = ['CREATED', 'CONFIRMED']

/**
 * Mirrors the backend's cancel-permission rule exactly (assertCancelActor /
 * assertCancellationPermission in order-transition.service.ts) so a cancel button
 * is never shown for a role/status combination the backend will reject.
 */
export function canCancelOrder(
  status: OrderStatus,
  actor: { isOwner: boolean; staffRole: StaffRole | null },
): boolean {
  if (TERMINAL_STATUSES.includes(status)) return false
  if (actor.isOwner || actor.staffRole === StaffRole.MANAGER) return true
  if (actor.staffRole === StaffRole.WAITER) return WAITER_CANCELLABLE_STATUSES.includes(status)
  return false
}
