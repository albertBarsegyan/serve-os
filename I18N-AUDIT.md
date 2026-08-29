# i18n Audit — Adding Latvian (`lv`)

**Scope of this document:** Phase 1 audit only. No code changed. Read this fully before approving
Phase 2 — the codebase is in a more advanced i18n state than "add a second locale" implies, and a
few of the findings below change what Phase 2 actually needs to do.

---

## 0. TL;DR — the big surprise

This is **not** a greenfield i18n setup. The app already has:

- `@inlang/paraglide-js` **v2.13.1** fully wired (Vite plugin, SSR middleware, TanStack Router
  rewrite integration, `<html lang>`, a working `LanguageSwitcher` component already mounted in
  both the admin sidebar and the landing/customer nav).
- A **second locale, `hy` (Armenian)**, already live with 983 of 984 messages translated.
- **987 Paraglide messages already exist** (`en` is the source of truth, `hy` is 99.9% complete).
- Generated `urlPatterns` for `/hy/...` already exist in `src/paraglide/runtime.js` — but they are
  **currently inert**: the active `strategy` in `vite.config.ts` is
  `['cookie', 'preferredLanguage', 'baseLocale']`, which does **not** include `'url'`. Paraglide's
  own generated code confirms this: `TREE_SHAKE_URL_STRATEGY_USED = false` in `runtime.js`. So
  today, locale is resolved purely from cookie / `Accept-Language`, never from the URL path, even
  though the `/hy/` URL machinery already exists.

So "add Latvian under `/lv`" is really two projects bolted together:

1. **Turn on URL-based routing** for the *existing* locale system (this affects `hy` too — see
   §4.1, this is a decision point, not just an `lv` change).
2. **Add `lv`** as a third locale and translate it, alongside migrating the ~300 strings that never
   got swept into the original `en`/`hy` migration (§2).

---

## 1. Current i18n setup inventory

| Item | Value |
|---|---|
| `@inlang/paraglide-js` | `^2.13.1` (package.json) — confirmed against the installed `src/paraglide/runtime.js` and `server.js`, which are authoritative for this exact version |
| `project.inlang/settings.json` | `baseLocale: "en"`, `locales: ["en", "hy"]`, plugin `plugin.inlang.messageFormat` with `pathPattern: "./messages/{locale}.json"`, plus `plugin-m-function-matcher` (enables the `_one`/`_other`/etc. plural-key convention) |
| Message files | `messages/en.json` (987 keys, source of truth) and `messages/hy.json` (983 keys — **1 key already missing**: `landing_pricing_scale_cta`, pre-existing drift unrelated to this task, flag for cleanup) |
| Vite plugin config | `vite.config.ts`: `paraglideVitePlugin({ project: './project.inlang', outdir: './src/paraglide', strategy: ['cookie', 'preferredLanguage', 'baseLocale'] })` — **no `'url'` strategy active** |
| SSR locale resolution | `src/start.ts` — `paraglideMiddleware` wrapped in a TanStack Start request middleware, backed by `AsyncLocalStorage`, so `getLocale()` is correct during SSR (no flash-of-wrong-locale risk once url routing is added) |
| Router integration | `src/router.tsx` — already wires `rewrite: { input: deLocalizeUrl, output: localizeUrl }`. This means `Link to=`, `navigate()`, and `redirect()` calls **already get automatic locale-URL rewriting for free** once `lv` is a real locale with `url` in the strategy — this is the standard Paraglide+TanStack Start pattern and it's already in place. |
| `<html lang>` | `src/routes/__root.tsx` — `getLocale()` used in both `RootDocument` and `RootErrorComponent`, plus a client-side `document.documentElement.setAttribute('lang', ...)` in `beforeLoad`. Already correct, SSR-safe. |
| Language switcher | `src/components/language-switcher.tsx` — already exists, already used in `src/routes/_admin.tsx` (admin sidebar) and `src/pages/landing/landing/ui/landing-page.tsx` (landing nav + mobile nav) and `src/pages/customer/menu/ui/views/menu-view.tsx` (customer menu header). **Locale metadata is hardcoded**: `LOCALE_META: Record<Locale, {...}>` in `language-switcher.tsx:8-11` only has `en`/`hy` entries — needs an `lv` entry (flag, code, endonym label) as part of Phase 2, trivial. |
| Message call site count | ~50 files import `{ m }` from `#/paraglide/messages` already |

