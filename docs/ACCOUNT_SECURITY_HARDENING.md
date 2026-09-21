# Phase 2.1 — Account security hardening

Baseline: main `52d763a`. Existing Supabase Auth, TOTP/AAL2, ownership RLS and
entitlements remain in place. This change adds safeguards around those mechanisms.

## Recovery and sensitive actions

The hosted AgroMind project was probed using an isolated, verified test account.
Two independent TOTP factors enrolled and verified successfully. A password login
started at AAL1 and the second factor elevated it to AAL2. Native recovery-code
generation returned HTTP 422 `mfa_recovery_codes_enroll_not_enabled`.

Recovery therefore means **enrolling a second authenticator before losing the
first**, preferably on a separate device. Sign in with the password, select the
surviving factor, complete the native TOTP challenge, then remove the lost factor
using a fresh code from the surviving one. The two factors have independent
secrets. If both are lost, this release provides no self-service MFA bypass;
password reset does not remove MFA.

The existing experimental native recovery-code integration is disabled by
default (`SUPABASE_RECOVERY_CODES_ENABLED=false`). No custom recovery codes,
recovery table, privileged factor reset or custom authentication token is added.
Do not enable that flag merely because the SDK exposes methods: provider support
and generation, one-time use, regeneration and invalidation must all be verified.

Enrollment, removal, disabling MFA, recovery-code changes (when supported), and
signing out other/all sessions require identity confirmation inside the same
server action. With MFA this is a new provider `challengeAndVerify` against an
owned, verified factor. Without MFA it is a native password login in an isolated,
temporary session that is signed out and never replaces the current cookie.
There is no reusable client-side "recently verified" flag.

These freshness checks protect AgroMind server actions. Supabase's own factor
API uses its native AAL2 requirements; this is not a claim that the provider offers
a configurable per-action fresh-TOTP policy. Authentication tokens stay in
HttpOnly server-managed cookies in AgroMind.

Cancel removes the unverified enrollment through Supabase. Restart first cleans
up prior unverified TOTP factors. Abandoned browser setups appear as incomplete
and can be discarded on the next visit; a crashed/offline browser cannot promise
immediate cleanup. Verified factors cannot be removed through the cancel action.

## Sessions and data access

Only native `local`, `others`, and `global` sign-out scopes are used. Current
session creation time is read from the matching authenticated `auth.sessions`
record. There is no fabricated device inventory or selective session revocation.

The migration reads provider-owned session/factor records, without changing them.
Existing RLS/RPC guards require the JWT's `session_id` to belong to the current
user and still exist with an unexpired `not_after`. Thus a completed sign-out
blocks subsequent personal cloud-data access even with the previous JWT. Missing
MFA infrastructure fails closed. Public plan catalogs remain public.

Supabase access JWTs may remain cryptographically valid until expiry. Endpoints
outside AgroMind's session-aware guards, including provider APIs, retain their
native revocation semantics. In-flight requests that started before sign-out are
not retroactively cancelled. See [Supabase sessions](https://supabase.com/docs/guides/auth/sessions)
and [sign-out scopes](https://supabase.com/docs/guides/auth/signout).

## Username login abuse protection

The Edge Function consumes an atomic database quota before account lookup:
10 attempts per normalized username per 10-minute window, and a project-wide
budget of 300 attempts per 5-minute window. These are fixed windows. Only HMAC
identifiers and short-lived counts are retained; usernames, passwords and IP
addresses are not stored in the limiter. The service credential stays in the
Edge runtime. Anonymous/authenticated callers cannot execute the quota RPC.
Quota failures fail closed. Oversized bodies, invalid input and provider timeouts
are bounded. Bad credentials use the same response for known and unknown names.

These limits reduce brute force but are not a guarantee against distributed
denial of service: an attacker can consume a username's budget or the shared
budget. Email/password login retains Supabase's native limits. No spoofable
forwarded IP is used as an authorization or quota identity.

Optional Cloudflare Turnstile integration is ready for username login only:

1. Create a Turnstile widget with the intended application hostname allowlist.
2. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in Vercel.
3. Set the matching `TURNSTILE_SECRET_KEY` and `TURNSTILE_HOSTNAME` in Supabase
   Edge Function secrets; hostname defaults to `agromind.ir`.
4. Deploy/redeploy the app with the public key, and verify a real challenge.

The Edge Function validates success, hostname and action `username-login` through
Cloudflare Siteverify. Configure public/private keys together; a secret without
a rendered widget correctly denies login. This does not enable Supabase-wide
CAPTCHA for unrelated email/signup/reset flows. No provider upgrade is required
or performed by this change. See [Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## Deployment and regression coverage

Apply the `account_security_hardening` migration before deploying this app: the
server session guard requires `get_current_session`. Deploy both `index.ts` and
`handler.ts` for the existing `username-login` function, with JWT verification
disabled because it is a pre-authentication endpoint. Existing Supabase runtime
credentials are sufficient; no service-role key is added to Vercel or the client.

Regression suites cover no MFA, AAL1/AAL2, backup-factor login, missing/invalid
fresh proof, owned-factor removal, incomplete enrollment cleanup, provider logout
scopes, missing/revoked/expired/foreign session claims, cross-user isolation,
sensitive RPCs, durable quota concurrency and optional CAPTCHA validation.
Native PostgreSQL tests use separate connections for concurrent writes; Auth
action tests mock the SDK. Hosted provider capability tests complement these
tests and do not modify a real user's authenticators.

Required release gates: `lint`, `typecheck`, `test`, `test:db:native`,
`localization:check`, `build`, `test:http`, then all PR checks before merge.

The development container exposes only UID 0; its native PostgreSQL subprocess
cannot switch to an unprivileged account (`EINVAL`). The native gate is therefore
run unchanged on GitHub Actions' Ubuntu runner, and must pass there before merge.
The local JavaScript suite passed 137 tests; the local PGlite suite passed 15 tests
and intentionally defers its independent-connection race test to native Postgres.

The deployed username endpoint was also checked with the isolated fixture: native
login succeeded, invalid names returned the same credentials error, attempt 11
was rejected, and an anonymous caller could not execute the limiter RPC.
Hosted session tests confirmed AAL1 denial, AAL2 access, `others` preserving the
current session while blocking the revoked session's old JWT and refresh token,
and `global` denying subsequent cloud reads with the old current JWT.

Remaining pre-existing advisories include leaked-password protection being off
and public signup availability/status RPCs. The new private quota table
intentionally has no user policies, and `get_current_session` intentionally grants
authenticated callers only their own minimal session metadata. The public
`username_available` signup RPC already reveals name availability, so this release
does not claim to make usernames private or eliminate all timing side channels.
