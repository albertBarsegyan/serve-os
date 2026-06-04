import { Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { Checkbox } from '#/components/ui/checkbox'
import { Label } from '#/components/ui/label'
import type { BusinessFeature, BusinessType } from '#/features/business/api/business-domain'
import {
  businessFeature,
  businessFeatureLabels,
  businessFeaturePresets,
  businessTypeLabels,
} from '#/features/business/api/business-domain'

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
          Features
        </p>
        <span className='text-xs text-muted-foreground'>{selectedFeatures.length} selected</span>
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
                    {businessFeatureLabels[feature]}
                  </span>
                  <span className='block text-xs text-muted-foreground'>
                    {presetFeatures.includes(feature)
                      ? `Default for ${businessTypeLabels[selectedType]}`
                      : 'Optional feature'}
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
                Default preset for {businessTypeLabels[selectedType]}
              </p>
              <p className='text-xs text-muted-foreground'>
                If you do not select features, backend defaults will be applied.
              </p>
            </div>
          </div>

          <div className='flex flex-wrap gap-2'>
            {presetFeatures.map((feature) => (
              <span
                key={feature}
                className='rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground'
              >
                {businessFeatureLabels[feature]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
