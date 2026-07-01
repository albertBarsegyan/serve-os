import {zodResolver} from '@hookform/resolvers/zod'
import {useQueryClient} from '@tanstack/react-query'
import {createFileRoute, redirect, useNavigate} from '@tanstack/react-router'
import {Building2, MapPin} from 'lucide-react'
import {useEffect, useId, useState} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {FeatureSelector} from '#/components/feature-selector'
import {Button} from '#/components/ui/button'
import {Input} from '#/components/ui/input'
import {Label} from '#/components/ui/label'
import type {AuthenticatedUser} from '#/features/auth/api/auth.types.ts'
import {authQueryKey} from '#/features/auth/lib/constants/auth-query-keys.ts'
import {businessTypeLabels, FEATURE_PRESETS} from '#/features/business/api/business-domain.ts'
import {
  createBusinessFormSchema,
  type CreateBusinessFormValues,
} from '#/features/business/lib/schemas/create-business-form.schema.ts'
import {businessFormAdapter} from '#/features/business/lib/utils/business-form-adapter.ts'
import {
  type CurrencyOption,
  getCityOptions,
  getCountryOptions,
  getCurrencyOptions,
  type LocationOption,
} from '#/features/business/lib/utils/location-options.ts'
import {useCreateBusinessMutation, useUpdateBusinessMutation,} from '#/features/business/model/business-hooks.ts'
import {selectBusinessServerFn} from '#/shared/api/business/business.fns.ts'
import {ImageEntityType} from '#/shared/api/images/images.api.ts'
import {adminRoutePathname} from '#/shared/libs/constants/route-pathname/admin.ts'
import {sharedRoutePathname} from '#/shared/libs/constants/route-pathname/shared.ts'
import {showError, showSuccess} from '#/shared/libs/hooks/toast.ts'
import {getResponseErrorMessage} from '#/shared/libs/utils/http.utils.ts'
import {stringToCommaSeparated} from '#/shared/libs/utils/naming.utils.ts'
import {ImageUpload} from '#/shared/ui/image-upload'
import {SearchSelect} from '#/shared/ui/search-select'
import {WorkingHoursPicker} from '#/widgets/shared/working-hours-picker'

export const Route = createFileRoute('/setup')({
  component: AdminSetupRoute,
  beforeLoad: ({ context }) => {
    if (!context.authUser) throw redirect({ to: sharedRoutePathname.SIGN_UP })

    if (
      context.authUser.type === 'staff' ||
      (context.authUser.type === 'owner' && context.authUser.hasBusiness)
    ) {
      throw redirect({ to: adminRoutePathname.DASHBOARD })
    }
  },
})

