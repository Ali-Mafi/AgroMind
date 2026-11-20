# MFA cancellation and account switching

**Starting main** `42a8eb2b54fd5852f11a2cc31e09dd7b598e4dc0`

Both the Back button and the secondary action on `/mfa` submit a separate cancellation form for the pending sign-in or password recovery. A same-origin POST redirects the browser to `/sign-in` without the recovery target. English and Persian labels use the existing catalog.

## Security review

- The form identifies the pending AAL1 session by a hash of the provider session ID. The POST compares that binding to the browser's current cookie and writes only an HttpOnly, host-scoped marker. The proxy and server clients suppress the matching session before Supabase can authenticate or refresh it. The marker also applies to other tabs that share the same cookies.
- This ends the pending session for AgroMind in that browser. The Supabase-side session record and refresh token remain provider-managed. The provider's local logout lacks a conditional AAL1 check, and deleting the shared auth cookie in the POST response could discard a newer session.
- A new session ID and an AAL2 upgrade of the same ID both ignore the marker. An already-dispatched verification can complete and retain its AAL2 session. Recovery uses the existing MFA and password-reset authorization checks.
- The cancellation route sits outside the proxy matcher to keep the POST response free of shared auth-cookie updates. The cancellation filter retains old chunk names so the SDK can remove them when a new session is installed.

## Verification and release

- Local checks passed for typecheck, lint with one existing warning, localization, build, HTTP smoke tests, 289 application tests, and 23 PGlite tests with two native-only skips. All 25 native PostgreSQL tests passed with temporary TCP-only startup options for the workspace.
- Six regression cases cover sign-in, recovery, replacement accounts, shared tabs, stale and late submissions, and same-origin enforcement. The workspace browser could not launch, so physical mobile and hosted Auth verification remain open.
- Review the cancellation POST, cookie suppression, and the two response orderings independently. The branch disables its own Vercel Git deployments while the Draft PR is under review.
