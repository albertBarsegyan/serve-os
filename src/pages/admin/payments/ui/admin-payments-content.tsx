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
import { paymentsQueryOptions } from '#/features/platform/lib/query-options.ts'
import { useConfirmPaymentMutation } from '#/features/platform/model/platform-hooks.ts'
import { cn } from '#/lib/utils'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { formatPrice } from '#/shared/libs/utils/price.utils'
import useActiveBusinessStore from '#/shared/store/use-active-business.store'

function statusBadgeVariant(status: PaymentStatus): 'success' | 'warning' | 'outline' {
  if (status === 'CONFIRMED') return 'success'
  if (status === 'PENDING') return 'warning'
  return 'outline'
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  POS: 'Card (POS)',
  ONLINE: 'Online',
}

const ALL_STATUSES: (PaymentStatus | 'all')[] = ['all', 'PENDING', 'CONFIRMED', 'FAILED']

export function AdminPaymentsContent() {
  const [activeFilter, setActiveFilter] = useState<PaymentStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const currency = useActiveBusinessStore((s) => s.active?.currency ?? 'USD')

  const {
    data: payments = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(paymentsQueryOptions())

  const confirmMutation = useConfirmPaymentMutation()

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
      showSuccess('Payment confirmed')
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Payments</h1>
          <p className='text-muted-foreground'>Review and confirm payments across all orders.</p>
        </div>
        <div className='flex items-center gap-2'>
          <Badge variant='outline' className='h-8 rounded-full bg-muted px-4 text-xs font-semibold'>
            <CreditCard className='mr-1.5 h-3.5 w-3.5' />
            {payments.filter((p) => p.status === 'PENDING').length} pending
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
            Retry
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
                  onClick={() => setActiveFilter(status)}
                  className={cn(
                    'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                    activeFilter === status
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <input
                type='text'
                placeholder='Search payments…'
                className='h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-64'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='pl-8'>Payment ID</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className='pr-8 text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending && (
                <TableRow>
                  <TableCell colSpan={7} className='h-32 text-center text-muted-foreground'>
                    Loading payments…
                  </TableCell>
                </TableRow>
              )}

              {!isPending && filteredPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className='h-32 text-center text-muted-foreground'>
                    No payments found.
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
                  <TableCell>{METHOD_LABELS[payment.method]}</TableCell>
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
                        <CheckCircle2 className='mr-1.5 h-4 w-4' /> Confirm
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
