# AgroMind — Identity Authority Isolation PoC / F01 & F02 architecture gate

**Date:** 2026-11-04  
**Mode:** separate, standalone, synthetic, zero-spend local proof of the **policy concept**, not a chosen or deployed identity provider.  
**Status:** **POLICY PROTOTYPE TESTED LOCALLY**; **EXTERNAL IDP, SUPABASE RLS/SESSION INTEGRATION AND UNIVERSAL PROVIDER ENFORCEMENT: NOT VERIFIED**. F01/F02 of Draft [PR #52](https://github.com/Ali-Mafi/AgroMind/pull/52) remain **UNRESOLVED / NO-GO**.

## Decision explored

Could AgroMind keep Supabase PostgreSQL/Data API while placing **all** credential changes and remote/global revocations behind an unavoidable identity authority that requires fresh, operation-bound step-up? In **a closed synthetic process**, yes: the isolated [runnable Node 22 PoC](../experiments/identity-boundary-poc/README.md) rejects old bearer-only mutation/revocation attempts while preserving separate synthetic recovery. This **does not prove** an existing managed or alternative provider offers this level of native enforcement, nor that the Supabase-managed Auth origin can be bypass-proofed while still exposed.

## Verifiable independent results

The standalone PoC implements (using Node built-ins only):

- Synthetic opaque bearer session store; independent fake users and independent MFA factor secrets, no production credentials.
- New TOTP challenge for **every** sensitive operation, including a simulated OAuth account's initial password, rather than relying on old AAL2.
- Operation+payload+user+session-bound 60-second one-use grant, 2-minute challenge, TOTP monotonic counter reuse prevention, bounded per-challenge failures and denied invalid/expired/wrong-user/scope attempts.
- State transitions for password/email mutations and remote logout `others`/`global`, with local synthetic audit events; separate verified-recovery **fixture** demonstrates replay rejection and retention of enrolled MFA factor.
- A loopback-only test HTTP façade that contains **no** direct `/auth/v1/user` or `/auth/v1/logout` endpoints. **This alone is not evidence that a real IdP's upstream direct API is unreachable.**
- RS256 test JWT creation/JWKS and local signature/issuer/expiration/tamper validation; a test explicitly shows a revoked session's JWT can remain cryptographically valid until expiry.

All assertions run via `cd experiments/identity-boundary-poc && npm test`. CI needs to run at the exact new branch head; do not claim final-head CI success until it completes. **No provider or database was connected.**

## Existing repository blocker: Supabase Auth is not only an interchangeable JWT issuer

Read-only inspection of **main** SQL reveals substantial data- and policy-level coupling:

| Real AgroMind location | Current assumption | External identity implication |
| --- | --- | --- |
| `supabase/migrations/20260913185754_auth_cloud_foundation.sql` | `profiles.id`, `accounts.owner_user_id` and related records reference `auth.users(id)`; `private.bootstrap_user()` populates app rows after `auth.users` insert | An external JWT `sub` is **not automatically** an `auth.users` row; user-ID preservation, FK/bootstrap lifecycle and deletion semantics need a separately reviewed migration |
| `supabase/migrations/20260917112635_account_security_hardening.sql` | `private.session_is_active()` expects `auth.jwt()->>'session_id'` to match `auth.sessions` ownership/existence/expiry | A third-party session is not automatically a native `auth.sessions` row. Simply trusting a new JWT would **deny legitimate users**, or relaxing the guard would risk stale-token access |
| Same migration | `private.is_verified()` reads confirmed email from `auth.users`; `private.mfa_access_allowed()` inspects Supabase-owned MFA factors and AAL | External `email_verified` and factor assurance must be authoritatively mapped, and forged user-controlled metadata must never grant roles |
| `supabase/migrations/20260925233720_farm_collaboration_foundation.sql` | Farm-membership rows reference `auth.users(id)` and `auth.uid()` | Tenant identity, UUID uniqueness, foreign users and invite/acceptance flow require migration and issuer collision tests |
| `lib/supabase/server.ts`, existing account-security services | `@supabase/ssr`, native Supabase Auth session/cookie and MFA service flow | SSR token retrieval, session management, reauthentication email/recovery, support and audit integrations must be replaced or adapted with acceptance tests |

**Do not alter these SQL objects, native Auth tables, service role functions, migrations, `lib/supabase/server.ts` or production settings as part of this PoC.** This research branch changes no live application logic.

## Provider feasibility findings (official public documentation, not hosted proof)

1. Supabase supports **third-party Auth including Custom OIDC** backed by asymmetric JWTs, a discoverable issuer/JWKS and a `kid` header; tokens need a `role` such as `authenticated`. This makes **retaining Supabase PostgreSQL** while changing the identity authority architecturally plausible. Official docs: [Third-party overview](https://supabase.com/docs/guides/auth/third-party/overview), [Custom OIDC](https://supabase.com/docs/guides/auth/third-party/custom-oidc).
2. **Supabase Auth cannot currently be disabled** in a project using third-party auth. Existing native accounts/sessions/credentials are a separate migration and bypass risk. Merely adding a third-party provider to the same project does **not** eliminate legacy GoTrue credential/logout routes. See [provider limits](https://supabase.com/docs/guides/auth/third-party/overview#limitations).
3. Available [Supabase Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks) do not document a universal **before native credential mutation + before native logout** operation-specific grant hook. Do **not** conflate password verification, token issuance or MFA verification hooks with this missing guarantee.
4. Official [Custom OIDC guide](https://supabase.com/docs/guides/auth/third-party/custom-oidc#using-rls-policies) warns that `auth.uid()` casts `sub` as UUID and that multiple issuers can collide. Our synthetic JWT has a UUID `sub` only to illustrate the shape. It is **not a production OIDC issuer**. Future RLS must restrict `iss` to approved issuers, preserve authoritative tenant IDs and enforce live session revocation.
5. External providers have distinct costs, recovery semantics and API capabilities; **no vendor selected**, no commercial promise and no live feature verified. This offline PoC does **not** demonstrate that Clerk/Auth0/Keycloak/other providers can enforce the universal policy without a separate provider-specific evaluation.

## Architecture direction: keep data plane; isolate identity control plane (conditional)

```text
                   Internet / clients
                            |
                   [ approved IdP ]
          (its OWN all credential, MFA, recovery,
           factor changes and logout routes enforced)
                            |
                 Signed short-lived JWT
                            |
         [ Supabase Data API / PostgreSQL RLS ]
              (issuer + active session +
               original user/tenant mapping)
```

This is a **candidate architecture**, not an implemented migration. It works only if **all** of the following are demonstrated:

- All identity-sensitive endpoints across a candidate provider, including non-UI direct APIs, enforce the intended per-operation step-up or a documented verified-recovery exception.
- No legacy managed GoTrue identity for the **same logical user** remains a usable bypass of the required credential/session policy. Do not assume CORS, client key secrecy or a front-end-only proxy secures the still-public origin.
- For external OIDC, the issuer provides real HTTPS discovery and JWKS, key rotation, stable subject mapping and auditable authorization transactions. Privileged API and recovery routes are also in the threat model.
- Every protected Supabase read/write/RPC requires authoritative active-session verification **after revocation** (not just JWT signature), as well as a tenant-scoped ownership check and issuer restriction. Test JWT rotation/TTL, replay and concurrent revocation.
- Existing user identity FKs, account/email verification/MFA, OAuth/PKCE, lost-device recovery, signup, collaboration invitations, emails, RLS, and signout UX must have a coherent migration/cutover and rollback plan.

## Mandatory hosted acceptance before any rollout

Use **an owner-authorized, free or budget-approved isolated provider/test project**, never Production. No environment was created in this task.

1. Pin exact provider/version/settings and network topology. Prove **direct upstream native endpoints** are actually inaccessible/unauthorized for legacy and new bearer tokens. A reverse proxy in front of a still-accessible origin fails the test.
2. Create test-only account A (password+MFA), B (separate tenant) and C (OAuth-only/first password). Verify time-bound fresh proof for password/email change, first-password creation, factor changes, phone changes if supported, and `others`/`global` logout, including **direct REST calls** bypassing application UI.
3. Validate replay, wrong operation/payload, wrong user, changed session, expired code, concurrent consumes, provider response loss and failed logout (do not falsely report success). Store persistent denial/audit events and reconcile unknown outcomes.
4. Verify recovery via independent out-of-band identity proof, including factor loss, re-enrollment, cooldown/rate limits, and preservation of account access without a silent MFA bypass. **The owner must approve a precise recovery exception policy**, because unconditional "TOTP required even when all factors lost" makes recovery impossible.
5. Provision/migrate synthetic existing `auth.users` UUIDs; prove all FK/bootstrap behavior, `auth.uid()`, `private.session_is_active`, email verification, MFA access, entitlement, farm/collaborator/support RLS, and SSR/OAuth flows under external JWTs.
6. Confirm JWT still signed-but-revoked is denied for both PostgREST and server data access; verify refresh-token semantics and stateless endpoints separately. Attempt cross-tenant reads/writes, old issuer JWT reuse and identity collisions.
7. Verify key rotation/JWKS freshness, rate limiting, persistent state under restart/multi-node, monitoring, audit export, and non-destructive cutover/rollback. Record actual API responses; code review or local mocks are not substitutes.
8. Re-audit all evidence independently and obtain an explicit owner/security go/no-go decision before any app integration.

## Explicit outcomes and constraints

- **Locally validated:** isolated policy design and negative-path behavior; local test HTTP façade and test JWT signing/verifying. This is an engineering PoC, not cryptographic protocol certification.
- **NOT validated:** true identity provider authentication, real Supabase third-party trust, hosted GoTrue bypass elimination, true multi-replica atomicity, RLS migration, provider OAuth and verified email recovery.
- **Not done:** no code on PR #52, no app routes or migrations, no Vercel/Supabase config changes, no identity provider deployment, no paid resources or user data.
- **Security verdict remains NO-GO** for production universal F01/F02. Keep PR #52 Draft and F01/F02 UNRESOLVED until actual provider isolation and RLS proof is established.

**Next single decision:** commission a **read-only provider capability and disposable-hosted-test feasibility screen** for a specific shortlisted IdP before any migration work; do not pick a provider from marketing claims or this toy issuer.