**Message coverage by prefix** (`messages/en.json`, 987 keys):

| Prefix | Count | Slice |
|---|---:|---|
| `admin_` | 527 | admin dashboard/orders/menu/staff/etc. |
| `landing_` | 114 | marketing site |
| `customer_` | 110 | customer QR menu flow |
| `product_` | 66 | product forms/modals |
| `staff_` | 58 | staff PIN login, roster, staff order flow |
| `shared_` | 51 | shared UI (pagination, confirm-delete, etc.) |
| `about_` | 20 | landing `/about` |
| `auth_` | 19 | sign-in/sign-up |
| `footer_` | 14 | site footer |
| misc (`home`, `language`, `current_locale`, `learn`, `example`) | 5 | scaffold leftovers from the original Paraglide template — `example_message`, `home_page`, `learn_router` look unused, worth pruning in Phase 2 |

Given ~300 additional hardcoded strings found below (§2), roughly **75% of user-facing copy is
already migrated**; the remaining 25% is concentrated in a handful of never-touched files (see
below) rather than spread evenly.

---

## 2. Strings not yet migrated to Paraglide messages

Full findings from a systematic pass over `src/routes/`, `src/pages/`, `src/widgets/`,
`src/features/`, `src/entities/`, `src/shared/`, and `src/components/` (excluding
`src/components/ui/`, the shadcn primitives, and excluding anything already using `m.xxx()`).

**Rough total: ~300 strings**, heavily concentrated in a short list of files that appear to have
been added *after* the original migration pass, plus every Zod schema file (schemas were never
touched at all).

### 2.1 Completely unmigrated files (no `m` import at all)

These are the highest-value targets — each is either a full page or a full widget with zero
existing Paraglide coverage:

