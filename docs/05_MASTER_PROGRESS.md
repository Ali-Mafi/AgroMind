# AgroMind Master Progress

> **Active snapshot — 2026-10-25.** Verified against GitHub `main` and Vercel metadata. All reports below the historical archive heading describe their original dates, **not the current state**.

## PR #52 F01/F02 provider boundary — 2026-10-31

- Continued from real Draft HEAD `565db25a72df30ba70dd54cfd1aa3bfa65ec8689`, clean checkout. Both F01 High and F02 Medium remain **UNRESOLVED / NO-GO** under universal fresh authorization; no owner risk acceptance or production changes.
- Added expected-user confirmation for native password responses, real installed-SDK wire/error tests, and strengthened partial-logout/data-denial regressions. Existing migrations and F03–F08 protections are preserved.
- Local checks: 326 JS, 44 PGlite passes (5 native-only skips), lint/typecheck/localization/build and 66 HTTP passes; one existing lint warning. Local native PostgreSQL remains blocked by EINVAL; final-head Foundation CI is tracked in PR #52. No isolated hosted test branch is available; native hosted Auth/JWT/refresh checks remain NOT VERIFIED.
- [Provider findings, alternatives and reproducible hosted matrix](SECURITY_PROVIDER_BOUNDARY_PR52.md) · [dated evidence](progress/2026-10-31-pr52-provider-boundary.md). Next: independent Astra delta review and explicit owner/security boundary decision.

## PR #52 targeted remediation — 2026-10-29

- Preserved independent audit and original probes. Hardened credential/recovery grants, database username mutation/audit, email payload freezing and pending-revocation recovery without removing denial protections.
- Existing local evidence: 305 JS and 38 PGlite passes, lint/typecheck/localization/build/HTTP pass. Native local EINVAL; new native concurrency acceptance is tracked in final-head PR CI. Physical device, hosted Auth and actual email acceptance remain unverified.
- F02 remains unresolved under universal freshness; **production NO-GO**, Draft only, no merge/deployment/production changes. [Remediation handoff](SECURITY_REMEDIATION_PR52.md).

## Advanced account security — review candidate, 2026-10-28

- Implemented new-login emails through the existing durable outbox, real Auth session listings, fresh TOTP-only remote sign-out with one-time server authorization, session-aware access denial and immutable user-scoped recent activity.
- Local evidence: 293 JS + 29 PGlite passes; lint/typecheck/localization/build/HTTP pass (one existing lint warning); 240 email + 20 security-layout Chromium checks. Native PostgreSQL subprocess is blocked locally by EINVAL and must pass on final-head CI.
- Dedicated feature branch; **not merged or deployed**. Hosted Auth/timeout/scheduler acceptance, independent security review, physical iOS/inbox QA and provider-wide limitations remain release blockers. [Runbook](ACCOUNT_SESSIONS.md) · [evidence](progress/2026-10-28-security.md).

## Signature Premium email candidate — 2026-10-28

- Existing shared auth, invitation and customer/staff support email shell polished directly against the supplied reference: integrated landscape/branding/title, gold leaf and serif wordmark, ivory body, gold-edged CTA, compact panel, complete highlights and asymmetric curved footer. Both locales remain centered, including image/table geometry.
- Final local evidence: 283 app tests, 23 PGlite tests and 216 Chromium layout/environment checks pass; lint/typecheck/localization/build/HTTP pass (one existing lint warning). Physical email clients and WebKit are unverified. New-head CI/preview status is recorded on PR #42.
- **Draft PR #42, not released:** visual comparison complete; actual hosted Supabase OTP expiry remains inaccessible behind dashboard sign-in. Local 3600s is not hosted evidence; duration remains unstated. Production remains `185f663e58a51f65e01a1b78d0436fb9b3290bb7`. [Final-polish evidence and remaining action](progress/2026-10-28-email-polish.md); [email architecture](EMAIL_SYSTEM.md).
- Current Vercel production inspection found support credential/recipient/activation/cron and Auth-hook/Resend variable names present. Values and actual delivery were not checked or changed; older missing-configuration entries below describe their original inspection dates.

