# 2026-11-04 — Standalone F01/F02 identity policy boundary PoC

## Starting state
- Existing `main`: `42a8eb2b54fd5852f11a2cc31e09dd7b598e4dc0`.
- Existing security PR #52: Draft, unmerged; verified head `2cd65a5dbf7730a6bdd2a1824912cde52564794f`; F01/F02 **UNRESOLVED / NO-GO**.
- Repository Public. New experimental branch created **from main**, not atop PR #52.

## Scope and implementation
- [Synthetic Node 22 policy authority](../../experiments/identity-boundary-poc/README.md), local-only TOTP, session-bound operation grants, recovery-ticket fixture, short-lived test JWT and loopback HTTP surface.
- 17 local authority and 4 HTTP negative-path tests; no real credentials, Supabase instances, paid services or API calls.
- `npm test` amended to run the new tests as part of the existing Foundation CI; dependency set and package lock remain unchanged.
- [Research report](../SECURITY_IDENTITY_BOUNDARY_POC.md) documents why existing `auth.users` FKs, `auth.sessions`-bound RLS, MFA verification and SSR are incompatible with a JWT-only provider swap.

## Evidence
- **Executed locally:** `node --test test/*.test.mjs` => 21 passed, zero failed/skipped (Node core only).
- **GitHub CI:** verify final-head outcome separately; local PoC success is **not** a hosted provider or real RLS result.
- Official Supabase third-party Auth docs allow external JWT trust but cannot disable native Supabase Auth; no hosted test, live provider or actual third-party integration was authorized.
- Application Auth code, database migration history, Supabase/Auth/Vercel configuration and production infrastructure **untouched**.

## Security verdict
- F01 **UNRESOLVED**, F02 **UNRESOLVED**.
- A closed local mock can enforce per-operation new TOTP, but it is not a supported hosted provider guarantee or a migration.
- Do not merge/deploy PR #52 based on this work. Keep migration, hosted-provider integration, historical account mapping and production step-up for separate owner approval.

## Next bounded action
Read-only capability/endpoint assessment of one specific IdP, then if authorized/budgeted create a disposable provider and Supabase trial, prove direct-native denial, real MFA recovery, refresh, JWT/RLS tenant isolation and a cutover/rollback plan.
