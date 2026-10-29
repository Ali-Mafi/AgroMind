# Account security and sessions — review candidate

Baseline: `42a8eb2b54fd5852f11a2cc31e09dd7b598e4dc0` (main, 2026-10-28).
Implementation is on `feat/account-sessions-security-20261028`. **Not released.**
No production schema, Auth configuration, factors, sessions, secrets or accounts
were changed. This is an application security change requiring hosted acceptance
and independent security review before release, not a security certification.

> **2026-10-29 remediation:** see [finding dispositions, provider threat model and forward-only runbook](SECURITY_REMEDIATION_PR52.md). F02 remains unresolved; production NO-GO. The original [independent audit](audits/2026-10-29-pr52-independent-audit.md) is preserved.

## Architecture and trust boundaries

1. Existing password/username sign-in, Google PKCE callback and recovery callbacks
   call `observeLogin`. Existing MFA completion calls it again. Protected requests
   reconcile a failed observation. No browser `SIGNED_IN` listener drives email.
2. Identity is checked through native `getUser`; `get_current_session` derives the
   real JWT `session_id` through PostgREST and checks owner, expiry and deny state.
   AAL and authentication methods come from that authenticated server context.
3. Server-only observation reads the matching `auth.sessions` row, retains the
   initial request description and defers completion while verified MFA requires
   AAL2. A row lock and unique `(user_id,event_key)` plus unique outbox event FK
   create **one login event and one durable email job per real session**.
4. Existing sessions are baselined in the migration; rollout/reload must not send
   a login alert for them. Failed MFA and temporary isolated password proofs or
   immediately discarded signup-verification sessions are not completed logins.
5. The existing support outbox, lease/ack RPCs, Resend sender, idempotency headers,
   retry mechanism and Signature Premium shell are extended. No parallel mail
   queue, authentication system or MFA enrollment system is introduced.

`auth.*` is read only. No triggers, UPDATEs, DELETEs, credentials or token copies
are added there. Privileged definitions are in `private` with an empty search
path; public wrappers explicitly grant execution only to `service_role`.
`security_snapshot` is the sole authenticated history/list API and derives its
user from `auth.uid()` with the existing verified/MFA/active-session guards.
Ordinary users cannot insert, change, delete or read raw private audit tables.
No service credential, OTP, token pair or factor secret enters an email or log.

## Session list and honest metadata

The list starts from **all the caller's `auth.sessions` rows**, LEFT JOINs optional
metadata and computes the current indicator using the signed `session_id` claim.
A record missing metadata still appears. Baseline sessions show unavailable
historical device/location/provider information; do not infer a browser from the
server SDK's user agent. Expired `not_after` and application-blocked records are
identified. Native-revoked rows disappear; the audit retains the operation.

`refreshed_at` is shown as **Last token refresh**, never as human interaction or
proof that a device is online. Auth may retain timed-out records until cleanup;
**hosted inactivity/timebox/single-session settings must be checked before
release**. This implementation uses `not_after` and existence and does not
reimplement undocumented Auth timeout rules. Non-default inactivity/single-session
policies need a verified listing/guard adaptation before this candidate can ship.

IP/city/region/country use documented `@vercel/functions` helpers only when the
server's `VERCEL=1` environment establishes the Vercel ingress boundary. Headers
outside that boundary yield unavailable IP/location. Request bodies never supply
network metadata. UA is bounded, parsed into broad category/OS/browser and
immediately discarded; no exact model, fingerprint or persistent device ID.
IP geolocation can reflect a VPN, carrier or upstream proxy. Do not add an
unverified proxy in front of Vercel or enable arbitrary forwarded-IP trust.
Persian emails use the Persian calendar and Tehran time; English emails show UTC.
The UI uses the user's existing calendar/numerals and explicitly displayed UTC,
which keeps server and browser rendering deterministic.

## Remote revocation authorization

Both existing `others` and `global` controls use the strengthened server path:

- Next Server Action POST protection plus explicit same-origin/host checks;
  missing Origin is denied. No target session IDs are accepted.
- Native server identity, authoritative current-session and owned verified TOTP
  factor checks. Passwords, recovery codes and a pre-existing AAL2 cookie cannot
  substitute for a fresh TOTP verification. The existing enrollment UI is offered
  when no verified TOTP factor exists.
- An atomic per-user reservation, at most five attempts per ten minutes and one
  outstanding operation. The operation is bound to user/current session/factor/
  scope and expires in two minutes. A keyed OTP digest prevents code replay for
  ten minutes; raw OTPs are never persisted. The server credential keys this
  digest; rotate credentials through a controlled release, not mid-operation.
