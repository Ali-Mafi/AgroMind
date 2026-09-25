# Performance regression — 2026-09-25

## Delivery status

Local implementation complete for the verified SSR, asset, eager-bundle and
loading-feedback issues. **Review-only publication authorized; not a physical-iPhone sign-off.**

- Base main: `725d27842f91c50328139b6bf968b1516ebd790c`.
- Working branch: `fix/ssr-navigation-performance`.
- Production: Vercel deployment `dpl_5iYcXcFMhgrcqZ73x8VvmD9Wo6dk`, `READY`,
  associated with `agromind.ir` and the same base commit. Rechecked at handoff.
- The user approved an exception on 2026-09-25 to commit/push this review-only
  branch and open a PR so GitHub Actions can run native PostgreSQL. No merge or
  production deployment is authorized. The PR/check runs hold the current SHA,
  preview URL and hosted verification results.
- Native PostgreSQL cannot start locally (`EINVAL`, single-UID mapping). The test
  and its independent-session concurrency requirement were not weakened or
  bypassed; hosted CI remains the required gate.

## Verified findings and exact fixes

| Finding | Fix |
| --- | --- |
| Navbar renders the 1,254 × 1,254 PNG at 32–44 CSS pixels. React also emits an image preload for that ordinary img element. The file is 1,126,025 bytes. | Use a versioned 132 × 132 lossless WebP derived from the same original, with explicit dimensions. Supports 44 CSS pixels at 3× density. Visible RGBA pixels are tested against the downsampled source. Original branding source remains available but is not requested by current app code. |
| Twelve Landing Reveal wrappers emit inline opacity:0 and translateY(16px) into SSR HTML, including the hero. Slow/disabled JS leaves meaningful content hidden. | Render visible divs. Native IntersectionObserver/Web Animations progressively add only a small translation to below-fold content; already-visible hero content never waits for an animation. Float keeps visibility/document/reduced-motion checks without Framer Motion. |
| Root MotionConfig loads animation code globally; the full RegionOnboarding dialog and selectors are also eagerly imported on every route. | Scope MotionConfig to ThemeSwitcher, where motion is actually used. Keep a small root onboarding entry; dynamically load the unchanged dialog only on hydrated, unconfirmed Landing visits. Root Theme/Settings/Region providers retain their existing positions. |
| Per-route loading.tsx is below the async ProtectedLayout, so it cannot display while that same layout waits for account data. Weather had no loading.tsx. | Add WorkspaceLoadingBoundary outside the unchanged ProtectedLayout on Dashboard, Farms/detail, Assistant, Account, Weather, Settings and Irrigation. Add Weather's nested loading skeleton. The fallback is public, non-sensitive markup. |
| Landing registers the same worker twice, and the root registration immediately calls update again. Installation precaches the huge PNG. All static assets are network-first at the worker layer. | One persistent registration after load/idle, no redundant immediate update; offline HTML is the only precache. Cache-first only for content-addressed Next assets and the versioned logo. Unversioned icons/backgrounds retain network-first behavior. |
| Older worker cache can retain the oversized logo and obsolete chunks. | Bump public cache to v4, remove prior AgroMind caches before claiming clients. Guard against caching redirects, HTML/RSC, private/no-store responses; preserve network-only private navigations and public offline fallback. Storage failures cannot block online asset fetches. |

### Findings deliberately not “fixed” speculatively

- Global Settings/Region providers already render their children during SSR;
  they do not gate the entire app behind hydration. RegionOnboarding was a heavy
  dependency, not an SSR page-hiding gate.
- `readCloudSnapshot` already uses request-scoped React cache and one consolidated
  `get_cloud_snapshot` RPC. This pass does not redo that prior optimization.
- Authentication/session/MFA checks precede private snapshot access intentionally.
  No parallelization across those security dependencies, cross-user cache,
  `unstable_cache`, `use cache`, client-persisted private snapshot or TTL was added.
- Sibling routes currently own separate ProtectedLayout/FarmProvider instances.
  This structural remount is documented, but its authenticated latency was not
  measured. It is unchanged: moving security/data gates into a persistent shared
  layout could alter revocation, onboarding and refresh semantics. Do not claim
  this patch eliminates those remounts or all backend navigation latency.
- Existing immediate navigation feedback and Next Link prefetching remain in
  place; no unconditional prefetch of private account payloads was added.
- No evidence was found of the original worker caching private HTML/RSC. The
  observed worker issue was redundant/heavy asset work, not a demonstrated
  stale-private-data leak.

## Before/after measurements

Same lockfile, Next 16.3.2, Node 24.19.0, production builds, same local environment.
Baseline was built before implementation. `node scripts/measure-performance.mjs
before|after` reports compiled bytes and seven local HTTP requests. It does not
measure browser rendering, CPU throttling, network transfer on iPhone, or logged-in
navigation. Gzip numbers are reproducibly computed file sizes, not a captured HAR.

