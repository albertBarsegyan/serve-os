import {
  getCountries as _getCountries,
  getCountryNameByCode as _getCountryNameByCode,
  configure,
  getAllCitiesOfCountry,
} from '@countrystatecity/countries-browser'

// Use locally-served data instead of the default jsDelivr CDN.
// Dev:  Vite middleware streams files from node_modules (cscDataPlugin).
// Prod: files are copied to .output/public/csc-data/ during build (cscDataPlugin).
configure({ baseURL: '/csc-data' })

export interface LocationOption {
  value: string
  label: string
}

export interface CurrencyOption {
  value: string
  label: string
}

let countryOptsPromise: Promise<LocationOption[]> | null = null
let currencyOptsPromise: Promise<CurrencyOption[]> | null = null

const loadCountryOpts = (): Promise<LocationOption[]> => {
  countryOptsPromise ??= _getCountries().then((countries) =>
    countries
      .map(({ iso2, name }) => ({ value: iso2, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  )
  return countryOptsPromise
}

const loadCurrencyOpts = (): Promise<CurrencyOption[]> => {
  currencyOptsPromise ??= _getCountries().then((countries) =>
    Array.from(new Set(countries.filter((c) => c.currency).map((c) => c.currency.toUpperCase())))
      .sort((a, b) => {
        const priority: Record<string, number> = {
          USD: 0,
          EUR: 1,
        }

        const priorityA = priority[a] ?? 2
        const priorityB = priority[b] ?? 2

        if (priorityA !== priorityB) {
          return priorityA - priorityB
        }

        return a.localeCompare(b)
      })
      .map((value) => ({ value, label: value })),
  )

  return currencyOptsPromise
}

const cityCache = new Map<string, LocationOption[]>()

export const getCountryOptions = (): Promise<LocationOption[]> => loadCountryOpts()

export const getCityOptions = async (countryCode?: string): Promise<LocationOption[]> => {
  if (!countryCode || typeof window === 'undefined') return []

  const cached = cityCache.get(countryCode)
  if (cached) return cached

  const rawCities = await getAllCitiesOfCountry(countryCode)
  const seen = new Set<string>()
  const cities = rawCities
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

export const getCountryNameByCode = async (countryCode?: string): Promise<string | undefined> => {
  if (!countryCode) return undefined
  return (await _getCountryNameByCode(countryCode)) ?? undefined
}

export const getCountryCurrencyByCode = async (
  countryCode?: string,
): Promise<string | undefined> => {
  if (!countryCode) return undefined
  const countries = await _getCountries()
  const country = countries.find((c) => c.iso2 === countryCode)
  return country?.currency ? country.currency.toUpperCase() : undefined
}

export const getCurrencyOptions = (): Promise<CurrencyOption[]> => loadCurrencyOpts()

export const formatBackendLocation = async (city: string, countryCode: string): Promise<string> => {
  const countryLabel = (await getCountryNameByCode(countryCode)) ?? countryCode
  return `${city.trim()}, ${countryLabel.trim()}`
}
