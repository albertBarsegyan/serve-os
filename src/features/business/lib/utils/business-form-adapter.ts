import type { CreateBusinessFormValues } from '#/features/business/lib/schemas/create-business-form.schema.ts'
import { formatBackendLocation } from '#/features/business/lib/utils/location-options.ts'

export const businessFormAdapter = {
  toApi: async (formData: CreateBusinessFormValues) => {
    return {
      name: formData.name.trim(),
      type: formData.type,
      location: await formatBackendLocation(formData.locationCity, formData.locationCountry),
      currency: formData.currency.trim().toUpperCase(),
      ...(formData.workingHoursJson.trim()
        ? { workingHours: formData.workingHoursJson.trim() }
        : {}),
      ...(formData.features.length ? { features: formData.features } : {}),
    }
  },
}
