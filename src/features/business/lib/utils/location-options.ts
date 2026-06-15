import { City, Country } from 'country-state-city'

export interface LocationOption {
  value: string
  label: string
}

export interface CurrencyOption {
  value: string
  label: string
}

// ─── Lazy singletons ──────────────────────────────────────────────────────────

const lazy = <T>(init: () => T): (() => T) => {
  let cache: T | undefined
  let initialized = false
  return () => {
    if (!initialized) {
      cache = init()
      initialized = true
    }
    return cache as T
  }
}

const getCountries = lazy(() => Country.getAllCountries())
const getCountryMap = lazy(() => new Map(getCountries().map((c) => [c.isoCode, c])))
const getCountryOpts = lazy(() =>
  getCountries()
    .map(({ isoCode, name }) => ({ value: isoCode, label: name }))
    .sort((a, b) => a.label.localeCompare(b.label)),
)
const getCurrencyOpts = lazy(() =>
  Array.from(
    new Set(
      getCountries()
        .filter((c) => c.currency)
        .map((c) => c.currency.toUpperCase()),
    ),
  )
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value })),
)

const cityCache = new Map<string, LocationOption[]>()

// ─── Public API ───────────────────────────────────────────────────────────────

export const getCountryOptions = (): LocationOption[] => getCountryOpts()

export const getCityOptions = (countryCode?: string): LocationOption[] => {
  if (!countryCode) return []
  if (cityCache.has(countryCode)) return cityCache.get(countryCode)!

  const seen = new Set<string>()
  const cities = (City.getCitiesOfCountry(countryCode) ?? [])
    .reduce<LocationOption[]>((acc, { name }) => {
      if (!seen.has(name)) {
        seen.add(name)
        acc.push({ value: name, label: name })
      }
      return acc
    }, [])
    .sort((a, b) => a.label.localeCompare(b.label))

  cityCache.set(countryCode, cities)
  return cities
}

export const getCountryNameByCode = (countryCode?: string): string | undefined =>
  countryCode ? getCountryMap().get(countryCode)?.name : undefined

export const getCountryCurrencyByCode = (countryCode?: string): string | undefined => {
  if (!countryCode) return undefined
  const currency = getCountryMap().get(countryCode)?.currency
  return currency ? currency.toUpperCase() : undefined
}

export const getCurrencyOptions = (): CurrencyOption[] => getCurrencyOpts()

export const formatBackendLocation = (city: string, countryCode: string): string => {
  const countryLabel = getCountryNameByCode(countryCode) ?? countryCode
  return `${city.trim()}, ${countryLabel.trim()}`
}
