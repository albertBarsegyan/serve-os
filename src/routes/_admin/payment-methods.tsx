import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminPaymentMethodsPage } from '#/pages/admin/payment-methods/ui/admin-payment-methods-page'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_admin/payment-methods')({
  component: AdminPaymentMethodsPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
  beforeLoad: ({ context }) => {
    const user = context.authUser
    if (user?.type === 'staff') {
      throw redirect({ to: '/dashboard' })
    }
  },
})
