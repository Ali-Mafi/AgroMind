# 🌱 AgroMind Master Document

Version: 0.1
Status: Planning & Architecture
Last Updated: 2026-08-02

---

# 1. Vision

AgroMind is an AI-powered Smart Farming Platform.

هدف پروژه ساخت یک پلتفرم هوشمند کشاورزی است که مدیریت مزرعه، تحلیل داده‌ها، هوش مصنوعی، آب‌وهوا، آبیاری و سنسورها را در یک محیط ساده و حرفه‌ای در اختیار کشاورزان قرار دهد.

---

# 2. Mission

کمک به کشاورزان برای تصمیم‌گیری بهتر، افزایش بهره‌وری و کاهش مصرف آب با استفاده از هوش مصنوعی.

---

# 3. Core Principles

- Simplicity First
- AI First
- Mobile First
- Data Driven
- Professional UI
- High Performance
- Scalable Architecture

---

# 4. Target Users

Version 1

- Farmers
- Farm Owners
- Agricultural Engineers
- Contractors
- Greenhouses

Future

- Agricultural Companies
- Cooperatives
- Universities
- Government Organizations

---

# 5. Technology Stack

Framework

- Next.js 16

Language

- TypeScript

UI

- Tailwind CSS v4
- shadcn/ui

Icons

- Lucide

Version Control

- Git
- GitHub

---

# 6. UI Philosophy

Minimal

Modern

Professional

White Space

Large Cards

Large Radius

Smooth Animations

---

# 7. Brand Identity

Main Color

Green

Accent

Gold

Information

Blue

Background

White

Style

Nature + Technology + AI

---

# 8. UX Rules

کاربر نباید گیج شود.

هر صفحه باید در کمتر از 5 ثانیه قابل فهم باشد.

ابتدا Action سپس Data نمایش داده شود.

AI همیشه نقش دستیار داشته باشد.

---

# 9. Navigation

Desktop

Sidebar

Mobile

Bottom Navigation

Dashboard

Farms

Add

Reports

Profile

---

# 10. MVP Features

Authentication

Dashboard

Farm Registration

Farm Management

Weather

Irrigation

Crop Management

AI Recommendation

Notifications

Profile

---

# 11. Farm Registration

ثبت مزرعه به صورت Wizard چند مرحله‌ای.

Location اجباری است.

Length و Width اختیاری است.

اگر طول و عرض وارد شد:

Area به صورت خودکار محاسبه شود.

حداکثر 5 مزرعه برای هر کاربر.

---

# 12. Future Features

IoT Sensors

Satellite Data

Drone Support

Marketplace

Team Roles

Farm Ownership Verification

AI Chat

Disease Detection

---

# 13. Farm Ownership Verification

Status

Future Feature

فعلاً پیاده‌سازی نمی‌شود.

بعداً سیستم احراز مالکیت مزرعه طراحی خواهد شد.

---

# 14. Dashboard Philosophy

Dashboard فقط اطلاعات نمایش نمی‌دهد.

Dashboard تصمیم‌گیری می‌کند.

نمونه:

امروز آبیاری انجام بده.

امروز سمپاشی نکن.

بارندگی فردا.

باد شدید.

---

# 15. AI Philosophy

AI فقط ChatBot نیست.

AI باید در تمام صفحات حضور داشته باشد.

Weather

Irrigation

Reports

Farm

Timeline

---

# 16. Timeline

هر مزرعه Timeline اختصاصی خواهد داشت.

ثبت:

کشت

آبیاری

کود

سم

برداشت

آفات

بازدید

---

# 17. Long-term Goal

AgroMind تبدیل شود به کامل‌ترین پلتفرم مدیریت کشاورزی هوشمند در منطقه.

---

# 18. Development Rules

هر Feature ابتدا طراحی می‌شود.

سپس مستند می‌شود.

سپس پیاده‌سازی می‌شود.

هر مرحله Commit خواهد شد.

هیچ Feature بدون بررسی Merge نمی‌شود.

---

# 19. Current Sprint

Sprint 1

Product Design

Current Status

