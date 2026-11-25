# Recovery-only password policy

Base `85872e2dda3627d72f9734b3d6a49c61e1b512fe`. On that main commit, `/reset-password` presented the password form for an active ordinary session and the action could authorize a change from existing assurance. The callback also used URL routing hints to distinguish recovery. A user ID in the form describes the displayed account and provides no recovery authorization.

Reviewed standalone Draft [PR #65](https://github.com/Ali-Mafi/AgroMind/pull/65) at `e0a407c2dfdcf51a0e0c7758495f30debbf1eb4a`. This branch independently implements the reviewed patterns of a hashed, server-only, expiring user/session capability, atomic consumption before the provider update, fresh provider TOTP, and revocation after confirmed mutation. The ordinary change, reauthentication nonce, backup-code, and PKCE proof branches from #65 are outside this policy.

## Recovery flow

- Forgot Password signs a short-lived request bound to the submitted email and sends it as the existing Supabase recovery redirect. The existing signed Send Email Hook attests only a matching recovery event. The email link binds this attestation to the provider token hash and user ID. Issuing email remains enumeration-safe.
- Link GETs only display confirmation. Explicit submission requires the attestation and successful Supabase recovery OTP verification. An isolated client verifies the email and returns the resulting session for installation after the recovery record has been issued.
- The application records a hash of a random HttpOnly capability for ten minutes. The private database row binds the proof to a user and verified provider session. A newer verified recovery closes the previous attempt. A duplicate email proof or session cannot issue a second attempt.
- The action checks the same recovery authorization independently of the reset page. MFA-enrolled accounts submit a fresh code from a verified authenticator in that request. The action checks the provider response and session again. SQL rechecks the active session and MFA enrollment and allows one atomic consumption before the password update. Failed or uncertain provider outcomes do not restore the consumed attempt. A confirmed update triggers global session revocation for that account.
- Persian and English use the existing auth layout. Cancel and Back on the pending AAL1 recovery form use the existing session-specific cancellation marker. Older unsigned links and bare PKCE callbacks require a new Forgot Password email after rollout.

## Native Supabase boundary

The documented hosted settings cover secure password change, current-password checks and MFA assurance. They do not expose an application recovery grant predicate or a pre-mutation password-update hook. Secure password change exempts recently created sessions. Current-password checks can authorize non-recovery changes, and MFA assurance is distinct from fresh TOTP for the current operation. The native `updateUser` endpoint can therefore remain available to an ordinary session when provider settings permit. The application migration does not enforce this policy inside the managed Auth service. See [updateUser](https://supabase.com/docs/reference/javascript/auth-updateuser), [Secure password change](https://supabase.com/docs/reference/python/auth-reauthentication), [Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks), and [upstream password update logic](https://github.com/supabase/auth/blob/10ef10789d1ee4fb422b448047e67e3e264c0482/internal/api/user.go). Live behavior for AgroMind's hosted settings remains unverified.

The upstream email verification handler groups password recovery and magic links into a shared token class. Successful verification with a recovery type alone therefore does not establish which email event created the token. AgroMind's signed email event attestation supplies that provenance. See the [upstream email verification handler](https://github.com/supabase/auth/blob/10ef10789d1ee4fb422b448047e67e3e264c0482/internal/api/verify.go).

## Release gates

Local checks passed 294 application tests, 24 PGlite tests with three native-only skips, all 27 native PostgreSQL tests, and 66 built HTTP checks. Chromium exercised the built application in English and Persian with a loopback Auth fixture. Typecheck, localization and build passed. Lint reported its existing hook dependency warning. Foundation runs the same app, native database and browser suites. Separately authorized isolated hosted acceptance must verify the actual signed email delivery and redirect handling, real MFA challenge/session behavior, native password update and revocation, and account switching in a browser. Apply the additive migration before the matching app in that isolated environment. The new app fails closed without the migration, a correctly bound service credential, and the configured Send Email Hook. Preview deployment is disabled for the candidate branch. Production remains NO-GO for a universal recovery-only guarantee because the documented native Auth API can authorize operations outside the application policy.

## Independent audit follow-up — 2026-11-25

The independent review of PR #71 at application-code HEAD `02571ed1023393bdf93bf836c4166342466e19d2` returned **CONDITIONAL GO for application-level security** and **NO-GO for Production**, with no confirmed Critical, High, or Medium PR implementation defect. Hosted acceptance, recovery readiness, and service credential binding are still open. This section is documentation only; it does not claim that the hosted provider flow has been exercised.

### Low L01: Staging migration identity (documented; not repaired)

- Committed migration: `supabase/migrations/20261123170000_recovery_only_password.sql` (version `20261123170000`).
- Staging Supabase project: `lpkxwwdzuligovfgpfey`.
- Effective Staging migration history: version `20261123165435`, name `recovery_only_password`. This was installed through the migration API using the candidate SQL; the independent audit found the resulting table, constraints, indexes, functions, RLS, and grants structurally equivalent to the committed migration.
- **Do not apply the committed migration again to this Staging project** just because the recorded version differs. A repeated `CREATE TABLE`/`CREATE FUNCTION` would conflict with existing objects.
- Before using a CLI migration workflow against Staging, explicitly reconcile the history mapping with a separately reviewed and authorized migration-history procedure, or run a **clean isolated rehearsal** of the committed migration. Do not silently edit migration history, drop the recovery objects, or mark an unverified script applied.
- Production project `gedwexwxaojpqyeiebwm` is distinct; this Staging mismatch is **not** evidence that Production has applied the candidate migration. Inspect Production migration history and schema, obtain a tested recovery backup, and apply only once using the controlled release sequence.

### Low L02: Sign-out and revocation guarantees (documentation correction)

- After a confirmed provider password update, `resetPasswordAction` attempts `supabase.auth.signOut({ scope: "global" })`. A successful SDK response is **not** independent evidence that all remote refresh sessions have been revoked; the hosted outcome must be tested with a previously established second session.
- A completed global sign-out is intended to invalidate other sessions' refresh capability, **not to revoke already issued JWT access tokens immediately**. A previously issued access JWT can remain valid until expiry at an endpoint that accepts the signature without checking current provider session existence. Test session-dependent endpoints separately.
- The current implementation treats a sign-out `error` as an uncertain revocation and returns a user-facing warning. An SDK response with `error: null` may still be insufficient to establish full provider-side revocation in some missing/invalid-session cases. Do not promise verified global revocation based only on `error: null`.
- MFA **Cancel / Back** terminates or suppresses the **current AAL1 browser flow** through a session-specific cancellation marker. It does **not** establish global provider-session revocation; it must never be represented as an account-wide logout. AAL2/newer sessions remain protected from stale cancellation attempts.
- All these distinctions are scoped to PR #71. The accepted native Supabase Auth password-update and native logout boundaries (F01/F02) remain deferred to the separate security architecture issue; no new provider guarantee is claimed.

### Bounded Hosted Acceptance (not yet verified)

Test only against the isolated project and Preview, using a controlled synthetic account and owner-entered secrets:

1. Verify Preview `NEXT_PUBLIC_SUPABASE_URL`, publishable key, and **service-role credential binding** to Staging without revealing credentials. Confirm the signed Send Email Hook destination/secret and exact recovery redirect allowlist. Production settings must not be reused.
2. Ensure the email provider and server-side send path enforce a **hard allowlist of `admin@agromind.ir` and at most one authorized recovery delivery** before enabling the temporary email key. Preview currently lacks `SUPABASE_AUTH_EMAIL_HOOK_SECRET` and `RESEND_API_KEY`; variables on the isolated project's `production` target do not establish Preview readiness. Do not assume `AGROMIND_ACCEPTANCE_*` environment variables are enforced by the PR #71 mail sender.
3. Verify a staging account with confirmed email and a currently verified TOTP factor. Confirm sender-domain authorization: the PR #71 sender is `AgroMind <accounts@agromind.ir>`, not a previously used Resend sandbox sender.
4. With bounded owner authorization, test a real email event, delivery and callback origin, scanner-safe GET, explicit OTP confirmation, a fresh TOTP, password update, replay rejection, fresh sign-in, and existing second-session refresh/revocation outcomes.
5. Record pass/fail/not-verified for expired links, direct action submissions from normal AAL1/AAL2 sessions, account switches, stale tabs, concurrent attempts, provider failures, and FA/EN mobile Back/Cancel/history behavior. Do not record a test as passed solely from local fixtures or CI.
6. Disable email sending and revoke temporary keys immediately after the bounded test; retain **non-secret** evidence only. Do not merge/deploy to Production until hosted acceptance plus independently verified encrypted backup/restoration and Production service-role binding are complete.

**Release state after this documentation update:** PR #71 is still a Draft; no application authorization logic, SQL migration, or provider configuration was changed by this note. Existing independent source findings attach to the pinned application-code snapshot; verify the resulting documentation-only Git delta and CI status before a later release.