## Support ticket system — 2026-10-26

- Continued from real main `098899aecf69ffda4ff7ae08bbeaf56b9c19912b`. Replaced the draft-only Help form with persisted tickets, personal lists/status filters, unread receipts, conversations/replies and resolved-ticket reopening. Added protected `/admin/support` search/filters, staff replies, internal notes, status/priority controls and fresh-MFA verification.
- Applied `20261026065610_support_tickets.sql` to AgroMind `gedwexwxaojpqyeiebwm`. Hosted catalog checks confirm RLS on both public tables, SELECT-only customer grants, no anonymous table/RPC access and no automatically granted staff accounts. Native isolation/authorization/concurrency tests pass; actual production customer/staff sessions remain untested.
- Local validation: 270 application tests; 24 native PostgreSQL tests; PGlite 22 passed with 2 native-only skips; typecheck, localization (zero missing/hardcoded strings), build and HTTP checks pass. Lint has zero errors and one pre-existing warning in `verification-pending.tsx`.
- Transactional email outbox, localized templates, Resend idempotency, leasing and retries implemented. **Email activation/delivery is not verified:** server worker credential, confirmed support recipient, cron secret and scheduler are not configured. Staff bootstrap is manual; no arbitrary account was promoted.
- [Setup and operations](SUPPORT_TICKETS.md); [session evidence](progress/2026-10-26-support.md). This entry records local/schema evidence; matching code commit CI and production release are checked separately after push. Authenticated browser/mobile and real inbox acceptance remain outstanding.

## Current baseline