- A **new** native challenge followed by native verification inside this action.
  No proof or operation ID is returned to the browser for later authorization.
- One-time consume rechecks the session/factor, locks the reservation, snapshots
  only that user's affected sessions and inserts application access-denial
  tombstones plus an audit request in one transaction.
- Native `auth.signOut({scope:'others'|'global'})` revokes refresh credentials.
  Success requires confirming targeted provider rows are gone. Lost responses
  reconcile through that check; provider success alone cannot declare completion.
  Pending global logout requires a new login and fresh TOTP, never same-session
  retry or removal of access blocks. A read-only-native worker reconciles outcomes.

There is **no supported arbitrary-session-ID revocation method** in the reviewed
SDK/API. Do not impersonate another session, delete managed tables, expose an
admin credential or label an application metadata change as native revocation.
Current-device logout reuses the existing LogoutButton, BroadcastChannel and
full-document navigation. Other devices use the supported all-other scope.

## Access JWT enforcement and limits

| Access path | Enforcement / limit |
| --- | --- |
| Server identity, protected pages and account actions | `currentUser` / `get_current_session`, with authoritative row/expiry/deny checks |
| Profiles, accounts, subscriptions, farms, collaboration, invitations, irrigation, legacy snapshots and sensitive RPCs | Existing `private.is_verified` / `private.mfa_access_allowed` RLS and RPC guards call the strengthened `session_is_active` |
| Security list/history | Own-user projection plus verified/MFA/session guard; service write APIs are inaccessible to users |
| Service-role email jobs | Trusted server-only credential; no browser-supplied recipients, targets or identity |
| Public weather, location, legal, plan/catalog and public signup APIs | Existing intentionally public behavior; no sensitive-session guarantee needed |
| Native Supabase Auth endpoints | Provider's native bearer/AAL rules. AgroMind cannot impose fresh-TOTP rules on direct native API calls |
| Existing realtime subscriptions / in-flight requests / already rendered or downloaded data | Not retroactively erased or cancelled; no immediate disconnect/erasure claim |
| Future Storage, financial or device-control paths | No new such capability is enabled. Add and verify session-aware authorization before introducing one |

Once consume commits, subsequent guarded application data requests from the
snapshot are denied even if native sign-out fails or its JWT remains valid.
Cryptographic JWT validity is not immediate revocation across every provider
endpoint. Native Auth can permit bearer-authorized sign-out or factor operations
without this application's fresh-proof policy. This **provider-wide limitation
must be part of release review**, especially the stolen-AAL2-token threat model.
A new login after the operation can create a new session; change compromised
credentials and investigate unfamiliar logins rather than promising permanent
exclusion by one logout request.

## Activity, privacy and retention

Recent history shows up to 50 own-account events in 90 days: login, successful
local logout, TOTP enrollment/removal, password/username change, authorized
revocation and confirmed/pending outcome. Stable event keys deduplicate login,
logout, MFA factor and operation events. Username grant consumption, mutation and audit are one transaction. Password
changes use grant-keyed events; provider update and app audit are separate transactions. Native API changes outside these application flows are
not reconstructed as application events. Managed Auth has its own provider logs.
Non-revocation native/account events are best-effort app audit writes with safe
error monitoring; a DB outage after a native change can leave a history gap.

Raw UA is not retained. App IP/location/device descriptions are redacted from
session projections after 30 days and physically scrubbed by `security_prune`;
login-email payloads are scrubbed too. History older than 90 days is removed.
Completed/failed operation rows are pruned after one day; unresolved revocations
remain until reconciled. Recovery tickets expire after ten minutes; sensitive action
grants after two. Quotas count the ten-minute attempt window without deleting pending work. Access-denial tombstones are pruned **only after the matching Auth
session is gone**; metadata/history retention must never restore a live JWT.
Run retention even if email sending is disabled. These are app-primary-storage
limits, not control over Supabase backups, Vercel infrastructure logs, Resend
retention or copies in recipients' inboxes. Review provider retention separately.

## Delivery semantics and operational prerequisites

An email failure never rejects authentication. Durable queue retries retain an
complete recipient/from/subject/HTML/text/locale snapshot frozen before first send and use `support/<outbox UUID>` as
the existing provider idempotency key. Leases use SKIP LOCKED, fencing IDs, five
minutes per lease and ten-minute failure backoff. The 23-hour retry horizon stays
inside Resend's 24-hour idempotency window; security jobs older than 23 hours are
not sent automatically. Alert on unsent/expired jobs and observation/audit/lease/
ack/retention errors; never re-send expired jobs under a new key silently.

