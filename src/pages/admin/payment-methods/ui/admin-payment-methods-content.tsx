import { zodResolver } from '@hookform/resolvers/zod'
import { Banknote, CreditCard, Globe, KeyRound, Save, Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Checkbox } from '#/components/ui/checkbox'
import type {
  BusinessPaymentMethodResponse,
  OnlinePaymentConfig,
  PaymentMethodType,
} from '#/features/business/api/business.types'
import {
  useDeletePaymentMethodMutation,
  usePaymentMethodsQuery,
  useUpsertPaymentMethodMutation,
} from '#/features/business/model/business-hooks'
import { m } from '#/paraglide/messages'
import { showError, showSuccess } from '#/shared/libs/hooks/toast'
import { useActiveBusiness } from '#/shared/libs/hooks/use-active-business.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils'

function getOnlineConfigSchema() {
  return z.object({
    clientId: z.string().min(1, m.admin_payment_methods_client_id_required()),
    secretKey: z.string().min(1, m.admin_payment_methods_secret_key_required()),
    merchantId: z.string().min(1, m.admin_payment_methods_merchant_id_required()),
    testMode: z.boolean(),
  })
}

type OnlineConfigForm = z.infer<ReturnType<typeof getOnlineConfigSchema>>

interface MethodMeta {
  method: PaymentMethodType
  label: string
  description: string
  icon: React.ReactNode
  configFields?: React.ReactNode
}

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-primary' : 'bg-input'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function OnlineConfigForm({
  existing,
  businessId,
  isEnabled,
}: {
  existing: BusinessPaymentMethodResponse | undefined
  businessId: string
  isEnabled: boolean
}) {
  const upsertMutation = useUpsertPaymentMethodMutation()
  const config = existing?.config as OnlinePaymentConfig | null

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<OnlineConfigForm>({
    resolver: zodResolver(getOnlineConfigSchema()),
    defaultValues: {
      clientId: config?.clientId ?? '',
      secretKey: config?.secretKey ?? '',
      merchantId: config?.merchantId ?? '',
      testMode: config?.testMode ?? true,
    },
  })

  useEffect(() => {
    reset({
      clientId: config?.clientId ?? '',
      secretKey: config?.secretKey ?? '',
      merchantId: config?.merchantId ?? '',
      testMode: config?.testMode ?? true,
    })
  }, [config, reset])

  const onSubmit = async (values: OnlineConfigForm) => {
    try {
      await upsertMutation.mutateAsync({
        businessId,
        payload: { method: 'ONLINE', isActive: isEnabled, config: values },
      })
      showSuccess(m.admin_payment_methods_vpos_credentials_saved())
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  const testMode = watch('testMode')

  return (
    <form
      className='mt-4 space-y-4 border-t border-border pt-4'
      onSubmit={(e) => {
        e.preventDefault()
        void handleSubmit(onSubmit)()
      }}
    >
      <p className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
        {m.admin_payment_methods_vpos_credentials_heading()}
      </p>

      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-1'>
          <label htmlFor='clientId' className='text-sm font-medium'>
            {m.admin_payment_methods_client_id_label()}
          </label>
          <div className='relative'>
            <KeyRound className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <input
              id='clientId'
              type='text'
              placeholder={m.admin_payment_methods_client_id_placeholder()}
              className='h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              {...register('clientId')}
            />
          </div>
          {errors.clientId && <p className='text-xs text-red-600'>{errors.clientId.message}</p>}
        </div>

        <div className='space-y-1'>
          <label htmlFor='secretKey' className='text-sm font-medium'>
            {m.admin_payment_methods_secret_key_label()}
          </label>
          <div className='relative'>
            <KeyRound className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <input
              id='secretKey'
              type='password'
              placeholder='••••••••••••'
              className='h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              {...register('secretKey')}
            />
          </div>
          {errors.secretKey && <p className='text-xs text-red-600'>{errors.secretKey.message}</p>}
        </div>

        <div className='space-y-1'>
          <label htmlFor='merchantId' className='text-sm font-medium'>
            {m.admin_payment_methods_merchant_id_label()}
          </label>
          <input
            id='merchantId'
            type='text'
            placeholder={m.admin_payment_methods_merchant_id_placeholder()}
            className='h-10 w-full rounded-xl border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            {...register('merchantId')}
          />
          {errors.merchantId && <p className='text-xs text-red-600'>{errors.merchantId.message}</p>}
        </div>

        <div className='flex items-center gap-3 pt-5'>
          <Checkbox
            id='testMode'
            checked={testMode}
            onChange={(e) => setValue('testMode', e.target.checked, { shouldDirty: true })}
          />
          <label htmlFor='testMode' className='cursor-pointer text-sm font-medium'>
            {m.admin_payment_methods_test_mode()}
          </label>
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <Button
          type='submit'
          size='sm'
          className='rounded-full'
          disabled={upsertMutation.isPending || !isDirty}
        >
          <Save className='mr-2 h-4 w-4' />
          {upsertMutation.isPending
            ? m.admin_payment_methods_saving()
            : m.admin_payment_methods_save_credentials()}
        </Button>
        {!isDirty && existing?.config && (
          <span className='text-xs text-emerald-600'>
            {m.admin_payment_methods_credentials_saved()}
          </span>
        )}
      </div>
    </form>
  )
}

function PaymentMethodCard({
  methodMeta,
  existing,
  businessId,
}: {
  methodMeta: MethodMeta
  existing: BusinessPaymentMethodResponse | undefined
  businessId: string
}) {
  const isEnabled = existing?.isActive ?? false
  const upsertMutation = useUpsertPaymentMethodMutation()
  const deleteMutation = useDeletePaymentMethodMutation()

  const handleToggle = async (enabled: boolean) => {
    try {
      await upsertMutation.mutateAsync({
        businessId,
        payload: {
          method: methodMeta.method,
          isActive: enabled,
          config: existing?.config ?? undefined,
        },
      })
      showSuccess(
        enabled
          ? m.admin_payment_methods_enabled({ method: methodMeta.label })
          : m.admin_payment_methods_disabled({ method: methodMeta.label }),
      )
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!existing) return
    try {
      await deleteMutation.mutateAsync({ businessId, methodId: existing.id })
      showSuccess(m.admin_payment_methods_config_removed({ method: methodMeta.label }))
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  const isBusy = upsertMutation.isPending || deleteMutation.isPending

  return (
    <Card className={isEnabled ? 'border-primary/30' : ''}>
      <CardHeader>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex items-start gap-3'>
            <div
              className={`mt-0.5 rounded-xl p-2 ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
            >
              {methodMeta.icon}
            </div>
            <div>
              <CardTitle className='text-base'>{methodMeta.label}</CardTitle>
              <CardDescription className='mt-1 text-sm'>{methodMeta.description}</CardDescription>
            </div>
          </div>

          <div className='flex items-center gap-2 shrink-0'>
            {existing && (
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-muted-foreground hover:text-destructive'
                disabled={isBusy}
                onClick={() => void handleDelete()}
                title={m.admin_payment_methods_remove_config()}
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            )}
            <ToggleSwitch
              checked={isEnabled}
              onChange={(v) => void handleToggle(v)}
              disabled={isBusy}
            />
          </div>
        </div>
      </CardHeader>

      {isEnabled && methodMeta.method === 'ONLINE' && (
        <CardContent>
          <OnlineConfigForm existing={existing} businessId={businessId} isEnabled={isEnabled} />
        </CardContent>
      )}

      {isEnabled && methodMeta.method === 'POS' && (
        <CardContent>
          <div className='rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground'>
            {m.admin_payment_methods_pos_description()}
          </div>
        </CardContent>
      )}

      {isEnabled && methodMeta.method === 'CASH' && (
        <CardContent>
          <div className='rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground'>
            {m.admin_payment_methods_cash_description()}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function getMethodMeta(): MethodMeta[] {
  return [
    {
      method: 'CASH',
      label: m.admin_payment_methods_cash_label(),
      description: m.admin_payment_methods_cash_desc(),
      icon: <Banknote className='h-5 w-5' />,
    },
    {
      method: 'POS',
      label: m.admin_payment_methods_pos_label(),
      description: m.admin_payment_methods_pos_desc(),
      icon: <CreditCard className='h-5 w-5' />,
    },
    {
      method: 'ONLINE',
      label: m.admin_payment_methods_online_label(),
      description: m.admin_payment_methods_online_desc(),
      icon: <Globe className='h-5 w-5' />,
    },
  ]
}

export function AdminPaymentMethodsContent() {
  const activeBusiness = useActiveBusiness()
  const { data: methods = [], isPending } = usePaymentMethodsQuery({
    businessId: activeBusiness?.id,
    enabled: true,
  })

  if (!activeBusiness) {
    return (
      <div className='space-y-4'>
        <h1 className='text-3xl font-semibold tracking-tight'>{m.admin_payment_methods_title()}</h1>
        <p className='text-muted-foreground'>{m.admin_payment_methods_no_business()}</p>
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-semibold tracking-tight'>{m.admin_payment_methods_title()}</h1>
        <p className='text-muted-foreground'>{m.admin_payment_methods_subtitle()}</p>
      </div>

      {isPending ? (
        <div className='space-y-4'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='h-28 animate-pulse rounded-2xl bg-muted' />
          ))}
        </div>
      ) : (
        <div className='space-y-4'>
          {getMethodMeta().map((meta) => (
            <PaymentMethodCard
              key={meta.method}
              methodMeta={meta}
              existing={methods.find((m) => m.method === meta.method)}
              businessId={activeBusiness.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
