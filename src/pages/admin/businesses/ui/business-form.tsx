import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Building2, MapPin } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FeatureSelector } from '#/components/feature-selector'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import type {
  CreateBusinessRequest,
  UpdateBusinessRequest,
} from '#/features/business/api/business.types'
import { businessTypeOptions } from '#/features/business/api/business-domain'
import {
  type UpdateBusinessFormValues,
  updateBusinessFormSchema,
} from '#/features/business/lib/schemas/update-business-form.schema'
import {
  type CurrencyOption,
  getCityOptions,
  getCountryNameByCode,
  getCountryOptions,
  getCurrencyOptions,
  type LocationOption,
} from '#/features/business/lib/utils/location-options'
import {
  useBusinessesQuery,
  useCreateBusinessMutation,
  useUpdateBusinessMutation,
} from '#/features/business/model/business-hooks'
import { m } from '#/paraglide/messages'
import { selectBusinessServerFn } from '#/shared/api/business/business.fns'
import { ImageEntityType, uploadImage } from '#/shared/api/images/images.api'
import { showError, showSuccess } from '#/shared/libs/hooks/toast'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils'
import { LogoUploadField } from '#/shared/ui/logo-upload-field'
import { Modal } from '#/shared/ui/modal'
import { SearchSelect } from '#/shared/ui/search-select'

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

  const pendingLogoFileRef = useRef<File | null>(null)
  const [shouldClearLogo, setShouldClearLogo] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
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

  const handleLogoFileChange = (file: File | null) => {
    pendingLogoFileRef.current = file
    setShouldClearLogo(file === null)
  }

  const onSubmit = async (values: UpdateBusinessFormValues) => {
    try {
      const countryLabel =
        (await getCountryNameByCode(values.locationCountry)) ?? values.locationCountry
      const pendingFile = pendingLogoFileRef.current

      if (mode === 'add') {
        const createPayload: CreateBusinessRequest = {
          name: values.name.trim(),
          type: values.type,
          location: `${values.locationCity.trim()}, ${countryLabel.trim()}`,
          currency: values.currency.toUpperCase(),
          ...(values.features.length ? { features: values.features } : {}),
        }
        const newBusiness = await createMutation.mutateAsync({ data: createPayload })

        if (pendingFile) {
          await selectBusinessServerFn({ data: newBusiness.id })
          const uploaded = await uploadImage(pendingFile, {
            entityType: ImageEntityType.BUSINESS_LOGO,
          })
          await updateMutation.mutateAsync({
            id: newBusiness.id,
            payload: { type: newBusiness.type, logoUrl: uploaded.url },
          })
        }

        await queryClient.invalidateQueries({ queryKey: ['businesses'] })
        showSuccess(m.admin_businesses_create_success())
      } else if (mode === 'edit' && businessId) {
        let logoUrl: string | null | undefined

        if (pendingFile) {
          const uploaded = await uploadImage(pendingFile, {
            entityType: ImageEntityType.BUSINESS_LOGO,
          })
          logoUrl = uploaded.url
        } else if (shouldClearLogo) {
          logoUrl = null
        }

        const payload: UpdateBusinessRequest = {
          name: values.name?.trim(),
          type: values.type,
          location: `${values.locationCity.trim()}, ${countryLabel.trim()}`,
          currency: values.currency?.toUpperCase(),
          ...(values.features.length ? { features: values.features } : {}),
          ...(logoUrl === undefined ? {} : { logoUrl }),
        }

        await updateMutation.mutateAsync({ id: businessId, payload })
        showSuccess(m.admin_businesses_update_success())
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
      title={mode === 'add' ? m.admin_businesses_add_title() : m.admin_businesses_edit_title()}
      footer={
        <>
          <Button variant='ghost' onClick={onClose} disabled={isLoading}>
            {m.admin_businesses_cancel()}
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? m.admin_businesses_saving() : m.admin_businesses_save()}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 px-4'>
        <LogoUploadField
          label={m.admin_businesses_logo_label()}
          currentUrl={currentBusiness?.logoUrl}
          onFileChange={handleLogoFileChange}
          shape='square'
        />

        <div className='space-y-2'>
          <Label htmlFor={nameId} className='text-sm font-medium'>
            {m.admin_businesses_name_label()}
          </Label>
          <div className='relative'>
            <Building2 className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              id={nameId}
              placeholder={m.admin_businesses_name_placeholder()}
              className='pl-10'
              {...register('name')}
            />
          </div>
          {errors.name && <p className='text-xs text-red-500'>{errors.name.message}</p>}
        </div>

        <div className='space-y-2'>
          <Label htmlFor={typeId} className='text-sm font-medium'>
            {m.admin_businesses_type_label()}
          </Label>
          <Controller
            name='type'
            control={control}
            render={({ field }) => (
              <SearchSelect
                id={typeId}
                value={field.value}
                onChange={field.onChange}
                options={businessTypeOptions()}
                placeholder={m.admin_businesses_select_type_placeholder()}
              />
            )}
          />
          {errors.type && <p className='text-xs text-red-500'>{errors.type.message}</p>}
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor={countryId} className='text-sm font-medium'>
              {m.admin_businesses_country_label()}
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
                  placeholder={m.admin_businesses_select_country_placeholder()}
                  startIcon={<MapPin className='h-4 w-4' />}
                />
              )}
            />
            {errors.locationCountry && (
              <p className='text-xs text-red-500'>{errors.locationCountry.message}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor={cityId} className='text-sm font-medium'>
              {m.admin_businesses_city_label()}
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
                  placeholder={
                    selectedCountry
                      ? m.admin_businesses_select_city_placeholder()
                      : m.admin_businesses_select_country_first_placeholder()
                  }
                  disabled={!selectedCountry}
                />
              )}
            />
            {errors.locationCity && (
              <p className='text-xs text-red-500'>{errors.locationCity.message}</p>
            )}
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor={currencyId} className='text-sm font-medium'>
            {m.admin_businesses_currency_label()}
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
                placeholder={m.admin_businesses_select_currency_placeholder()}
              />
            )}
          />
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
