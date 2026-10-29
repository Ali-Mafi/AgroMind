# AgroMind PR #52 — Independent Security Audit

**Final verdict: NO-GO for production release.**  
**Completed:** 29 October 2026, Asia/Tehran.  
**Scope:** Account Security & Session Management, its existing authentication dependencies, direct database access, and release readiness. Audit only.

## 1. Executive security summary

The new remote-revocation handler has substantive controls: authoritative identity/session checks, an owned verified TOTP factor, a newly created native challenge even for AAL2, a two-minute operation reservation, durable rate/replay limits, atomic single-use consumption, and a database denial list applied through existing RLS/RPC guards. Independent isolated tests supported these controls. No cross-user session access or bypass of the new service-only database functions was found in the tested cases.

Nevertheless, the complete account-security surface does not meet the stated release requirements. An existing password-reset action retained in this PR accepts an already elevated session, changes the password, and globally signs out sessions without fresh TOTP or proof that this is an authorized recovery flow. The application-level missing authorization check was reproduced using the actual action with mocked provider calls. Hosted exploitation depends on password-change configuration and was not attempted. This is a **High** finding and a release blocker even though it predates this PR.

Direct Supabase Auth logout also remains outside AgroMind's fresh-TOTP policy. A direct username RPC accepts AAL2 without fresh proof and bypasses the newly added application audit write. The failure path for global revocation blocks its own initiating session, preventing the advertised same-session retry. Email retry content is not fully immutable despite the documented guarantee.

**Findings:** one High, three Medium, one Low; no Critical finding established. This is not a claim that no other vulnerabilities exist.

Mandatory isolated hosted Auth tests, actual email delivery, physical iPhone PWA testing, scheduler readiness, and hosted migration/rollback rehearsal remain outstanding. Green CI does not close these gates.

**Boundary maintained:** no repository code edits, commits, pushes, PR comments/reviews, merge, deployment, production migration, configuration change, email sending, or production-account security test was performed. Temporary test programs and this report were created outside the repository. Production inspection was read-only and limited to metadata, schema/policies, configuration-variable names, and aggregate storage inventory; no production user records or credentials were exported.

## 2. Confirmed revision and review scope

