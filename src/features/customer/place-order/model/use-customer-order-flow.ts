import { useMutation, useQueryClient } from '@tanstack/react-query'
import { menuQueryKeys } from '#/entities/product/api/query-options'
import { orderQueryKeys } from '#/entities/order/api/query-options'
import {
	createOrder,
	createPayment,
} from '#/shared/api/customer/customer-api'
import type { CreateOrderBody } from '#/shared/api/dto'

interface PlaceOrderInput {
	businessId: string
	tableId: string
	sessionToken?: string
	items: { productId: string; quantity: number }[]
	paymentMethod: 'cash' | 'pos' | 'online'
}

export function useCustomerOrderFlow() {
	const queryClient = useQueryClient()

	const placeOrder = useMutation({
		mutationFn: async ({
			businessId,
			tableId,
			sessionToken,
			items,
			paymentMethod,
		}: PlaceOrderInput) => {
			const body: CreateOrderBody = {
				tableId,
				...(sessionToken ? { sessionToken } : {}),
				items: items.map((i) => ({
					productId: i.productId,
					quantity: i.quantity,
				})),
			}
			const order = await createOrder(businessId, body)
			const method =
				paymentMethod === 'cash'
					? ('CASH' as const)
					: paymentMethod === 'pos'
						? ('POS' as const)
						: ('ONLINE' as const)
			await createPayment(businessId, { orderId: order.id, method })
			return order
		},
		onSuccess: (_data, variables) => {
			void queryClient.invalidateQueries({
				queryKey: orderQueryKeys.business(variables.businessId),
			})
			void queryClient.invalidateQueries({
				queryKey: orderQueryKeys.kitchen(variables.businessId),
			})
			void queryClient.invalidateQueries({
				queryKey: menuQueryKeys.byBusiness(variables.businessId),
			})
		},
	})

	return { placeOrder }
}
