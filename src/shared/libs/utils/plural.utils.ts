import { getLocale } from '#/paraglide/runtime'

type PluralVariants = {
  zero?: (args: { count: number }) => string
  one?: (args: { count: number }) => string
  other: (args: { count: number }) => string
}

/**
 * Selects the correct plural-form message via Intl.PluralRules (real CLDR data per locale —
 * e.g. Latvian's zero/one/other categories) rather than a hand-rolled `count === 1` check.
 */
export function pluralMessage(count: number, variants: PluralVariants): string {
  const category = new Intl.PluralRules(getLocale()).select(count)
  const fn =
    (category === 'zero' ? variants.zero : category === 'one' ? variants.one : undefined) ??
    variants.other
  return fn({ count })
}
