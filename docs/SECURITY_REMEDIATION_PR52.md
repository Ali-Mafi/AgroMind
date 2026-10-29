# PR #52 — security remediation and re-audit handoff

Starting HEAD: `8e2c776c69283a2f891532dca8118ac79851d56f`; branch
`feat/account-sessions-security-20261028`. Date: 2026-10-29 (Asia/Tehran).
The remote HEAD was unchanged when remediation resumed. Existing work was preserved.
**Draft; no merge, deployment, production migration, Auth setting or secret change.**

The [independent audit](audits/2026-10-29-pr52-independent-audit.md) and its
[original evidence](audits/pr52-evidence/README.md) are preserved unchanged.
This document reports remediation, not a replacement independent audit.

## Finding disposition and reproducible evidence

“Verified” below means application/SQL behavior in isolated tests. It does not
mean hosted GoTrue/PostgREST, actual email delivery or physical-device certification.

| Finding | Disposition | Change and evidence |
| --- | --- | --- |
| F01 High | FIXED AND VERIFIED at the AgroMind application boundary | `actions.ts` now requires a reserved, verified, consumed credential grant. Ordinary MFA accounts need a newly challenged TOTP, never old AAL2. Non-MFA accounts need their current password through the existing isolated provider proof. Recovery needs a separate provider-verified ticket, bound to user/session, ten-minute expiry and atomic one-use consumption. Tests reject the original old-AAL2 request, forged recovery context, missing ticket, bad Origin, foreign factor, old/foreign PKCE claims, expiry, OTP failure and changed session. |
| F02 Medium | UNRESOLVED under universal freshness requirement | Native Auth retains provider bearer/AAL semantics. The application gate, RLS guards, documentation and UI do not claim otherwise. The isolated native-deletion regression confirms no separate data-access bypass through the tested guards; hosted API behavior still needs validation. |
| F03 Medium | FIXED AND VERIFIED at the database mutation boundary | Historical `change_username(text)` is revoked and replaced by a rejecting stub. New `security_change_username` derives caller/user/session from JWT, checks the exact normalized username digest and atomically consumes a verified operation grant, mutates and audits. Direct old-AAL2 calls, wrong user/session/payload, replay and audit failure are tested. Native concurrency tests require one winning mutation and one audit event. |
| F04 Low | FIXED AND VERIFIED for queued sends | Full recipient/from/subject/HTML/text/locale/template identifier is frozen by lease-fenced write-once RPC before the first provider send. Retries send stored bytes; renderers are not called again. Actual worker tests vary year/template/locale and inject provider failure and lost freeze responses. SQL tests check payload immutability and stale leases. Unknown legacy attempts are held, never silently resent. |
| F05 Medium | MITIGATED WITH RESIDUAL RISK | Same-session retry is no longer advertised after global denial. User signs in anew and gives fresh TOTP for a new revocation; old authorization cannot replay. Denials and pending records survive cleanup. Read-only-native reconciliation confirms snapshot disappearance, deduplicates completion and handles lost responses. Provider availability and a new valid login remain required to finish native logout; no unattended privileged logout is introduced. |

`features/account-security/services/action-proof.ts` reuses existing native MFA
and password-verification infrastructure. Grants bind user, original session,
operation and payload; expiry is two minutes. Five attempts per ten minutes and
one outstanding reservation are shared with remote revocation. The original
revocation HMAC domain is retained across the upgrade so old replay reservations
remain effective. Plaintext passwords/OTP and bearer tokens are not stored.

## F01 recovery and provider password boundary

The browser's `password_context` selects a UX, not authorization. Recovery tickets
are minted only after successful `verifyOtp(type: 'recovery')`; PKCE additionally
requires a signature-verified fresh `recovery` AMR matching the authoritative
user/session. URL `type`/`next`, SDK-local redirect type and user metadata cannot
mint proof. The ticket uses a random 256-bit HttpOnly, Secure-in-production,
SameSite=Strict cookie; only its hash is stored. It cannot be renewed for the same
native session. Failure after consumption requires a new proof/email.

