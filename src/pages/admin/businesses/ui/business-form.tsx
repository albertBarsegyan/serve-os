import {zodResolver} from '@hookform/resolvers/zod'
import {useQueryClient} from '@tanstack/react-query'
import {Building2, MapPin} from 'lucide-react'
import {useEffect, useId, useMemo} from 'react'
import {useForm} from 'react-hook-form'
import {FeatureSelector} from '#/components/feature-selector'
import {Button} from '#/components/ui/button'
import {Input} from '#/components/ui/input'
import {Label} from '#/components/ui/label'
import type {CreateBusinessRequest, UpdateBusinessRequest,} from '#/features/business/api/business.types'
import {businessTypeLabels} from '#/features/business/api/business-domain'
import {
  updateBusinessFormSchema,
  type UpdateBusinessFormValues,
} from '#/features/business/lib/schemas/update-business-form.schema'
import {
  getCityOptions,
  getCountryNameByCode,
  getCountryOptions,
  getCurrencyOptions,
} from '#/features/business/lib/utils/location-options'
import {
  useBusinessesQuery,
  useCreateBusinessMutation,
  useUpdateBusinessMutation,
} from '#/features/business/model/business-hooks'
import {showError, showSuccess} from '#/shared/libs/hooks/toast'
import {getResponseErrorMessage} from '#/shared/libs/utils/http.utils'
import {Modal} from '#/shared/ui/modal'

interface BusinessFormProps {
  mode: 'add' | 'edit'
  businessId?: string | null
  onClose: () => void
}

export function BusinessForm({ mode, businessId, onClose }: Readonly<BusinessFormProps>) {
  const queryClient = useQueryClient()
  const nameId = useId()
  const typeId = useId()
  const currencyId = useId()
  const countryId = useId()
  const cityId = useId()

  const businessesQuery = useBusinessesQuery({ enabled: true })
  const createMutation = useCreateBusinessMutation()
  const updateMutation = useUpdateBusinessMutation()

  const currentBusiness = useMemo(() => {
    if (mode === 'edit' && businessId) {
      return (businessesQuery.data ?? []).find((b) => b.id === businessId)
    }
    return null
  }, [mode, businessId, businessesQuery.data])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<UpdateBusinessFormValues>({
    resolver: zodResolver(updateBusinessFormSchema),
    defaultValues: {
      name: currentBusiness?.name ?? '',
      type: currentBusiness?.type ?? 'RESTAURANT',
      locationCountry: '',
      locationCity: '',
      currency: currentBusiness?.currency ?? 'USD',
      features: currentBusiness?.features ?? [],
    },
  })

  const selectedCountry = watch('locationCountry')
  const selectedType = watch('type')
  const selectedFeatures = watch('features')

  const countryOptions = useMemo(() => getCountryOptions(), [])
  const cityOptions = useMemo(() => getCityOptions(selectedCountry), [selectedCountry])
  const currencyOptions = useMemo(() => getCurrencyOptions(), [])

  useEffect(() => {
    if (mode === 'edit' && currentBusiness?.location) {
      const [city, country] = currentBusiness.location.split(', ').map((s) => s.trim())

      if (country) {
        const countryCode =
          countryOptions.find((c) => c.label === country || c.value === country)?.value || ''
        setValue('locationCountry', countryCode)

        if (city) {
          setValue('locationCity', city)
        }
      }
    }
  }, [mode, currentBusiness, countryOptions, setValue])

  const onSubmit = async (values: UpdateBusinessFormValues) => {
    try {
      const countryLabel = getCountryNameByCode(values.locationCountry) ?? values.locationCountry

      const payload: UpdateBusinessRequest = {
        name: values.name?.trim(),
        type: values.type,
        location: `${values.locationCity.trim()}, ${countryLabel.trim()}`,
        currency: values.currency?.toUpperCase(),
        ...(values.features.length ? { features: values.features } : {}),
      }

      if (mode === 'add') {
        const createPayload: CreateBusinessRequest = {
          name: values.name.trim(),
          type: values.type,
          location: `${values.locationCity.trim()}, ${countryLabel.trim()}`,
          currency: values.currency.toUpperCase(),
          ...(values.features.length ? { features: values.features } : {}),
        }
        await createMutation.mutateAsync({ data: createPayload })
        await queryClient.invalidateQueries({ queryKey: ['businesses'] })

        showSuccess('Business created successfully')
      } else if (mode === 'edit' && businessId) {
        await updateMutation.mutateAsync({ id: businessId, payload })
        showSuccess('Business updated successfully')
      }

      onClose()
      reset()
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={mode === 'add' ? 'Add Business' : 'Edit Business'}
      footer={
        <>
          <Button variant='ghost' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 px-4'>
        <div className='space-y-2'>
          <Label htmlFor={nameId} className='text-sm font-medium'>
            Business Name
          </Label>
          <div className='relative'>
            <Building2 className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              id={nameId}
              placeholder='e.g. Sunset Bistro'
              className='pl-10'
              {...register('name')}
            />
          </div>
          {errors.name && <p className='text-xs text-red-500'>{errors.name.message}</p>}
        </div>

        <div className='space-y-2'>
          <Label htmlFor={typeId} className='text-sm font-medium'>
            Business Type
          </Label>
          <select
            id={typeId}
            className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            {...register('type')}
          >
            {Object.entries(businessTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.type && <p className='text-xs text-red-500'>{errors.type.message}</p>}
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor={countryId} className='text-sm font-medium'>
              Country
            </Label>
            <div className='relative'>
              <MapPin className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <select
                id={countryId}
                className='h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                {...register('locationCountry')}
              >
                <option key='select-country' value=''>
                  Select country
                </option>
                {countryOptions.map((country) => (
                  <option key={country.label} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.locationCountry && (
              <p className='text-xs text-red-500'>{errors.locationCountry.message}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor={cityId} className='text-sm font-medium'>
              City
            </Label>
            <select
              id={cityId}
              disabled={!selectedCountry}
              className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              {...register('locationCity')}
            >
              <option key='select-city' value=''>
                {selectedCountry ? 'Select city' : 'Select country first'}
              </option>
              {cityOptions.map((city) => (
                <option key={city.label} value={city.value}>
                  {city.label}
                </option>
              ))}
            </select>
            {errors.locationCity && (
              <p className='text-xs text-red-500'>{errors.locationCity.message}</p>
            )}
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor={currencyId} className='text-sm font-medium'>
            Currency
          </Label>
          <select
            id={currencyId}
            className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            {...register('currency', {
              setValueAs: (value) => String(value).toUpperCase(),
            })}
          >
            <option value=''>Select currency</option>
            {currencyOptions.map((currency) => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
          {errors.currency && <p className='text-xs text-red-500'>{errors.currency.message}</p>}
        </div>

        <div className='border-t pt-4'>
          <FeatureSelector
            selectedFeatures={selectedFeatures}
            onFeaturesChange={(features) => setValue('features', features)}
            selectedType={selectedType}
          />
        </div>
      </form>
    </Modal>
  )
}