| File | What it is | Approx. strings |
|---|---|---:|
| `src/routes/setup.tsx` | Business onboarding form (first-run flow for new owners) | ~50+ (headings, labels, placeholders, "Business created successfully" toast) |
| `src/routes/select-business.tsx` | Multi-business picker | 6 |
| `src/routes/staff-accept-invite.tsx` | Staff invite acceptance + password set | ~15 (incl. 3 zod messages) |
| `src/routes/staff-change-password.tsx` | Staff password change | ~15 (incl. 4 zod messages) |
| `src/routes/_admin/staff/index.tsx` | "Waiter Workspace" live order view | ~12 |
| `src/pages/display/ui/venue-display-page.tsx` | TV kitchen/order display | ~11 |
| `src/widgets/shared/working-hours-picker.tsx` | Business hours picker (used in setup + settings) | ~11 (incl. day-of-week labels, needs pluralization) |
| `src/widgets/admin/order-table/ui/order-table.tsx` | Admin order table widget | ~9 |
| `src/widgets/customer/menu-list/ui/menu-list.tsx` | Customer menu list widget | 2 |
| `src/features/customer/menu-pending.tsx` | Customer "connecting" skeleton screen | 2 |
| `src/pages/admin/kitchen/lib/kanban.ts` | Kanban column titles (Queue/Preparing/Ready) | 3 |
| `src/components/header.tsx` | Marketing site header nav (separate from landing-page.tsx's own nav) | 5 |
| `src/features/palette/ui/PaletteSwitcher.tsx` | Color palette switcher (aria-labels, popover heading) | 4 |
| `src/features/notification/model/use-order-notifications.ts` | `TOAST_MESSAGES` map for realtime order-lifecycle toasts | 11 |

### 2.2 Every Zod schema file — 100% unmigrated

None of `src/features/*/lib/schemas/*.ts` use Paraglide. All validation messages are hardcoded
English string literals passed to `.min()`, `.email()`, `.refine()`, etc. This is the single
largest uniform category (~70 messages) and the most mechanical to migrate:

- `features/auth/lib/schemas/sign-in-form.schema.ts`, `sign-up.schema.ts`
- `features/business/lib/schemas/create-business-form.schema.ts`, `update-business-form.schema.ts`
- `features/contact/lib/schemas/contact-request.schema.ts` (has a pre-existing bug: the `message`
  field's Zod error says `"Phone number is required"` — copy/paste bug, worth fixing while
  migrating rather than translating the bug)
- `features/display/lib/schemas/create-display.schema.ts`
- `features/platform/lib/schemas/platform.schemas.ts` (largest single file, ~35 messages — **verify
  this is actually rendered in a user-facing form before migrating**, it may be a
  shared API-layer contract used server-side too)
- `features/product/lib/schemas/create-product-form.schema.ts`
- `features/staff-auth/lib/schemas/staff-auth.schema.ts`
- `features/users/lib/schemas/change-password.schema.ts`, `update-profile.schema.ts`
- Plus the three schema files under `src/routes/staff-accept-invite.tsx` and
  `staff-change-password.tsx` (schemas are inlined in the route file, not in `lib/schemas/`)

### 2.3 Toast strings

- `src/shared/libs/hooks/toast.ts` — the **shared wrapper itself** hardcodes generic titles:
  `toast.success('Success!', ...)`, `toast.error('Went wrong!', ...)` (note: "Went wrong!" reads as
  a typo for "Something went wrong!" — worth fixing the copy while migrating), `toast.info('Info', ...)`.
  These are used by every `showSuccess`/`showError` call site app-wide, so this is a
  high-leverage, low-effort fix (3 messages, ~30+ call sites benefit).
- `src/features/auth/lib/constants/ui-messages.ts` — `authUiMessage.SUCCESS_SIGN_IN` /
  `SUCCESS_SIGN_UP` / `SUCCESS_LOGOUT` (the last one looks unused/dead).
- Several route files pass hardcoded strings directly to `showError`/`showSuccess` instead of the
  constants file pattern (`staff-change-password.tsx`, `staff-accept-invite.tsx`, `setup.tsx`,
  `_admin/staff/index.tsx`).

### 2.4 Enum-to-label maps

Several `Record<Enum, string>` maps render hardcoded English directly with no Paraglide involvement:

- `src/features/business/api/business-domain.ts` — `businessTypeLabels` (8 entries: Restaurant,
  Cafe, Bar, Fast Food, Food Truck, Hotel, Event Venue, Other) and `businessFeatureLabels`
  (11 entries)
- `src/features/notification/model/use-order-notifications.ts` — `TOAST_MESSAGES` (11 entries,
  order-lifecycle event copy)
- `src/features/palette/lib/palettes.ts` — palette names (Ocean, Terracotta, Sage, ...). **Judgment
  call**: these read like proper nouns/brand-ish labels (similar to not translating product names)
  — recommend leaving untranslated, but flagging since they're rendered as visible UI labels via
  `title`/`aria-label` in `PaletteSwitcher.tsx`.
- `src/widgets/shared/working-hours-picker.tsx` — `DAY_LABELS` (Monday–Sunday)

### 2.5 Locale-hardcoded formatting

- **`src/shared/libs/utils/price.utils.ts:2`** — `Intl.NumberFormat('en-US', { style: 'currency', ... })`
  is hardcoded to `en-US` regardless of the active Paraglide locale. This is the **single shared
  price formatter** used across order, payment, menu, and dashboard pages — so it's one fix with
  wide impact. Needs to switch to a locale→BCP47 map (`en` → `en-US`, `hy` → `hy-AM`, `lv` → `lv-LV`)
  driven by `getLocale()`. This is exactly the file that needs to produce `"12,00 €"` for Latvian
  per the constraints below — currently it would produce `"€12.00"` or similar for every locale.
- No other `toLocaleDateString`/`Intl.DateTimeFormat`/hardcoded date-pattern calls were found
  anywhere in `src/shared/` — dates don't appear to be formatted client-side yet at all (worth
  double-checking `src/entities/order` and `src/pages/admin/orders` directly in Phase 2, since
  order timestamps must exist somewhere — the search here was scoped to `src/shared/`).

