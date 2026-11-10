# PR #67 — real hosted acceptance, 10 November 2026

**Release consideration: NO-GO. Matrix: 14 PASS, 11 NOT VERIFIED, 13 BLOCKED, 0 confirmed FAIL.** PASS is scoped to the native-provider or forward-DDL scenario stated in the matrix; it does not certify a hosted Next.js UI or email delivery.

## Candidate, hosting and isolation

- Candidate: 9e371da2f883405daab3d0aa4a665f68c4fa6860, original Draft #67 preserved. #65, #66 and #52 were not edited, merged or deployed.
- Separate review branch: test/hosted-acceptance-20261110. It changes staging sender/origin configuration, adds a signed disposable runner and records evidence. The two hotfix migrations and the authorization helper source files are unchanged from the candidate.
- Supabase target: lpkxwwdzuligovfgpfey, ACTIVE_HEALTHY, eu-central-1, PostgreSQL 17.11.0.018, Free organization blezpaevjeyarvmayddg. Production gedwexwxaojpqyeiebwm was never a request target.
- Full HTTPS application URL / deployment SHA: UNAVAILABLE. Vercel project creation returned 403 forbidden: permission to create the project denied. No authenticated local CLI fallback exists. No new Vercel project/domain or web app deployment was created.
- Vercel billing page showed active Hobby, no payment method, no enabled paid extras. No plan upgrade, DNS change, add-on or paid resource was initiated.
- Real HTTPS provider runner: https://lpkxwwdzuligovfgpfey.supabase.co/functions/v1/pr67-acceptance — Edge Function version 6, bundle SHA-256 21fd55afe593b99287eace66b0124631f8e4f9cb8ae762d628931888f239482e. This is the signed test runner, not the full application.
- Unchanged candidate username-login Edge Function: version 1, bundle SHA-256 56584d22711a010fce1253bbb3ef1e12984f92d3b9b6069ba92c2603463cff82.
- Four synthetic administrator-confirmed example.invalid users; zero non-synthetic users. No genuine signup/email confirmation is claimed. No customer data, Production secrets or Production configuration was copied.

## Actual Auth / PostgREST results

Native Auth issued signed tokens for the expected identities and sessions. SDK getClaims verified them; PostgREST rejected a modified-subject token with HTTP 401. Three native TOTP factors were enrolled/challenged/verified and issued AAL2 tokens.

The username tests used the exact candidate authorizeUsername helper bundle against actual Auth, native sessions/factors and service/signed-user PostgREST. They verified role ACLs, legacy RPC/direct DML denial, existing AAL2 without fresh grant, AAL1 denial, foreign user/session/factor/target, unverified/expired/consumed grants, exact proof replay, normalized uniqueness, duplicate concurrent consume, audit atomicity and factor/session revocation. One concurrent mutation committed; one audit was recorded. After native factor/session removal, final consume failed with receipts still unconsumed and no audit.

A staging-only trigger raised QA67_FORCED_AUDIT_FAILURE inside the real PostgREST transaction. SQL confirmed no username mutation, no consume and no audit. The trigger/function were then removed. The same grant succeeded on retry. Final SQL confirmed exactly one audit per consumed grant and zero leftover failure triggers.

The password tests used the exact candidate authorizePassword/fresh-auth bundle for ordinary flows. Non-MFA current-password proof and MFA fresh owned TOTP both changed the expected synthetic credential. Separate native logins rejected old and accepted new passwords. Missing/wrong proof and disabled backup substitution were rejected. Direct provider rejection probes returned weak_password and same_password and left the credential usable. Application UI wording and the full reset server action remain unverified.

The helper bundles were reproduced exactly from the candidate by scripts/check-acceptance-adapters.mjs. Only the build-only server marker, explicit read-only Deno environment bridge and an explicit unsupported cookie boundary differ. Cookie-bound recovery is unavailable in this harness and is never represented as verified.

## Forward migration and recovery rehearsal

The initial 23 installed repository baseline SQL SHA-256 values matched source; both hotfixes were initially absent. Native baseline legacy username RPC and synthetic farm creation worked.

Applied the exact password hotfix SQL first, then exact username hotfix SQL. Auth user, profile, account, subscription and farm row fingerprints matched immediately before/after each DDL application. No irrigation schedule row was seeded. All 25 source SQL contents are retained unchanged; provider-generated migration history versions are explicitly mapped in operator-evidence.json.

Two additional history entries install/remove the disposable audit-failure fixture; their function/trigger are absent afterward. They are test history, not candidate schema migrations. Consumed receipts, new guards and legacy denial remain installed. No vulnerable schema/app rollback, project reset, deletion or pause occurred.

Matching #65 web app deployment between migrations, combined web app deployment, reverse hosted DDL order and application operational rollback/roll-forward remain unverified. Forward DDL success and transaction rollback do not certify those missing application stages.

