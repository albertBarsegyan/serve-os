const SITE_NAME = 'ServeOS'
const DEFAULT_DESCRIPTION =
  'ServeOS is a next-generation hospitality operations platform for restaurants, cafes, and bars — QR table ordering, kitchen display, table management, and payments in one system.'
const DEFAULT_OG_IMAGE = '/favicon/web-app-manifest-512x512.png'

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? '').replace(/\/$/, '')

export function absoluteUrl(path: string): string {
  return SITE_URL ? `${SITE_URL}${path}` : path
}

export function buildTitle(pageTitle?: string): string {
  return pageTitle ? `${pageTitle} | ${SITE_NAME}` : `${SITE_NAME} - Next-Gen Hospitality OS`
}

interface SeoMetaOptions {
  title?: string
  description?: string
  image?: string
  path?: string
  type?: 'website' | 'article'
}

/** Route-level `head()` should spread this and override `title`/`description`/`image` per page. */
export function buildSeoMeta(options: SeoMetaOptions = {}) {
  const title = buildTitle(options.title)
  const description = options.description ?? DEFAULT_DESCRIPTION
  const image = absoluteUrl(options.image ?? DEFAULT_OG_IMAGE)
  const url = options.path ? absoluteUrl(options.path) : undefined

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:type', content: options.type ?? 'website' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    ...(url ? [{ property: 'og:url', content: url }] : []),
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
  ]
}

/** Second layer of protection beyond robots.txt for gated/auth routes. */
export const noIndexMeta = [{ name: 'robots', content: 'noindex, nofollow' }]
