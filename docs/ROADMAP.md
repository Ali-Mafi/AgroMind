# AgroMind Roadmap

Reviewed 2026-10-25 from audited `main` `3d3eadc`. Roadmap items are prioritized intentions, **not fixed dates**. Read [current status](05_MASTER_PROGRESS.md) for verified deployed information.

## Implemented foundations

Supabase SSR Auth and MFA, email verification/recovery, Google OAuth, cloud farms/gardens and irrigation with RLS, Dashboard and Weather, localization, Light/Dark/System themes, PWA/offline Agro Runner, role-aware collaboration and invitation UI. Apple OAuth remains deferred; AI chat is not active. "Implemented" never implies a real device/provider acceptance test.

## P0 — Stability and production acceptance (needs verification)

1. Test installed iPhone PWA and authenticated navigation: SSR visibility, performance, safe areas, fullscreen mode, caches, RTL and light/dark themes.
2. Compare WeatherAPI current/3-day and Open-Meteo extension against actual provider responses, preserving source labels, timestamps and unknown data.
3. Test signup/verification/recovery/Google login and farm team invite/role acceptance using authorized test users.
4. Verify live eNAMAD image/link and record reproducible issues with focused regression tests.

## P1 — Real farm-aware AI assistant (planned)

Implement authenticated, RLS-safe farm context, chat API/provider, usage limits, reliability and localized UX. Validate privacy, model errors and cost boundaries. The current Assistant is a draft-only UI with sending disabled.

## P2 — Subscription and payment readiness (not yet verified)

Audit entitlement tiers and charging expectations; build/verify payment initiation, callbacks/webhooks, reconciliation and account access. Verify actual payments, trust display and end-to-end user journey before launch.

## P3 — Later expansions

Sensors and device controls, advanced analytics, automation and deeper agricultural recommendations after product/data validation.

## Definition of progress

For each authorized scope: inspect relevant branch code; make minimal changes; run appropriate tests and CI; distinguish code-complete from integration/device accepted; update [daily log](progress/README.md) and [Master Progress](05_MASTER_PROGRESS.md). Follow [Project Rules](PROJECT_RULES.md). Historical planning is not automatically a current backlog.
