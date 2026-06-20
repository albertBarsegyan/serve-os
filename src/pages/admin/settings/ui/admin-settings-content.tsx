import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, MapPin, Save, Settings } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FeatureSelector } from '#/components/feature-selector'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import type { UpdateBusinessRequest } from '#/features/business/api/business.types'
import { type BusinessType, businessTypeLabels } from '#/features/business/api/business-domain'
import {
  type UpdateBusinessFormValues,
  updateBusinessFormSchema,
} from '#/features/business/lib/schemas/update-business-form.schema'
import {
  getCityOptions,
  getCountryNameByCode,
  getCountryOptions,
  getCurrencyOptions,
} from '#/features/business/lib/utils/location-options'
import {
  useBusinessesQuery,
  useUpdateBusinessMutation,
} from '#/features/business/model/business-hooks'
import { ImageEntityType } from '#/shared/api/images/images.api'
import { showError, showSuccess } from '#/shared/libs/hooks/toast'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils'
import useActiveBusinessStore from '#/shared/store/use-active-business.store'
import { ImageUpload } from '#/shared/ui/image-upload'
import { SearchSelect } from '#/shared/ui/search-select'
import { WorkingHoursPicker } from '#/widgets/shared/working-hours-picker.tsx'

export function AdminSettingsContent() {
  const activeBusiness = useActiveBusinessStore((s) => s.active)
  const { data: businesses = [], isPending: isLoadingBusinesses } = useBusinessesQuery({
    enabled: true,
  })
  const updateMutation = useUpdateBusinessMutation()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  const currentBusiness = useMemo(
    () => businesses.find((b) => b.id === activeBusiness?.id) ?? null,
    [businesses, activeBusiness?.id],
  )

  const nameId = useId()
  const typeId = useId()
  const countryId = useId()
  const cityId = useId()
  const currencyId = useId()
  const workingHoursId = useId()

  const [hasUnsaved, setHasUnsaved] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<UpdateBusinessFormValues>({
    resolver: zodResolver(updateBusinessFormSchema),
    defaultValues: {
      name: '',
      type: 'RESTAURANT',
      locationCountry: '',
      locationCity: '',
      currency: 'USD',
      features: [],
      workingHours: '',
    },
  })

  const selectedCountry = watch('locationCountry')
  const selectedType = watch('type')
  const selectedFeatures = watch('features')

  const countryOptions = useMemo(() => getCountryOptions(), [])
  const cityOptions = useMemo(() => getCityOptions(selectedCountry), [selectedCountry])
  const currencyOptions = useMemo(() => getCurrencyOptions(), [])

  // Populate form once the active business is loaded
  useEffect(() => {
    if (!currentBusiness) return

    const [city, country] = currentBusiness.location.split(', ').map((s) => s.trim())
    const countryCode =
      countryOptions.find((c) => c.label === country || c.value === country)?.value ?? ''

    reset({
      name: currentBusiness.name,
      type: currentBusiness.type,
      locationCountry: countryCode,
      locationCity: city ?? '',
      currency: currentBusiness.currency,
      features: currentBusiness.features,
      workingHours:
        typeof currentBusiness.workingHours === 'string'
          ? currentBusiness.workingHours
          : currentBusiness.workingHours
            ? JSON.stringify(currentBusiness.workingHours, null, 2)
            : '',
    })
    setLogoUrl(currentBusiness.logoUrl ?? null)
    setHasUnsaved(false)
  }, [currentBusiness, countryOptions, reset])

  const onSubmit = async (values: UpdateBusinessFormValues) => {
    if (!currentBusiness) return

    try {
      const countryLabel = getCountryNameByCode(values.locationCountry) ?? values.locationCountry
      const payload: UpdateBusinessRequest = {
        logoUrl,
        name: values.name.trim(),
        type: values.type as BusinessType,
        location: `${values.locationCity.trim()}, ${countryLabel.trim()}`,
        currency: values.currency.toUpperCase(),
        features: values.features,
        workingHours: values.workingHours?.trim() || undefined,
      }

      await updateMutation.mutateAsync({ id: currentBusiness.id, payload })
      showSuccess('Business settings saved')
      setHasUnsaved(false)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  if (!activeBusiness) {
    return (
      <div className='space-y-4'>
        <h1 className='text-3xl font-semibold tracking-tight'>Settings</h1>
        <p className='text-muted-foreground'>
          No active business selected. Please select a business from the sidebar.
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Settings</h1>
          <p className='text-muted-foreground'>
            Configure your business profile and enabled features.
          </p>
        </div>
        <Button
          size='sm'
          className='rounded-full'
          disabled={updateMutation.isPending || isLoadingBusinesses}
          onClick={() => void handleSubmit(onSubmit)()}
        >
          <Save className='mr-2 h-4 w-4' />
          {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

      <form
        className=''
        onSubmit={(e) => {
          e.preventDefault()
          void handleSubmit(onSubmit)()
        }}
        onChange={() => setHasUnsaved(true)}
      >
        {hasUnsaved && <p className='text-xs text-amber-600 my-2'>You have unsaved changes.</p>}
        <div className='flex flex-col gap-4 space-y-6 lg:flex-row md:space-y-0'>
          {/* Business info */}

          <Card className='shrink-0'>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <div className='rounded-xl bg-accent p-2 text-accent-foreground'>
                  <Settings className='h-5 w-5' />
                </div>
                <div>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>
                    Core details shown on customer menus and receipts.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <ImageUpload
                value={logoUrl}
                onChange={setLogoUrl}
                entityType={ImageEntityType.BUSINESS_LOGO}
                label='Business logo'
                previewShape='square'
                enableEditor
              />
              {/* Name */}
              <div className='space-y-2'>
                <label htmlFor={nameId} className='text-sm font-medium text-muted-foreground'>
                  Business Name
                </label>
                <div className='relative'>
                  <Building2 className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <input
                    id={nameId}
                    type='text'
                    className='h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    {...register('name')}
                  />
                </div>
                {errors.name && <p className='text-xs text-red-600'>{errors.name.message}</p>}
              </div>

              {/* Type */}
              <div className='space-y-2'>
                <label htmlFor={typeId} className='text-sm font-medium text-muted-foreground'>
                  Business Type
                </label>
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
                      className='rounded-xl'
                    />
                  )}
                />
                {errors.type && <p className='text-xs text-red-600'>{errors.type.message}</p>}
              </div>

              {/* Location */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <label htmlFor={countryId} className='text-sm font-medium text-muted-foreground'>
                    Country
                  </label>
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
                        className='rounded-xl'
                        startIcon={<MapPin className='h-4 w-4' />}
                      />
                    )}
                  />
                  {errors.locationCountry && (
                    <p className='text-xs text-red-600'>{errors.locationCountry.message}</p>
                  )}
                </div>

                <div className='space-y-2'>
                  <label htmlFor={cityId} className='text-sm font-medium text-muted-foreground'>
                    City
                  </label>
                  <Controller
                    name='locationCity'
                    control={control}
                    render={({ field }) => (
                      <SearchSelect
                        id={cityId}
                        value={field.value}
                        onChange={field.onChange}
                        options={cityOptions}
                        placeholder={selectedCountry ? 'Select city' : 'Select country first'}
                        disabled={!selectedCountry}
                        className='rounded-xl'
                      />
                    )}
                  />
                  {errors.locationCity && (
                    <p className='text-xs text-red-600'>{errors.locationCity.message}</p>
                  )}
                </div>
              </div>

              {/* Currency */}
              <div className='space-y-2'>
                <label htmlFor={currencyId} className='text-sm font-medium text-muted-foreground'>
                  Currency
                </label>
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
                      className='rounded-xl'
                    />
                  )}
                />
                {errors.currency && (
                  <p className='text-xs text-red-600'>{errors.currency.message}</p>
                )}
              </div>
              {/* Working hours */}
              <div className='space-y-2'>
                <label
                  htmlFor={workingHoursId}
                  className='text-sm font-medium text-muted-foreground'
                >
                  Working Hours
                </label>
                <Controller
                  name='workingHours'
                  control={control}
                  render={({ field }) => (
                    <WorkingHoursPicker value={field.value || ''} onChange={field.onChange} />
                  )}
                />

                {errors.workingHours && (
                  <p className='text-xs text-red-600'>{errors.workingHours.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Enabled Features</CardTitle>
              <CardDescription>
                Control which capabilities are active for this business.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeatureSelector
                selectedFeatures={selectedFeatures}
                onFeaturesChange={(features) => {
                  setValue('features', features)
                  setHasUnsaved(true)
                }}
                selectedType={selectedType}
              />
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
