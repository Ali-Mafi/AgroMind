# AgroMind — Identity Authority / Fresh-Step-Up Boundary PoC

**2026-11-04 · Research-only · No spend · No production changes**

**Verdict:** The operation-bound TOTP *policy concept* passed **21 locally isolated synthetic tests**. **F01 High and F02 Medium remain UNRESOLVED / NO-GO on Draft PR #52**. The tests do not demonstrate a genuine provider-native workaround, a functioning external identity provider or Supabase RLS compatibility.

## Why this PoC exists

PR #52's independent audits determined that direct native Supabase credential mutations (F01) and remote/global logout (F02) cannot be guaranteed to traverse AgroMind's fresh-TOTP authorization code. Stale valid native bearer credentials and provider-specific recovery/first-password semantics must be considered. A bypassable Next.js API wrapper, CORS restriction, client-side secret or proxy in front of an **also publicly accessible** native Auth origin cannot close either finding.

This research branch is based on `main`; it neither rebases nor edits PR #52. It builds a **synthetic closed authority** that demonstrates the policy which a real unavoidable identity boundary would need to guarantee.

## Executed local behavior (not provider tests)

The standalone code is [`experiments/identity-boundary-poc`](../experiments/identity-boundary-poc/README.md), **Node 22+ / core modules only**:

- Test identities have distinct opaque bearer sessions and TOTP secrets; fixture methods for provisioning are **not HTTP routes**.
- An action challenge is bound to the caller's user/session, operation and canonical payload; fresh 6-digit TOTP is checked with monotonic counter to reject reuse. The bound opaque grant is single-use and expires in at most 60 seconds.
- Supported fake mutations: password, email and native-equivalent remote logout scopes `others` and `global`. A simulated account with no previous password tests the first-password path.
- Wrong session/user, expired challenge/grant, replayed code, wrong payload/operation/scope and missing TOTP fail closed.
- `others` keeps the current session and another user's sessions; `global` revokes all only for the actor. A synthetic local audit records actions.
- A **separate trusted recovery-ticket fixture** simulates identity proof being provided externally; the PoC **does not implement real identity verification, email recovery, enrollment or backup-code issuance**.
- A test-created RS256 JWT includes issuer, UUID subject, role, session ID and a key ID. Signature/issuer/expiry checks work; a signed JWT still verifies after its session is revoked. **Do not interpret this token as production OIDC**.
- Four HTTP tests use a random loopback port and prove step-up on `/poc/*`. 404 on `/auth/v1/*` proves only these routes are **absent on the mock**, not upstream isolation.

**Verified:** 21/21 local `node --test test/*.test.mjs` tests, no skipped cases. The root `npm test` has been extended to run these in CI. **Repository final-head CI is a separate result and must be checked after the PR is created.**

## Specific AgroMind compatibility blockers

Source: the actual existing `main` migration and SSR code, not conjecture.

| Existing code | Assumption | Why replacing only the JWT issuer fails |
| --- | --- | --- |
| `supabase/migrations/20260913185754_auth_cloud_foundation.sql` | `profiles.id` and `accounts.owner_user_id` reference `auth.users(id)`; a trigger bootstraps account/profile rows | External `sub` does not auto-create native `auth.users`; user mapping, FK, lifecycle and deletion must be migrated and tested |
| `supabase/migrations/20260917112635_account_security_hardening.sql` | `private.session_is_active()` requires `auth.jwt()->>'session_id'` to exist and belong to the user in native `auth.sessions` | External sessions are **not automatically Supabase native sessions**. Old protected reads may fail; simply removing the guard risks revoked-token access |
| Same security migration | `private.is_verified()` checks `auth.users.email_confirmed_at`; `private.mfa_access_allowed()` uses native factor state | A new IdP's verified email/MFA must be mapped from authoritative, tamper-resistant claims/state, not `user_metadata` or merely `aal2` |
| `supabase/migrations/20260925233720_farm_collaboration_foundation.sql` | collaborator `user_id` references `auth.users`; RLS derives owners from `auth.uid()` | New issuer/sub namespace and orphaned or colliding IDs can corrupt tenant ownership |
| `lib/supabase/server.ts` + existing auth features | Supabase SSR cookies and native `auth.*` lifecycle | Sign-in, OAuth callback, password recovery, TOTP management, notification delivery and SSR need a coordinated compatibility plan |

