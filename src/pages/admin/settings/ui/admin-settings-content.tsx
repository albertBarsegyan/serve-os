import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { CreditCard, DollarSign, Landmark, MapPin, Save, Settings, Smartphone } from 'lucide-react'
import { useId, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { PaymentMethod } from '#/features/platform/api/platform.types.ts'
import { businessPaymentMethodsQueryOptions } from '#/features/platform/lib/query-options.ts'
import { useUpsertBusinessPaymentMethodMutation } from '#/features/platform/model/platform-hooks.ts'
import { cn } from '#/lib/utils'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'

const businessSettingsSchema = z.object({
  name: z.string().trim().min(2, 'Business name is required'),
  location: z.string().trim().min(2, 'Address is required'),
  currency: z.string().trim().regex(/^[A-Z]{3}$/, 'Use 3-letter ISO currency code'),
  language: z.string().trim().min(2, 'Language is required'),
})

type BusinessSettingsValues = z.infer<typeof businessSettingsSchema>

const paymentMethodMeta: Array<{
  id: PaymentMethod
  label: string
  icon: typeof Landmark
  desc: string
}> = [
  {
    id: 'CASH',
    label: 'Cash Payments',
    icon: Landmark,
    desc: 'Waiters confirm physical cash handling.',
  },
  {
    id: 'POS',
    label: 'POS Terminal',
    icon: Smartphone,
    desc: 'External card terminal integration.',
  },
  {
    id: 'ONLINE',
    label: 'Online Payments',
    icon: CreditCard,
    desc: 'Stripe/direct bank transfer support.',
  },
]

export function AdminSettingsContent() {
  const nameId = useId()
  const locationId = useId()
  const currencyId = useId()
  const languageId = useId()

  const paymentMethodsQuery = useQuery(businessPaymentMethodsQueryOptions())
  const upsertMethodMutation = useUpsertBusinessPaymentMethodMutation()

  const methodsByType = useMemo(() => {
    const map = new Map<PaymentMethod, boolean>()
    for (const method of paymentMethodsQuery.data ?? []) {
      map.set(method.method, method.isActive)
    }
    return map
  }, [paymentMethodsQuery.data])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessSettingsValues>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: {
      name: 'ServeOS Kitchen',
      location: '123 Gourmet St, Foodie City',
      currency: 'USD',
      language: 'English',
    },
  })

  const onSaveBusinessInfo = (values: BusinessSettingsValues) => {
    // Business PATCH endpoint is not wired in this workspace yet.
    showSuccess(`Settings validated for ${values.name}`)
  }

  const togglePaymentMethod = async (method: PaymentMethod, current: boolean) => {
    try {
      await upsertMethodMutation.mutateAsync({ method, isActive: !current })
      showSuccess(`${method} payment ${current ? 'disabled' : 'enabled'}`)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Settings</h1>
          <p className='text-muted-foreground'>Configure your restaurant profile and payment systems.</p>
        </div>
        <Button size='sm' className='rounded-full' onClick={() => void handleSubmit(onSaveBusinessInfo)()}>
          <Save className='mr-2 h-4 w-4' /> Save Changes
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl bg-accent p-2 text-accent-foreground'>
                <Settings className='h-5 w-5' />
              </div>
              <div>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                  Update your restaurant details displayed on customer menus.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <label htmlFor={nameId} className='text-sm font-medium text-muted-foreground'>
                Restaurant Name
              </label>
              <input
                id={nameId}
                type='text'
                className='h-10 w-full rounded-xl border border-input bg-background px-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                {...register('name')}
              />
              {errors.name && <p className='text-xs text-red-600'>{errors.name.message}</p>}
            </div>
            <div className='space-y-2'>
              <label htmlFor={locationId} className='text-sm font-medium text-muted-foreground'>
                Address
              </label>
              <div className='relative'>
                <MapPin className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <input
                  id={locationId}
                  type='text'
                  className='h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                  {...register('location')}
                />
              </div>
              {errors.location && <p className='text-xs text-red-600'>{errors.location.message}</p>}
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <label htmlFor={currencyId} className='text-sm font-medium text-muted-foreground'>
                  Currency
                </label>
                <div className='relative'>
                  <DollarSign className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <input
                    id={currencyId}
                    type='text'
                    maxLength={3}
                    className='h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm uppercase ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    {...register('currency')}
                  />
                </div>
                {errors.currency && <p className='text-xs text-red-600'>{errors.currency.message}</p>}
              </div>
              <div className='space-y-2'>
                <label htmlFor={languageId} className='text-sm font-medium text-muted-foreground'>
                  Language
                </label>
                <input
                  id={languageId}
                  type='text'
                  className='h-10 w-full rounded-xl border border-input bg-background px-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                  {...register('language')}
                />
                {errors.language && <p className='text-xs text-red-600'>{errors.language.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl bg-emerald-500/10 p-2 text-emerald-700'>
                <CreditCard className='h-5 w-5' />
              </div>
              <div>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Configure which payment options are available to your customers.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-6'>
            {paymentMethodMeta.map((method) => {
              const active = methodsByType.get(method.id) ?? false

              return (
                <div
                  key={method.id}
                  className='flex items-center justify-between rounded-2xl border border-border p-4 transition hover:bg-accent'
                >
                  <div className='flex items-center gap-4'>
                    <div className='rounded-xl bg-accent p-2.5 text-accent-foreground'>
                      <method.icon className='h-5 w-5' />
                    </div>
                    <div>
                      <h4 className='font-bold'>{method.label}</h4>
                      <p className='text-xs text-muted-foreground'>{method.desc}</p>
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={() => {
                      void togglePaymentMethod(method.id, active)
                    }}
                      className={cn(
                        'relative h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        active ? 'bg-primary' : 'bg-muted',
                      )}
                    disabled={upsertMethodMutation.isPending}
                  >
                    <span
                      className={cn(
                        'absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform',
                        active ? 'translate-x-5' : 'translate-x-0',
                      )}
                    />
                  </button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
