import { Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { Checkbox } from '#/components/ui/checkbox'
import { Label } from '#/components/ui/label'
import type { BusinessFeature, BusinessType } from '#/features/business/api/business-domain'
import {
  businessFeature,
  businessFeatureLabel,
  businessFeaturePresets,
  businessTypeLabel,
} from '#/features/business/api/business-domain'
import { m } from '#/paraglide/messages'
import { pluralMessage } from '#/shared/libs/utils/plural.utils'

interface FeatureSelectorProps {
  selectedFeatures: BusinessFeature[]
  onFeaturesChange: (features: BusinessFeature[]) => void
  selectedType: keyof typeof BusinessType
  readonly?: boolean
}

export function FeatureSelector({
  selectedFeatures,
  onFeaturesChange,
  selectedType,
  readonly = false,
}: Readonly<FeatureSelectorProps>) {
  const presetFeatures = useMemo(() => businessFeaturePresets[selectedType], [selectedType])

  const handleFeatureToggle = (feature: BusinessFeature, checked: boolean) => {
    if (readonly) return

    if (checked) {
      onFeaturesChange([...selectedFeatures, feature])
    } else {
      onFeaturesChange(selectedFeatures.filter((f) => f !== feature))
    }
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between gap-3'>
        <p className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
          {m.shared_feature_selector_heading()}
        </p>
        <span className='text-xs text-muted-foreground'>
          {pluralMessage(selectedFeatures.length, {
            one: m.shared_feature_selector_selected_count_one,
            other: m.shared_feature_selector_selected_count_other,
          })}
        </span>
      </div>

      <div className='grid gap-3 sm:grid-cols-2'>
        {businessFeature.map((feature) => {
          const featureId = `feature-${feature.toLowerCase()}`
          const isChecked = selectedFeatures.includes(feature)

          return (
            <div
              key={feature}
              className='flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-sm'
            >
              <Checkbox
                id={featureId}
                checked={isChecked}
                onChange={(e) => handleFeatureToggle(feature, e.currentTarget.checked)}
                disabled={readonly}
                className='mt-1'
              />
              <Label htmlFor={featureId} className={readonly ? '' : 'cursor-pointer'}>
                <span>
                  <span className='block font-semibold text-foreground'>
                    {businessFeatureLabel(feature)}
                  </span>
                  <span className='block text-xs text-muted-foreground'>
                    {presetFeatures.includes(feature)
                      ? m.shared_feature_selector_default_for({
                          type: businessTypeLabel(selectedType),
                        })
                      : m.shared_feature_selector_optional_feature()}
                  </span>
                </span>
              </Label>
            </div>
          )
        })}
      </div>

      {presetFeatures.length > 0 && (
        <div className='flex flex-col gap-4 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-start gap-3'>
            <Sparkles className='mt-0.5 h-5 w-5 text-primary' />
            <div>
              <p className='text-sm font-semibold text-foreground'>
                {m.shared_feature_selector_default_preset_for({
                  type: businessTypeLabel(selectedType),
                })}
              </p>
              <p className='text-xs text-muted-foreground'>
                {m.shared_feature_selector_default_preset_hint()}
              </p>
            </div>
          </div>

          <div className='flex flex-wrap gap-2'>
            {presetFeatures.map((feature) => (
              <span
                key={feature}
                className='rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground'
              >
                {businessFeatureLabel(feature)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
