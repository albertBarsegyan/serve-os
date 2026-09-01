import { clientApiInstance } from '#/shared/api/client-instance'

// Matches CreateTipDto in serve-os-backend/src/modules/table-sessions/dto/create-tip.dto.ts
export interface CreateTipRequest {
  amount?: number
  percentage?: number
  basis: 'SUBTOTAL'
  idempotencyKey: string
}

// Matches TipResponseDto in the same file — tipAmount is the order's authoritative total
// confirmed tip (major currency units), not just this write.
export interface TipResponse {
  orderId: string
  tipAmount: number
  paymentId: string
}

export function submitCustomerTip(
  sessionToken: string,
  body: CreateTipRequest,
): Promise<TipResponse> {
  return clientApiInstance.post(`sessions/${sessionToken}/tip`, { json: body }).json<TipResponse>()
}