| Item | Independently observed state |
| --- | --- |
| Repository / PR | [Ali-Mafi/AgroMind #52](https://github.com/Ali-Mafi/AgroMind/pull/52), open, draft, not merged |
| Reviewed and final rechecked HEAD | `8e2c776c69283a2f891532dca8118ac79851d56f` — `8e2c776` is still current |
| Actual base branch / commit | `main`, `42a8eb2b54fd5852f11a2cc31e09dd7b598e4dc0` |
| Merge base | Same `42a8eb2…`; review used the actual base-to-HEAD diff |
| Implementation commit within PR | `425a16b38bbef5e4fc0a0eb755f7eb417285769b` |
| HEAD commit's role | Documentation/guarantees/rollback evidence; the reviewed tree includes implementation and documentation |
| Diff | 40 changed files, 1,614 additions, 88 deletions |
| New migration | `supabase/migrations/20261028164556_account_session_security.sql` |
| Down script | `supabase/rollback/account_session_security.sql` |
| Production deployment inspected | Vercel production deployment for `agromind.ir` points to base `42a8eb2…`, READY; PR HEAD is not the production deployment |
| Production migration inventory | New PR migration absent; production also has a prior extra invitation-index migration not in the checkout |
| Repository working tree | Clean after audit |
| CI | [Foundation run 40733935394](https://github.com/Ali-Mafi/AgroMind/actions/runs/40733935394) on the reviewed HEAD succeeded; its native database step is explicitly successful |

Reviewed material included the supplied project guide, workflow, architecture and design documents; repository `AGENTS.md`, canonical `docs/PROJECT_RULES.md`, `SECURITY_FIRST.md`, `ACCOUNT_SESSIONS.md`, existing account hardening, email/privacy documentation, release/rollback instructions, every new security service and migration, changed authentication hooks, existing MFA/recovery architecture, relevant RLS and account/farm/team/support RPCs, SDK logout implementation, and PWA/session cleanup code.

All repository line references below refer to the reviewed HEAD, including unchanged dependencies. Provider documentation/source describes available behavior, not proof of the deployed Supabase Auth build or configuration.

## 3. Findings grouped by severity

### High — F01: Password-reset action bypasses fresh authorization and globally revokes sessions

**Status:** verified application control-flow defect; isolated action reproduction completed; hosted password-change acceptance NOT VERIFIED. **Origin:** inherited from the base, retained in a security-sensitive file touched by this PR. **Blocks release:** YES.

**Affected locations:**

- [features/authentication/services/actions.ts, lines 529–576](https://github.com/Ali-Mafi/AgroMind/blob/8e2c776c69283a2f891532dca8118ac79851d56f/features/authentication/services/actions.ts#L529), particularly AAL check at 558–560 and password/global-signout calls at 562–576.
- [features/authentication/components/email-entry.tsx, lines 58–65](https://github.com/Ali-Mafi/AgroMind/blob/8e2c776c69283a2f891532dca8118ac79851d56f/features/authentication/components/email-entry.tsx#L58).

**Technical explanation:** `resetPasswordAction` checks identity, active session, expected user, and whether AAL2 is already present. It does not require a recovery-specific authorization, a fresh TOTP challenge, the current password, or a single-use operation grant. If the existing session is AAL2, it calls `updateUser({password})` and then `signOut({scope:'global'})`. The `/reset-password` UI renders a reset form for an ordinarily signed-in user without a reset link. The new protected remote-signout handler is bypassed entirely.

**Prerequisites/exploitability:** possession of a usable account session; AAL2 if the account has MFA. For password mutation and the subsequent explicit sign-out, Supabase must accept the password update. The provider's recent-login reauthentication policy ordinarily permits updates for sessions created within 24 hours; a separate current-password requirement can change that result. The actual hosted settings were not obtained. A user ID is not an authorization secret and is supplied by the reset page. CSRF protection does not prevent an attacker controlling an authenticated session from making a same-origin request.

**Impact:** unauthorized credential replacement and global session termination from an existing session, defeating the requested fresh-TOTP policy. On an MFA account, password replacement alone is not proof that the attacker can subsequently satisfy MFA; do not equate this test with a demonstrated complete MFA takeover.

**Reproduction/evidence:** an independent probe loaded the actual action, supplied a one-hour-old AAL2 context, and submitted only `password`, `confirmPassword`, and `expected_user_id`. With provider success modeled, observed calls were:

```text
updateUser({ password: <synthetic new password> })
signOut({ scope: "global" })
redirect("/sign-in?status=password-updated")
```

No recovery proof, current password, new TOTP challenge, or revocation reservation was requested. Base inspection confirmed the same permissive control flow already existed.

**Remediation:** distinguish ordinary password change from recovery. Require server-enforced fresh proof for ordinary changes and an authenticated, short-lived, operation-bound, single-use recovery authorization for recovery. Apply the approved MFA policy to every path that changes credentials or revokes other sessions. Verify provider password-update requirements rather than relying on a recent-login window. Add negative tests for ordinary AAL2 visits to `/reset-password`, replay, wrong session/user, and the resulting global logout.

### Medium — F02: Native Supabase logout bypasses the application fresh-TOTP restriction

**Status:** confirmed architecture/API boundary from provider documentation, upstream source, and installed SDK inspection; actual hosted request NOT EXECUTED. **Origin:** existing provider boundary, explicitly retained. **Blocks release:** YES under the mission's requirement that existing AAL2 alone must not authorize remote revocation.

**Affected locations:**

- [features/account-security/services/revoke.ts, lines 23–52](https://github.com/Ali-Mafi/AgroMind/blob/8e2c776c69283a2f891532dca8118ac79851d56f/features/account-security/services/revoke.ts#L23): checks apply only to this application path.
- [docs/ACCOUNT_SESSIONS.md, lines 103–112](https://github.com/Ali-Mafi/AgroMind/blob/8e2c776c69283a2f891532dca8118ac79851d56f/docs/ACCOUNT_SESSIONS.md#L103): correctly acknowledges the provider boundary.
- Installed `@supabase/auth-js/src/GoTrueAdminApi.ts:142–161` and `GoTrueClient.ts:4080–4117`: native logout is an authenticated POST, with no application operation grant.

**Technical explanation:** `/auth/v1/logout?scope=others` or `global` is available directly at Supabase. It does not run AgroMind's action or consult its grant/rate-limit tables. The current upstream logout handler takes the authenticated user/session and requested scope, with no fresh-TOTP verification. The publishable API key is not an access-control secret. Keeping normal browser tokens in HttpOnly cookies is useful, but does not constrain a stolen bearer credential or a client that signs in directly to Supabase.

**Prerequisites/exploitability:** a bearer session accepted by the native Auth endpoint plus the project's publishable key; provider endpoint/configuration behavior must be validated on an isolated hosted project. Existing AAL2 is more than enough for the documented native logout model; an application TOTP code is not part of the request.

**Impact:** other sessions can be invalidated without the intended fresh proof, application quota, or application `revocation_requested` event. This finding concerns authorization to terminate sessions, not a cross-user logout exploit. Native Auth also has its own factor-management AAL rules; those require a separate hosted stolen-AAL2 test and cannot be represented as protected by this application's fresh-proof gate.

**Reproduction plan, not a passed live test:** with two own isolated sessions, send an authenticated native POST to `/auth/v1/logout?scope=others` without any TOTP or operation ID; test preservation of the caller and revocation of the other session. Inspect both native and application audit trails.

**Remediation:** establish an enforceable provider-level boundary or formally change the security requirement through an explicit threat-model decision. Extra checks in Next.js alone cannot fix a directly callable Auth API. Do not invent an unsupported Supabase setting or promise that a client-side key restriction enforces fresh TOTP. Documentation acknowledges the limitation; acknowledgment does not satisfy the current requirement.

### Medium — F03: Direct username RPC accepts old AAL2 and bypasses the new audit write

**Status:** reproduced against actual migrations in isolated PostgreSQL/PGlite. The same function definition was also confirmed in the production catalog using a read-only query. **Origin:** authorization gap inherited; audit integration added by this PR is incomplete. **Blocks release:** YES for the reviewed account-security/fresh-proof and audit-integrity requirements.

**Affected locations:**

- [supabase/migrations/20260923173735_stronger_signup_credentials.sql, lines 24–73](https://github.com/Ali-Mafi/AgroMind/blob/8e2c776c69283a2f891532dca8118ac79851d56f/supabase/migrations/20260923173735_stronger_signup_credentials.sql#L24), especially 52–59 and authenticated grant 72–73.
- [features/account/services/username-actions.ts, lines 77–111](https://github.com/Ali-Mafi/AgroMind/blob/8e2c776c69283a2f891532dca8118ac79851d56f/features/account/services/username-actions.ts#L77).

**Technical explanation:** the server action requires `verifyFreshIdentity`, but the authenticated, exposed `change_username` RPC only checks an active verified user, an enrolled TOTP factor, and `aal2`. It checks neither freshness nor a one-use authorization. The new audit event is emitted after the application action, outside the database mutation, so direct RPC changes create no `username_changed` event.

**Prerequisites:** active owned AAL2 JWT and an available valid username. No other user's account can be changed by this finding.

**Impact:** account login-identifier changes without the promised fresh proof, and an incomplete security history even when all services are healthy.

**Reproduction/evidence:** using role `authenticated`, a valid owned session, `aal2`, and an empty AMR array, the independent SQL probe successfully called `change_username('audit_name_one')` and then `change_username('audit_name_two')`. The count of `private.security_events` with kind `username_changed` remained zero. Real migration definitions were used; no production mutation was made.

**Remediation:** enforce fresh, operation-bound authorization at the mutation boundary, or restrict the callable mutation to a vetted server path with that authorization. Write the audit event atomically with the database change. A recent reusable AAL2 claim alone is insufficient for a one-use sensitive-action policy.

### Medium — F05: Pending global revocation disables its own retry path

**Status:** reproduced in isolated SQL; provider failure simulated. **Origin:** new implementation. **Blocks release:** YES until a usable, verified failure/recovery path and operational handling exist.

**Affected locations:**

- [supabase/migrations/20261028164556_account_session_security.sql, lines 153–174](https://github.com/Ali-Mafi/AgroMind/blob/8e2c776c69283a2f891532dca8118ac79851d56f/supabase/migrations/20261028164556_account_session_security.sql#L153): global scope tombstones the current session; failed completion becomes pending.
- Same migration, [lines 133–135](https://github.com/Ali-Mafi/AgroMind/blob/8e2c776c69283a2f891532dca8118ac79851d56f/supabase/migrations/20261028164556_account_session_security.sql#L133): retry denies that session.
- [features/account-security/services/revoke.ts, lines 52–55](https://github.com/Ali-Mafi/AgroMind/blob/8e2c776c69283a2f891532dca8118ac79851d56f/features/account-security/services/revoke.ts#L52): instructs the user to refresh/retry.
- [features/authentication/services/mfa-actions.ts, lines 617–620](https://github.com/Ali-Mafi/AgroMind/blob/8e2c776c69283a2f891532dca8118ac79851d56f/features/authentication/services/mfa-actions.ts#L617): redirect occurs only on confirmed global success.

**Technical explanation:** global consume blocks every snapshot session, including the initiating session, before native sign-out. If native sign-out fails, the operation is pending and its tombstones correctly remain. However, the current-session RPC now returns null, and both the application context and a new reservation reject the initiating session. Refreshing cannot make the advertised retry work. No pending-revocation reconciliation worker was found. The SDK may also clear the local session on a global sign-out error.

**Prerequisites:** a valid fresh authorization followed by a native Auth error, interruption, or uncertain completion. No attacker is necessary; this is a failure-recovery and residual-access issue.

**Impact:** the owner must establish a new valid login or use an operational recovery path, while native sessions may remain. Guarded AgroMind data is denied, but the native refresh credentials have not been proven revoked. Their lifetime is not bounded by the current access JWT's expiry: a still-live native session may refresh until native revocation or provider policy ends it.

**Reproduction/evidence:** global reservation → consume → finish with failure produced `pending`; `get_current_session()` returned null; a new reservation from the same session failed with `SECURITY_DENIED`; both native fixture rows remained. This is a real SQL result, not a test of hosted refresh-token issuance.

**Remediation:** keep the fail-closed denial, provide an explicit reauthentication/recovery path, and define supported native completion/reconciliation with monitoring. Any worker must retain a durable, narrowly scoped authorization model and use supported Auth APIs. Do not clear live tombstones merely to enable retry. Test global failures, response loss after successful revocation, and owner recovery end to end.

### Low — F04: Email retry body is not immutable

**Status:** reproduced with the actual email renderer and a controlled clock. **Origin:** new security queue inherits a dynamic shared template. **Blocks release alone:** NO; correct the guarantee and address retry consistency before relying on immutable-payload claims.

**Affected locations:**

- [features/support/services/notifications.ts, lines 44–49](https://github.com/Ali-Mafi/AgroMind/blob/8e2c776c69283a2f891532dca8118ac79851d56f/features/support/services/notifications.ts#L44): rerenders every retry while retaining `support/<job ID>`.
- [lib/email/layout.ts, lines 136 and 144](https://github.com/Ali-Mafi/AgroMind/blob/8e2c776c69283a2f891532dca8118ac79851d56f/lib/email/layout.ts#L136): current UTC year changes HTML and text.
- [supabase/migrations/20261028164556_account_session_security.sql, lines 111–113](https://github.com/Ali-Mafi/AgroMind/blob/8e2c776c69283a2f891532dca8118ac79851d56f/supabase/migrations/20261028164556_account_session_security.sql#L111): freezes recipient/locale/details, not the final body/template version.

**Prerequisites:** a retry spans a UTC year boundary or a deployment that changes the shared renderer; an earlier provider request has been accepted with the same key.

**Impact:** the retry can conflict with Resend's same-key/same-payload requirement, leaving a job unacknowledged and producing misleading delivery-failure status. The first request may already have delivered the email; this is not evidence of duplicate inbox delivery or a proven lost email.

**Reproduction/evidence:** render identical queued details at `2026-12-31T23:59Z` and `2027-01-01T00:01Z`. Both HTML and text differ because the copyright year changes. The retry key is unchanged. Resend documents a conflict for a reused key with a different body.

**Remediation:** freeze the complete send payload, or persist and honor an immutable template version and deterministic rendering inputs, including year. Cover deployment-crossing retries and ambiguous provider acceptance/ACK loss.

## 4. Authentication and fresh-TOTP assessment

For the new `revokeRemoteSessions` path specifically, static review and executed tests support the following:

| Control | Evidence and limit |
| --- | --- |
| Server identity | `getUser` plus `get_current_session`; verified email, native session ownership, expiry and denial are checked |
| Current-session binding | Session ID originates from JWT-aware RPC, not form data; begin and consume recheck it |
| Operation binding | Stored `others`/`global` scope; consumer returns scope and action checks it; arbitrary target IDs rejected |
| Fresh verification | Always invokes a new challenge and verify, even with existing AAL2; no reusable browser proof accepted |
| Factor ownership | Verified owned TOTP is selected; SQL rechecks factor owner/status |
| Short validity | Reservation expires after two minutes; expired consume rejected in SQL tests |
| Single use | Consumed/state checks, row lock and user advisory lock; repeat consumption rejected |
| Replay/rate control | Keyed OTP hash, uniqueness, ten-minute replay/quota window; five reservations per ten minutes; overlapping verification rejected |
| CSRF | Next Server Action POST protection plus explicit Origin/Host and production HTTPS check; missing/foreign origins rejected in executed mocked tests |
| Cross-user isolation | Foreign session/factor/operation attempts failed in SQL probes |
| Service role | Seven new public worker entry points denied to both anon and authenticated; private tables are not ordinary-user read/write APIs |

Limitations: native challenge expiration, actual TOTP verification/reuse behavior across other authentication flows, provider challenge-rate limits, token rotation, and simultaneous hosted requests were not independently exercised. A grant is intentionally consumed by trusted server code after native verification; the database does not itself perform TOTP verification. A compromised service-role secret is outside this protection boundary. No password or recovery-code fallback exists in the new remote handler. These strengths do not cure F01, F02 or F03 elsewhere.

OAuth review found allowlisted destinations, PKCE exchange, secure intent-cookie handling, no-store redirects, and no new external redirect introduced by the PR. Notification observation follows successful exchange and database MFA gating. Repeated callbacks and concurrent login/cookie replacement still need hosted tests; no browser-session fixation exploit was established by static inspection.

## 5. Critical JWT/revocation question — exact answer

**For the existing guarded AgroMind database resources tested, a targeted session is denied on subsequent fresh requests after the denial transaction commits, even while its JWT is unexpired and its native Auth row still exists. This is not enforcement only in Next.js.** The strengthened `private.session_is_active()` is reached through existing `is_verified`/`mfa_access_allowed` RLS and RPC gates.

This was tested with real migrations and role/claim contexts in isolated PostgreSQL/PGlite. It was not an HTTP PostgREST test with an actual signed hosted JWT, nor proof about every provider endpoint.

| Access path | Result / remaining exposure |
| --- | --- |
| Protected Next.js pages and server actions | `currentUser`/`requireUser`/security context use the authoritative session RPC. Already-running work can have passed a check before revocation |
| Direct PostgREST table reads | Isolated denied-session queries returned no rows from profiles, accounts, subscriptions, plans, plan entitlements, farms, irrigation schedules, legacy imports, farm memberships, support tickets and support messages |
| Direct database RPCs | Cloud snapshot returned no private profile/farm data; tested account/team/support/security mutations denied the revoked session |
| Direct Supabase client database calls | Same RLS/RPC boundary applies when using user credentials. Ordinary app browser code does not instantiate a token-bearing Supabase Auth client |
| Farm/account operations | Direct farm update/schedule delete and selected privileged RPC probes denied; existing ownership tests also passed |
| Supabase native Auth | AgroMind tombstones are not consulted. Current upstream Auth code checks native session existence on authenticated requests, but the deployed build/endpoint behavior is unverified. Before native completion, a still-live session can retain native capabilities |
| Refresh credentials | Supported native logout scopes revoke affected refresh sessions. No live refresh-after-revocation test performed. Pending native failure is not completed refresh revocation |
| Storage | Repository has no active Supabase Storage integration; read-only production inventory returned zero buckets. No storage revocation certification is claimed |
| Realtime | No application Supabase channel/subscription usage found. Existing/future realtime authorization and disconnect behavior must be tested separately; no immediate-disconnect claim |
| Browser memory, downloaded data, responses in flight | Not retroactively erased or cancelled. Suspended PWA screens can retain previously rendered information |

**Exposure windows:**

- Guarded new database operations: denial takes effect once the transaction commits and the operation observes the updated database state; previously started transactions/requests are excluded.
- Any stateless JWT-only surface: up to the token's remaining `exp` lifetime. Local config says `jwt_expiry=3600`; hosted expiry is NOT VERIFIED, so one hour is not asserted as a production maximum.
- Pending native logout with live refresh credentials: potentially beyond one access-token lifetime, until actual native revocation or provider session limits terminate it.
- Cached/downloaded data: no finite remote-erasure guarantee.

`signOut({scope:'others'})` is supported and preserves the calling native session by design; `global` includes it. Actual current-device preservation under concurrent refresh, and remote refresh failure across devices, remain mandatory hosted tests. SDK sign-out can suppress certain native 401/403/404 errors; the PR's additional target-row check helps avoid declaring surviving snapshot sessions revoked. Targets created after the snapshot and concurrent new logins require explicitly tested semantics; a logout request is not a permanent account ban.

## 6. Login notifications and audit history

**Supported by code and isolated evidence:** password/username login, Google callback, recovery, and MFA-completion paths observe real session IDs. Verified-factor accounts at AAL1 are recorded but not completed; successful completion inserts one unique login event and one unique outbox job. Existing sessions are baselined. Eight repeated observations in an independent SQL probe did not duplicate the job. Invalid/cross-user observations and blocked sessions are rejected. Email delivery runs through `after()` and the durable shared worker, not a frontend event listener.

Leases, skip-locked claiming, fencing ACKs, stable job keys, ten-minute failed-delivery backoff, and the 23-hour security-job age cutoff provide meaningful duplicate control. Independent SQL probes confirmed exclusion during a lease, rejection of a stale ACK, and expiry. The worker catches send errors; an email provider rejection does not directly reject authentication. Observation itself is awaited and uses Auth/database calls; no full outage/latency guarantee was demonstrated. Only privileged worker requests have an explicit five-second fetch bound in the new security worker.

**Limits requiring explicit acceptance/testing:**

- A direct native login that never reaches AgroMind can avoid this application's login email and app history. Direct database access after native authentication does not itself invoke `observeLogin`.
- An observation outage can permanently miss a session that never returns; reconciliation is request-driven, not a complete Auth event stream.
- Reconciled metadata describes the first observed request, which can occur later than login. It must not be treated as proven original-login location.
- Delivery is provider acceptance, not guaranteed inbox receipt; no delivery webhook/inbox outcome was verified.
- Audit events for native account changes are best-effort. Direct native changes are not reconstructed; F03 bypasses an app event even without an outage.
- The audit table is access-controlled against ordinary users, not cryptographically append-only or immutable against privileged database/service administration. Retention intentionally changes/deletes it.
- F04 invalidates the claim of a fully immutable rendered retry body.

**Metadata and privacy:** Vercel helpers are trusted only when server environment `VERCEL=1`; outside that boundary IP/location are unavailable. IP syntax is validated. Raw UA is bounded and discarded after broad OS/browser/device classification. Location strings are bounded/control-stripped and the premium template escapes values. Existing executed tests covered HTML injection, malformed metadata, FA/EN directions and missing data. UA descriptions remain spoofable and geolocation can reflect VPN/proxy egress; they are not identity proof. Actual Vercel ingress/header overwrite behavior was not penetration-tested. Full public IP and approximate location are sent to Resend and the recipient, which is an intentional privacy surface requiring the stated retention/privacy policy.

The shared Signature Premium renderer is reused; FA uses Persian calendar/Tehran time and EN uses UTC. The browser uses explicit UTC with user calendar/numeral preferences. Actual Gmail/Apple Mail rendering, delivery, spam placement and RTL/dark-mode behavior are NOT VERIFIED in this audit.

## 7. Database, migration and rollback safety

The migration is additive to application data. It reads provider-owned `auth.sessions`, users and factors; it does not introduce writes or triggers on provider Auth tables. New private tables have RLS enabled and ordinary-user privileges revoked. Privileged functions use an empty search path and qualified application objects; service wrappers explicitly restrict execution. Snapshot reads derive the user from authenticated claims. No ordinary-user path to read another user's sessions or edit private audit/grant/denial records was established.

Native Auth session columns used by the migration were checked against the production catalog. Existing production policies use restrictive MFA gates where intended, and the existing session helper is the baseline version without the new tombstone check. Production has not received this migration. Catalog inspection cannot prove migration execution time, lock impact, backfill behavior at production scale, or real Auth concurrency.

**Transaction boundaries:** observation/event/outbox creation is atomic; grant consumption/target denial/requested-event creation is atomic. Native Auth logout happens outside that database transaction, creating the pending state examined in F05. Account/provider audit writes outside their mutations can have gaps.

**Retention:** app metadata/payloads are scrubbed after 30 days; history after 90; operation rows after one day, with per-user ten-minute cleanup on new attempts. Denial rows are removed only after native session disappearance. Independent SQL confirmed pruning did not restore a stale session's data access. These limits depend on successful pruning and do not control backups, provider logs or inbox copies.

**Forward release ordering:** install and verify migration before deploying the new app. Baseline sessions were tested with users/sessions genuinely present before applying the new migration. The old app can still use the additive session RPC response. Without the migration, the new security context/list and queue calls cannot function correctly.

**Rollback:** the down script is transactional and refuses to proceed while a denied native session still exists. Existing executed SQL tests covered refusal and restoration after simulated native cleanup. It deletes this feature's history, metadata, authorization/denial tables and security jobs; that data loss is irreversible without an export/backup. Full rollback requires app rollback, audit export and supported native cleanup first. Prefer retaining the migration and denial guard during application rollback. However, the earlier app restores the earlier remote-signout authorization policy, and its older mail worker does not itself perform the new retention pruning; retain a functioning retention process explicitly. Do not describe app rollback as preserving all new guarantees.

## 8. Evidence and execution record

| Check | Result and evidence class |
| --- | --- |
| GitHub PR metadata, actual checkout, base diff | Independently read; final HEAD rechecked after continuation |
| Production commit/domain and migration inventory | Read-only provider metadata inspected; production remains on base |
| Dependency installation | `npm ci --ignore-scripts --no-audit --no-fund` completed; this was not a vulnerability scan or normal lifecycle-script certification |
| Existing JavaScript tests | Executed: 293 passed, zero failed |
| Existing PGlite database tests | Executed: 29 passed, zero failed; 3 native-only tests skipped |
| Independent probes | 13 completed groups, plus the supplemental pending-global group: 14 total; actual migrations/action/template, with synthetic data and mocked Auth boundary |
| Native local PostgreSQL | NOT VERIFIED: runner could not start (`EINVAL`); alternate unprivileged launch failed (`cannot set groups: Operation not permitted`) |
| CI native PostgreSQL | GitHub run and job-step success independently inspected; this is CI evidence, not a locally reproduced or hosted Supabase concurrency test |
| Lint/typecheck/localization/build/HTTP | Successful steps verified in that CI run; not rerun independently during this audit |
| Diff whitespace / repository integrity | `git diff --check` clean; tracked working tree clean |
| Hosted Auth, real JWT/refresh HTTP tests | NOT EXECUTED |
| Automated browser E2E | NOT EXECUTED; prior PR fixture claims were reviewed, not adopted as independent execution |
| iOS Safari / installed iPhone PWA / Android / desktop real flows | NOT EXECUTED |
| Actual Gmail/Apple Mail delivery | NOT EXECUTED |

Independent probe coverage comprised: actual baseline backfill; AAL1 denial and owner isolation; all seven service-only public functions denied to anon/authenticated; direct username bypass; foreign-session/factor/operation and double-consume denials; denied-session reads of eleven tables; sensitive mutation denials; expiry/replay/uncertain completion; pruning safety; MFA notification deferral/durable deduplication; lease fencing/expiry; password-reset bypass; deterministic email-body mismatch; and pending-global retry denial.

PGlite models SQL with supplied JWT claim contexts; it does not authenticate signatures or run GoTrue, PostgREST, native refresh rotation, provider MFA, or independent native connections. The independent behavioral probes above execute SQL or application/template code. Some existing repository tests use mocks/source assertions; their aggregate success is reported separately and is not proof of a provider security guarantee.

The production security advisor reported leaked-password protection disabled and advisories about callable security-definer functions/private tables without policies. The latter are not automatically vulnerabilities: intentional worker-only tables deny ordinary access, and exposed functions require individual review. The disabled leaked-password protection is an inherited operational risk, not evidence that this PR introduced credential stuffing. See the [provider remediation guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## 9. Production prerequisites and unverified assumptions

| Requirement | Current evidence / gate |
| --- | --- |
| Supabase URL/publishable key, service-role credential | Production variable names present; secret values/correctness were not tested |
| `RESEND_API_KEY`, configured sender, `CRON_SECRET` | Production variable names present; live sender authorization, key validity and delivery not tested |
| `SECURITY_EMAIL_ENABLED=true` | Variable absent from the inspected project list; activation is a release prerequisite, not authorized in this audit |
| Existing support flag/mailbox | Names present; values and production behavior not revalidated |
| Recovery-code feature | Application has an explicit environment gate; no production recovery-code enablement/capability assumed |
| Preview/test environment | Required Supabase/cron application variable names were production-only in the inspected list; Resend appeared in multiple targets. No complete isolated hosted test environment was established |
| Scheduler | PR hardcodes ten-minute cron. Compatible Vercel plan or equivalent scheduler NOT VERIFIED. Hobby permits daily frequency only; do not infer plan from project metadata |
| Runtime | Production project reports Node 24.x; CI uses Node 22; repository requires Node >=22. Audit JavaScript ran on Node 24.22.1. Full production build on this audit host not executed |
| Auth policy | Hosted JWT lifetime, inactivity/timebox/single-session limits, current-password/reauthentication rules, MFA hooks/rate limits, redirect allowlist and CAPTCHA NOT VERIFIED |
| Monitoring | Log statements/runbook exist; configured queue-age, pending-revocation, audit-loss and retention alerts/ownership NOT VERIFIED |
| Migration/rollback | Isolated SQL evidence exists; isolated hosted rehearsal, production lock/backfill budget and export/restore procedure remain required |

The worker leases at most 20 jobs per drain. Ten-minute cron alone supplies at most 120 leased jobs/hour before failures/other workloads; post-login drains can add capacity. This is a planning calculation, not measured throughput. Support and security share a queue; test backlog fairness, API rate limits and outage recovery. The cron endpoint can return HTTP 200 after worker-caught errors, so monitoring only HTTP status is insufficient.

Existing users should not be intentionally logged out by the additive migration. Baseline suppression protects them from rollout emails. Risks of unexpected denial remain if the app precedes the migration, provider timeout policies are inconsistent with the row-based guard, required services fail, or a global revocation becomes pending. Native TOTP verification has provider session side effects that the SQL fixture does not model; verify effects on lower-assurance sessions during hosted acceptance.

## 10. iPhone PWA and browser assessment

Static review found numeric OTP input, one-time-code autocomplete, explicit LTR code entry inside localized UI, native dialog behavior, dynamic viewport/safe-area styling, and FA/EN strings. Normal local logout uses BroadcastChannel and full-document navigation. Farm context reloads on bfcache restoration/reconnect. The service worker avoids storing navigations/private API/RSC responses and limits caching to public assets.

These are implementation observations, not device certification. Global sign-out uses a server redirect and does not itself invoke the normal LogoutButton broadcast. Suspended/open tabs can keep already-rendered content; global/remote sign-out does not provide universal immediate UI blanking. Browser profiles and installed PWA storage contexts require real testing. Token refresh is primarily mediated by server requests/proxy; no foreground-resume guarantee was demonstrated. ASCII-only OTP validation also needs Persian-keyboard/autofill acceptance testing.

Required matrix: iOS Safari, installed iPhone PWA, Android Chrome, desktop Chrome/Firefox/Safari where supported, separate profiles, and multiple tabs. Cover keyboard/autofill, rotation, safe-area/footer access, modal focus/cancel, RTL/LTR, light/dark, long metadata, offline/reconnect, background/foreground, bfcache, expired tokens, concurrent refresh, and account switching. **No physical device was tested in this audit.**

## 11. Required fixes before merge and mandatory live tests

Before merge/release approval:

1. Close F01 with enforced fresh authorization/recovery separation and negative tests; verify the hosted password-change policy.
2. Resolve F02 against the stated security requirement. If provider-native behavior cannot meet it, obtain an explicit revised threat model and guarantee; do not silently mark the requirement passed.
3. Close F03 at the database mutation boundary and make username auditing atomic.
4. Fix and rehearse F05's pending-global recovery path, completion handling and monitoring without weakening denial.
5. Fix F04 or narrow the immutable-content guarantee and accept the documented retry-status risk explicitly.
6. Complete the release prerequisites and hosted/device/email tests below on the final candidate. Reaudit changed security paths; do not rely on this report for a later SHA.

Mandatory isolated hosted integration tests, using only designated test accounts:

- Password, username, Google PKCE and recovery; ordinary AAL2 password-reset rejection; fresh authorized password change; failed/abandoned MFA; complete MFA; repeated callbacks; simultaneous sign-ins and account switches.
- Two sessions for one account plus a foreign account. Validate listing/current marker, missing historical metadata, real timeout policies and accurate state after refresh.
- Existing AAL2 without code, foreign factor/session, malformed and expired challenge, invalid OTP, replay across scopes/sessions, duplicate consume, parallel reservation/consume, quota across instances, and native direct-call boundaries.
- Preserve the current session for `others`; remove it for `global`. Retain pre-revocation access/refresh tokens, then test route handlers, server actions, direct PostgREST reads/writes/RPCs, native Auth and refresh. Record actual timestamps, statuses and the JWT's `exp` without exposing tokens.
- Race token refresh and sign-out; create a new login during revocation; inject provider failure before deletion and lost response after deletion. Verify pending state, retained data denial, owner recovery, eventual native completion and audit consistency.
- Repeated tabs/reloads/refresh must produce one durable login event/job. Inject observation and email failures, delayed retries, stale leases/ACK loss, template deployment/year changes, queue overload and jobs older than 23 hours. Verify alerts and absence of secret logging.
- Receive FA/EN emails in actual Gmail and Apple Mail; verify sender, subject, CTA, approximate metadata, time zones, RTL/dark/image-blocked layouts and delivery outcomes.
- Complete the physical/browser matrix in section 10.
- Rehearse migration with baseline sessions and existing support jobs, old/new app compatibility, retention, guarded rollback refusal, audit export and supported cleanup. Confirm no unauthorized access is restored.

No live integration result above is marked passed by this report.

## 12. Final release decision by area

| Area | Decision | Reason |
| --- | --- | --- |
| Authentication security | NO-GO | F01 remains; hosted password/recovery configuration unverified |
| Fresh TOTP enforcement | NO-GO | New handler supported by isolated evidence, but alternate application/provider paths violate the full requirement |
| Remote session revocation | NO-GO | Supported native scopes used; F05 recovery gap and mandatory hosted refresh/concurrency tests unresolved |
| JWT and RLS enforcement | CONDITIONAL GO for the tested design | Strong database-level denial evidence; actual hosted HTTP/JWT/provider behavior still unverified |
| Login notification reliability | CONDITIONAL GO for the architecture | Durable dedupe/leases supported; F04, observation blind spots, activation and real delivery outstanding |
| Database and migration safety | CONDITIONAL GO | Isolation/ACL/rollback tests support design; hosted rehearsal and operational lock/retention evidence missing |
| Operational readiness | NO-GO | Security-mail activation, scheduler compatibility, monitored recovery and environment readiness incomplete/unverified |
| Real-device and email testing | NO-GO | Mandatory acceptance not performed |

**Overall: NO-GO.** The High application authorization finding and unresolved mandatory release gates prevent production approval. This verdict does not authorize remediation, merge, deployment or configuration changes. Work stops at this audit report pending explicit instruction.

## References

Repository links above are pinned to the reviewed SHA. Provider references were independently consulted during this audit:

- [Supabase session lifetime, refresh reuse and session-row validation](https://supabase.com/docs/guides/auth/sessions)
- [Supported JavaScript sign-out scopes and JWT limitation](https://supabase.com/docs/reference/javascript/auth-signout)
- [Supabase sign-out semantics](https://supabase.com/docs/guides/auth/signout)
- [Native logout implementation](https://github.com/supabase/auth/blob/master/internal/api/logout.go) and [native session authentication](https://github.com/supabase/auth/blob/master/internal/api/auth.go); upstream master, not confirmation of hosted build
- [MFA factor unenrollment/AAL requirement](https://supabase.com/docs/reference/javascript/auth-mfa-unenroll)
- [Password change/reauthentication controls](https://supabase.com/docs/guides/auth/password-security)
- [Resend idempotency: 24-hour lifetime and payload consistency](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Vercel request headers](https://vercel.com/docs/headers/request-headers)
- [Vercel cron frequency limits](https://vercel.com/docs/cron-jobs/usage-and-pricing)

## Appendix: changed-file inventory

```text
app/account/security/loading.tsx
app/account/security/page.tsx
docs/03_ARCHITECTURE.md
docs/05_MASTER_PROGRESS.md
docs/ACCOUNT_SECURITY_HARDENING.md
docs/ACCOUNT_SESSIONS.md
docs/EMAIL_SYSTEM.md
docs/PRIVACY_DATA_FLOW.md
docs/progress/2026-10-28-security.md
docs/progress/README.md
features/account-security/components/session-panel.tsx
features/account-security/lib/email.ts
features/account-security/lib/metadata.ts
features/account-security/services/login.ts
features/account-security/services/revoke.ts
features/account-security/services/server.ts
features/account-security/tests/security.test.mjs
features/account-security/types/security.ts
features/account/components/security-center.tsx
features/account/services/username-actions.ts
features/account/tests/support.test.mjs
features/authentication/components/fresh-identity-fields.tsx
features/authentication/services/actions.ts
features/authentication/services/callback.ts
features/authentication/services/mfa-actions.ts
features/authentication/services/session.ts
features/authentication/tests/auth.test.mjs
features/authentication/tests/security-hardening.test.mjs
features/navigation/tests/workspace.test.mjs
features/settings/constants/security-persian.ts
features/support/services/notifications.ts
lib/supabase/database.types.ts
package-lock.json
package.json
scripts/preview-emails.mjs
scripts/qa-account-security.mjs
supabase/migrations/20261028164556_account_session_security.sql
supabase/rollback/account_session_security.sql
supabase/tests/foundation.test.mjs
vercel.json
```
