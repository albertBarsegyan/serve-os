import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, CreditCard, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader } from '#/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import type { PaymentMethod, PaymentStatus } from '#/features/platform/api/platform.types.ts'
import { pagedPaymentsQueryOptions } from '#/features/platform/lib/query-options.ts'
import { useConfirmPaymentMutation } from '#/features/platform/model/platform-hooks.ts'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { useActiveBusiness } from '#/shared/libs/hooks/use-active-business.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import { type PageLimit, PaginationControls } from '#/shared/ui/pagination-controls'

function statusBadgeVariant(status: PaymentStatus): 'success' | 'warning' | 'outline' {
  if (status === 'CONFIRMED') return 'success'
  if (status === 'PENDING') return 'warning'
  return 'outline'
}

function methodLabel(method: PaymentMethod): string {
  if (method === 'CASH') return m.admin_payments_method_cash()
  if (method === 'POS') return m.admin_payments_method_card_pos()
  return m.admin_payments_method_online()
}

const ALL_STATUSES: (PaymentStatus | 'all')[] = ['all', 'PENDING', 'CONFIRMED', 'FAILED']

export function AdminPaymentsContent() {
  const [activeFilter, setActiveFilter] = useState<PaymentStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<PageLimit>(20)
  const activeBusiness = useActiveBusiness()
  const currency = activeBusiness?.currency ?? 'USD'
  const businessId = activeBusiness?.id ?? ''

  const {
    data: pagedPayments,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(pagedPaymentsQueryOptions(businessId, page, limit))

  const confirmMutation = useConfirmPaymentMutation()

  const payments = pagedPayments?.data ?? []

  const filteredPayments = useMemo(() => {
    const byStatus =
      activeFilter === 'all' ? payments : payments.filter((p) => p.status === activeFilter)

    const needle = search.trim().toLowerCase()
    if (!needle) return byStatus

    return byStatus.filter((p) =>
      [p.id, p.orderId, p.method, p.status].join(' ').toLowerCase().includes(needle),
    )
  }, [payments, activeFilter, search])

  const handleConfirm = async (paymentId: string) => {
    try {
      await confirmMutation.mutateAsync({ paymentId, data: {} })
      showSuccess(m.admin_payments_payment_confirmed())
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  const handleFilterChange = (status: PaymentStatus | 'all') => {
    setActiveFilter(status)
    setPage(1)
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>{m.admin_payments_title()}</h1>
          <p className='text-muted-foreground'>{m.admin_payments_subtitle()}</p>
        </div>
        <div className='flex items-center gap-2'>
          <Badge variant='outline' className='h-8 rounded-full bg-muted px-4 text-xs font-semibold'>
            <CreditCard className='mr-1.5 h-3.5 w-3.5' />
            {m.admin_payments_pending_this_page({
              count: payments.filter((p) => p.status === 'PENDING').length,
            })}
          </Badge>
        </div>
      </div>

      {isError && (
        <div className='rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive'>
          {getResponseErrorMessage(error)}
          <button
            type='button'
            className='ml-2 font-semibold underline'
            onClick={() => void refetch()}
          >
            {m.admin_payments_retry()}
          </button>
        </div>
      )}

      <Card>
        <CardHeader className='border-b border-border'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0'>
              {ALL_STATUSES.map((status) => (
                <button
                  key={status}
                  type='button'
                  onClick={() => handleFilterChange(status)}
                  className={cn(
                    'uppercase whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                    activeFilter === status
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {status === 'all'
                    ? m.admin_payments_status_all()
                    : status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <input
                type='text'
                placeholder={m.admin_payments_search_placeholder()}
                className='h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-64'
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='pl-8'>{m.admin_payments_col_payment_id()}</TableHead>
                <TableHead>{m.admin_payments_col_order()}</TableHead>
                <TableHead>{m.admin_payments_col_method()}</TableHead>
                <TableHead>{m.admin_payments_col_amount()}</TableHead>
                <TableHead>{m.admin_payments_col_status()}</TableHead>
                <TableHead>{m.admin_payments_col_date()}</TableHead>
                <TableHead className='pr-8 text-right'>{m.admin_payments_col_actions()}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending && (
                <TableRow>
                  <TableCell colSpan={7} className='h-32 text-center text-muted-foreground'>
                    {m.admin_payments_loading()}
                  </TableCell>
                </TableRow>
              )}

              {!isPending && filteredPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className='h-32 text-center text-muted-foreground'>
                    {m.admin_payments_no_payments()}
                  </TableCell>
                </TableRow>
              )}

              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className='pl-8 font-mono text-xs font-semibold'>
                    #{payment.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell className='font-mono text-xs text-muted-foreground'>
                    #{payment.orderId.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>{methodLabel(payment.method)}</TableCell>
                  <TableCell className='font-mono font-semibold'>
                    {formatPrice(Number(payment.amount), currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(payment.status)} className='capitalize'>
                      {payment.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {new Date(payment.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>

                  <TableCell className='pr-8 text-right'>
                    {payment.status === 'PENDING' && (
                      <Button
                        size='sm'
                        variant='secondary'
                        className='rounded-full text-primary-foreground'
                        disabled={confirmMutation.isPending}
                        onClick={() => void handleConfirm(payment.id)}
                      >
                        <CheckCircle2 className='mr-1.5 h-4 w-4' /> {m.admin_payments_confirm()}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pagedPayments && pagedPayments.total > 0 && (
            <PaginationControls
              page={page}
              limit={limit}
              total={pagedPayments.total}
              totalPages={pagedPayments.totalPages}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l)
                setPage(1)
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
