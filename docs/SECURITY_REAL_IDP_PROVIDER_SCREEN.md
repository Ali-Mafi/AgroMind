# AgroMind — Real Identity Provider Screen (Read-only, No Spend)

**Date:** 2026-11-05  
**Base:** synthetic identity-policy experiment [PR #61](https://github.com/Ali-Mafi/AgroMind/pull/61) on `2a621f31b4784d3e5f10601d485e85a7fa811c20`.  
**Security release:** [PR #52](https://github.com/Ali-Mafi/AgroMind/pull/52) F01 HIGH and F02 MEDIUM remain **UNRESOLVED / NO-GO**. This is vendor/documentation/source screening only, **not a real provider integration test, recommendation to deploy, or certification**.

## Question being tested

Can a real external identity authority make a *fresh, operation/session/payload-bound* authenticator challenge unavoidable for **every relevant credential mutation** and **remote/global session revocation**, including **direct provider endpoints**, without breaking legitimate recovery, losing tenant isolation or changing the economics without approval?

The previous Node PoC proves only **synthetic policy logic**. This screen narrows which provider deserves a genuine isolated test. No account, paid resource, isolated hosted IdP, local Kratos/Core binary, Supabase setting or production credential was provisioned.

## Source-backed candidate 1 — Ory Kratos (screen result: REJECT AS-IS for F02)

Reviewed **pinned upstream source snapshot** `ory/kratos@b86338da04a040247a07f46100a86dcfb3875909`, [session/handler.go](https://github.com/ory/kratos/blob/b86338da04a040247a07f46100a86dcfb3875909/session/handler.go).

- The public `DELETE /sessions` route leads to `deleteMySessions`.
- The handler fetches a valid current session and invokes native revocation of **other sessions belonging to that identity**, without a demonstrated additional per-operation fresh TOTP check.
- Therefore the published handler is **not a basis for claiming universal F02 enforcement**. A new UI step-up, protected Next.js action, AAL2 established earlier or user-hidden button does not alter a directly reachable public session endpoint.
- The [settings-flow source](https://github.com/ory/kratos/blob/b86338da04a040247a07f46100a86dcfb3875909/selfservice/flow/settings/handler.go) mentions `privileged_session_max_age`, but that **does not prove operation/session/payload-bound TOTP on all credential routes**, and is separate from the published other-session endpoint.

**Evidence scope:** a pinned published source path, **not** actual live Ory Network behavior, every Kratos version, proxy configuration, or all credential endpoint flows. A **mandatory, genuinely isolated public API boundary** might change feasibility but would require a separate custom architecture and negative tests; do not mark it fixed by assumption.

## Source-backed candidate 2 — SuperTokens private Core (screen result: CONDITIONAL / BLOCKED)

Relevant official resources:
- [Self-host Core](https://supertokens.com/docs/deployment/self-host-supertokens) and [core API keys](https://supertokens.com/docs/platform-configuration/supertokens-core/api-keys): Core exposes privileged user/session APIs; docs require **private networking** plus API keys as defense in depth. A public Core would be unsafe.
- [Backend account-update routes](https://supertokens.com/docs/post-authentication/user-management/allow-users-to-update-their-data): the application owns a user-facing password/email update route. Verify every other frontend/recovery/identity path, not just that example.
- [Frontend Driver Interface](https://supertokens.com/docs/references/fdi), [Core Driver Interface](https://supertokens.com/docs/references/cdi): inventory user-facing vs backend-only password reset, signout, sign-up/first-password, session and privileged account routes.
- [MFA introduction](https://supertokens.com/docs/additional-verification/mfa/introduction), [step-up](https://supertokens.com/docs/additional-verification/mfa/step-up-auth): official TOTP and step-up functionality requires **paid feature licensing for production** (development testing can be free). The project owner has **not authorized any paid product or infra**.

**Not established:** a ready-to-use Supabase-compatible HTTPS OIDC issuer/discovery/JWKS, immutable package/runtime versions, real MFA/step-up enforcement for every API, authenticated recovery exception, private Core reachability, production pricing/TCO, or real SQL/RLS mapping. A JWT with `kid`/JWKS **alone** is insufficient to claim custom OIDC compatibility.

**Recommendation:** only a **conditional research lead**, never a selected production identity provider. Do not implement or pay for it before resolving budget, official OIDC contract, complete API exposure and a funded security acceptance plan.

## Supabase retention: non-negotiable integration blockers

Official [third-party Auth overview](https://supabase.com/docs/guides/auth/third-party/overview) and [Custom OIDC](https://supabase.com/docs/guides/auth/third-party/custom-oidc) describe asymmetric JWTs, `kid`, HTTPS OIDC discovery, `role` claim and issuer restrictions. **Supabase Auth cannot be disabled in the existing managed project**. A new IdP does **not** make legacy native `/auth/v1/user` and `/auth/v1/logout` unreachable. The published docs' key-refresh delay also requires a rotation plan.

Current AgroMind coupling (read-only `main` inspection): `auth.users` foreign keys and automatic user bootstrap, `auth.sessions` existence checks, `auth.uid()` UUID identity, `private.is_verified()`, `private.mfa_access_allowed()`, collaboration, subscription and support RLS, SSR cookies, verified recovery, Google OAuth and account security outbox. **New OIDC token acceptance is not proof of secure account/session migration.**

Required before selecting a provider:
1. **Direct native endpoint inventory and negative tests:** old bearer/no fresh TOTP must be denied for all mutations and remote/global logout. Include first OAuth password, email/phone, factor changes, recovery exceptions and reset tokens. Do not assume a provider's signout (current device) has the same policy as remote/global revocation.
2. **Complete network boundary:** if using a trusted Core API, prove from an external untrusted client that the upstream administration/mutation routes are genuinely unreachable; firewall and server-side secrets must be tested, not merely diagrammed.
3. **True Supabase integration:** a real isolated HTTPS OIDC issuer with discovery/JWKS/key rotation; stable unique subject/issuer mapping; issuer-scoped restrictive RLS; existing `auth.users` FKs/bootstrap and active-session checks refactored **only in a separate migration proposal**, without silently opening access.
4. **Revocation correctness:** signed-but-revoked JWT denied for farm/profile/support access over actual PostgREST and server APIs; refresh racing and lost-response cases; cross-tenant isolation; both current/foreign session preservation.
5. **Recovery and availability:** verified recovery and lost MFA must work under a separately approved policy; no new arbitrary account lockout or fallback granting attacker access.
6. **Finances and audit:** approved zero-/paid-cost envelope, immutable version/terms and independent hosted security review. External service creation and paid features require **explicit owner approval**.

## Executable fail-closed research gate

[Machine-readable candidate inventory](../experiments/identity-boundary-poc/provider-screen.json), [screening logic](../experiments/identity-boundary-poc/src/provider-screen.mjs) and [offline tests](../experiments/identity-boundary-poc/test/provider-screen.test.mjs) run with the existing `cd experiments/identity-boundary-poc && npm test`.

This **tests the decision gate**, not Kratos, SuperTokens or Supabase hosted APIs. Missing evidence, native bearer-only remote endpoints, unverified OIDC/RLS/session/cutover, missing independent review, and unapproved paid MFA prevent a false `READY` result. Even a hypothetical all-pass research record returns `productionApproved:false`: a human security/owner release decision is never automated.

**Local run:** previous 21 synthetic tests + **18 research-gate tests = 39/39** passed using Node 22. No provider-side HTTP calls or hosted accounts. Verify **new PR-head CI separately**.

## Next smallest authorized step

A **read-only/owner-approved pilot decision**: either obtain a credible zero-cost open-source provider path that can be truly isolated behind a mandatory gateway **and** can satisfy OIDC/RLS/cutover, or obtain explicit authorization for a disposable development-only instance to run the complete direct-API negative matrix. **No real IdP setup, migration or paid deployment was authorized by this screen.**

**Security disposition:** F01 and F02 remain **UNRESOLVED / NO-GO**; keep PR #52 Draft and do not merge the new experiment. No project privacy, production, Vercel, Supabase, database or user-data changes.
