import { useQuery } from '@tanstack/react-query'
import { CreditCard, ShoppingBag, TrendingUp, Users } from 'lucide-react'
import { useMemo } from 'react'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import {
  ordersQueryOptions,
  paymentsQueryOptions,
  staffQueryOptions,
} from '#/features/platform/lib/query-options.ts'
import { useActiveBusiness } from '#/shared/libs/hooks/use-active-business.ts'
import { StaffPermission } from '#/shared/libs/permissions/index.ts'
import { usePermissions } from '#/shared/libs/permissions/use-permissions.ts'
import { formatPrice } from '#/shared/libs/utils/price.utils'

function formatStatus(s: string) {
  return s
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function AdminDashboardPage() {
  const activeBusiness = useActiveBusiness()
  const businessId = activeBusiness?.id ?? ''
  const businessName = activeBusiness?.name
  const currency = activeBusiness?.currency ?? 'USD'

  const { isOwner, hasPermission } = usePermissions()
  const canViewPayments =
    isOwner() ||
    hasPermission(StaffPermission.PAYMENT_TAKE) ||
    hasPermission(StaffPermission.REPORTS_VIEW)
  const canViewStaff = isOwner() || hasPermission(StaffPermission.STAFF_MANAGE)

  const { data: orders = [], isPending: ordersLoading } = useQuery(ordersQueryOptions())
  const { data: payments = [], isPending: paymentsLoading } = useQuery({
    ...paymentsQueryOptions(),
    enabled: canViewPayments,
  })
  const { data: staff = [] } = useQuery({ ...staffQueryOptions(businessId), enabled: canViewStaff })

  const stats = useMemo(() => {
    const today = new Date().toDateString()

    const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today)

    const confirmedPayments = payments.filter((p) => p.status === 'CONFIRMED')
    const totalRevenue = confirmedPayments.reduce((sum, p) => sum + Number(p.amount), 0)

    const todayRevenue = confirmedPayments
      .filter((p) => new Date(p.createdAt).toDateString() === today)
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const pendingPayments = payments.filter((p) => p.status === 'PENDING')
    const pendingRevenue = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0)

    const activeOrders = orders.filter((o) =>
      ['CREATED', 'CONFIRMED', 'IN_KITCHEN', 'READY', 'DELIVERED'].includes(o.status),
    )

    return {
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      totalRevenue,
      todayRevenue,
      pendingRevenue,
      activeOrders: activeOrders.length,
      confirmedPayments: confirmedPayments.length,
    }
  }, [orders, payments])

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8),
    [orders],
  )

  const isLoading = ordersLoading || (canViewPayments && paymentsLoading)

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-extrabold'>
          Welcome back{businessName ? `, ${businessName}` : ''}
        </h1>
        <p className='text-muted-foreground'>Here's what's happening at your venue today.</p>
      </div>

      {/* Stats grid */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Today's Orders
            </CardTitle>
            <ShoppingBag className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-black'>{isLoading ? '—' : stats.todayOrders}</div>
            <p className='mt-1 text-xs text-muted-foreground'>{stats.totalOrders} total all-time</p>
          </CardContent>
        </Card>

        {canViewPayments && (
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                Today's Revenue
              </CardTitle>
              <TrendingUp className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-black'>
                {isLoading ? '—' : formatPrice(stats.todayRevenue, currency)}
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>
                {formatPrice(stats.totalRevenue, currency)} total confirmed
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Active Orders
            </CardTitle>
            <ShoppingBag className='h-4 w-4 text-amber-500' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-black'>{isLoading ? '—' : stats.activeOrders}</div>
            <p className='mt-1 text-xs text-muted-foreground'>in progress right now</p>
          </CardContent>
        </Card>

        {canViewPayments && (
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                Pending Payments
              </CardTitle>
              <CreditCard className='h-4 w-4 text-amber-500' />
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-black'>
                {isLoading ? '—' : formatPrice(stats.pendingRevenue, currency)}
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>awaiting confirmation</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className={canViewStaff ? 'grid grid-cols-1 gap-6 lg:grid-cols-3' : 'space-y-6'}>
        {/* Recent orders */}
        <Card className={canViewStaff ? 'lg:col-span-2' : ''}>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='text-base'>Recent Orders</CardTitle>
            <Badge variant='outline' className='text-xs'>
              {stats.totalOrders} total
            </Badge>
          </CardHeader>
          <CardContent className='p-0'>
            {isLoading ? (
              <div className='flex h-32 items-center justify-center text-sm text-muted-foreground'>
                Loading…
              </div>
            ) : recentOrders.length === 0 ? (
              <div className='flex h-32 items-center justify-center text-sm text-muted-foreground'>
                No orders yet.
              </div>
            ) : (
              <div className='divide-y divide-border'>
                {recentOrders.map((order) => (
                  <div key={order.id} className='flex items-center justify-between px-6 py-3'>
                    <div className='flex items-center gap-3'>
                      <span className='font-mono text-xs font-semibold text-muted-foreground'>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <div>
                        <p className='text-sm font-medium'>
                          {order.table
                            ? `Table ${order.table.number}`
                            : order.tableId
                              ? `Table #${order.tableId.slice(0, 6)}`
                              : order.type}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          {' · '}
                          {new Date(order.createdAt).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-3'>
                      <Badge
                        variant={
                          order.status === 'CLOSED'
                            ? 'success'
                            : order.status === 'READY' || order.status === 'DELIVERED'
                              ? 'info'
                              : order.status === 'IN_KITCHEN' || order.status === 'CONFIRMED'
                                ? 'warning'
                                : 'outline'
                        }
                        className='text-xs capitalize'
                      >
                        {formatStatus(order.status)}
                      </Badge>
                      <span className='font-mono text-sm font-semibold'>
                        {formatPrice(Number(order.totalAmount), currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Staff summary */}
        {canViewStaff && (
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle className='text-base'>Staff</CardTitle>
              <Users className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent className='space-y-3'>
              {staff.length === 0 ? (
                <p className='text-sm text-muted-foreground'>No staff yet.</p>
              ) : (
                staff.slice(0, 6).map((member) => (
                  <div key={member.id} className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium'>{member.displayName}</p>
                      <p className='text-xs text-muted-foreground'>{member.role}</p>
                    </div>
                    <Badge variant={member.isActive ? 'success' : 'outline'} className='text-xs'>
                      {member.isActive ? 'active' : 'inactive'}
                    </Badge>
                  </div>
                ))
              )}
              {staff.length > 6 && (
                <p className='text-xs text-muted-foreground'>+{staff.length - 6} more</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
