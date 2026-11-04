# AgroMind identity policy-boundary PoC — LOCAL SYNTHETIC EXPERIMENT

> **NOT A PRODUCTION AUTH IMPLEMENTATION.** This directory must **never** be mounted as a production route, enabled in Vercel, or used with real users/secrets. It is a runnable security-protocol counterexample to the current managed Supabase native-Auth policy gap. F01/F02 remain **UNRESOLVED / NO-GO** for PR #52.

## Run (Node 22+, no npm install and no paid services)

```sh
cd experiments/identity-boundary-poc
npm test
```

The complete suite uses only Node core modules, synthetic identities, fresh random fixture TOTP secrets, a process-local mock credential authority, and a short-lived HTTP server bound to **127.0.0.1** on a random port during tests. It does **not** read project environment variables or contact Supabase/Vercel.

The repository's root `npm test` also runs this suite on the new PR, so GitHub Foundation CI can verify the exact branch revision. This does not independently certify a hosted identity provider.

## What the PoC actually demonstrates

- Every synthetic credential mutation (`password_change`, `email_change`, including a synthetic **OAuth-only first-password** case) requires a **new** TOTP verification bound to the user, authenticating session, exact operation and canonical payload.
- Synthetic native-equivalent `remote_logout` with `others` or `global` likewise requires fresh operation-bound TOTP. Wrong scope, wrong user/session, wrong payload, expired challenge/grant, repeated OTP counter and repeated grant are denied.
- Successful `others` revokes only other same-user sessions; `global` includes the calling session; foreign accounts remain unaffected.
- A distinct **trusted recovery ticket fixture** can restore access without clearing the TOTP factor, but the real email/identity-proof issuance system **is not implemented or tested**. Recovery is a separate explicitly governed exception to a universal fresh-TOTP-only model.
- RSA-generated **RS256 synthetic JWTs** include `sub` (UUID), `role`, `iss`, `kid`, and `session_id`; tampering is detected. This is **not** a fully compliant OIDC issuer, real token endpoint, JWKS rotation, OAuth login, or a token trusted by Supabase.
- A signed JWT can **remain signature-valid after logout**. Revocation requires authoritative session verification at each protected data boundary, not JWT signature checks alone.
- HTTP harness exposes only `/poc/*` routes. Its rejection of `/auth/v1/*` demonstrates a local routing shape **only**, not isolation of the currently public Supabase Auth origin.

## Deliberate boundaries and unimplemented production requirements

| Needed for production | Here | Why it matters |
| --- | --- | --- |
| Certified identity provider and HTTPS OIDC discovery/authorization/JWKS endpoints | **NO** | The local RS256 token cannot be registered as an external OIDC provider |
| Durable shared transactional challenge/grant/session store, replay control across replicas | **NO** | In-memory single-process consumption does not prove distributed atomicity or crash recovery |
| Real identity sign-in, credential hashing/provider-backed mutations, OAuth/PKCE, account recovery, enrollment | **NO** | The fixture methods are not user-facing registration/authentication services |
| OTP risk controls (device binding, throttling across identities, alerting, recovery operations) | **PARTIAL/NO** | Local challenge failures are capped; account-wide abuse controls are not implemented |
| MFA/recovery factor lifecycle, backup and lost-device flows | **NO** | Test-only trusted recovery-ticket minting must never stand in for verified recovery |
| Origin isolation: no directly reachable credential/logout API without step-up | **NOT VERIFIED** | Managed GoTrue remains publicly reachable in the existing application |
| Supabase third-party JWT trust, session-aware RLS and legacy-Auth lockout | **NOT VERIFIED** | Existing AgroMind RLS relies on `auth.users`, `auth.sessions`, `auth.mfa_factors` |
| Hosted PostgREST/refresh/recovery race tests, signed JWT access controls | **NOT RUN** | Only local synthetic mocks were executed |
| Production auth, migrations, service connections, payments | **NONE** | No actual farm or customer data touched |

## Experimental protocol

1. Test helper creates fake user and bearer sessions. **These helpers are not HTTP routes.**
2. Caller asks for challenge, specifying the exact sensitive operation and payload.
3. Caller proves a fresh 6-digit RFC 6238-style TOTP. The monotonic accepted counter blocks same-code reuse across sessions in this single process.
4. The authority issues a 60-second operation/session/payload-bound opaque grant.
5. Matching mutation/log-out consumes that grant once, **before** the in-memory state change.
6. All network-facing tests run against the local loopback HTTP façade; the tests prove **only its policy**.

**Hard warning:** A gateway in front of Supabase does not fix F01/F02 while the original `/auth/v1/user` and `/auth/v1/logout` are independently callable by existing valid bearer holders.

## Next technical decision

Read [`docs/SECURITY_IDENTITY_BOUNDARY_POC.md`](../../docs/SECURITY_IDENTITY_BOUNDARY_POC.md). Before choosing a provider, first verify in a **separate non-production environment** that any candidate's **every** credential, factor/recovery and logout route enforces the desired step-up contract (or documented recovery exception). Only then design user-ID migration, RLS rework and phased rollout. PR #52 must remain Draft/NO-GO until those gates and an explicit owner security decision are met.