MFA-enabled recovery still requires fresh MFA. Existing native backup codes remain
usable only for genuine recovery and only if the existing provider feature gate
is enabled. Normal password change and remote logout do not accept that fallback.
OAuth-only accounts without a password can use verified email recovery; they cannot
satisfy a current-password prompt by presenting an OAuth/AAL claim. Recovery does
not remove MFA. Users who lose all enrolled MFA and configured recovery methods
still need the existing recovery/support policy; this PR invents no MFA bypass.

A successful password update records app denial/audit before supported global
logout. Failure is reported as unconfirmed; consumed grants are not restored.
Native password update and database audit/denial are separate transactions: a DB
outage after provider success can still cause an audit gap. Monitor
`password_revocation_record_failed`; do not claim cross-provider atomicity.

Direct Supabase `updateUser` follows provider rules, not these grants. Supabase's
recent-login policy has a 24-hour window, distinct from the current-password
setting. Hosted requirements, recovery exemptions and MFA/nonce behavior must be
validated. No production Auth setting was read as a secret or changed. A provider
setting requiring current-password/nonce may require further UX adaptation after
hosted acceptance; do not disable the policy to make tests pass.

## F02 threat-model decision — explicitly unresolved

Assets: private farm/account/support data, credentials, availability and complete
security history. Adversary: someone possessing an otherwise valid native bearer
session, including old AAL2, who calls Supabase directly. The publishable key is
public; HttpOnly normal app cookies are not a provider access-control mechanism.

| Boundary | Enforced guarantee | Remaining limitation |
| --- | --- | --- |
| AgroMind remote sign-out controls | New native TOTP challenge and verification; exact owned factor/session/scope; durable atomic single use, replay and quota checks | This governs requests through AgroMind. Credential recovery/change has its separately authorized policy described above. |
| Native `/auth/v1/logout` | Supabase's own user/session/scope authorization | No supported per-logout fresh-TOTP hook was found. Native bearer callers can terminate their account's sessions without the AgroMind grant/audit path. |
| AgroMind protected data | Existing `session_is_active` checks native row ownership/existence/expiry and application denials through RLS/RPC and server guards | Live JWT/PostgREST, actual timeout policies, future storage/realtime paths and in-flight work need separate evidence. |
| Refresh tokens and native sessions | Supported provider logout and authoritative disappearance checks | If logout fails and native rows remain, refresh credentials can outlive the current JWT. The residual native exposure is not bounded by that JWT's expiry. |

The current Auth Hooks catalog has token-issuance, email/SMS, user-creation,
password-verification and MFA-verification hooks; none is a logout authorization
hook. Token issuance restrictions, Next middleware, hiding the key or modifying
managed Auth tables are not substitutes. Native password and factor-management
operations also retain their own provider requirements. No unsupported Auth-table
writes, trigger, token impersonation or broad new service-role logout path exists.

Native logout is a session-termination bypass of the *application freshness
policy*, not evidence of a new cross-user data-reading bypass. In isolated tests,
native row removal without any AgroMind tombstone makes the old claim context fail
`get_current_session`, profile/farm reads and sensitive mutations. `others` preserves
the current and foreign user's access; global removal denies the current too.
Existing JWT-aware RLS tests also cover tombstoned sessions whose native rows
remain. These are SQL models, not signed-JWT HTTP or hosted Auth certification.
Native operations may be absent from AgroMind history and login alerts; retain
provider Auth audit logs and investigate discrepancies. No log export/alert was
configured in production by this task.

**Product/security decision required before release:** explicitly accept the
narrower application-controlled freshness guarantee with these native-provider
risks, or retain universal fresh-TOTP enforcement as a blocker. Until that decision,
F02 remains UNRESOLVED and the release verdict remains NO-GO. Documentation is not
a technical fix and is not implicit risk acceptance.

## F05 state machine and operations