| Metric | Before | After |
| --- | ---: | ---: |
| Navbar logo asset | 1,126,025 B | 14,602 B (−98.70%) |
| SSR-hidden Landing Reveal blocks | 12 | 0 |
| Landing document bytes | 89,017 B | 85,333 B |
| HTML-referenced JS inventory, raw | 1,073,291 B | 858,395 B (−20.02%) |
| Same JS inventory, gzip | 338,325 B | 265,264 B (−21.59%) |
| Referenced script files | 17 | 15 |
| Worker registration call sites on Landing | 2 | 1 |
| Precache bytes for original PNG | 1,126,025 B | 0 B |
| Worker fetch calls for two same-hash requests, controlled cache test | 2 by original network-first handler | 1 with v4 cache-first handler |

The HTML script inventory includes Next's unchanged 112,594-byte `noModule`
polyfill, which modern Safari need not download. These are build inventories,
not a claim that every byte transfers to every browser. Initial document delivery
remained in the same local range (about 5–6 ms warm headers and 6–7 ms complete);
the fixes target visibility and client/asset work, not a claimed server-speed win.

Protected-route entry JS below excludes the common Next/React runtime but includes
shared route dependencies, counted once per entry. Dynamic optional panels are not
counted until loaded. These values are **not route navigation timings**.

| Route | Before raw entry JS | After raw entry JS |
| --- | ---: | ---: |
| Dashboard | 836,867 B | 822,604 B |
| Farms | 768,447 B | 614,284 B |
| Farm detail | 837,110 B | 758,023 B |
| Assistant | 767,744 B | 613,581 B |
| Account | 768,801 B | 614,638 B |
| Weather | 816,825 B | 658,792 B |

### Not measured / still required

- FCP/LCP, actual iPhone paint and hydration delay, frame smoothness and authenticated
  click-to-content latency: unmeasured. agent-browser could not start; Playwright
  browser installation returned unusable archives. No browser/network restrictions
  were bypassed, and no screenshots/HAR/device timings are claimed.
- Logged-in duplicate requests and actual cross-section provider remount cost:
  unmeasured. No existing authenticated browser session or authorized test-account
  credentials were available. Public redirect tests are not a substitute.
- The SSR streaming regression test uses a pending private-data fixture. It proves
  fallback bytes arrive before private data resolves, not real production timing.
- After native CI passes and a reviewable preview is available, verify cold/warm
  Landing with slow/disabled JS, first/returning region selection, reduced motion,
  real-account routes, sign-out/session expiry, and old-worker-to-v4 update/offline
  behavior in Safari/PWA. Do not merge based solely on bundle savings.

## Verification

| Requested check | Result |
| --- | --- |
| lint | Passed |
| typecheck | Passed |
| test | 221 application tests passed; 16 PGlite tests passed, 1 native-only concurrency case skipped by its existing gate |
| test:db:native | BLOCKED: isolated process cannot start, EINVAL; /proc/self/uid_map exposes only UID 0 |
| localization:check | Passed: en/fa, 1,258 keys; no missing keys or detected hardcoded UI strings |
| build | Passed, normal Turbopack production build |
| test:http | Passed, 42 checks including SSR Landing, 14,602-byte logo, unchanged optimized Dashboard images, private redirects/no-store, auth forms and MFA redirect |
| git diff --check | Passed |

Tests caught a too-broad initial root loading boundary changing `/mfa` from an
HTTP redirect to a streamed response. That version was removed; only workspace
layouts now use the fallback. The final HTTP suite verifies original auth/MFA
responses. Auth, Supabase clients/configuration, RLS, MFA, entitlements, data models,
business rules, Weather behavior/visuals and Dashboard photo code/assets are unchanged.

## Changed files

### Runtime (18)

- `app/account/layout.tsx`
- `app/assistant/layout.tsx`
- `app/components/theme-switcher.tsx`
- `app/dashboard/layout.tsx`
- `app/farms/layout.tsx`
- `app/irrigation/layout.tsx`
- `app/layout.tsx`
- `app/providers/theme-provider.tsx`
- `app/settings/layout.tsx`
- `app/weather/layout.tsx`
- `app/weather/loading.tsx`
- `components/layout/workspace-loading-boundary.tsx`
- `features/authentication/components/pwa-session-safety.tsx` (PWA registration only)
- `features/landing/components/landing-motion.tsx`
- `features/landing/components/navbar.tsx`
- `features/landing/components/pwa-install.tsx`
- `features/settings/components/region-onboarding-entry.tsx`
- `public/sw.js`

### Asset (1), tests/tools (4), documentation (3)

- `public/logo/agromind-mark-132-v1.webp`
- `features/landing/tests/performance.test.mjs`
- `features/landing/tests/service-worker.test.mjs`
- `scripts/measure-performance.mjs`
- `scripts/test-http.mjs`
- `docs/performance-regression-2026-09-25.md`
- `docs/progress/2026-09-25.md`
- `docs/AgroMind_Master_Document.md`

## Next task

Publish the authorized review-only branch/PR and verify the existing GitHub
Actions native PostgreSQL gate. No merge/deploy is authorized by this exception.
Keep device/authenticated performance verification open.
