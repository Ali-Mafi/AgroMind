# 2026-10-28 — Signature Premium reference polish

Starting commit: `ecabd8aaff57551ca3a2580384d55d14a9d70449`, existing draft PR #42, branch `feat/signature-premium-emails`. Continued the existing shared architecture; no delivery/auth/token/authorization/RLS/queue changes.

## Comparison and changes

The supplied reference was compared directly with actual Persian desktop and mobile renders. The previous candidate used a separate app-icon masthead, unrelated wheat photograph and ivory title band. It also had a flat unoutlined CTA, oversized security block, incomplete highlights and a simple semicircular footer.

The shared shell now integrates reference-derived agricultural scenery with a gold leaf/serif wordmark and live ivory/gold title; includes a rounded ivory body transition, corrected CTA width/color/gold outline, compact warm-neutral security panel and separate ignore notice, three gold highlights with supporting lines in reference order, and an asymmetric gold-trimmed botanical footer. Every section stays centered. Mobile stacking and client-font fallbacks are deliberate adaptations. No pixel-identical or real-inbox certification claim.

Approved Persian title, subtitle, greeting, paragraphs, CTA and one-use/ignore wording are preserved. Formal recovery/invitation/support/staff wording and secure link construction are unchanged. Instagram `agromind.ir` and Telegram `agromindir` retain the same HTTPS destinations.

## Verification

- Existing preview/QA scripts reused, including Persian desktop/mobile verification, English mobile verification, Persian mobile recovery, customer/staff support, collaboration, blocked images, dark mode and stripped CSS.
- 216 Chromium cases passed with 144 full-page screenshots. Added actual image/table/CTA center geometry and background-request checks; found and fixed a 320px stripped-CSS highlight-table shift. No horizontal overflow, non-centered text/cells or element-center failures remain.
- 283 app tests passed; 23 PGlite tests passed, two existing native-only skips. Relevant security/link/escaping tests remain intact. Existing support palette assertions updated to the reference-matched colors.
- Lint: zero errors, one pre-existing `verification-pending.tsx` dependency warning. Typecheck and localization passed. Production build and HTTP checks passed, including both asset generations and byte/type/public-access checks.
- Native database execution remains assigned to the existing Foundation CI gate; this session does not repeat the already documented local process-switching limitation. GitHub CI and Vercel preview results for the new head are recorded on PR #42 after push.
- No real emails were sent. Gmail, Outlook, Apple Mail and WebKit were not tested. VML/legacy-background markup and solid-color fallbacks are implemented, not inbox-certified.

## Release gate

Live Supabase project `gedwexwxaojpqyeiebwm` is ACTIVE_HEALTHY. Its connector does not expose Auth configuration. Direct access to the hosted Auth settings redirects to Supabase sign-in, so actual Production Email OTP Expiration remains **unverified**. Local `otp_expiry=3600` is not hosted evidence. No duration was invented and no live settings or credentials were changed.

The visual comparison gate is complete as an explicitly centered, responsive email adaptation. **Keep PR #42 draft and unmerged until the hosted OTP expiration is read and the duration sentence completed accurately.** If it is 3600 seconds, state one hour, not 24 hours.

Production Vercel `dpl_DRk6QmUpYkZ9AgfajcV5NVFb8R6b` remains READY on `185f663e58a51f65e01a1b78d0436fb9b3290bb7`, with `agromind.ir`/`www.agromind.ir` attached. No production release occurred.

Next action: read the actual hosted Email OTP Expiration through an authenticated Supabase settings session, complete the notice, rerun affected checks, merge the exact passing head, and verify production SHA plus public email assets.
