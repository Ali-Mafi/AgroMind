# AgroMind Product Roadmap

**Product decision recorded:** 2026-10-30. **Reference:** `main` at `42a8eb2b54fd`. The complete seven-phase roadmap below is **approved as a long-term direction**, not approved for implementation, funding, commercial launch, or deployment as a single batch. Sequence is provisional; **no delivery dates or effort estimates are committed**.

For what is actually present, reviewed, integrated or released, consult [Master Progress](05_MASTER_PROGRESS.md), [daily evidence](progress/README.md), and [Project Rules](PROJECT_RULES.md). A planned feature is not an implemented feature.

## Program-level release gate — PR #52 (Phase 0)

As inspected on 2026-10-30, [PR #52](https://github.com/Ali-Mafi/AgroMind/pull/52) is **OPEN / DRAFT / NOT MERGED**, candidate HEAD `565db25a72df30ba70dd54cfd1aa3bfa65ec8689`. It is **NO-GO for merge and production**. The unresolved **F01** (direct/native credential authorization boundary) and **F02** (fresh-TOTP enforcement on native-provider logout, outside AgroMind-controlled operations) require independent assessment and an explicit security/product decision. A test passing or a risk being documented alone does not close these boundaries.

Do not merge PR #52, execute its migrations, enable security emails, or deploy it on the strength of this roadmap. Complete the targeted security review, any remediation and re-audit, inspect final-head CI, validate provider/hosted and rollback/migration readiness, then authorize release separately.

## Existing foundations — do not rebuild

The audited project already has Next.js 16 / React 19 / TypeScript, Supabase SSR Auth/MFA/RLS, farm and garden management, Dashboard, WeatherAPI + Open-Meteo forecasts, irrigation scheduling, localization (including FA/EN and RTL), Light/Dark/System themes, responsive UI, PWA/offline fallback, collaboration and a persisted support-ticket foundation. These are foundations, **not proof of live provider accuracy, completed end-to-end device acceptance, enabled payments or working AI/IoT**. Refer to [Master Progress](05_MASTER_PROGRESS.md) for historical audit limits.

## Seven-phase capability roadmap

| Phase | Workstream | State at planning date | Intended outcome |
| --- | --- | --- | --- |
| **0** | Security, reliability & launch acceptance | **Release gate / open** | Close PR #52 release risks and validate critical live user flows |
| **1** | Weather Intelligence 2.0 | **Planned enhancement** | Trusted, source-aware and farm-specific weather intelligence |
| **2** | Smart Irrigation 2.0 | **Planned enhancement** | Explainable crop-, soil- and weather-aware irrigation decisions |
| **3** | AgroMind AI Assistant | **Planned product feature** | Permission-safe, farm-aware multilingual decision support |
| **4** | Premium & Billing | **Planned / commercial acceptance unverified** | Robust subscription and payment lifecycle |
| **5** | Satellite & Farm Intelligence | **Planned product feature** | Field boundaries, vegetation change and satellite monitoring |
| **6** | AgroMind IoT | **Planned product feature** | Secure sensor ingestion and ultimately safe remote irrigation controls |

### Phase 0 — Security & Stability

- **Release blocking:** independently verify F01/F02 at the actual final PR #52 HEAD; distinguish app-bound proofs from native Supabase capability; complete threat-model/risk decision and actionable hosted test plan; keep NO-GO until appropriate approval.
- Preserve fresh TOTP for AgroMind-controlled destructive/revocation operations; do not equate application denials with provider-native session invalidation.
- Validate live signup, verified email, recovery, Google login, profile/MFA, tickets, invitations, storage isolation and security mail in authorized test environments. Establish migration sequencing, observability, alerts, backups and recovery drills.
- Test physical iPhone installed PWA, native safe areas, fullscreen, offline service-worker updates, Persian RTL/font switching, responsive themes and accessible navigation.
- Verify production weather provider readings, source timestamps and trust-badge/eNAMAD rendering. Separate automated checks from real-user/provider acceptance.
- **Exit:** independently reviewed release candidate, explicit risk disposition, green final-head CI, and completed critical hosted/device acceptance before launch approval.

### Phase 1 — Weather Intelligence 2.0

- Evolve the **existing** WeatherAPI/Open-Meteo pipeline, rather than replacing it blindly. Preserve current/forecast source, observation/forecast time, location/timezone, probability versus amount, unknown values and fallback disclosure.
- Compare provider accuracy against documented measured observations; define confidence, stale-data/failure behavior, caching, budgets and location-specific alert thresholds.
- Add actionable agricultural warnings (frost, precipitation, damaging wind and extreme conditions) and source-aware charts and explanations.
- **Exit:** tested provider normalization and threshold logic; clear timestamp/source, no invented precision, explainable alerts, localization and live sample acceptance.

### Phase 2 — Smart Irrigation 2.0

- Extend the existing irrigation scheduler with **optional** crop, growth stage, soil type, irrigation method, location, rainfall and evapotranspiration inputs. Preserve distinct farm/garden cases and user override.
- Validate water-balance/ET assumptions with agricultural references and field data; expose missing inputs, calculated ranges and why a date/volume is suggested. No claim that advisory estimates are meter-grade measurements.
- Plan reminder/forecast-driven rescheduling and history without taking autonomous physical action.
- **Exit:** agronomic validation, reproducible units/calculations, uncertainty messages, and farm-specific acceptance; safe manual fallback.

### Phase 3 — Farm-aware AgroMind AI Assistant

- **Model and architecture discovery proposal:** [AgroMind AI — Architecture & Model Strategy](AGROMIND_AI_ARCHITECTURE_MODEL_STRATEGY.md); this is not implementation authorization, a chosen model or production approval.

- Replace the currently **draft-only, send-disabled** Assistant with a gated authenticated service: least-privilege/RLS-protected farm context, clear data-use boundaries, model/provider fail-safe behavior, usage quotas and billing-aware cost controls.
- Provide localized conversational recommendations grounded in farm/weather/irrigation provenance; show uncertainty, sources, missing data and escalation for consequential advice.
- Do not let a language model independently issue financial, account-security or physical equipment commands.
- **Exit:** adversarial data-isolation tests, cost/rate-limit tests, quality/evaluation suite, privacy review and visible distinction between facts, forecasts and AI inference.

### Phase 4 — Premium & Billing

- Define entitlement tiers around actual user value, documented quotas and downgrade behavior, using existing entitlement foundations rather than creating parallel authorization.
- Plan Zibal checkout integration only after provider onboarding and technical/legal requirements are confirmed: authenticated initiation, signed/verified server callbacks, idempotent fulfillment, payment reconciliation, refunds/failures and auditable invoice lifecycle.
- Preserve trial, renewal/cancellation, access and payment-history transparency; do not assert a payment gateway or subscription is currently live.
- **Exit:** sandbox and authorized real end-to-end payment/provider acceptance, financial reconciliation, user-support path and commercial/legal readiness.

### Phase 5 — Satellite & Farm Intelligence

- Record farm/garden polygons with consent and location-precision safeguards, area checks and geo-data provenance; plan satellite-provider licensing, coverage, cost and cadence.
- Visualize imagery and vegetation indices (including NDVI) as observations **with acquisition dates and caveats** (clouds, resolution, crop type and field conditions).
- Flag vegetation change and suspected stress without asserting plant disease, irrigation deficiency or diagnosis from imagery alone.
- **Exit:** geospatial consistency, permissions, ground-truth comparisons, cloud/no-data handling and mobile rendering acceptance.

### Phase 6 — AgroMind IoT

- Define a separate device/sensor gateway, asset identity, strong per-device authentication, rotation/revocation, timestamped readings, audit trails and offline buffering.
- Start with **read-only** soil-moisture and equipment monitoring; only then design remote valves/pumps/irrigation automation with independent hardware limits, explicit operator permissions, two-step confirmation where appropriate, fail-closed limits, emergency manual stop and connectivity/power-loss safety.
- Forecast and AI outputs may **inform** controls but cannot bypass deterministic hardware safeguards.
- **Exit:** bench/field hardware validation, failure-mode tests, documented recovery/ownership, secure updates and explicit operational approval before remote actuation.

## Cross-cutting product commitments

Across every phase: security-first and tenant isolation; production-safe migration and rollback/forward recovery; explainable data provenance; agricultural safety; localization and regional units; accessibility, performance and iPhone PWA; privacy and consent; monitoring and cost controls; feature flags and incremental release. Extend the current feature-based architecture and shared tokens ([Architecture](03_ARCHITECTURE.md), [Design System](04_DESIGN_SYSTEM.md)).

## Additional backlog and existing obligations

- **Operational acceptance:** persisted support tickets, customer/staff bootstrap and notification outbox end-to-end; real Resend delivery, scheduled worker, third-party trust elements; legal identity, retention/export/deletion procedures, provider contracts and relevant regulatory review.
- **Existing P0 product regressions:** iOS layout/safe-area issues, double-switch locale/RTL/font bugs, hydration/cache/performance and verified provider data.
- **Later / separate discovery:** drone integrations, farm ownership verification and marketplace from [PRD](PRD.md) are **not silently discarded**, but are **not part of this committed seven-phase sequence** and need separate product decisions.

## Execution and progress discipline

1. Finish Phase 0 security gates before PR #52 merge or production security release. Docs work is independent.
2. Before each phase, agree on scope, risks, dependencies, MVP acceptance, data model, delivery milestones and authorized budget/provider accounts. A phase may have smaller PRs and can share preparatory work with another phase after risk review.
3. Log **meaningful actual sessions**, not invented daily activity, in `docs/progress/YYYY-MM-DD.md`; link them from [index](progress/README.md). Update [Master Progress](05_MASTER_PROGRESS.md) with new verified state. No automated daily job is implied or configured.
4. Only mark features **implemented**, **tested**, **integrated**, **hosted accepted** or **released** with matching evidence and a verified SHA. No roadmap approval itself authorizes coding, deployment or spending.