**A third-party OIDC JWT alone does not solve session revocation in RLS.** Every protected read/write/RPC needs verified issuer + correct mapped user/tenant + **authoritative live session check**. Do not rely only on JWT signature, static MFA claims, stale JWTs or public role grants. Never update Supabase-managed `auth.users` / `auth.sessions` / `auth.mfa_factors` using unsupported triggers or writes to conceal the mismatch.

## Current Supabase documented constraints

- Official [third-party Auth overview](https://supabase.com/docs/guides/auth/third-party/overview) documents asymmetrically signed JWTs and OIDC issuer discovery with a `kid`. Importantly, **Supabase Auth cannot currently be disabled** using this integration. Existing native sessions/credentials may remain usable until separately retired/isolated.
- [Custom OIDC provider documentation](https://supabase.com/docs/guides/auth/third-party/custom-oidc) requires a real HTTPS issuer/JWKS and `role` claim; `auth.uid()` expects a UUID subject, and claims from multiple issuers may collide. Use restrictive issuer policies and distinguish authorization claims from user-editable metadata.
- [Supabase Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks) are not established here as universal pre-mutation or pre-logout fresh-TOTP enforcement hooks.
- Providers such as Auth0, Clerk, Cognito or self-hosted alternatives may differ in direct credential/logout endpoints, MFA/recovery, price and operational responsibility. **No commercial provider is selected or proven secure by this PoC.**

## Candidate architecture — data plane unchanged only if technically proven

```text
 Internet / user clients
        |
   [ separately validated identity authority ]
     fresh, operation-bound authorization for *every*
     credential/factor and remote/global logout API,
     plus independently verified recovery exceptions
        |
  signed short-lived JWT; stable issuer+subject mapping
        |
   [ Supabase Data API / PostgreSQL RLS ]
   issuer restriction + session state + ownership
```

This is a **design option**, not an implementation. If the native managed Supabase Auth origin remains reachable for the same logical users with valid bearer credentials, an app-only gateway does not make universal enforcement true. Building a separate identity authority increases the operational/recovery burden; using an external provider does not automatically satisfy per-operation step-up.

## Required isolated hosted acceptance, not executed

1. Select a **specific** candidate provider and version/settings through a separate no-cost capability screen. Do not claim behavior from marketing language. Obtain explicit owner authorization for any test infrastructure, cost or security-impacting configuration.
2. Use **non-production** synthetic users A (MFA), B (foreign tenant) and C (OAuth-first-password), plus multiple own sessions. Test every native REST and SDK credential/factor/logout/recovery endpoint **directly**, not only via app UI.
3. With an old AAL2 bearer lacking new TOTP, verify password/email/phone/first-password mutation and `others`/`global` sign-out truly fail at the provider/authority boundary. Test replay, wrong scope/session/action, expired proof, concurrent consumption, and errors after provider commit.
4. Test recovery when MFA is lost using separately verified identity proof. Record explicit recovery exception policy; never create an impossible account lockout or an unreviewed factor-bypass backdoor.
5. Prove old native Supabase paths and old credentials for the same users are rejected **at the unavoidable enforcement boundary**. A reverse proxy with a still-public upstream does not count.
6. Demonstrate real third-party OIDC/JWKS, key rotation and accepted JWTs with Supabase; map users and all FKs; verify issuer/sub collision isolation, email verification, factor authorization, SSR/OAuth, collaboration and account data.
7. Verify protected direct PostgREST and Next paths reject revoked sessions **while JWT signatures remain valid**, and test refresh after `others`/`global` logout and failed provider attempts. Include RLS, Storage/Realtime if used, audit integrity and rollback.
8. Re-audit findings independently. Any migration needs a separate implementation authorization, staged provider rollout, user recovery, backups, and explicit final security GO.

## Status and boundaries

| Category | Outcome |
| --- | --- |
| Local synthetic policy + unit/HTTP tests | **PASSED (21/21)** |
| External identity provider selected | **NO** |
| Actual provider's native universal fresh TOTP | **NOT VERIFIED** |
| Hosted Supabase third-party JWT + session-aware RLS | **NOT VERIFIED** |
| Persisted multi-node transactional grants | **NOT IMPLEMENTED** |
| Real recovery, MFA enrollment, OAuth, email delivery | **NOT IMPLEMENTED** |
| Production deployment/migration/config change | **NONE** |
| PR #52 F01/F02 | **UNRESOLVED / NO-GO** |

**Decision:** Preserve Draft PR #52. Next authorize a **provider-specific read-only capability screen** and, only when affordable and explicitly approved, a disposable hosted acceptance environment. Do **not** promote the mock PoC into production or infer that an identity migration is already required or safe.