Exactly-once **inbox delivery** cannot be guaranteed during external outages.
If Auth succeeds while the observation database is unavailable, a later protected
request retries observation; a session that never returns cannot be recovered by
that path. Direct native sign-ins that never reach AgroMind are likewise outside
this application's observation boundary. These limits require release review;
no undocumented auth-table trigger is introduced to disguise them.

Before any hosted release:

1. All Foundation CI checks, including independent-connection PostgreSQL races,
   must pass on the final head; complete independent security review.
2. Rehearse migration and forward-only recovery on an isolated Supabase project.
   Verify actual Auth timeout settings and schema compatibility. No production
   migration or Auth setting change is authorized by this PR itself.
3. Apply `20261028164556_account_session_security.sql`, then
   `20261029034759_account_security_remediation.sql` before the compatible app.
   Pause old workers/mutations during cutover; see the remediation runbook. Retain
   existing server-only `SUPABASE_SERVICE_ROLE_KEY`, Resend sender/key and
   `CRON_SECRET`. Enable `SECURITY_EMAIL_ENABLED=true` only in the reviewed target
   environment after sender/destination verification. Existing support flags and
   staff language are preserved.
4. The shared cron changes from daily to every ten minutes. Confirm a Vercel plan
   that supports this frequency or provide an authorized equivalent scheduler;
   **do not deploy the new cron on Hobby or purchase an upgrade automatically**.
   Bound backlog capacity: 20 jobs per drain, immediate post-login drain plus cron;
   review volume/monitoring before wider launch.
5. Branch-only `git.deploymentEnabled=false` prevents an automatic preview for this
   review branch. It does not change main's deployment rule. Re-enable a test
   branch only after its database/environment prerequisites and release approval.
6. Run the manual checklist below on isolated hosted accounts and physical iOS
   PWA. Recheck native Auth API limitations and operational monitoring explicitly.

## Manual acceptance checklist

- [ ] Password, username, Google login and recovery callbacks; onboarding and
  Google terms gate preserved; required MFA produces no email until verified.
- [ ] One new-session email in FA/EN, correct IP/approximate city/OS/browser/method,
  timestamp and CTA. Missing/invalid metadata safely unavailable. Actual Apple
  Mail/Gmail inboxes checked in both directions, dark mode and blocked images.
- [ ] Refresh, hard reload, concurrent tabs and token refresh do not enqueue a
  second email. Simulated Resend outage recovers the same immutable queued job.
- [ ] Two physical/browser sessions and another user's account: accurate current
  marker; no cross-user data; baseline unavailable details and timeout behavior.
- [ ] AAL2 alone, bad/foreign factor, missing/invalid/replayed/expired code and
  concurrent requests fail. Five-attempt quota survives another app instance.
- [ ] Others preserves current; global exits current. Old JWT fails direct RLS,
  account/farm/invitation/irrigation mutations; old refresh fails natively.
- [ ] Native timeout/outage shows pending, retains deny state and creates no false
  success. Direct provider API/realtime/in-flight limitations are understood.
- [ ] On installed iPhone PWA: keyboard, numeric OTP/autofill, safe-area dialog
  footer, scroll/focus/escape, rotation, suspended/resumed app, multi-tab logout,
  offline/reconnect and no private/security response in Service Worker cache.
- [ ] Retention, expired queue alerting, audit monitoring and rollback rehearsal.

## Verification and rollback

Local evidence is in [the dated report](progress/2026-10-28-security.md). Unit tests
mock provider boundaries; SQL tests run real migrations against isolated Postgres
engines, not production Auth. Chromium checks validate actual component HTML plus
production CSS and email layout, not a physical iPhone or live Auth integration.

After the remediation migration, rollback is forward-only. Preserve deny/audit/grant
and frozen delivery records. The historical down script refuses the hardened schema.
Use a compatible reviewed app/worker or a forward fix; the audited baseline is not a
security-preserving rollback target. Keep reconciliation and pruning active when
pausing email. See the [cutover and recovery runbook](SECURITY_REMEDIATION_PR52.md).

Primary references reviewed 2026-10-28:
[Supabase sessions](https://supabase.com/docs/guides/auth/sessions),
[sign-out](https://supabase.com/docs/reference/javascript/auth-signout),
[admin sign-out](https://supabase.com/docs/reference/javascript/auth-admin-signout),
[Vercel request headers](https://vercel.com/docs/headers/request-headers),
[Vercel helpers](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package),
[branch deployment controls](https://vercel.com/docs/project-configuration/git-configuration),
[Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).
Hosted schema column names were checked read-only; no live user data was read.