### 2.6 SEO defaults

`src/shared/libs/seo/meta.ts` — `DEFAULT_DESCRIPTION`, `buildTitle()`'s `"{name} - Next-Gen Hospitality OS"`
suffix, and `SITE_NAME` are all hardcoded English, used by every route's `<title>`/`og:*`/`twitter:*`
tags unless overridden per-route. Also: **there are currently zero canonical or hreflang link tags
anywhere** — `buildSeoMeta()` only returns `meta`, no `links`. This needs building from scratch in
Phase 2 (see §4.4).

---

## 3. Strings needing variables or pluralization

### 3.1 Already-parameterized messages (existing pattern to follow)

The existing `en.json` already has a solid interpolation convention (`{count}`, `{name}`, `{price}`,
etc.) — e.g. `customer_table: "Table {name}"`, `admin_orders_order_number: "Order #{id}"`. New
messages should follow this.

### 3.2 Real pluralization gap

Only **one** message in the entire existing set uses the proper `_one`/`_other` plural-key
convention: `admin_dashboard_item_count_one` / `admin_dashboard_item_count_other`. Every other
count-based message uses an English "(s)" hack that doesn't actually pluralize:

- `staff_auth_pin_attempts_remaining: "{count} attempt(s) remaining"`
- `admin_orders_items_count: "{count} items"` (always plural form, even for 1)
- `customer_item_count: "{count} item(s)"`
- `product_form_option_count: "{count} option(s)"`
- `admin_kitchen_active_count`, `admin_dashboard_orders_total`, `admin_payments_pending_this_page`, etc.

This isn't new debt introduced by adding `lv` — it already exists for `en`/`hy` — but it becomes
**mandatory to fix for any message Latvian reuses**, because Latvian has three plural categories
(zero / one / other) per the task brief, and the "(s)" hack has no zero/other distinction at all.
**Recommendation**: audit every `{count}` message during migration and convert to proper
`_zero`/`_one`/`_other` keys using the `plugin-m-function-matcher` that's already installed —
don't hand-roll `count === 1 ? ... : ...` logic.

New count-based strings found in this audit that will need the same treatment:
- `src/components/feature-selector.tsx:44` — `` `${selectedFeatures.length} selected` ``
- `src/widgets/shared/working-hours-picker.tsx:112` — `` `${configuredDays} day${configuredDays === 1 ? '' : 's'} configured` `` (already has a manual singular check — exactly the anti-pattern to replace)

### 3.3 Strings needing interpolation that are currently plain concatenation

- `src/features/palette/ui/PaletteSwitcher.tsx:38` — `` `${p.label} palette${isActive ? ' (active)' : ''}` `` — string concatenation building an aria-label; needs a message with a `{label}` variable plus a separate active/inactive message or conditional rendering, not string-glued.
- `src/routes/customer/menu.tsx:62,64` — SEO title/description interpolate `loaderData.businessName` — needs `{businessName}` variable messages.
- `src/pages/display/ui/venue-display-page.tsx:18` — `` `Table ${order.tableNumber}` `` vs `"Takeaway"` ternary — needs a `{number}` variable message plus a separate takeaway message (this exact pattern — "Table {name}" — already exists as `customer_table`, likely reusable).
- `src/routes/_admin/staff/index.tsx:199` — `` `Table ${order.table.number}` `` — same, likely reusable against `customer_table` or `admin_orders_table_number`.
- `src/routes/auth.tsx:54` and `staff-change-password.tsx:170` and `staff-accept-invite.tsx:162` — `` `© ${year} ServeOS. All rights reserved.` `` — an equivalent message already exists (`staff_auth_footer_copyright: "© {year} ServeOS. All rights reserved."`), these three should just reuse it instead of getting new keys.

---

## 4. Blockers and complexities for a clean `/lv` URL-prefix strategy