Design System






# Progress

# Step 004 - Navbar

## Completed
- Created reusable Navbar component
- Added AppContainer
- Connected APP constants
- Connected NAVIGATION constants
- Replaced default Next.js page

## Status
✅ Completed

## Next Step
Build Hero Section

## Weather current-data update — 2026-09-07

- Added a server-side `/api/weather` route and optional `WEATHERAPI_API_KEY` configuration.
- WeatherAPI supplies the complete current report when configured; Open-Meteo hourly/daily forecasts retain explicit source labels.
- Normalized provider-native condition codes separately and retained the provider's condition text.
- Added visible-page refresh every five minutes, manual refresh, cancellation on location changes, and retention of the last report during connection failures.
- Show provider report/valid time in the farm timezone, explicit model fallback, and old-report status. Do not invent precipitation accumulation periods.
- Preserved the earlier static-background and rain performance work.
- Validation: 16 targeted tests, TypeScript, scoped lint and a successful production build. Live WeatherAPI credentials and farm-level accuracy remain unverified.
- Setup: `docs/weather-realtime-setup.md`.
- Next task: configure the user's API key and compare a report for the farm against local conditions at the same time.

## Unified weather source and Now card — 2026-09-07

- Replaced the mixed-provider request with WeatherAPI `forecast.json?days=3`, which supplies current, hourly and daily weather together.
- The highlighted Now card uses the exact same current report as the hero; upcoming cards begin after the current time and retain their forecast values.
- Daily totals, high/low temperatures and all condition labels now use the selected provider consistently. Missing measurements remain unknown; rain/snow probability labels retain their meaning.
- A failed primary request switches the complete weather dataset to Open-Meteo with an explicit source message.
- Validation: 21 targeted tests, TypeScript, scoped lint and production build. Live validation against the user's API account remains outstanding.
- Next task: install this update with the existing API key and verify the source label and Now card in the user's running app.


## Step 005 — Full-screen farm weather experience — 2026-09-08

### Completed work

- Replaced the bounded weather hero route with an atmospheric full-viewport experience inspired by the supplied iPhone reference, retaining AgroMind farm/garden navigation.
- Added an hourly strip, daily temperature ranges, a farm-location sheet and eight agricultural weather cards. UV and visibility are not primary cards; cloud cover is available in details.
- Added lazily loaded metric/day details with interactive SVG charts, keyboard hour selection and exact-value tables. Forecasts and the current report remain distinct; missing values remain unknown.
- Kept current, hourly and daily weather with one provider. Added an optional bounded WEATHERAPI_FORECAST_DAYS setting, defaulting to three, with no fabricated extra days.
- Preserved the daily precipitation forecast separately from the current amount and its known/unknown accumulation period. A measured daily total is explicitly unavailable without observations.
- Aligned night-temperature charts with the overnight card across midnight, and advanced report age during offline checks without rewriting the provider timestamp.
- Reused existing background asset mappings with WebP preference, weather-appropriate image fallback and no clear-sky fallback for rain/storms.
- Added bounded canvas rain/snow/hail and gentle storm illumination, reduced-motion and visibility handling, a saved animation toggle, and suspension while detail sheets are open. No per-frame React rendering or per-card live backdrop blur.
- Exposed the existing farm hydration status to prevent a premature empty-farm screen.

### Status

Implementation complete. Thirty-two focused tests, TypeScript and production build passed. Browser visual QA, device FPS and live WeatherAPI account/local forecast accuracy remain unverified. No deployment or external push was performed.

### Next task

Install the cumulative replacement ZIP in the user's existing VS Code checkout and review Weather with their existing API key and background images. Setup: docs/weather-realtime-setup.md.

## Step 006 — Weather continuation and repository reconciliation — 2026-09-09

