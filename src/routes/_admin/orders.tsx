import { createFileRoute, redirect } from '@tanstack/react-router'
import type { OrderStatus } from '#/features/platform/api/platform.types.ts'
import { ALL_STATUSES } from '#/pages/admin/orders/ui/admin-orders-content'
import { AdminOrdersPage } from '#/pages/admin/orders/ui/admin-orders-page'
import { StaffPermission } from '#/shared/libs/permissions/index.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export type AdminOrdersSearch = {
  status: OrderStatus | 'all'
  q: string
  page: number
  limit: 10 | 20 | 50
}

export const Route = createFileRoute('/_admin/orders')({
  validateSearch: (raw: Record<string, unknown>): AdminOrdersSearch => {
    const status =
      typeof raw.status === 'string' && ALL_STATUSES.includes(raw.status as OrderStatus)
        ? (raw.status as OrderStatus)
        : 'all'
    const page = Number(raw.page)
    const limit = Number(raw.limit)
    return {
      status,
      q: typeof raw.q === 'string' ? raw.q : '',
      page: Number.isInteger(page) && page > 0 ? page : 1,
      limit: limit === 10 || limit === 50 ? limit : 20,
    }
  },
  component: AdminOrdersPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
  beforeLoad: ({ context }) => {
    const user = context.authUser
    if (user?.type === 'staff' && !user.permissions.includes(StaffPermission.ORDER_VIEW)) {
      throw redirect({ to: '/kitchen' })
    }
  },
})
