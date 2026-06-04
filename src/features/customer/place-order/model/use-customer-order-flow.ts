import { useMutation, useQueryClient } from '@tanstack/react-query'
import { menuQueryKeys } from '#/entities/product/api/query-options'
import { platformQueryKeys } from '#/features/platform/lib/constants/platform-query-keys'
import {
  createOrder,
  createPayment,
} from '#/shared/api/customer/customer-api'
import type { CreateOrderBody } from '#/shared/api/dto'

interface PlaceOrderInput {
  businessId: string
  sessionToken: string
  items: { productId: string; quantity: number }[]
  paymentMethod: 'cash' | 'pos' | 'online'
}

export function useCustomerOrderFlow() {
  const queryClient = useQueryClient()

  const placeOrder = useMutation({
    mutationFn: async ({
      businessId,
      sessionToken,
      items,
      paymentMethod,
    }: PlaceOrderInput) => {
      if (!sessionToken) {
        throw new Error('No active table session. Please rescan the QR code.')
      }

      const body: CreateOrderBody = {
        sessionToken,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      }

      const order = await createOrder(businessId, body)

      const method =
        paymentMethod === 'cash'
          ? ('CASH' as const)
          : paymentMethod === 'pos'
            ? ('POS' as const)
            : ('ONLINE' as const)

      await createPayment(businessId, {
        orderId: order.id,
        method,
        amount: order.total,
      })

      return order
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['session-scan', variables.businessId],
      })
      void queryClient.invalidateQueries({
        queryKey: menuQueryKeys.byBusiness(variables.businessId),
      })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.orders(),
      })
    },
  })

  return { placeOrder }
}
