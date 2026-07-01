import { defineEventHandler, getRequestURL } from 'nitro/h3'

// Public, indexable surface — everything else (dashboard, orders, menu management,
// auth, etc.) lives behind the `_admin` / `auth` layout routes and is gated below.
const DISALLOWED_PATHS = [
  '/dashboard',
  '/orders',
  '/kitchen',
  '/menu',
  '/modifiers',
  '/tables',
  '/payments',
  '/payment-methods',
  '/settings',
  '/staff',
  '/user-settings',
  '/businesses',
  '/auth',
  '/api/',
]

// Explicitly allow known AI/LLM crawlers on public routes rather than leaving them
// to the catch-all group, so they aren't blocked by mistake as scrapers are locked down.
const AI_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'PerplexityBot',
  'CCBot',
  'anthropic-ai',
]

function buildRobotsTxt(siteUrl: string): string {
  const disallowLines = DISALLOWED_PATHS.map((path) => `Disallow: ${path}`).join('\n')
  const agents = ['*', ...AI_CRAWLERS]
  const groups = agents.map((agent) => `User-agent: ${agent}\nAllow: /\n${disallowLines}`)

  return `${groups.join('\n\n')}\n\nSitemap: ${siteUrl}/sitemap.xml\n`
}

export default defineEventHandler((event) => {
  const siteUrl = (process.env.SITE_URL || getRequestURL(event).origin).replace(/\/$/, '')

  event.res.headers.set('content-type', 'text/plain; charset=utf-8')
  return buildRobotsTxt(siteUrl)
})