## Environment and email configuration

| Configuration | Actual state / required staging setting |
| --- | --- |
| Supabase URL | https://lpkxwwdzuligovfgpfey.supabase.co |
| Staging service/publishable credentials | Fresh project-bound runtime credentials used only by Edge/native probes; no privileged key returned or logged; web app env not configured |
| Controller signing key | Fresh local P-256 key; only public verifier is committed |
| Runner authentication | Signature covers exact body/timestamp; 90-second freshness; explicit project guard; hard expiry 2026-11-11T23:59:59Z |
| Invalid runner requests | Unsigned, wrong signature and expired timestamp each returned HTTP 401 |
| Replay boundary | Warm-isolate replay cache is best effort; fixed limited test operations, native one-use grant checks and short signature lifetime remain in place; independent runner review required |
| AGROMIND_ACCEPTANCE_MODE | Must be true for the approved staging Supabase project; missing mode fails closed |
| NEXT_PUBLIC_SITE_URL | Missing until a real isolated HTTPS app is provisioned; staging rejects Production origin, credentials, paths and insecure URLs |
| Sender | Staging code permits only onboarding@resend.dev initially; Production default remains AgroMind accounts@agromind.ir |
| Recipient and approval | Explicit allowlist plus AGROMIND_ACCEPTANCE_EMAIL_APPROVED=true required; currently absent/off |
| RESEND_API_KEY / email-hook secret | Fresh staging values not configured |
| Support delivery / recovery codes | Remain disabled |
| Google test client | Not configured; native provider disabled |

The shared email assets/CTAs and support links use the staging origin when explicitly configured; no Production-origin fallback is allowed for the identified staging project. Default Production output passed existing email tests unchanged. Automatic Vercel deployment exclusions retain the original three branches and add this acceptance branch.

**Actual Send Email Hook results: BLOCKED.** No hook is configured and no full application hook endpoint is deployed. P-256 runner signature tests are not Send Email Hook signature/delivery tests. Unit tests cover the unchanged Standard Webhooks verification, but no live hook delivery/rejection or inbox receipt is claimed.

No test mail was sent. Resend's previously verified account email is admin@agromind.ir. Its testing sender is restricted to the matching account address; connected Gmail is a different address. Ownership, secure mailbox access and delivery for security-qa@agromind.ir are unverified. No Production mail key was opened/reused. auth@staging.agromind.ir remains unverified and requires separate DNS/sender approval.

## Human actions required

1. In the owner account, allow project creation/deployment/environment writes for the Vercel connection, or create a new Hobby project named agromind-pr67-acceptance and grant access to it. Use no Git auto-deployment link, no AgroMind custom domains, and no paid extras. Supply its project ID, not credentials in chat. The 403 denied creation, so an app URL cannot be fabricated.
2. Configure only that new project's staging Supabase credentials and fresh server secrets through secure provider environment settings. A deployment to this separate project's default Production target can expose its own vercel.app HTTPS origin to Supabase while standard preview protection remains enabled; it must never target the AgroMind production project or domain. Verify unauthenticated hook reachability plus application signature rejection before sending.
3. Establish secure access to the owner-controlled matching admin@agromind.ir mailbox for an initial onboarding@resend.dev smoke, or verify the proposed QA mailbox and an approved sender that can reach it. Create a fresh sending-only staging Resend credential. Confirm both endpoints before enabling the allowlist approval flag. Never paste passwords/API keys/OTPs into chat.
4. For Google groups, provide a dedicated test OAuth client/identity with the staging Supabase callback and exact app redirect. No Production OAuth secret reuse.
5. Complete the blocked application, recovery/nonce/PKCE/email/support and operational sequence groups after these prerequisites. Reverse hosted order needs a separate approved isolated replay environment or a separately approved safe reset plan that does not reopen consumed proof; none was performed.

## Validation and limits

- 317 JavaScript tests passed (including five new staging isolation tests); 34 PGlite passed, four native-only skips. The 140 auth/account tests are a subset, not an additional count.
- Lint/typecheck/localization and the Next.js production build passed. The existing verification-pending.tsx hook dependency warning remains.
- New hosted runner authenticated positive requests and rejected invalid/stale signatures. Native Auth/PostgREST observations and SQL state are separate evidence files.
- New independent-branch CI/review remains separate from the previously successful exact PR #67 Foundation run. No source security audit was restarted.
- Two early runner-health failures occurred during harness setup. A moving-time-step replay probe incorrectly generated a new code; it was corrected to reuse the exact proof and rejected. Historical records are retained as superseded NOT VERIFIED harness observations, not reported as product defects.
- No new confirmed product defect was found in the executed scope. No release authorization is implied. Universal F01/F02 remain unresolved and outside this task.

## 38-group results

See docs/acceptance/hosted-matrix.csv for each original scenario/expected evidence, exact candidate, prerequisite, method, actual result and sanitized evidence reference.