- Inspected the existing main branch, all pending edits and the three local weather commits before changing code. Fetched and merged the newer upstream farm/dashboard changes and WebP assets; retained the completed Weather experience and pre-existing uncommitted optimization work.
- Fixed reconnect races in background refresh, including reconnecting while hidden. Old aborted responses cannot overwrite the latest state.
- Aligned farm-detail precipitation with the immersive dashboard's full local-day forecast total, preserving unknown/expired values and the distinction from current accumulation.
- Added animation lifecycle/draw-budget tests, API/FPS diagnostic scripts and reproducible test/typecheck commands.
- Validation: 38 tests, full-repository lint and production build passed. The initial browser flow and local test-farm creation worked. The preview then stopped; browser chart interaction and target-device FPS remain unverified. The real Open-Meteo adapter request timed out; the user's WeatherAPI key was unavailable.
- Detailed evidence and external reproduction steps: `docs/weather-verification-2026-09-09.md` and `docs/weather-realtime-setup.md`.
- Remaining external validation: run the committed API check with the configured WeatherAPI account and collect FPS on the target device. No claim of live accuracy or measured FPS is made.

## Step 007 — Ten-day forecast and desktop weather refinement — 2026-09-09

- Continued from clean main at `0269b88`; preserved the completed Weather work.
- Replaced the generic farm/garden hero label with its saved location and changed the farm-list action to Add farm.
- At the user's request, extended the default three WeatherAPI days with seven Open-Meteo days. Each day and its hours/charts retain a visible source; primary current/Now, totals and hourly values stay intact. Extension failure keeps the primary data usable.
- Added farm-local calendar bounds, date-keyed extension caching, absolute Open-Meteo hourly timestamps and a chart break when an overnight forecast changes provider.
- Added smooth native-sheet entry/exit with focus restoration and reduced-motion handling. Isolated desktop background/canvas rendering, reduced raster buffer size without thinning heavy rain and avoided recomputing unchanged forecast cards.
- Validation: 48 tests, repository lint, TypeScript and production build passed. Desktop dialog, Add farm and keyboard/focus behavior were checked in the browser. The live Open-Meteo call failed; no WeatherAPI key was present, so live mixed-data checks and target-device FPS remain unverified.
- Details: `docs/weather-ten-day-update.md`; setup and account/device diagnostics: `docs/weather-realtime-setup.md`.

## Step 008 — Landing installation and account entry flow — 2026-09-10

- Header start action scrolls to the installation section. Sign In, the hero Start Farming action and the final CTA route to `/login`.
- Installation offers Android as coming soon and an opt-in iOS Safari guide with a continuation to `/signup`. The installed PWA opens signup; installation is not inferred or automatically claimed.
- Added localized login/signup entry screens. Account authentication is not configured in this repository: these screens clearly state availability, collect no credentials and create no fake sessions.
- Smoothed landing anchor navigation, reveal easing, install-sheet transitions and the subtle preview float. Floating pauses outside the viewport and in hidden tabs; reduced-motion preferences disable movement and smooth scrolling. Flow pulses now animate transforms instead of layout coordinates.
- Integrated upstream iPhone icons from `e111eeb`, retained their metadata and consolidated the duplicate manifest into `public/manifest.webmanifest`. Removed the nonexistent maskable-icon reference and excluded account routes from service-worker interception.
- Status: implementation complete for navigation and installation guidance. Localization validation, 69 tests, lint, typecheck and production build passed. Production HTTP checks passed for the landing page, login, signup, manifest, all referenced install icons and service worker. The cloud browser could not access localhost; visual interaction, native iOS installation and physical-device smoothness still require device verification.
- Next step: connect the account entry screens to the chosen authentication service.


## Authentication + Cloud Data Foundation — 2026-09-13

- Implemented Supabase SSR cookie authentication, verification/recovery/sign-out, protected routes, account profile and resumable onboarding. Legacy login/signup and the existing design/localization remain supported.
- Added personal account ownership, versioned Free entitlements, subscriptions, transaction-safe three-farm enforcement, cloud farms/schedules, RLS and a lossless retryable localStorage import with immutable backup.
- Added signed Supabase Send Email Hook through the existing Resend service, explicit English/Persian HTML and plain text templates, and private-data-safe PWA caching.
- Verification: application/auth/account tests, SQL/RLS/import tests, lint, typecheck, production build and HTTP route checks. Native concurrent-transaction testing is a separate GitHub workflow gate; local PGlite cannot exercise multiple connections. Browser access to localhost was blocked.
- Hosted activation is pending: no Supabase project exists in the connected AgroMind organization; creation requires organization/cost confirmation. The Vercel connection does not expose the production team. No real test inbox was provided. Do not claim hosted auth/email or migrations are live.
- Setup, migrations, environment names, policies and remaining acceptance checks: [AUTH_CLOUD_FOUNDATION.md](AUTH_CLOUD_FOUNDATION.md).

