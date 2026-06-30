import { cpSync, createReadStream, existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { paraglideVitePlugin } from '@inlang/paraglide-js'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'

// Serves @countrystatecity/countries-browser data locally so the library
// never needs to reach the jsDelivr CDN.
//   dev  → Vite middleware streams JSON files directly from node_modules
//   prod → files are copied into .output/public/csc-data/ after the bundle is written
function cscDataPlugin(): Plugin {
  const pkgDist = resolve('node_modules/@countrystatecity/countries-browser/dist')

  return {
    name: 'csc-data',
    configureServer(server) {
      server.middlewares.use('/csc-data', (req, res, next) => {
        const rel = (req.url ?? '').replace(/^\//, '').split('?')[0]
        if (!rel) return next()
        const filePath = resolve(pkgDist, rel)
        if (existsSync(filePath) && statSync(filePath).isFile()) {
          res.setHeader('Content-Type', 'application/json')
          createReadStream(filePath).pipe(res)
        } else {
          next()
        }
      })
    },
    closeBundle() {
      const outputDir = resolve('.output/public')
      if (!existsSync(outputDir)) return
      cpSync(resolve(pkgDist, 'data'), resolve(outputDir, 'csc-data/data'), {
        recursive: true,
        force: true,
      })
    },
  }
}

const config = defineConfig({
  nitro: {
    serverDir: 'server',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/react-dom/')) return 'vendor-react-dom'
          if (
            id.includes('/node_modules/react/') &&
            !id.includes('react-dom') &&
            !id.includes('@tanstack')
          )
            return 'vendor-react'
          if (
            id.includes('@tanstack/react-query/') &&
            !id.includes('@tanstack/react-start') &&
            !id.includes('@tanstack/react-router')
          )
            return 'vendor-tanstack-query'
          // TanStack Router core (1.4 MB source → ~250 kB minified) — split from the
          // main entry chunk so it stays cached across app-code deployments.
          if (
            id.includes('@tanstack/router-core/') ||
            id.includes('@tanstack/react-router/') ||
            id.includes('@tanstack/history/')
          )
            return 'vendor-tanstack-router'
          // @base-ui/react (popover, button, progress) + floating-ui positioning engine.
          // Isolating here removes ~99 kB from the PaletteSwitcher shared chunk and
          // keeps UI-primitive code stable between feature deployments.
          if (id.includes('@base-ui/') || id.includes('@floating-ui/')) return 'vendor-ui'
          // socket.io-client + engine.io-client — shared by orders/kitchen/tables/customer pages.
          if (id.includes('socket.io-client') || id.includes('engine.io')) return 'vendor-socket'
        },
      },
    },
  },
  plugins: [
    cscDataPlugin(),
    devtools(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      strategy: ['url', 'baseLocale'],
    }),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    nitro(),
    viteReact(),
    VitePWA({
      registerType: 'prompt',
      // Registration is handled manually via PwaUpdatePrompt component (useEffect + dynamic import),
      // which avoids the virtual:pwa-register module being pulled into the Nitro SSR bundle.
      injectRegister: null,
      strategies: 'generateSW',
      // tanstackStart() sets build.outDir to .output/public at runtime, but vite-plugin-pwa
      // resolves outDir at plugin-init time before that override kicks in, so we pin it here.
      outDir: '.output/public',
      manifest: {
        name: 'Serve OS',
        short_name: 'Serve OS',
        description: 'Next-generation hospitality operations platform',
        theme_color: '#05140B',
        background_color: '#05140B',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait-primary',
        categories: ['business', 'productivity'],
        icons: [
          // 96 × 96 — general-purpose small icon (browser UI, task switcher)
          {
            src: '/favicon/favicon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any',
          },
          // 180 × 180 — Apple touch icon reused as a PWA icon for mid-range displays
          {
            src: '/favicon/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any',
          },
          // 192 × 192 — required PWA icon; maskable so Android adaptive icons work
          {
            src: '/favicon/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          // 512 × 512 — required PWA icon (splash screen, install prompt)
          // Also listed as 'any' so browsers can use it for general display without masking
          {
            src: '/favicon/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/favicon/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache built JS/CSS/font/image assets. HTML documents are NOT precached —
        // they're SSR'd per-request. The offline.html is auto-precached as navigateFallback.
        globPatterns: ['**/*.{js,css,ico,png,svg,woff2,mp3}'],

        // Serve /offline.html for any navigation that fails while the user is offline.
        // Using a static HTML file (not a TanStack Router route) avoids the SSR beforeLoad
        // auth chain running against a dead network and triggering the error boundary instead.
        navigateFallback: '/offline.html',

        // Do not apply the navigation fallback to API paths or auth routes.
        // /api/* requests should fail naturally; /auth/* routes need live network for sign-in.
        navigateFallbackDenylist: [/^\/api\//, /^\/auth\//],

        runtimeCaching: [
          // Built assets carry content-hash filenames → CacheFirst is safe for 1 year.
          {
            urlPattern: /\/assets\/.+\.(js|css)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'build-assets',
              expiration: { maxEntries: 150, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
          // Web fonts (Google Fonts, fontsource) — CacheFirst, long TTL.
          {
            urlPattern: /\.(woff2?|ttf|otf|eot)(\?.*)?$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
          // Static images / favicons — StaleWhileRevalidate keeps them fresh without blocking.
          {
            urlPattern: /\.(png|jpe?g|svg|gif|webp|ico)(\?.*)?$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          // API: NetworkOnly — auth is cookie-based; caching would risk serving one user's
          // data to another session. Do not add API endpoints here without explicit sign-off.
          {
            urlPattern: /\/api\//,
            handler: 'NetworkOnly',
          },
        ],
      },
      // Disable SW in dev to avoid stale-cache confusion during development.
      // Test PWA behaviour via: pnpm build && pnpm start
      devOptions: { enabled: false },
    }),
  ],
})

export default config