| Group | Result | Actual result / limitation |
| --- | --- | --- |
| 65-01 | PASS | Exact authorizePassword bundle with actual non-MFA current-password proof; real updateUser succeeded for expected user. Independent native logins rejected old and accepted new password. Wrong current password rejected. |
| 65-02 | PASS | Exact authorizePassword bundle with newly verified native owned TOTP; actual updateUser and independent old/new login outcomes matched expected identity. |
| 65-03 | NOT VERIFIED | Missing/wrong proof and disabled backup path rejected. Native wrong-TOTP error mfa_verification_failed. Full application stale/reuse/global-logout routing remains unverified. |
| 65-04 | NOT VERIFIED | Observed default native current-password policy OFF; application current-password proof worked. Native setting ON and transition behavior untested. |
| 65-05 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-06 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-07 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-08 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-09 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-10 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-11 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-12 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-13 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-14 | NOT VERIFIED | Actual provider returned weak_password and same_password; independent login confirmed credential unchanged. Application rejection wording untested. |
| 65-15 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-16 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-17 | NOT VERIFIED | Authorization helper rejects unauthorized proof. Full application action plus separate-session logout outcome untested. |
| 65-18 | NOT VERIFIED | Disabled backup-code path rejected. Enabled native supported-provider path not configured/verified. |
| 66-01 | PASS | Actual AAL2 signed-user legacy RPC and direct profiles.username DML each rejected with 42501. |
| 66-02 | PASS | Anon/authenticated reserve and attest RPCs rejected with 42501. Native service role reserve/attest succeeded; legacy and authorized-consume service calls rejected with 42501. |
| 66-03 | PASS | Native SDK getClaims verified expected signed subject/session identity; forged-subject token rejected by PostgREST HTTP 401. Revoked native session failed final consumption. |
| 66-04 | PASS | Existing signed AAL2 without a fresh grant rejected. Separate AAL1 native session rejected authorized consumption. |
| 66-05 | PASS | Exact candidate authorizeUsername bundle completed native fresh TOTP, service reserve/attest and signed-user consumption. Expected normalized profile and exactly one audit verified. |
| 66-06 | PASS | Actual foreign user, different native session, foreign factor and target mismatch rejected against live bound grants. |
| 66-07 | PASS | Unverified, naturally expired (202 seconds), consumed grant and exact reused proof rejected. Invalid moving-time-step probe is explicitly superseded in evidence. |
| 66-08 | PASS | Two independent concurrent PostgREST requests yielded one success and one rejection. SQL verified one consumed receipt and one audit for that mutation. |
| 66-09 | PASS | Uppercase public availability resolved normalized occupied username; authenticated case-normalized collision rejected with 23505. |
| 66-10 | PASS | Staging-only audit trigger raised QA67_FORCED_AUDIT_FAILURE through real PostgREST. SQL confirmed username unchanged, receipt unconsumed, no audit. Removed fixture; same grant retry succeeded. No fixture trigger remains. |
| 66-11 | NOT VERIFIED | Admin-confirmed synthetic accounts and real email/password login worked; unchanged username-login Edge Function returned HTTP 200 and expected signed identity. Genuine signup/email confirmation NOT TESTED. |
| 66-12 | PASS | Native factor unenrolled after attestation and native global session logout after attestation each caused final PostgREST consumption rejection. SQL confirmed factor/session absent and no consume/audit. |
| combined-01 | NOT VERIFIED | All 23 repository baseline SQL hashes verified; real legacy AAL2 RPC and synthetic farm seed succeeded. Baseline web application not deployed. |
| combined-02 | NOT VERIFIED | Exact #65 SQL installed first; seeded Auth/profile/account/subscription/farm fingerprints unchanged. Matching HTTPS web app/hook unavailable. |
| combined-03 | NOT VERIFIED | Exact #66 SQL installed second; seeded fingerprints unchanged; legacy RPC retired and new signed-native path succeeded. Combined HTTPS web app unavailable. |
| combined-04 | BLOCKED | No reverse-order hosted rehearsal. Existing consumed receipts/guards retained; no schema rewind/reset or additional project authorized/provisioned. |
| combined-05 | NOT VERIFIED | Actual audit rollback and same-grant retry verified; consumed receipts remain protected. Operational application rollback/roll-forward remains unverified. |
| combined-06 | NOT VERIFIED | Native login, JWT, MFA, password and username flows verified. Browser integration, Google and delivered recovery remain blocked. |
| combined-07 | BLOCKED | No approved recovery/notification inbox or fresh sending credential/hook; support notifications not sent. |
| combined-08 | PASS | Real forward #65 then #66 DDL preserved all seeded Auth users/profiles/accounts/subscriptions and synthetic farm fingerprints; no Auth user row changed. No irrigation schedule was seeded. |