## Step 010 — Account security and preference repair — 2026-09-14

- Added MFA checks inside `complete_onboarding`, `import_legacy_data` and `get_entitlements`, including the paths that return an existing import receipt. The migration is applied to Production and the installed guards and anonymous EXECUTE restrictions were verified.
- Handled the hosted experimental recovery endpoint's `validation_failed` / 404 response without blocking AAL2-authenticated TOTP removal. Unknown provider failures still stop removal so existing backup codes cannot be left active accidentally.
- Made cloud profile country/language authoritative during account hydration and profile refresh. Settings now saves explicit region/language edits through the authenticated mutation flow, shows failures through the existing cloud error UI, and keeps device-specific measurement choices.
- Restored verification resend after pending cookies expire or on another browser. Signup still shows the named inbox; the recovery form uses server validation, Supabase rate limits, a honeypot and generic account-existence responses.
- Validation: lint, typecheck, 110 application tests, 12 PGlite database tests, localization and production build passed. HTTP checks passed for protected redirects, public forms, cookie-free resend and the named pending inbox. Native PostgreSQL execution is blocked locally by this container's single-UID mapping; CI runs the independent-session race test.
- Remaining provider dependency: this project's experimental Supabase recovery-code API still returns 404. Native code generation/recovery sign-in are not claimed as activated; no custom JWT or MFA bypass was introduced. Live account changes and transactional email sends were not used for these regression checks.
- Next step: verify hosted recovery-code support before activating code generation and testing one-time recovery with an authorized test account.

## Step 011 — First-visit locale and signup form feedback — 2026-09-15

- The landing page's first-visit location suggestion now proposes both the detected region and its supported default language. Continue still applies the choice explicitly. A manual language choice made while location detection is pending wins over the late result; account Settings and cloud preference hydration are unchanged.
- Removed the verification link from sign-in, including the link previously rendered after an unconfirmed-account error. Signup verification, the named pending inbox, expired-link recovery and the server's verified-email requirement remain intact.
- Auth inputs are controlled in component memory, so a returned validation or provider error does not reset other fields. Signup uses the existing server schema for immediate feedback while editing, including cross-field password matching. Corrected errors and their summary disappear without another submission; unrelated identity errors remain visible.
- Attached duplicate-email and username-collision responses to their respective fields. Passwords are never returned in action state, logged or written to browser storage. Existing rate limits and duplicate-submit protection are preserved.
- Validation: regression tests cover first-visit detection, manual overrides, failed geolocation, controlled input retention, live error correction, password dependencies, identity collisions and sign-in CTA removal. Lint, typecheck, application/database tests, localization, production build and HTTP route checks passed. No database migration, provider configuration change, live credential entry or email send was needed.
- Next step: check the first-visit popup and signup correction experience on the user's iPhone/PWA.

## Step 013 — Workspace UX polish — 2026-09-22

- Verified real main and Production at PR #8 merge `e139830`; preserved the completed calm redesign.
- Polished shared motion, theme switching, selects/popovers, accessible disclosures, RTL navigation, farm-limit presentation, status-first farm cards and the mobile Assistant composer. Expanded Help/About and reviewed Persian workspace copy.
- No auth/security/business/data/provider rules changed. A thin onboarding route wrapper preserves the existing ProtectedLayout behavior while satisfying Next's build-time route props check.
- Status: implementation and local automated verification complete. 167 application tests and 15 PGlite tests pass; localization, lint, typecheck, Webpack production build and 21 HTTP checks pass. Native PostgreSQL is blocked locally by `EINVAL`; default Turbopack font retrieval is restricted. CI retains both normal build and native DB gates.
- No real ticket backend or official support address exists; the support form is explicitly draft-only, with no simulated submission. Schema/RLS/service decisions are a separate task.
- Next step: review PR/CI and verify the authenticated iOS Safari/PWA experience, including keyboard, safe areas and visual motion. Details: [UX polish progress](progress/2026-09-22.md).