These are the things that need a decision or extra work beyond "add lv to the locales array."

### 4.1 ⚠️ The `url` strategy is currently disabled — enabling it is a *global* change, not an `lv`-only one

As covered in §0, `strategy` in `vite.config.ts` doesn't include `'url'` today, so `hy` has never
actually been served at `/hy/...` in practice. Turning on URL-prefix routing for `lv` necessarily
turns it on for `hy` too — there's no per-locale strategy toggle, only per-*route* overrides (see
below). **This needs your explicit sign-off**: are you fine with `hy` also becoming URL-prefixed at
`/hy/...` as a side effect, or does that need separate coordination (e.g. if `hy` users have bookmarks
or the marketing site links directly to unprefixed URLs with a cookie-set `hy` locale today)?

### 4.2 ⚠️ Strategy ordering has a real gotcha that affects whether "cookie fallback + Accept-Language initial guess" actually works

Paraglide's default `urlPatterns` use a wildcard (`/:path(.*)?`) for the base locale's unprefixed
pattern. That means the `url` strategy **always resolves to a locale** for any path — including
bare `/` — because `/` itself matches `en`'s unprefixed pattern. Concretely: `resolveLocaleWithStrategies()`
(in `src/paraglide/runtime.js:257-308`) returns the **first** strategy in the array that yields a
match. So:

- If `strategy = ['url', 'cookie', 'preferredLanguage', 'baseLocale']`: a returning visitor with a
  stored `lv` cookie who lands on bare `/` will **always** get `en`, because `url` resolves to `en`
  first and cookie is never consulted. This breaks "cookie persistence as a fallback."
- If `strategy = ['cookie', 'preferredLanguage', 'url', 'baseLocale']`: a **fresh** visitor (no
  cookie yet) who follows a direct link to `/lv/menu` (e.g. a QR code printed on a table) will have
  their locale decided by `preferredLanguage` (their phone's `Accept-Language`, often `en-US` by
  default) *before* `url` is ever consulted — so they could land on `/lv/menu` and see **English**,
  which is almost certainly wrong for a guest who scanned a Latvian-language QR code.

Neither simple global ordering satisfies both "cookie/Accept-Language decide the redirect for a
bare visit" and "an explicit `/lv/...` link is always honored." **Recommendation**: use Paraglide's
`routeStrategies` option (already supported by the installed version — `src/paraglide/runtime.js`
has `findMatchingRouteStrategy`/`getStrategyForUrl`, currently an empty array) to set a **per-route
override**:

- Global default: `['cookie', 'preferredLanguage', 'url', 'baseLocale']` — admin/auth/landing
  surfaces redirect returning/new visitors based on stored preference or browser language.
- Override for `/customer/*` (the QR flow) and its localized `/lv/customer/*`,
  `/b/*/staff-login`, `/display/*`: `['url', 'preferredLanguage', 'baseLocale']` (no cookie) —
  these are link-driven, often-anonymous, often shared-device surfaces where the URL a guest
  actually opened should always win over whatever locale a previous guest on the same device/table
  tablet left behind.

This is a judgment call, not a mechanical fact — flagging it for your decision rather than picking
silently.

### 4.3 Raw `<a href>` tags bypass the router's locale rewrite

`src/router.tsx` already wires `rewrite: { input: deLocalizeUrl, output: localizeUrl }`, so
`Link to=`, `navigate()`, and `redirect()` calls get automatic locale-prefixing "for free." But
that only applies to TanStack Router's own navigation primitives. **`src/pages/landing/landing/ui/landing-page.tsx`**
uses 12 raw `<a href='/...'>` tags (logo, nav anchors, sign-in/sign-up CTAs) instead of `<Link>` —
these will **not** get the `/lv/` prefix automatically and need manual `localizeHref()` wrapping
(the correct pattern already exists elsewhere: `src/shared/api/client-instance.ts:52` does
`window.location.href = localizeHref('/auth/sign-in')` for its own redirect). Same file also has
two more `window.location.href = ...` assignments (lines ~225) that need the same fix.