`verifying -> failed` for failed proof; `verifying -> executing` only after fresh
proof consumption and atomic denial. Executing/pending becomes completed only when
all snapshot native rows are absent. Missing/failed provider responses cannot
manufacture success; disappearance can reconcile a successful logout whose reply
was lost. Completed is terminal and idempotent. Pending is retryable through a new
owned login and fresh operation, never by replaying the consumed grant or lifting
denial. New logins after a snapshot are not permanently excluded by that snapshot.

Global failure redirects to sign-in with an honest pending message and account
security destination. Sign in again, enroll an authenticator if needed, then give
a new TOTP to sign out all sessions. If credentials/MFA are unavailable, use the
verified recovery policy; do not unblock a denied session. A new provider outage
can leave the new operation pending too. No promise of automatic native completion.

The existing cron worker calls `security_reconcile_revocations` even with mail
flags off. It reads native rows only, rotates through bounded batches using
checked timestamps and SKIP LOCKED, writes app outcomes and retains unresolved
records. Monitor `revocation_reconciliation_failed`, `revocations_pending` (pending
and >10-minute stale counts), `password_revocation_record_failed`, queue health,
retention and ACK failures. HTTP 200 alone is insufficient because the worker
catches errors. Alert routing, owner and actual cron execution remain release gates.

## Migration, delivery and rollback runbook

New forward-only file: `20261029034759_account_security_remediation.sql`, after
`20261028164556_account_session_security.sql`. Historical applied migrations are
unchanged. Transactional DDL; new private tables have RLS and no ordinary grants;
privileged functions have empty search paths. New worker wrappers are service-only.
The username wrapper alone is callable by authenticated users and derives identity
from claims; no client-supplied user or session ID authorizes its mutation.

Before release, rehearse with existing users, pending support jobs and denied
sessions. The SQL suite applies the complete migration chain and seeds legacy
jobs/denial before this migration to exercise upgrade behavior. This does not
measure production lock/backfill time or hosted Auth schema compatibility.

1. Prepare and verify the compatible app release, isolated tests and rollback fix.
2. Pause old mail drains and stop in-flight old app mutations during the coordinated
   cutover; wait for existing mail leases/drains to finish. Do not run old and new
   mutation paths simultaneously and assume the old password action is protected.
3. Apply migrations in order, then deploy the compatible application. No production
   migration/deployment is authorized or performed by this remediation task.
4. Old leasing RPCs return no jobs. The v2 worker persists the complete send payload
   before sending. A crash before persistence cannot send a speculative body; a
   crash after send reuses the same saved body and `support/<UUID>` idempotency key.
5. Existing attempted, unsent jobs have unknown prior bytes: `delivery_hold=true`,
   `LEGACY_PAYLOAD_UNKNOWN`. Reconcile against provider delivery evidence. Never
   change keys or release a hold with a guessed payload. If original bytes cannot
   be established, leave held and record the operational outcome. Never call these
   delivered merely because the row exists. Unattempted legacy jobs are safe to freeze.
6. Existing Resend/server/cron credentials are reused; security-mail activation,
   verified sender and compatible ten-minute scheduler still require acceptance.
   Frozen payloads (including recipient and metadata) are scrubbed after 30 days;
   retries stop inside 23 hours, below the provider's 24-hour idempotency window.
7. Monitor held/overdue queue counts, pending revocations and retention. Pending
   operations are retained until completed, then eligible for normal pruning.

**Rollback is forward-only after hardening.** Keep grants, audit records, deny
records and frozen payloads. The historical down script now refuses if the new
schema exists, even if native sessions have disappeared. Roll back only to a
reviewed app version compatible with the new authorization and v2 worker, or deploy
a narrowly scoped forward fix. Rolling back to the audited vulnerable app is not
a security-preserving rollback. If mail is defective, pause delivery while keeping
reconciliation/pruning operational. Export evidence before any separately approved
destructive recovery; never delete denials/history as routine rollback.

## Validation and outstanding acceptance

