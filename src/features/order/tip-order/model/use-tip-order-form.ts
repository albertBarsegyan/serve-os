import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { submitCustomerTip, type TipResponse } from '#/features/order/tip-order/api/tip-order.api'
import {
  createTipFormSchema,
  maxTipForSubtotal,
  normalizeDecimalInput,
  TIP_PRESET_PERCENTAGES,
  type TipFormValues,
  type TipMode,
} from '#/features/order/tip-order/lib/schemas/tip-order.schema'
import { m } from '#/paraglide/messages'
import { showError, showSuccess } from '#/shared/libs/hooks/toast'

interface UseTipOrderFormOptions {
  sessionToken: string
  subtotal: number
  onSuccess: (result: TipResponse) => void
}

/**
 * Pure form/network logic for the guest tip flow — no JSX, so order-view.tsx (which owns
 * the customer theme) renders the actual markup and this stays free of a page-layer import.
 */
export function useTipOrderForm({ sessionToken, subtotal, onSuccess }: UseTipOrderFormOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const maxAmount = maxTipForSubtotal(subtotal)

  const { register, handleSubmit, watch, setValue, formState } = useForm<TipFormValues>({
    resolver: zodResolver(createTipFormSchema(maxAmount)),
    defaultValues: { mode: 'percentage', percentage: TIP_PRESET_PERCENTAGES[1], customAmount: '' },
  })

  const mode = watch('mode')
  const percentage = watch('percentage')

  function selectMode(next: TipMode, presetPercentage?: number) {
    setValue('mode', next)
    if (next === 'percentage' && presetPercentage !== undefined) {
      setValue('percentage', presetPercentage)
    }
  }

  async function onSubmit(values: TipFormValues) {
    setIsSubmitting(true)
    try {
      // Client generates the idempotency key; a resubmit after a network hiccup replays
      // safely instead of double-tipping.
      const idempotencyKey = crypto.randomUUID()

      const body =
        values.mode === 'percentage'
          ? { percentage: values.percentage, basis: 'SUBTOTAL' as const, idempotencyKey }
          : values.mode === 'custom'
            ? {
                // Server expects minor units (cents) — see CreateTipRequest.
                amount: Math.round(Number(normalizeDecimalInput(values.customAmount ?? '')) * 100),
                basis: 'SUBTOTAL' as const,
                idempotencyKey,
              }
            : { amount: 0, basis: 'SUBTOTAL' as const, idempotencyKey }

      const result = await submitCustomerTip(sessionToken, body)
      showSuccess(m.customer_tip_success())
      onSuccess(result)
    } catch (err) {
      showError(err instanceof Error ? err.message : m.customer_generic_error())
    } finally {
      setIsSubmitting(false)
    }
  }

  const presetAmounts = TIP_PRESET_PERCENTAGES.map((p) => ({
    percentage: p,
    amount: (subtotal * p) / 100,
  }))

  return {
    register,
    mode,
    percentage,
    selectMode,
    presetAmounts,
    isSubmitting,
    errors: formState.errors,
    submit: () => void handleSubmit(onSubmit)(),
  }
}