## Step 014 — Mobile support, account identity and RTL follow-up — 2026-09-23

- Improved Help & Support topic navigation with smooth question-section scrolling and activated the official support email at `support@agromind.ir`; ticket submission remains draft-only.
- Hid the mobile bottom navigation while the Assistant composer is focused, preserved iOS safe-area/visual-viewport behavior, and left desktop navigation unchanged.
- Renamed Persian Controls & sensors to «کنترل و حسگرها», separated the irrigation-control and sensor cards, and fixed RTL measurement-unit overlap in Add/Edit Farm.
- Separated Full Name from Username in Account/Profile. Legacy accounts with no canonical username now show an explicit unset state instead of deriving identity from `full_name`.
- Added a dedicated username mutation flow that requires a fresh TOTP challenge, uses the existing username availability function, and relies on the existing `profiles_username_lower_unique` index for race-safe duplicate rejection. The migration adds only the MFA-gated mutation RPC; it does not add a redundant index.
- Production database audit found no duplicate non-null usernames. Six profiles existed: three with usernames and three with `username = NULL`; Auth username metadata matched profile usernames where present.
- Validation: migration syntax checked in a rolled-back hosted transaction and `secure_username_change` applied successfully to Production; GitHub Foundation checks passed lint, typecheck, application tests, native PostgreSQL tests, localization, production build and HTTP checks; Vercel preview is green.
- Deferred by design: Signup redesign, Home/Dashboard visual redesign and a real support-ticket backend.
- Details: [2026-09-23 progress](progress/2026-09-23.md).

### Next task

Review and merge PR #10, then perform the separate Signup UX pass before the later Dashboard redesign.

## Step 015 — Living Dashboard polish — 2026-09-24

- Completed: scoped agricultural hero depth, real-condition weather atmosphere and report time, calendar-style irrigation presentation, crop/garden hierarchy, welcoming empty state and native farm-switch transition. Reused the active Dashboard components and existing tokens.
- Preserved: business logic, Auth/MFA, Supabase/RLS/entitlements, data behavior, scheduling, weather refresh/providers, localization and navigation. No new dependency, imagery or invented readings.
- Status: implementation and automated verification complete; browser visual acceptance pending because local/file preview access is blocked. Native PostgreSQL cannot start locally (`EINVAL`); CI retains that gate.
- Next step: review the draft PR and verify authenticated responsive, theme, RTL, reduced-motion and iPhone performance before merging.
- Evidence: [2026-09-24 progress](progress/2026-09-24.md).

## Step 016 — SSR/performance regression repair — 2026-09-25

- Completed locally: visible SSR Landing, lossless retina logo (−98.70% bytes),
  scoped/deferred client dependencies, workspace-only loading boundaries above
  private layout waits, and deduplicated/private-data-safe PWA asset loading.
- Landing HTML-referenced JavaScript inventory decreased 20.02% raw / 21.59% gzip.
  Dashboard imagery/design and Weather/auth/security/data behavior are unchanged.
- Status: local lint, typecheck, 221 application tests, 16 PGlite tests, localization,
  production build and 42 HTTP checks pass. Native PostgreSQL is blocked by this
  container's single-UID mapping (`EINVAL`); browser/iPhone/authenticated navigation
  timing is not verified. The user approved review-only branch/PR publication as
  an exception to the local native-test blocker; no merge/deployment is authorized.
- Next step: publish the authorized review-only CI branch/PR and verify the native
  gate; retain real-device performance acceptance as outstanding.
- Details: [Performance report](performance-regression-2026-09-25.md) and
  [daily progress](progress/2026-09-25.md).
