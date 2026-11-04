# AgroMind — Identity Boundary PoC (LOCAL SYNTHETIC EXPERIMENT)

> **NOT A PRODUCTION AUTH IMPLEMENTATION.** Do not import as an app route, expose publicly, deploy as an IdP, or use real accounts/credentials. This is a local experimental *policy* boundary; Draft PR #52 remains **F01/F02 UNRESOLVED / NO-GO**.

## Execute

~~~sh
cd experiments/identity-boundary-poc
npm test
~~~

Requires **Node.js 22+**; no install, cloud provider, GPU or paid service. The root repository `npm test` also runs these tests on GitHub Foundation CI. The test HTTP server binds to `127.0.0.1` on a random port and runs only during tests. There is no startup or production entrypoint.

## Verified in this experimental process

- Two synthetic accounts and opaque, session-bound bearer credentials.
- New TOTP challenge for exact `password_change`, `email_change` or `remote_logout` (scope `others`/`global`).
- 2-minute challenge, at-most-60-second single-use operation grant; exact user/session/action/payload binding; short wrong-code retry budget and monotonic TOTP counter to prevent OTP reuse.
- Old/stolen bearer alone **cannot** change the password/email or revoke remote/global sessions in **this mock authority**; synthetic OAuth first-password scenario is covered.
- Cross-user, other-session, different-scope/payload and replay attempts fail in local unit/HTTP tests.
- `others` revokes only the owner's other sessions; `global` includes the current one; foreign user's sessions remain untouched.
- Separate `issueVerifiedRecoveryTicketForTest` creates a fake *trusted* recovery ticket. Once used, it revokes old sessions and retains the enrolled factor; it is **not** a real out-of-band verification or user recovery flow.
- Locally generated RS256 test JWT, JWKS and verification; proves JWT **signature-validity can persist after session revocation**.

The test harness lacks any native `/auth/v1/user` or `/auth/v1/logout` route. The HTTP 404 response proves **only that these routes are not in this mock**, not that production Supabase Auth can be hidden or bypass-proofed.

## Exact files

- `src/totp.mjs`: synthetic TOTP generation/verification (Node crypto).
- `src/authority.mjs`: in-memory single-process identity + proof authority.
- `src/http.mjs`: optional loopback-only HTTP façade, never started by production.
- `test/authority.test.mjs` and `test/http.test.mjs`: 21 adversarial tests.
- `package.json`: no dependencies; `npm test` only.

## Non-goals / security limitations

| Required production capability | PoC coverage |
| --- | --- |
| Actual OIDC identity provider + HTTPS discovery, JWKS rotation, PKCE, OAuth | **NOT IMPLEMENTED** |
| Durable multi-replica transactional replay and session state | **NOT IMPLEMENTED** — local maps only |
| Real password storage, hashing, provider credential mutations, factor enrollment | **NOT IMPLEMENTED** — simulated only |
| Verified email, lost-factor recovery, external recovery identity proof | **NOT IMPLEMENTED** — trusted test fixture only |
| Native Supabase Auth direct-endpoint isolation | **NOT VERIFIED** — production GoTrue remains directly reachable |
| Real Supabase third-party JWT trust and PostgREST/RLS integration | **NOT VERIFIED** |
| Supabase `auth.users` FK and `auth.sessions` / factor-policy compatibility | **NOT VERIFIED**; migrations required |
| Hosted refresh/revocation races and provider network failure | **NOT TESTED** |
| Production availability and audit reliability | **NOT TESTED** |

**No working complete auth architecture is claimed.** Tests are single-process and cannot prove distributed security, production provider enforcement, source origin isolation or tenant-data authorization.

For the detailed migration blockers, accepted evidence and an isolated hosted verification checklist, see [docs/SECURITY_IDENTITY_BOUNDARY_POC.md](../../docs/SECURITY_IDENTITY_BOUNDARY_POC.md).

## Required next decision

Select **one** candidate real IdP only after a read-only feature/requirements screen. Before a funded/owner-authorized hosted PoC, demonstrate that *all* native credential/factor/remote-logout endpoints require step-up or a narrowly defined, independently verified recovery exception. Protect the underlying provider origin, migrate identity and RLS safely, and independently verify direct API rejection and revocation. Do not treat `auth.uid()` / JWT signing alone as proof of session validity.
