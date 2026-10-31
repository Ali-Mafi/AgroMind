# PR #52 — F01/F02 provider enforcement decision

Reviewed 2026-10-31 (Asia/Tehran), starting from the independently rechecked PR head
`565db25a72df30ba70dd54cfd1aa3bfa65ec8689`, clean checkout, existing Draft branch
`feat/account-sessions-security-20261028`.

**F01 High: UNRESOLVED. F02 Medium: UNRESOLVED. Release: NO-GO.**
No residual risk has been accepted. No merge, deployment, production migration,
Auth setting, production account or infrastructure change is part of this work.
This is targeted implementation evidence, not an independent security audit.

## Evidence and its limits

- Installed and lockfile-pinned `@supabase/supabase-js` / `@supabase/auth-js`
  **2.116.0**, `@supabase/ssr` **0.12.7** were inspected.
- Supabase Auth upstream was pinned to
  [`a7e97d665b9ea03853edb66d014bcde323f7894b`](https://github.com/supabase/auth/tree/a7e97d665b9ea03853edb66d014bcde323f7894b).
  This is the reviewed source version, **not a claim about the hosted binary**.
- The current [changelog](https://supabase.com/changelog) index was fetched and
  relevant breaking changes inspected. No new credential-mutation or logout
  authorization hook was established. TLS cipher deprecation does not add one.
- Connected project/branch discovery found only AgroMind and **zero development
  branches**. No isolated authorized hosted Auth fixture or test credentials were
  available. No native hosted credential/logout/refresh request was executed.
  Hosted version, settings, delivery and direct-API results are **NOT VERIFIED**.
- New SDK tests use real installed SDK code with synthetic in-memory sessions and
  an intercepted transport. They establish request/response behavior only. SQL
  tests apply real migrations to isolated fixtures; they do not execute GoTrue,
  authenticate JWT signatures, or issue refresh tokens.

## F01: credential mutation paths

| Path | Actual authorization boundary | Residual exposure |
| --- | --- | --- |
| Ordinary AgroMind password change | Server identity and active-session check; fresh native TOTP for MFA accounts, isolated current-password proof otherwise; two-minute user/session/operation/payload grant, consumed once before provider mutation | Native Auth can be called without this grant |
| AgroMind recovery | Provider-verified recovery exchange, bound expiring single-use ticket; fresh MFA when enrolled, existing gated provider backup recovery only | The app ticket is not a native Auth requirement |
| Native `PUT /auth/v1/user` password/email/phone | Native authenticated route; MFA accounts require AAL2 in reviewed source, without per-mutation TOTP freshness | Stolen valid stale-AAL2 sessions can satisfy that assurance check; actual password acceptance depends on configured provider policies |
| Native reauthentication | Signed-in caller requests a provider email/phone nonce; password update optionally validates it | This is not AgroMind's TOTP, grant, exact payload or session-bound authorization |
| Google/social OAuth account adding its first password | Reviewed source's current-password check is conditional on an existing password; native MFA and reauthentication rules still apply | Requiring current password does not protect first-password creation; Google OAuth is distinct from enterprise SSO restrictions |
| Provider admin mutation | Trusted privileged provider API, outside ordinary session authorization | No new admin credential mutation or service-role bypass is introduced; compromise of privileged credentials remains outside this grant model |

The [password policy](https://supabase.com/docs/guides/auth/password-security)
offers two distinct protections: reauthentication after a **24-hour session age**,
and requiring the existing password. Neither enforces a fresh authenticator code
for each operation. In reviewed source, current-password validation is exempt for
recovery sessions and absent passwords. Preserve those recovery semantics; do not
disable recovery or block enrollment to manufacture compliance.

The enforcement is visible in pinned upstream
[`user.go`](https://github.com/supabase/auth/blob/a7e97d665b9ea03853edb66d014bcde323f7894b/internal/api/user.go#L109),
[`sessions.go` recovery recognition](https://github.com/supabase/auth/blob/a7e97d665b9ea03853edb66d014bcde323f7894b/internal/models/sessions.go#L108),
and [`api.go` routes](https://github.com/supabase/auth/blob/a7e97d665b9ea03853edb66d014bcde323f7894b/internal/api/api.go#L275).
The password mutation also removes other native sessions in
[`models/user.go`](https://github.com/supabase/auth/blob/a7e97d665b9ea03853edb66d014bcde323f7894b/internal/models/user.go#L445).
Thus a direct credential mutation can affect both account control and availability,
without AgroMind's denial/audit intent. This does not establish MFA removal.

The current [Auth Hooks catalog](https://supabase.com/docs/guides/auth/auth-hooks)
and [password verification hook](https://supabase.com/docs/guides/auth/auth-hooks/password-verification-hook)
do not provide a before-credential-mutation grant gate. Verification hooks cannot
cover paths that perform no password verification, including first-password
creation. Token-issuance/MFA/email hooks do not authorize every use of an already
issued bearer token. Next.js checks, CORS, RLS, public-key secrecy and HttpOnly
cookies cannot impose that missing rule on a publicly reachable Auth endpoint.

**Implemented delta:** native password success now requires an error-free response
containing the expected user ID. The installed SDK accepts an empty HTTP 200 body
as an error-free user result; the prior action incorrectly reported success.
Missing/foreign user results and transport loss now keep the password outcome
unknown, consume proof permanently, retain precommitted denials, attempt supported
global logout and preserve reconciliation evidence. Existing definite-rejection
classification, recovery, F03–F08 and migration history remain intact.
This response validation is useful hardening, **not a provider-boundary fix**.

## F02: logout, remaining sessions and data

Pinned [`Logout`](https://github.com/supabase/auth/blob/a7e97d665b9ea03853edb66d014bcde323f7894b/internal/api/logout.go)
runs behind native bearer authentication, accepts `local`, `others`, `global`,
and calls native session deletion plus provider audit. It has no AgroMind grant
or per-logout fresh-TOTP check. The route and reviewed middleware do not add one.
No officially supported universal enforcement hook/configuration was established.

| Operation/state | Consequence in reviewed code and isolated tests |
| --- | --- |
| Direct native `others` | Deletes the caller's other native sessions; keeps the initiating session. The actor's own account availability and app audit completeness are affected |
| Direct native `global` | Includes the initiating session. No cross-user selection parameter is accepted; no new cross-user data disclosure was demonstrated |
| Native deletion with an old unexpired JWT | JWT cryptographic validity alone can persist. Existing `private.session_is_active()` requires native row ownership, existence, unexpired `not_after`, and no app denial for protected RLS/RPC access |
| Failed native logout, rows still present | App-controlled operations retain denial; native refresh credentials may remain usable beyond the current JWT lifetime. A successful refresh must not erase app denial |
| SDK `signOut` returns `error:null` | Not proof of completion: installed auth-js suppresses native 401/403/404. `security_finish_revocation` checks every snapshotted native row and returns pending while any survive |
| Lost response or unavailable completion lookup | No success assertion; denial and consumed proof persist. New login plus new TOTP authorizes a new attempt, without restoring the denied session |

The [session documentation](https://supabase.com/docs/guides/auth/sessions) and
[sign-out contract](https://supabase.com/docs/reference/javascript/auth-signout)
explain access-token/refresh-session separation. The SQL tests now seed readable
farm/profile data before simulated native deletion, then verify denied reads and
mutations, current-session preservation for `others`, global denial, and foreign
user preservation. A new completion test proves that even `p_success=true` cannot
complete partial/surviving native targets. These are not hosted HTTP/refresh tests.

Existing bilingual UI explicitly limits fresh-code protection to sign-out
initiated in AgroMind. That statement was inspected and retained. App-controlled
revocation still requires a new owned TOTP challenge, bound durable single use,
expiry/replay/quota checks, pre-provider denial and authoritative completion.
In-flight/downloaded data, provider APIs, future Storage/Realtime integrations,
provider timeout policies and native audit export remain separate acceptance work.

## Options requiring an owner/security decision

| Option | What it can achieve | Consequences / required evidence |
| --- | --- | --- |
| Retain hosted Supabase and the universal requirement | Keep release blocked; seek a provider-supported mutation/logout authorization facility | Recommended immediate decision: retain NO-GO. A provider feature or written capability claim still needs an isolated hostile direct-API test |
| Explicitly approve a narrower application-only guarantee | Retain strong AgroMind controls; optionally evaluate current-password policy as defense in depth | Requires explicit owner/security risk acceptance for **both** F01 High and F02 Medium. Provider settings do not close universal freshness; verify recovery/OAuth first. No setting changed here |
| Replace the identity boundary | Use a provider with demonstrated per-operation step-up enforcement and supported [third-party authentication](https://supabase.com/docs/guides/auth/third-party/overview), keeping Supabase data if suitable | Architectural proposal only. Migrate identity mapping, sessions, MFA/recovery, RLS and notifications; prove all alternate credential/logout APIs reject stale bearer sessions. Merely adding another social OAuth provider does not remove native Supabase access |
| Privately hosted Auth behind a mandatory policy gateway | Make the gateway an actual unavoidable authorization boundary | [Self-hosting](https://supabase.com/docs/guides/self-hosting/auth/config) is supported; custom gateway policy is a separately engineered control, not an official hosted hook. Deny direct upstream access including refresh, recovery, OAuth and alternate routes; own patching, availability, backups and operations. A proxy in front of a still-public hosted origin is insufficient |

If universal enforcement remains mandatory, commission the identity/gateway design
separately and keep this PR Draft. Do not disable legitimate recovery, depend on
unsupported Auth-table triggers, or introduce unbounded service-role operations.
No architecture migration or residual-risk acceptance is authorized by this delta.

## Reproducible hosted acceptance plan — NOT EXECUTED

Use a separately authorized disposable Supabase environment with reviewed migrations
and its own inboxes. Refuse the production project, its custom domains, production
users and production keys. Record fixture project identity, Auth build/version,
non-secret policy values and test time before running. Use different synthetic
accounts for destructive cases and retain backup authenticators/recovery access.

1. Create accounts A/B and two A sessions A1/A2. Enroll/verify TOTP on A. Preserve
   access/refresh tokens privately; record only IDs, AAL, AMR age and JWT expiry in
   evidence. Seed owned and foreign farm/profile data and verify reads first.
2. With A1's TOTP older than AgroMind's two-minute proof window, send requests
   **directly** to the test origin with publishable key and A1 bearer, without any
   application grant. For exact wire requests use the table below. Observe actual
   password/login, session rows, app/provider audit and refresh results, not just HTTP.
3. Independently exercise the app's stale/missing proof, expired grant, wrong
   user/session/payload, consumed grant replay, invalid nonce/password and uncertain
   provider response cases. None may bypass fresh proof or reopen denied sessions.
4. For every revocation keep the old signed JWT and refresh credentials. Test
   direct PostgREST profile/farm reads, writes and guarded RPCs, Next server paths,
   Auth `/user`, and refresh before/after. `others` must keep A1 and B; `global`
   must remove A1 too. Record exact statuses and target-row disappearance times.
5. Inject response loss after provider success, provider 401/403/404/5xx, partial
   deletion, and completion-RPC outage; race refresh/new login with revocation.
   Unknown outcomes must stay unknown/pending, denials must persist, and fresh
   owner login must remain available. Confirm retained pending-password outcomes
   survive reservation, reconciliation and pruning from the previous fixes.

Every request below uses the **isolated test** origin's `/auth/v1` prefix,
`apikey: <test publishable key>` and `Authorization: Bearer <test session>` where
authenticated. Do not store those headers or request bodies in shared evidence.

| Direct request | Required cases and observations |
| --- | --- |
| `PUT /user`, JSON `{"password":"<new synthetic password>"}` | Stale AAL2 session younger than 24h; older than 24h with reauth enabled; AAL1 with MFA; no-MFA account. Record acceptance/rejection without app proof |
| `GET /reauthenticate`, then `PUT /user` with `nonce` | Missing, invalid, correct, expired/reused nonce; confirm email hook/delivery and whether provider proof is bound as required |
| `PUT /user` with `password` and `current_password` | Actual enabled/disabled current-password policy; missing/wrong/correct password; do not infer policy from a similarly named local CLI flag |
| Recovery `/recover`, `/verify` or PKCE `/token`, then `PUT /user` | Provider-verified recovery, expired/reused link, recovery + MFA, absence of app ticket; confirm current-password exemption and preserved access/MFA |
| Social OAuth session, then `PUT /user` | Google-only first password, both MFA states, before/after existing password; do not confuse with enterprise SSO |
| `POST /logout?scope=others` and `POST /logout?scope=global`, no proof body | Independently verify native acceptance with stale AAL2; remaining sessions, refresh tokens, app denial, foreign isolation, audit gap and error paths |
| `POST /token?grant_type=refresh_token`, JSON `{"refresh_token":"<test token>"}` | Use separate fixtures so refresh rotation does not confound outcomes; test revoked targets and failed-native-logout rows with app denial |

If direct calls succeed without fresh TOTP, record a universal-policy failure,
even when the app regressions pass. If calls reject, identify the precise provider
rule and prove all relevant exceptions before closing either finding.

## Independent Astra delta review required

Review the final PR head: expected-user confirmation and unknown outcomes; retained
proof/denial/retention behavior; SDK wire/error evidence; strengthened populated-data
and partial-native-completion tests; and the provider-boundary analysis above.
Reconfirm F03–F08 through existing regression evidence. Hosted credential/logout,
recovery/MFA/OAuth, signed JWT/PostgREST/refresh/race evidence and an explicit owner
security decision remain required. Green CI cannot close F01 or F02.

## Executed local verification

- Before the code fix: the new missing/mismatched-user regression failed because
  the action redirected to `password-updated`; the installed-SDK empty-body probe
  independently showed `error:null` without a user ID.
- After the fix: all **326 JavaScript tests** passed. All **44 PGlite tests**
  passed, with **5 native-only skips**. This includes F03–F08 regressions.
- Lint: zero errors, one pre-existing React Hook dependency warning in
  `verification-pending.tsx`; typecheck, localization, production build and all
  **66 local HTTP checks** passed. No browser/device acceptance is claimed.
- Local native PostgreSQL: **BLOCKED**, runner could not start (`EINVAL`).
  The existing Foundation CI's native PostgreSQL step must pass on the final
  pushed head; its run/result is recorded in PR #52's current handoff.
- No migration, dependency, deployment configuration or preserved audit evidence
  file changed. Hosted provider matrix above remains **NOT VERIFIED**.