- Repository: [Ali-Mafi/AgroMind](https://github.com/Ali-Mafi/AgroMind), branch `main`.
- Audited source commit: [`3d3eadcff8b738b9e9f2c065621d19fc30a91233`](https://github.com/Ali-Mafi/AgroMind/commit/3d3eadcff8b738b9e9f2c065621d19fc30a91233), dated 2026-10-05.
- Vercel project `agro-mind`: production deployment of the audited source commit **READY**; domain `agromind.ir` verified and attached. READY is not device or end-to-end acceptance.
- [Foundation checks run 37341761200](https://github.com/Ali-Mafi/AgroMind/actions/runs/37341761200): **PASS** for the above code commit, including lint, typecheck, app/database tests (including native PostgreSQL), localization, build and HTTP checks. No claim is made about later commits.
- Vercel's 7-day runtime-error aggregation returned zero clusters at audit time; browser/device/provider errors may still exist.
- No open GitHub PRs at audit time.

## Present in source

- Next.js 16 / React 19 / TypeScript, Supabase SSR Auth, email verification/recovery, MFA, account management, cloud farms and irrigation with RLS.
- Google OAuth merged in [PR #28](https://github.com/Ali-Mafi/AgroMind/pull/28). Apple OAuth [PR #29](https://github.com/Ali-Mafi/AgroMind/pull/29) closed **without merge**.
- Farm/garden creation and management, Dashboard, Weather, irrigation, multilingual preferences, responsive themes, PWA/offline fallback and Agro Runner.
- Role-aware farm sharing merged in [PR #30](https://github.com/Ali-Mafi/AgroMind/pull/30); invitation/role-management UI and server actions exist. No fresh end-to-end invite delivery test was performed in this audit.
- eNAMAD embed code exists in the Landing footer; external trust-badge rendering was not confirmed.

## Agro Runner crow obstacle — 2026-10-25

- Added an animated pixel-art crow that flies above the standing Dino; staying grounded is safe while jumping into it can trigger a collision.
- Introduced a visible early crow spawn, a cooldown between later crows, bilingual instructions and focused spawn/hitbox tests. Preserved the working `farmer-dino-sheet-v4.png`.
- Offline public cache upgraded to v17; real installed-iPhone gameplay still requires user visual acceptance.

## Temporary Agro Runner v4 source comparison — 2026-10-25

- At the user's request, switched the active Farmer Dino sprite **from v5 to the existing v4 PNG** for an A/B visual comparison. No image regeneration, change to frame size/count, movement logic, collision physics, or one-pass Canvas renderer.
- Bumped the public offline Service Worker cache from v15 to v16 and adjusted the relevant offline/sprite tests. The v5 pixel-repair integrity test remains, explicitly documenting the retained archived asset; it is **not** evidence that v4's leg gap is repaired.
- The previous v5 change was reported as visually unchanged on the user's device. Current v4 appearance and PWA update need direct device acceptance after reconnect/reopening. If unchanged again, investigate installed Service Worker, cached `offline.html`, and actual loaded asset URL before further artwork changes.

## Latest Agro Runner repair — 2026-10-25

- Repaired 12 transparent pixels at the torso-to-leg junction in the two running frames while preserving the original 336×84 character sheet and all four frame designs; added the versioned `farmer-dino-sheet-v5.png`.
- `offline.html` now renders each complete frame in a single Canvas draw (no torso/lower-body offset); adjusted the artwork baseline without changing jump physics or collision handling.
- Bumped offline public cache from v14 to v15 and precached the new sprite so existing iPhone PWAs can fetch it after Service Worker activation.
- Added image-pixel integrity and single-draw regression tests and updated stale-cache assertions.
- Real installed-iPhone appearance and PWA cache refresh remain to be accepted; do not mark device verification complete based solely on CI/READY.

## Public legal and privacy foundation — 2026-10-25

- Published bilingual Privacy, Cookie and Terms documents and linked them from landing, account and signup.
- First-party cookies, browser storage and external providers are disclosed from inspected code in [Privacy Data Flow](PRIVACY_DATA_FLOW.md).
- No inert tracking-consent banner was introduced; any future nonessential tracking must be gated by a real choice where legally required.
- Operator identity, data-retention/deletion commitments, provider agreements and legal compliance review remain open before commercial launch.

## Formal user-facing legal copy — 2026-10-26

- Updated bilingual Privacy, Cookie and Terms document wording to formal, natural institutional prose; revised registration and Google post-login acknowledgment text for consistency.
- Kept factual disclosures and the existing checkbox, modal, route gating and policy revision unchanged; legal review and operator particulars remain outstanding.

## Registration requires explicit Terms acceptance — 2026-10-25

- Email signup keeps a compact mandatory unchecked checkbox directly above the final form button; its server action requires acknowledgement.
- Google OAuth starts without the checkbox; users with a Google identity and no accepted policy revision are sent to an authenticated `/accept-terms` step before onboarding/private pages, even when they started from sign-in.
- The acceptance action stores the policy revision and timestamp on Supabase user metadata, or lets the user sign out without accepting. Existing approved Google sessions are not repeatedly prompted.
- User metadata is user-editable; a durable server-controlled legal audit log remains open before formal commercial launch.

## Global legal modal — 2026-10-25

- Privacy, Cookie and Terms open in a keyboard-accessible native popup (with X close and Escape) from Landing, signup and Account About without navigation.
- Shared bilingual notices are lazily loaded inside a lightweight global provider; public URL routes remain available to open or share directly.
- Real iPhone modal interaction and accessibility verification still require device testing.

## Legal and cookie transparency — 2026-10-25

- Added English/Persian public Privacy, Cookie and Terms pages, linked from Landing, signup and Account About.
- Audited first-party storage and major providers without installing a nonfunctional cookie-consent banner. The actual legal entity, deletion/retention obligations and vendor agreements still need review.
- See [privacy data-flow checklist](PRIVACY_DATA_FLOW.md) for facts and outstanding responsibilities.

## Open / not verified

- **AI assistant:** `features/assistant/components/assistant-workspace.tsx` is draft-only; send button is disabled. Do not claim AI chat is operational.
- **Weather:** production Vercel lists a sensitive `WEATHERAPI_API_KEY` variable (the secret was not accessed); provider results and forecast accuracy were not verified. The older "key missing" note below is historical.
- **Commercial activation:** subscriptions/entitlements exist as foundations; real checkout/payment completion has not been verified.
- **Device/integration:** authenticated iPhone PWA launch/safe area/performance, offline cache upgrades, live email/OAuth, role invitations and eNAMAD rendering still need explicit testing.
- **Brand:** application branding remains AgroMind in source; business/company naming is a separate decision.

## Active next steps

1. Maintain coherent evidence-based progress and workflow documentation (this docs-only pass).
2. Validate live account/device/weather/invite flows and record reproducible issues.
3. Design and implement the actual farm-aware AI assistant in an authorized task.
4. Verify payment, entitlements, and trust flows before commercial launch.

The canonical workflow is [Project Rules](PROJECT_RULES.md); priorities are in [Roadmap](ROADMAP.md), with dated evidence in the [Progress Index](progress/README.md). Update this snapshot when tested facts or shipped behavior change. Never rewrite old records as though they are the latest state.

---

## Historical archive — superseded snapshots, not active instructions

Earlier "Current Sprint", "Next Step", or "hosted activation pending" claims below are preserved as contemporaneous history. Use the active snapshot and current code for today's state.


## General review fixes — 2026-09-26

- Fixed stale native-status-bar CI expectations, saved-locale initial rendering, the landing navigation translation, marketing availability labels, and precise-location application logging.
- Aligned six local migration versions with the identical SQL already applied on the hosted project; no database mutation.
- Local checks: lint, typecheck, 228 app tests, 16 PGlite checks, localization, production build and 51 HTTP checks passed. Native PostgreSQL remains a CI gate because local process startup is unavailable.
- WeatherAPI activation still needs the server key configured in Vercel and a redeployment; physical-iPhone/authenticated-navigation checks remain unmeasured.
- Decisions, measured rendering cost, migration and verification details: [daily progress](progress/2026-09-26.md).

## Project Status

- Project: AgroMind
- Current Phase: Landing Page
- Current Sprint: Sprint 1
- Status: Completed

---

# Sprint 1 — Landing Page

## Completed

### Foundation
- Design System established
- AppContainer created
- Navigation constants created
- Landing constants created
- Project architecture established
- Project documentation established

### Navbar
- Reusable Navbar created
- App constants connected
- Navigation constants connected

### Hero
- Hero section created
- Hero connected to Demo Data
- Hero Badge added
- Hero Heading updated
- Hero Typography applied
- Hero CTA updated
- FarmStatusCard created
- FarmStatusCard props implemented
- FarmStatusCard refactored
- FarmStatusCard V2 implemented
- FarmStatusCard connected to Hero
- Hero Layout V2 implemented
- Hero Background V2 implemented
- Button Polish completed

### Landing Sections
- TrustBadges created
- FeatureHighlights created
- FeatureHighlights connected to Landing
- Capabilities created
- Capabilities connected to Landing
- Reusable Section component created
- Section variants implemented
- ValueProposition created
- ValueProposition connected to Landing
- Dashboard Preview Mockup created

### Conversion
- Landing CTA created
- CTA connected to Landing

### Footer
- Landing Footer created
- Footer connected to Landing

### Responsive
- Mobile layout reviewed
- Tablet layout reviewed
- Desktop layout reviewed
- No responsive issues found

---

# Current Architecture

## Landing Flow

Navbar
↓
Hero
↓
Value Proposition
↓
Feature Highlights
↓
Capabilities
↓
CTA
↓
Footer

---

# Design Foundation

- Design System established
- UI Guidelines established
- Component Standards established
- Typography system established
- AgroMind visual language established
- Responsive design rules established

---

# Documentation

- PROJECT_GUIDE
- AI_WORKFLOW
- ARCHITECTURE
- DESIGN_SYSTEM
- MASTER_PROGRESS
- UI_GUIDELINES
- COMPONENT_STANDARDS

---

# Current Status

## Landing Page

✅ Completed

## Responsive Review

✅ Completed

## Next Phase

Dashboard Foundation

---

# Next Step

Begin Dashboard Foundation.

Before implementation:

1. Review existing project architecture.
2. Review existing constants and types.
3. Define Dashboard structure.
4. Define reusable Dashboard Widgets.
5. Implement the first Dashboard screen.

---

# Workflow Rule

After every completed task:

1. Verify the implementation.
2. Report the completed task.
3. Update this file.
4. Define the next task.
5. Stop and wait for user confirmation.

Never continue to the next implementation step without user confirmation.

## Authentication + Cloud Data Foundation — 2026-09-13

- Implemented Supabase SSR cookie authentication, verification/recovery/sign-out, protected routes, account profile and resumable onboarding. Legacy login/signup and the existing design/localization remain supported.
- Added personal account ownership, versioned Free entitlements, subscriptions, transaction-safe three-farm enforcement, cloud farms/schedules, RLS and a lossless retryable localStorage import with immutable backup.
- Added signed Supabase Send Email Hook through the existing Resend service, explicit English/Persian HTML and plain text templates, and private-data-safe PWA caching.
- Verification: application/auth/account tests, SQL/RLS/import tests, lint, typecheck, production build and HTTP route checks. Native concurrent-transaction testing is a separate GitHub workflow gate; local PGlite cannot exercise multiple connections. Browser access to localhost was blocked.
- Hosted activation is pending: no Supabase project exists in the connected AgroMind organization; creation requires organization/cost confirmation. The Vercel connection does not expose the production team. No real test inbox was provided. Do not claim hosted auth/email or migrations are live.
- Setup, migrations, environment names, policies and remaining acceptance checks: [AUTH_CLOUD_FOUNDATION.md](AUTH_CLOUD_FOUNDATION.md).

## Living Dashboard polish — 2026-09-24

- Starting from verified main `b7fb525`, refined the existing Farm Today hero, condition-aware dashboard weather, schedule presentation, crop/garden hierarchy, first-farm empty state and farm-switch motion.
- Kept business logic, authentication, data services, scheduling, localization and destinations unchanged; added no dependency or fabricated farm data.
- Automated verification passed: application/PGlite checks, 10 new Dashboard regressions, lint, typecheck, localization, standard production build and 21 HTTP checks. Native PostgreSQL is blocked locally by `EINVAL`.
- Browser policy blocks local rendering. Responsive/theme/RTL/reduced-motion CSS has been reviewed, but screenshots, authenticated visual acceptance and FPS checks remain pending.
- Details and exact limitations: [2026-09-24 progress](progress/2026-09-24.md).
- Next step: review the draft and complete authenticated visual acceptance before merge.

## Premium Dashboard image and proportion pass — 2026-09-24

- Continued directly from current main `335a495`; preserved the existing Dashboard component tree, farm selection, destinations, translations, weather logic and scheduling.
- Replaced remote photographic mappings with eight high-resolution local WebP assets. Added correct corn/wheat/rice/tomato variants, a whole-tree garden view and a neutral cultivated-field fallback. Asset provenance and prompts: `public/images/dashboard/ASSETS.md`.
- Consolidated conflicting Dashboard CSS into one scoped responsive composition: edge-to-edge header, compact hero, balanced operational columns, bounded crop image region, RTL logical spacing and narrow-screen reflow. Removed costly blur/filters and restored visible forecast freshness, fallback notices, refresh disclosure and Farm overview action.
- Added Dashboard-only `viewport-fit=cover` and translucent iOS status-bar metadata, with safe-area padding on header controls rather than above its background. No global route/auth settings or manifest changes. Hosted verification caught the old `/dashboard/backgrounds` prefix passing through authentication; new public imagery lives under `/images/dashboard`, with eight HTTP regression checks for real WebP responses without redirects.
- Verification: 203 application tests and 29 production-build HTTP checks passed; 16 PGlite checks passed (native concurrency check remains a separate CI gate); lint, typecheck, localization and production build passed. Asset dimensions verified without upscaling.
- Browser limitation: production `/dashboard` redirects this unauthenticated browser to Sign In. Authenticated mobile/tablet/desktop screenshots, light/dark RTL visual acceptance and physical-iPhone safe-area verification remain pending; automated checks do not establish those outcomes. Previously blocked local-browser access was not bypassed.
- Next step: review the deployed Dashboard with an authenticated account, especially an installed iPhone PWA (cached installation metadata may require reinstalling).

## Dashboard screenshot corrections — 2026-09-25

- Continued from main `30ee5c5` using the user's two iPhone screenshots. Stacked Weather and Irrigation vertically, removed equal-height stretching, and recomposed weather icon/measurements for full-width cards.
- Faded the header's lower edge into the actual light/dark page background. Expanded crop/tree photographs to the whole card with `cover`, a directional RTL-aware readability overlay, and no letterboxed side panel.
- Corrected the root install/launch document's status bar from `default` to `black-translucent`; Dashboard's existing `viewport-fit=cover` and padded header controls remain. Other standalone pages retain a safe content origin and readable status-bar backing. No auth, routing, weather, irrigation, translation or data changes.
- Checks: 203 application tests, 16 PGlite checks, 29 HTTP checks, lint, typecheck, localization and production build passed. HTTP regressions assert the translucent status-bar tag is in the initial head of launch/auth pages, not only the protected Dashboard.
- Limitation: physical-iPhone installed-PWA verification is not available in this environment; an older installation may retain its old status-bar configuration and need removal/re-adding. Authenticated visual acceptance remains with the user.
- Next step: inspect the deployed layout and iPhone status bar after reopening/re-adding the PWA.

## Dashboard launch viewport, icon contrast and image delivery — 2026-09-25

- Continued from main `6fea98d` after the user's latest iPhone screenshots. The root install/start document now declares `viewport-fit=cover` alongside the already-translucent status bar, so launching through `/signup` no longer starts with the default inset viewport. Dashboard controls retain their own safe insets; other pages retain safe content padding. No manifest identity, start URL, routing, auth or data changes.
- Scoped the farm/garden selector icon's foreground and surface to the photographic header, keeping the dropdown and other screens' existing theme colors.
- Replaced Dashboard's full-resolution CSS photo requests with responsive `next/image` rendering, static content-hashed imports and tiny inline previews. Header loading is eager/high-priority; the hero shares its request; crop artwork loads lazily. Original artwork, crop resolver, card composition and destinations are unchanged. No cache of private data, new effects or animation loops was added.
- Verification: 204 application tests, 16 PGlite tests (native concurrency remains CI-only), lint, typecheck, localization, production build and 37 HTTP checks passed. Optimized images are public and immutable-cached. Example field header: 373,864-byte original → 128,686 bytes at 1200px, or 45,788 at 640px; orchard 471,094 → 176,090 / 61,412 bytes. These are payload measurements, not a claim of measured iPhone network timings.
- Browser verification is blocked by the normal Sign In screen; no authenticated session or physical iPhone is available. Existing Home Screen installations can retain installation metadata. Do not claim the native status-bar outcome has been verified from a build/test pass.
- Next step: review the deployed Dashboard after fully closing/reopening the PWA; if the older status-bar mode persists, re-add it through Safari and check the header and light-theme selector on the device.
- Follow-up verification: CI caught missing static-image ambient types before Next's first build on a clean checkout. Added a tracked reference to Next's image types and reproduced typecheck in a clean source-only directory. The initial production image probe used local build hashes (which differ from the hosted build); those 404/400 results do not test the hosted component's actual URLs. The public optimizer responds successfully for the original assets; per-build hashed image responses remain covered by the production-build HTTP suite.

## 2026-10-26 — Compact Terms UX and post-Google gate

- Compressed and moved the email registration checkbox into the bottom of the form before submit.
- Google OAuth no longer asks for consent before Google sign-in. On return, Google users without acceptance are directed to `/accept-terms`, which requires a checkbox before accessing onboarding or protected pages.
- Onboarding/dashboards are protected by a server-side requireUser gate and authenticated redirect routing. A separate authenticated server action updates the acceptance revision and time, or the user can decline and sign out.
- Supabase user_metadata is editable by the user; treat this as a product UX and route gate, **not** an independently verifiable legal audit trail. A trusted database-backed event table is future hardening.
- Added new regression tests; physical iPhone acceptance still outstanding.
