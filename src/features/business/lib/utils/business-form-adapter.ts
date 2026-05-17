import type { CreateBusinessRequest } from '#/features/business/api/business-domain.ts'
import type { CreateBusinessFormValues } from '#/features/business/lib/schemas/business-form.schema.ts'

function parseWorkingHoursJson(workingHoursJson: string): Record<string, string> | undefined {
  const trimmed = workingHoursJson.trim()
  if (!trimmed) return undefined

  return JSON.parse(trimmed) as Record<string, string>
}

export const businessFormAdapter = {
  toApi: (formData: CreateBusinessFormValues): CreateBusinessRequest => {
    const workingHours = formData.workingHoursJson
      ? parseWorkingHoursJson(formData.workingHoursJson)
      : undefined

    return {
      name: formData.name.trim(),
      type: formData.type,
      location: formData.location.trim(),
      currency: formData.currency.trim().toUpperCase(),
      ...(workingHours === undefined ? {} : { workingHours }),
      ...(formData.features.length ? { features: formData.features } : {}),
    }
  },
}