### 4.4 Hardcoded `locale === 'hy'` checks in the landing page won't generalize to a third locale

`src/pages/landing/landing/ui/landing-page.tsx` has three separate hardcoded Armenian-specific
checks:
- `const isArmenian = locale === 'hy'` (line 64) — drives `small-gap`/`small-font` CSS classes on
  the nav, presumably because Armenian nav labels were wider than the fixed-width nav allowed.
- `storyUrl = locale === 'hy' ? 'https://story.serve-os.net/hy' : 'https://story.serve-os.net/'`
  (line 83) and the mobile-nav equivalent (line 225) — links out to an **external** marketing site
  that has its own `/hy` path. **This site is not part of this repo** — if Latvian needs an
  equivalent `story.serve-os.net/lv`, that's a blocker outside the scope of this codebase change
  and needs coordination with whoever owns that site. Flagging explicitly since it can't be
  resolved by editing this repo.

Both need generalizing from a binary `en`/`hy` check to something locale-list-driven (e.g. a
per-locale "compact nav" flag, and a story-URL map keyed by locale that falls back to the
unprefixed URL for any locale without a known subpath).

### 4.5 SSR / cookie forwarding — no blocker found

`src/shared/api/server-instance.ts` forwards the incoming request's `cookie` header wholesale to
the backend API — this includes the Paraglide locale cookie automatically, no special handling
needed. `src/start.ts`'s `paraglideMiddleware` + `AsyncLocalStorage` already makes `getLocale()`
correct during SSR with no hydration flash. This part of the architecture is already sound and
needs no rework.

### 4.6 `offline.html` is a static file outside the SSR/Paraglide pipeline

