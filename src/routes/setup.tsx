import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Building2, FileJson, MapPin, Sparkles, Store } from 'lucide-react'
import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import {
  businessFeatureLabels,
  businessFeaturePresets,
  businessFeatures,
  businessTypeLabels,
} from '#/features/business/api/business-domain.ts'
import {
  createBusinessFormSchema,
  type CreateBusinessFormValues,
} from '#/features/business/lib/schemas/create-business-form.schema.ts'
import { businessFormAdapter } from '#/features/business/lib/utils/business-form-adapter.ts'
import { useCreateBusinessMutation } from '#/features/business/model/business-hooks.ts'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { stringToCommaSeparated } from '#/shared/libs/utils/naming.utils.ts'
import useActiveBusinessStore from '#/shared/store/use-active-business.store.ts'

export const Route = createFileRoute('/setup')({
  component: AdminSetupRoute,
  beforeLoad: ({ context }) => {
    if (!context.authUser) throw redirect({ to: '/auth/sign-in' })

    if (context.authUser.hasBusiness) throw redirect({ to: '/dashboard' })
  },
})

function AdminSetupRoute() {
  const navigate = useNavigate()
  const createBusinessMutation = useCreateBusinessMutation()
  const setActiveBusiness = useActiveBusinessStore((s) => s.setActive)
  const nameId = useId()
  const typeId = useId()
  const currencyId = useId()
  const locationId = useId()
  const workingHoursId = useId()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createBusinessFormSchema),
    defaultValues: {
      name: '',
      type: 'RESTAURANT',
      location: '',
      currency: 'USD',
      workingHoursJson: '',
      features: [],
    },
  } as const)

  const selectedType = watch('type')
  const selectedFeatures = watch('features')
  const presetFeatures = businessFeaturePresets[selectedType]
  const generatedSlug = stringToCommaSeparated(watch('name')) || 'sunset-bistro'

  const onSubmit = async (values: CreateBusinessFormValues) => {
    try {
      const newBusiness = await createBusinessMutation.mutateAsync({
        data: businessFormAdapter.toApi(values),
      })

      setActiveBusiness({ id: newBusiness.id, name: newBusiness.name })

      showSuccess('Business created successfully')
      await navigate({ to: '/dashboard' })
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  return (
    <main className='w-full max-w-[1600px] mx-auto px-4 py-10'>
      <section className='mb-6 overflow-hidden rounded-3xl border border-border bg-card px-6 py-8 shadow-sm sm:px-8'>
        <div className='relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
          <div className='max-w-2xl space-y-4 rise-in'>
            <div className='inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground'>
              <span className='h-2 w-2 rounded-full bg-primary animate-pulse' />
              First-time onboarding
            </div>
            <div className='space-y-2'>
              <p className='text-sm font-medium text-muted-foreground'>Hi, nice to see you.</p>
              <h1 className='display-title text-4xl font-semibold tracking-tight text-foreground sm:text-5xl'>
                Let&apos;s create your business.
              </h1>
              <p className='max-w-xl text-sm leading-7 text-muted-foreground sm:text-base'>
                This setup flow helps you create the venue profile, choose your business type, and
                enable the right modules before you enter the dashboard.
              </p>
            </div>
          </div>

          <div className='relative flex min-h-40 flex-1 items-center justify-center'>
            <div className='absolute h-28 w-28 rounded-full bg-primary/10 blur-2xl animate-pulse' />
            <div className='absolute -left-6 top-6 h-16 w-16 rounded-full bg-accent animate-fade-in-up' />
            <div className='absolute bottom-4 right-10 h-10 w-10 rounded-full bg-primary/20 animate-fade-in-up' />
          </div>
        </div>
      </section>

      <section className='grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
        <div className='island-shell rounded-2xl p-6 sm:p-8'>
          <p className='island-kicker mb-2'>Business Creation</p>
          <h2 className='mb-3 text-3xl font-semibold tracking-tight text-foreground'>
            Create your first business
          </h2>
          <p className='mb-6 text-sm text-muted-foreground'>
            Add the venue profile first. If you skip feature selection, ServeOS will apply the
            backend preset for the selected business type.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
            <div className='grid gap-5 sm:grid-cols-2'>
              <div className='space-y-2 sm:col-span-2'>
                <div className='space-y-2'>
                  <Label
                    htmlFor={nameId}
                    className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                  >
                    Business name
                  </Label>
                  <div className='relative'>
                    <Building2 className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      id={nameId}
                      type='text'
                      placeholder='Sunset Bistro'
                      className={`h-14 rounded-xl pl-12 pr-4 ${
                        errors.name ? 'border-red-400 ring-2 ring-red-100' : ''
                      }`}
                      {...register('name')}
                    />
                  </div>
                  {errors.name && <p className='text-xs text-red-500'>{errors.name.message}</p>}
                </div>

                <div>
                  <span className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                    Generated slug
                  </span>

                  <div className='mt-1 flex items-center gap-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm'>
                    <span className='text-muted-foreground'>/</span>
                    <span className='font-mono text-foreground'>{generatedSlug}</span>
                  </div>
                </div>
              </div>
              <div className='space-y-2'>
                <Label
                  htmlFor={typeId}
                  className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                >
                  Business type
                </Label>
                <select
                  id={typeId}
                  className='h-14 w-full rounded-xl border border-input bg-background px-4 text-sm ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                  {...register('type')}
                >
                  {Object.entries(businessTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor={currencyId}
                  className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                >
                  Currency
                </Label>
                <div className='relative'>
                  <span className='absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground'>
                    ₳
                  </span>
                  <Input
                    id={currencyId}
                    type='text'
                    placeholder='USD'
                    maxLength={3}
                    className={`h-14 rounded-xl pl-12 pr-4 uppercase ${
                      errors.currency ? 'border-red-400 ring-2 ring-red-100' : ''
                    }`}
                    {...register('currency', {
                      setValueAs: (value) => String(value).toUpperCase(),
                    })}
                  />
                </div>
                {errors.currency && (
                  <p className='text-xs text-red-500'>{errors.currency.message}</p>
                )}
              </div>

              <div className='space-y-2 sm:col-span-2'>
                <Label
                  htmlFor={locationId}
                  className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                >
                  Location
                </Label>
                <div className='relative'>
                  <MapPin className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id={locationId}
                    type='text'
                    placeholder='123 Main St, New York'
                    className={`h-14 rounded-xl pl-12 pr-4 ${
                      errors.location ? 'border-red-400 ring-2 ring-red-100' : ''
                    }`}
                    {...register('location')}
                  />
                </div>
                {errors.location && (
                  <p className='text-xs text-red-500'>{errors.location.message}</p>
                )}
              </div>

              <div className='space-y-2 sm:col-span-2'>
                <Label
                  htmlFor={workingHoursId}
                  className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                >
                  Working hours JSON
                </Label>
                <div className='relative'>
                  <FileJson className='absolute left-4 top-4 h-5 w-5 text-muted-foreground' />
                  <Textarea
                    id={workingHoursId}
                    rows={4}
                    placeholder='{"monday":"09:00-22:00","tuesday":"09:00-22:00"}'
                    className={`w-full rounded-xl py-4 pl-12 pr-4 ${
                      errors.workingHoursJson ? 'border-red-400 ring-2 ring-red-100' : ''
                    }`}
                    {...register('workingHoursJson')}
                  />
                </div>
                <p className='text-xs text-muted-foreground'>
                  Optional. Leave empty to skip. Must be a JSON object.
                </p>
                {errors.workingHoursJson && (
                  <p className='text-xs text-red-500'>{errors.workingHoursJson.message}</p>
                )}
              </div>

              <div className='space-y-3 sm:col-span-2'>
                <div className='flex items-center justify-between gap-3'>
                  <p className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                    Features
                  </p>
                  <span className='text-xs text-muted-foreground'>
                    {selectedFeatures.length} selected
                  </span>
                </div>

                <div className='grid gap-3 sm:grid-cols-2'>
                  {businessFeatures.map((feature) => {
                    const featureId = `feature-${feature.toLowerCase()}`

                    return (
                      <div
                        key={feature}
                        className='flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-sm'
                      >
                        <Checkbox
                          id={featureId}
                          value={feature}
                          className='mt-1'
                          {...register('features')}
                        />
                        <Label htmlFor={featureId} className='cursor-pointer'>
                          <span>
                            <span className='block font-semibold text-foreground'>
                              {businessFeatureLabels[feature]}
                            </span>
                            <span className='block text-xs text-muted-foreground'>
                              Included in the selected preset only if you leave the list empty.
                            </span>
                          </span>
                        </Label>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className='flex flex-col gap-4 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-start gap-3'>
                <Sparkles className='mt-0.5 h-5 w-5 text-primary' />
                <div>
                  <p className='text-sm font-semibold text-foreground'>
                    Default preset for {businessTypeLabels[selectedType]}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {presetFeatures.length
                      ? 'If you do not select features, backend defaults will be applied.'
                      : 'This business type starts without a predefined feature preset.'}
                  </p>
                </div>
              </div>

              <div className='flex flex-wrap gap-2'>
                {presetFeatures.length ? (
                  presetFeatures.map((feature) => (
                    <span
                      key={feature}
                      className='rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground'
                    >
                      {businessFeatureLabels[feature]}
                    </span>
                  ))
                ) : (
                  <span className='rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground'>
                    No preset features
                  </span>
                )}
              </div>
            </div>

            <Button
              type='submit'
              disabled={createBusinessMutation.isPending}
              className='h-14 w-full rounded-xl'
            >
              {createBusinessMutation.isPending ? 'Creating business…' : 'Create business'}
            </Button>
          </form>
        </div>

        <aside className='island-shell rounded-2xl p-6 sm:p-8 h-min'>
          <p className='island-kicker mb-2'>What happens next</p>
          <h2 className='mb-4 text-2xl font-semibold tracking-tight text-foreground'>
            Your venue onboarding
          </h2>
          <div className='space-y-4 text-sm text-muted-foreground'>
            <div className='rounded-xl border border-border bg-card p-4'>
              <p className='mb-1 flex items-center gap-2 font-semibold text-foreground'>
                <Store className='h-4 w-4 text-primary' />
                Business profile
              </p>
              <p>Store the venue name, location, currency, and optional working hours.</p>
            </div>

            <div className='rounded-xl border border-border bg-card p-4'>
              <p className='mb-1 flex items-center gap-2 font-semibold text-foreground'>
                <Sparkles className='h-4 w-4 text-primary' />
                Feature-driven modules
              </p>
              <p>
                The backend decides the final feature set. The UI should only expose modules that
                exist in the saved business features.
              </p>
            </div>

            <div className='rounded-xl border border-border bg-card p-4'>
              <p className='mb-1 flex items-center gap-2 font-semibold text-foreground'>
                <Building2 className='h-4 w-4 text-primary' />
                Automatic redirect
              </p>
              <p>
                Once the business is created, the app will update your session and continue to the
                dashboard.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}