function AdminSetupRoute() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const createBusinessMutation = useCreateBusinessMutation()
  const updateBusinessMutation = useUpdateBusinessMutation()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  const nameId = useId()
  const typeId = useId()
  const currencyId = useId()
  const countryId = useId()
  const cityId = useId()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createBusinessFormSchema),
    defaultValues: {
      name: '',
      type: 'RESTAURANT',
      locationCountry: '',
      locationCity: '',
      currency: 'USD',
      workingHoursJson: '',
      features: [],
    },
  } as const)

  const selectedType = watch('type')
  const selectedCountry = watch('locationCountry')
  const selectedCity = watch('locationCity')

  const generatedSlug = stringToCommaSeparated(watch('name')) || 'sunset-bistro'
  const [countryOptions, setCountryOptions] = useState<LocationOption[]>([])
  const [cityOptions, setCityOptions] = useState<LocationOption[]>([])
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>([])

  useEffect(() => {
    getCountryOptions().then(setCountryOptions)
    getCurrencyOptions().then(setCurrencyOptions)
  }, [])

  useEffect(() => {
    getCityOptions(selectedCountry).then(setCityOptions)
  }, [selectedCountry])

  useEffect(() => {
    if (selectedCity && !cityOptions.some((option) => option.value === selectedCity)) {
      setValue('locationCity', '')
    }
  }, [cityOptions, selectedCity, setValue])

  useEffect(() => {
    setValue('features', FEATURE_PRESETS[selectedType])
  }, [selectedType, setValue])

  const onSubmit = async (values: CreateBusinessFormValues) => {
    try {
      const createdBusiness = await createBusinessMutation.mutateAsync({
        data: await businessFormAdapter.toApi(values),
      })

      if (logoUrl) {
        await updateBusinessMutation.mutateAsync({
          id: createdBusiness.id,
          payload: { type: createdBusiness.type, logoUrl },
        })
      }

      await selectBusinessServerFn({ data: createdBusiness.id })

      await queryClient.invalidateQueries({ queryKey: ['business'] })
      queryClient.setQueryData<{ user: AuthenticatedUser }>([authQueryKey.ME], (old) => {
        if (!old) return old

        return {
          user: {
            ...old.user,
            hasBusiness: true,
          },
        }
      })

      showSuccess('Business created successfully')
      await navigate({ to: '/dashboard' })
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  return (
    <main className='w-full max-w-400 mx-auto px-4 py-10'>
      <section className='mb-6 overflow-hidden rounded-3xl border border-border bg-card px-6 py-8 shadow-sm sm:px-8'>
        <div className='relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
          <div className='max-w-2xl space-y-4 rise-in'>
            <div className='inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground'>
              <span aria-hidden='true' className='h-2 w-2 rounded-full bg-primary animate-pulse' />
              <span>First-time onboarding</span>
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

      <section>
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
              <div className='sm:col-span-2'>
                <Label className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                  Business logo
                </Label>
                <div className='mt-2'>
                  <ImageUpload
                    value={logoUrl}
                    onChange={setLogoUrl}
                    entityType={ImageEntityType.BUSINESS_LOGO}
                    previewShape='square'
                    enableEditor
                  />
                </div>
                <p className='mt-1 text-xs text-muted-foreground'>
                  Optional. PNG, JPG, WebP or SVG — max 3 MB.
                </p>
              </div>

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
                <Controller
                  name='type'
                  control={control}
                  render={({ field }) => (
                    <SearchSelect
                      id={typeId}
                      value={field.value}
                      onChange={field.onChange}
                      options={Object.entries(businessTypeLabels).map(([value, label]) => ({
                        value,
                        label,
                      }))}
                      placeholder='Select type'
                      className='h-14 rounded-xl'
                    />
                  )}
                />
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor={currencyId}
                  className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                >
                  Currency
                </Label>
                <Controller
                  name='currency'
                  control={control}
                  render={({ field }) => (
                    <SearchSelect
                      id={currencyId}
                      value={field.value}
                      onChange={(v) => field.onChange(v.toUpperCase())}
                      options={currencyOptions}
                      placeholder='Select currency'
                      className={`h-14 rounded-xl ${errors.currency ? 'border-red-400 ring-2 ring-red-100' : ''}`}
                    />
                  )}
                />
                {errors.currency && (
                  <p className='text-xs text-red-500'>{errors.currency.message}</p>
                )}
              </div>

              <div className='space-y-2 sm:col-span-2'>
                <Label
                  htmlFor={countryId}
                  className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                >
                  Location
                </Label>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label
                      htmlFor={countryId}
                      className='text-xs font-medium text-muted-foreground'
                    >
                      Country
                    </Label>
                    <Controller
                      name='locationCountry'
                      control={control}
                      render={({ field }) => (
                        <SearchSelect
                          id={countryId}
                          value={field.value}
                          onChange={field.onChange}
                          options={countryOptions}
                          placeholder='Select country'
                          className={`h-14 rounded-xl ${errors.locationCountry ? 'border-red-400 ring-2 ring-red-100' : ''}`}
                          startIcon={<MapPin className='h-5 w-5' />}
                        />
                      )}
                    />
                    {errors.locationCountry && (
                      <p className='text-xs text-red-500'>{errors.locationCountry.message}</p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor={cityId} className='text-xs font-medium text-muted-foreground'>
                      City
                    </Label>
                    <Controller
                      name='locationCity'
                      control={control}
                      render={({ field }) => (
                        <SearchSelect
                          id={cityId}
                          value={field.value}
                          onChange={field.onChange}
                          options={cityOptions}
                          placeholder={selectedCountry ? 'Select city' : 'Select a country first'}
                          disabled={!selectedCountry}
                          className={`h-14 rounded-xl ${errors.locationCity ? 'border-red-400 ring-2 ring-red-100' : ''}`}
                        />
                      )}
                    />
                    {errors.locationCity && (
                      <p className='text-xs text-red-500'>{errors.locationCity.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className='space-y-2 sm:col-span-2'>
                <Label
                  htmlFor='working-hours'
                  className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                >
                  Working hours
                </Label>
                <Controller
                  name='workingHoursJson'
                  control={control}
                  render={({ field }) => (
                    <WorkingHoursPicker value={field.value || ''} onChange={field.onChange} />
                  )}
                />
                <p className='text-xs text-muted-foreground'>
                  Optional. Select the days and hours your business operates. Leave empty to skip.
                </p>
                {errors.workingHoursJson && (
                  <p className='text-xs text-red-500'>{errors.workingHoursJson.message}</p>
                )}
              </div>

              <div className='sm:col-span-2'>
                <Controller
                  name='features'
                  control={control}
                  render={({ field }) => (
                    <FeatureSelector
                      selectedFeatures={field.value}
                      onFeaturesChange={field.onChange}
                      selectedType={selectedType}
                    />
                  )}
                />
              </div>
            </div>

            <Button
              type='submit'
              disabled={createBusinessMutation.isPending || updateBusinessMutation.isPending}
              className='h-14 w-full rounded-xl'
            >
              {createBusinessMutation.isPending || updateBusinessMutation.isPending
                ? 'Creating business…'
                : 'Create business'}
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