The PWA offline fallback (served by `vite-plugin-pwa`'s `navigateFallback`) is a static HTML file
with hardcoded English (`<html lang="en">`, "You're offline"). It's served directly by the service
worker when the network is down, before any SSR/routing happens — it **cannot** use `getLocale()`
or Paraglide messages at all. Options: leave it English-only (reasonable — it's a rare, low-stakes
edge case), or hand-duplicate it per locale and pick one via `document.documentElement.lang` client
script. Recommend leaving as-is unless you want it addressed.

### 4.7 No drift-detection between `en.json` and `lv.json`

The task requires `en.json` and `lv.json` to "fail loudly if they drift," but no such check exists
today (the pre-existing `hy.json` has already silently drifted by one key, as noted in §1). This
needs to be built in Phase 2 — recommend a small Vitest test that diffs `Object.keys()` across all
locale files and fails on any mismatch, run as part of `pnpm test`.

---

## 5. Route groups — do they need `/lv`?

| Route group | Files | Recommendation | Notes |
|---|---|---|---|
| **`customer/` (QR menu flow)** | `routes/customer/menu.tsx` | **Yes — highest priority** | This is the one actual restaurant guests see. Already has 110 `customer_` messages, a working language switcher in the menu header, and full SSR session/cart flow. Per §4.2, this is also the surface where strict URL-first locale resolution matters most (QR codes are pre-printed with a specific locale). |
| **`auth/` (sign-in, sign-up)** | `routes/auth.tsx`, `auth/sign-in.tsx`, `auth/sign-up.tsx` | Yes | Already has 19 `auth_` messages and is fully migrated except the shared footer/copyright line. First screen many local (Latvian-speaking) business owners will see. |
| **`_admin` (dashboard, orders, menu, staff, etc.)** | `routes/_admin.tsx` + all `_admin/*.tsx` | Yes | 527 existing `admin_` messages — by far the largest slice, already has the language switcher mounted in the sidebar. Owners/staff running a Latvian restaurant will want to operate the whole back office in Latvian. |
| **`_site` (landing, about)** | `routes/_site.tsx`, `_site/index.tsx`, `_site/about.tsx` | Yes, continue existing pattern | Already has 114 `landing_` + 20 `about_` messages and `hy` translations for both — but see §4.3/§4.4, this is the route group with the most non-mechanical blockers (raw `<a>` tags, hardcoded `hy` checks, external site dependency). |
| Top-level onboarding routes: `setup.tsx`, `select-business.tsx`, `staff-accept-invite.tsx`, `staff-change-password.tsx` | outside any layout group | Yes | These sit outside `_admin`/`auth` route groups but are part of the same owner/staff-facing flow and are currently the least-migrated files in the whole app (§2.1) — will need both string migration and URL-prefix coverage. |
| `display/$token.tsx` (TV kitchen/order display) | — | Yes, but lower priority | Public-facing screen inside the venue, staff-adjacent rather than guest-facing. Currently 100% unmigrated (§2.1). |
| `b/$slug/staff-login.tsx` (staff PIN login) | — | Yes | Already fully migrated to `m.xxx()`, just needs URL-prefix coverage. |

No route group is a clear "skip" — the app is genuinely bilingual-and-growing rather than
having an English-only admin/Latvian-only customer split, so the recommendation is to bring `lv`
everywhere `hy` already reaches, plus the handful of files that predate the original migration.

---

## 6. Rough counts

- **987** Paraglide messages already exist (en source of truth), **983** already translated to `hy`
- **~300** additional hardcoded strings/messages found needing migration, of which:
  - **~70** are Zod validation messages (100% unmigrated, mechanical to convert)
  - **~50+** are concentrated in `setup.tsx` alone
  - **~40** are enum-to-label maps (business type/feature labels, toast-lifecycle map, day names)
  - **~30** are toast strings (mostly the 3 shared wrapper defaults + inline hardcoded calls)
  - remainder spread across ~10 previously-untouched page/widget files
- **1** pre-existing key drift between `en.json`/`hy.json` (unrelated cleanup item)
- **0** canonical/hreflang tags currently exist anywhere

---

## 7. Proposed Phase 2 implementation plan

1. **Decide and resolve the two flagged judgment calls** before writing code: (a) §4.1 — is
   turning on real URL-prefix routing for the existing `hy` locale acceptable as a side effect;
   (b) §4.2 — approve (or adjust) the proposed global-vs-`routeStrategies` split for strategy
   ordering.
2. **Locale config + routing** (commit 1): add `lv` to `project.inlang/settings.json`; add `'url'`
   to the Vite plugin `strategy` (plus `routeStrategies` per §4.2); extend `urlPatterns` generation
   by rebuilding; fix the 12 raw `<a href>` tags and 2 `window.location.href` assignments in
   `landing-page.tsx` to use `localizeHref`; generalize the `isArmenian`/`locale === 'hy'` checks in
   `landing-page.tsx` to a locale-list-driven approach; add canonical + hreflang tags to
   `buildSeoMeta()`; add the `en`/`lv` key-drift Vitest check.
3. **Switcher UI** (commit 2): add `lv` to `LOCALE_META` in `language-switcher.tsx` (flag 🇱🇻, code
   `LV`, endonym `Latviešu`); verify the existing admin-sidebar and customer-menu-header mounts pick
   it up automatically (they should, since they iterate the `locales` array already).
4. **Message migration per slice** (commit 3, likely split further): Zod schemas first
   (mechanical, high count), then the shared `toast.ts` wrapper (high leverage), then the
   completely-unmigrated files from §2.1 one by one, converting every `{count}` message found in
   §3.2 to proper `_zero`/`_one`/`_other` keys as you touch it. Fix `price.utils.ts`'s hardcoded
   `en-US` locale as part of this pass since it's a single shared file.
5. **`lv` translations** (commit 4): generate `messages/lv.json` from the now-complete `en.json`,
   full formal-address (Jūs/jūsu) translation with correct diacritics, `dd.mm.yyyy`/24h/decimal-comma
   formatting wired through the locale-aware formatters built in step 4.
6. **Widths pass**: after translation, sweep the admin sidebar nav labels, table headers, badges,
   and the landing nav (which already has a documented precedent for this exact problem via
   `isArmenian`/`small-font`) for overflow, and note findings.
7. `pnpm check && pnpm test && pnpm build` before reporting done, per the task constraints.

---

*Waiting for approval before starting Phase 2.*