Preserved executed local evidence: 305 JavaScript tests, 38 PGlite database tests,
lint (zero errors, one pre-existing warning), typecheck, localization, production
build and HTTP checks passed. Native local runner was blocked by EINVAL; four
native-only tests were skipped in PGlite. The final continuation adds one targeted
native-logout/data-boundary regression and relies on new-HEAD CI for the complete
native suite. Exact final-head CI result is recorded in PR #52 and the handoff.

New tests cover old AAL2, fresh TOTP, wrong session/user/operation/payload, expiry,
replay, provider failures, recovery tickets and signed PKCE claims, OAuth-only and
no-MFA paths, CSRF, shared rate limits, RLS denial, username audit rollback, native
concurrent consume/reconciliation, email immutability and safe legacy upgrade.
Actual Auth/provider calls in JS tests are mocked; native tests use isolated Auth
schema fixtures, not GoTrue. No test credentials or production accounts were used.

No isolated Supabase development branch was available (`list_branches` returned
empty). Hosted Auth/PostgREST/real refresh-token races, actual Gmail/Apple Mail and
physical iPhone/Android tests are NOT VERIFIED. Browser layout execution was
attempted but Chromium was absent; download returned an invalid/truncated archive.
No new browser-layout pass is claimed. Existing component rendering tests are not
browser E2E. Re-audit the final SHA and complete the original audit's hosted/device
matrix, migration/rollback rehearsal and operational gates before release.

**Overall production verdict: NO-GO.** Candidate is a targeted remediation for
independent re-audit, not production approval.

## Provider sources reviewed

- [Supabase Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks)
- [Supported sign-out scopes](https://supabase.com/docs/reference/javascript/auth-signout)
- [Session/JWT/refresh semantics](https://supabase.com/docs/guides/auth/sessions)
- [Password policies](https://supabase.com/docs/guides/auth/password-security)
- [Recovery authentication methods](https://github.com/supabase/auth/blob/master/internal/models/factor.go)
- [PKCE exchange](https://github.com/supabase/auth/blob/master/internal/api/token.go)
- [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys)

Upstream master is not proof of the hosted Auth build/configuration. The current
changelog was reviewed; it did not establish a supported logout-freshness hook.

## Follow-up after independent re-audit — F06/F07/F08

A subsequent independent delta audit of `103d2c4` identified F06 (unrecorded password-update partial failure), F07 (lost consume response), and F08 (provider password policy compatibility). The follow-up implementation is on this same Draft PR and uses forward-only migration `20261029193000_account_security_followup.sql`.

**F06:** `security_prepare_password_change` atomically consumes the fresh grant, records a native-session snapshot and durable revocation/audit intent, and inserts app denial tombstones *before* any native password update. No confirmed prepare means no native password mutation. `security_password_changed` now confirms only a previously prepared operation, and rejected provider outcomes are tracked separately. Password change, app denial, provider logout and database reconciliation are not a distributed atomic transaction: uncertain outcomes require reauthentication/recovery and operational alerting. Denials are never erased for convenience.

**F07:** After an ambiguous revocation consume response, a server-only, user/session/operation-scoped `security_revocation_status` lookup determines whether the operation actually committed. A confirmed consumed operation gets pending/completed guidance; unknown status never replays proof or claims success.

**F08:** The password UI can request an email nonce using the official `auth.reauthenticate()` API through a service-side per-user cooldown/quota. It accepts a separate nonce and optional current password for MFA-enabled password changes, without replacing fresh TOTP. Password recovery remains provider-verified and independently authorized. Hosted provider policy and OAuth-only first-password compatibility still require real integration tests.

The code and migration are *not production approved*. The original independent audit artifacts remain unchanged. Coordinated migration/application cutover, real hosted signed-JWT/Auth/refresh testing, recovery checks, real email/PWA, monitoring, and separate delta re-audit are still required. **F01's native credential endpoint and F02's native logout guarantee remain unresolved under the original universal security requirements.** Keep PR Draft, never deploy or run migrations in production from this follow-up. A compatible forward repair is safer than reverting to prior vulnerable code.
