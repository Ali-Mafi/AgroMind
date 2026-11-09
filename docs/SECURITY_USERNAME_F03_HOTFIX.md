# F03 username authorization hotfix — Astra handoff (2026-11-07)

Developer implementation only. Independent Astra audit and isolated hosted acceptance remain required. No merge, deploy or production migration. PR #52 and provider-native F01/F02 remain unchanged / NO-GO.

## Provenance and original failure

Separate branch from clean actual main `42a8eb2b54fd5852f11a2cc31e09dd7b598e4dc0`, which matches READY agromind.ir production. PR #52 stays Draft at `2cd65a5dbf7730a6bdd2a1824912cde52564794f`. Research #61–#64 remain Draft/unmerged. Production migrations stop at `20261027134742`; none of #52's chain is installed. Exact final head and CI run are in this Draft PR's description.

The isolated database harness applies actual baseline migrations, creates a synthetic verified user, native-session/factor fixture, and invokes actual legacy `change_username(text)` with stale AAL2/no operation proof. Mutation succeeds before the new migration. The harness then applies this migration, verifies the existing username is unchanged and proves the same legacy call is denied. This is real SQL with injected claims, **not signed JWT or hosted Auth verification**. It establishes an own-account authorization/audit bypass, not cross-user disclosure.

## Small independent boundary

One forward, transactional migration: `20261107162535_username_single_use_authorization.sql`. Two private RLS tables (grants and audit), one private context checker, two service-only reserve/attest RPCs and one authenticated consume/mutate RPC. Legacy `change_username(text)` is replaced with rejection and execute revoked from PUBLIC/anon/authenticated/service_role. No auth.* writes, profile-table grant expansion, shared RLS/session-helper changes, email/session system or PR #52 machinery.

Server verifies getUser, signature-verified getClaims subject/session and JWT-backed get_current_session. SQL independently checks verified native user, active owned unexpired session and owned verified TOTP factor. Reservation binds normalized target, user/session/factor and expires after two minutes; five attempts/user/minute. Only after a new native TOTP challenge succeeds with expected user/token response and identity/session are rechecked does the trusted service attest it. Keyed code fingerprints prevent proof replay across distinct grants within two minutes. No raw TOTP, credential or token persists.

`change_username_authorized(uuid,text)` is the only new authenticated mutation surface. It derives subject/session from authenticated claims, requires AAL2 plus exact verified grant scope, rechecks factor/session, locks the grant/profile, consumes once and atomically inserts the audit with the mutation. Ordinary clients cannot issue or attest grants, read private audit/grant tables or update username by DML. Native unique index and grandfathered 3-character existing usernames remain; new names retain 6–30 rules and case normalization. Signup, availability and username-login implementations are untouched.

The form keeps the existing owned-authenticator code controls and errors. This operation explicitly requires TOTP: the backup-code toggle is hidden only in UsernameForm, matching the task's owned-factor requirement. Other authentication/recovery policies are unchanged. Account/current-session changes, verification errors, stale/missing/replayed proof and uncertain/mismatched mutation responses do not report success. Database committed mutation with lost response remains unconfirmed to the user; no automatic replay.

## Executed tests and exact evidence boundaries

- Actual server authorization/action tests with intercepted provider: stale AAL2/no code, wrong code/factor, backup substitution, native challenge failure/malformed/foreign response, switched session/user, missing native session, replayed attestation, normalized successful update, duplicate-name errors and uncertain response handling. EN/FA UI fixtures cover MFA inputs and enrollment path.
- Real isolated SQL: pre/post migration bypass reproduction; exact RPC/table/DML ACLs; valid normalization/single use/audit identity; wrong target/user/session, AAL1, missing/unverified/expired grants, foreign/revoked factors and expired session; replay and wrong attestation scope; unique conflict; injected audit failure rolls mutation, consumption and audit back together. Original signup/availability/session/account-isolation suites retained.
- Two independent native connections race the same grant; exactly one mutation and one audit must commit. Native local launcher fails `EINVAL`; final-head Foundation CI must supply native evidence.
- Local final suite: 289 app JS and 28 PGlite passed, three native-only skips; six focused JS tests are included. Both standalone migrations also applied together in disposable PGlite; the unchanged username/database suite passed 28 tests with three native-only skips (not native combined-migration evidence). Lint (one pre-existing hook warning), typecheck, localization, production build and HTTP checks passed. Final exact full-suite counts and CI URLs are in the PR description.
- No hosted provider, signed JWT/PostgREST, real TOTP/replay, physical device or browser end-to-end test was run. No customer credentials/data or production mutation used. These developer checks do not independently certify the change.

## Deployment / compatible recovery

After independent review, isolated hosted rehearsal and separate owner authorization: migration first, matching app second. There are no dependencies on the password hotfix or PR #52. Existing service-role key and publishable config are required server-side. The branch disables automatic Vercel deployment explicitly.

**Temporary compatibility impact:** after migration and before matching app, old versions' username-change calls are denied and the old UI reports unavailable. Existing usernames, login, signup and availability continue working. New app before migration also fails closed. Keep this deployment window short; this is explicit containment during transition, not a permanently disabled username feature.

Recovery is forward-only: retain schema and the new username adapter when reverting unrelated app changes. Do not restore legacy execute or re-enable the vulnerable function. A full old-app rollback leaves username changes unavailable until the safe adapter is restored; login/availability remain usable. Consumed grants must never be restored from an earlier snapshot. Audit failure or uniqueness collision rolls consumption back in the same transaction; a valid unexpired verified grant can then retry its exact target, whereas a committed grant never reopens. The isolated tests verify these states. No destructive down script is supplied. Audit rows retained 90 days, grants one day, with per-user pruning on later reservation; inactive users' expired rows are not globally scheduled for deletion. No audit immutability claim against administrators.

## PR #52 and sibling integration

Abandoning #52 does not affect this hotfix. Its migrations sort earlier and introduce a separate username grant/audit path, including a replacement legacy function: do not apply that chain blindly to a database with this hotfix. Reconcile mutation APIs/grants and forward migration history against actual main, retaining legacy denial and atomic auditing. Changes overlap username action, form/tests/progress; direct blanket cherry-pick is unsafe. The password PR has separate tables/functions but shares foundation test/progress/vercel.json additions; combine those without overwriting either branch exclusion. Both standalone fixes can deploy independently, password first per owner sequence.

## Astra audit focus

Review exact final head and CI logs. Invoke every RPC as anon/authenticated/service_role; attempt stale AAL2, forged/replayed grant IDs, nulls, wrong scope/target/session/user, factor changes and expiry. Independently test double consume, unique collision and audit-trigger failure. Review service attestation trust and provider response validation. Rehearse forward migration with existing usernames/sessions and old/new app behavior. Run isolated hosted native MFA and signed JWT/PostgREST acceptance before release. No closure of universal F01/F02 is claimed.
