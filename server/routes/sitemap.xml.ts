import { defineEventHandler, getRequestURL } from 'nitro/h3'

// Only the public, statically-known marketing pages are listed here. The customer
// menu (`/customer/menu`) is scoped per QR/table session and has no stable, crawlable
// URL, and there is currently no public endpoint to enumerate active businesses —
// revisit this once one exists.
const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
]

function buildSitemap(siteUrl: string): string {
  const urls = STATIC_PAGES.map(
    ({ path, priority, changefreq }) => `  <url>
    <loc>${siteUrl}${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  ).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

export default defineEventHandler((event) => {
  const siteUrl = (process.env.SITE_URL || getRequestURL(event).origin).replace(/\/$/, '')

  event.res.headers.set('content-type', 'application/xml; charset=utf-8')
  return buildSitemap(siteUrl)
})
