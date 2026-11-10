> Follow-up checkpoint, 2026-11-10: [real hosted results](SECURITY_HOTFIX_HOSTED_ACCEPTANCE_20261110.md): 14 PASS, 11 NOT VERIFIED, 13 BLOCKED. The dated initial-discovery observations below are historical.

# PR #65 + #66 — integration rehearsal and hosted acceptance gate

Date: 9 November 2026, Asia/Tehran. **NO-GO for release consideration for #65, #66 and this combined candidate while hosted acceptance is blocked.** This is an evidence gap, not a newly demonstrated security vulnerability. A developer decision never authorizes Production release.

## Exact inputs and environment

| Item | Verified state |
| --- | --- |
| Main | `42a8eb2b54fd5852f11a2cc31e09dd7b598e4dc0` |
| Password #65 | `e0a407c2dfdcf51a0e0c7758495f30debbf1eb4a`, open Draft, source/browser audit closed by Astra |
| Username #66 | `8852ac8483974974b806b644ecd05d58252c5338`, open Draft, source/SQL audit passed |
| #65 exact-head Foundation | [42528448595](https://github.com/Ali-Mafi/AgroMind/actions/runs/42528448595), success rechecked |
| #66 exact-head Foundation | [42392688305](https://github.com/Ali-Mafi/AgroMind/actions/runs/42392688305), success rechecked |
| Integration branch | `test/security-hotfix-integration-20261109`; exact final commit/tree/CI in its separate Draft PR |
| Existing work | #65 checkout clean; preserved. Integration uses its own worktree and merge ancestry from both exact heads. |
| Hosted staging | **NONE**: connected project inventory contains only Production; development-branch inventory empty |
| Production reference | `gedwexwxaojpqyeiebwm`, AgroMind, eu-central-1; deny as an acceptance target |
| Organization | AgroMind `blezpaevjeyarvmayddg`, observed plan `free` |

Read both current handoffs, canonical project rules and Astra's A65-04 closure report (`AgroMind-PR65-A65-04-Closure-2026-11-09.md`). Accepted audits were not restarted. PR #52 stays Draft/NO-GO and universal provider-native F01/F02 remain unresolved. Original PRs/research branches were not modified.

Production access was limited to project/organization metadata, development-branch inventory and migration history. No Production credentials, user records, MFA material or refresh tokens were read or copied. No production SQL mutation, account change, migration, deployment or setting change occurred. No infrastructure was provisioned, no cost confirmation called, and no payment/plan upgrade initiated.

Production migration history ends at `20261027134742_support_ticket_notification_language`; neither hotfix nor PR #52 is installed. The additional historical `20260926041846_farm_invitation_invited_by_index` is present in Production inventory but absent from repository baseline migrations. The prior independent audit identified it as an additive index. Local rehearsal uses repository baseline, not a claimed exact hosted clone; reconcile this metadata difference in the isolated hosted baseline without copying customer data.

## Provisioning/configuration blockers

| ID | Severity / state | Precise blocker and next requirement |
| --- | --- | --- |
| H01 | Release-blocking / BLOCKED | No suitable isolated project. Service requires explicit organization selection before its project-cost quote/create workflow. Confirm the proposed AgroMind organization; obtain current quote/permission/quota check. Proposed spend ceiling is **$0**; stop if any nonzero cost or upgrade is required. |
| H02 | Release-blocking / BLOCKED | New isolated app/project reference, fresh staging publishable/service keys, Auth hook signing secret and reachable test app origin are not configured. Read/list permission is established; create/admin/configuration permission is not established. Supply fresh staging secrets only through secure environment configuration, never chat or repository. |
| H03 | Release-blocking / BLOCKED | No approved controlled inbox, test-only sender/transport credentials, or test email-hook endpoint. Existing auth transport fixes From to `accounts@agromind.ir`; support delivery/link rendering also contains Production identity/origin assumptions. A separate project alone does not make these test-only. Choose and review a safe staging transport/origin strategy before sending; do not copy Production mail keys or change Production DNS. |
| H04 | Conditional release coverage / NOT VERIFIED | No safe dedicated Google OAuth test client/identity is configured. No claim of OAuth-only first-password acceptance. Configure a separate test client and exact staging redirect when available. |

The Free plan documentation allows two active free projects across owned/administered organizations, and only one project is visible here. This is possible capacity, **not** a reserved quota or actual $0 provisioning quote. Do not infer create permission or exact charges from a plan name. No billable branch or paid project is authorized. See [billing](https://supabase.com/docs/guides/platform/billing-on-supabase) and [hosted email testing limits](https://supabase.com/docs/guides/auth/testing-auth-flows): built-in email is restricted to organization member addresses and is insufficient for unrestricted synthetic inbox testing.

Concrete proposed configuration is [environment-plan.json](acceptance/environment-plan.json): project `agromind-hotfix-acceptance-20261109`, eu-central-1, Free-only/$0 ceiling, no Production data/credential clone, fresh keys, exact isolated HTTPS app/callback/hook origins, email confirmation on, owned native TOTP, current-password and secure-change settings tested on/off only in staging, backup codes off unless provider-supported and verified. Missing resource/mailbox/origin identifiers are explicit nulls, not fabricated configuration. Keep support email disabled until recipient/sender isolation is proven. No automatic deployment is enabled for the integration branch.

## Hosted test matrix and evidence

[hosted-matrix.csv](acceptance/hosted-matrix.csv) records **38 real hosted acceptance groups**, pinned input revisions, expected observable evidence, status and blockers: 18 for #65, 12 for #66, eight combined. **All 38 are BLOCKED; none was executed.** No hosted FAIL or PASS is inferred. Configured provider policies/version, Google support and live mail behavior are **NOT VERIFIED**. New candidate source/fixture results below are separate.

There is **no** real signed-JWT, provider MFA, recovery/PKCE, actual nonce delivery, subsequent real login, PostgREST ACL, hosted concurrent-consume or real email evidence from this task. When unblocked, retain only booleans/expected identity aliases, request outcome codes, sanitized timestamps and delivery/message references. Validate signatures in process; never store bearer/refresh tokens, OTPs, passwords, MFA secrets or full recovery URLs in the evidence package.

Required execution method: pin the deployed SHA and migration state, assert target ref differs from the Production denylist, create only controlled synthetic identities, then run browser → actual Next.js action → actual Auth/PostgREST → fresh independent login checks. Inject timeout/lost response at real staging transport and inspect resulting credentials/receipts; do not substitute mocked provider success. Recovery email delivery must be observed from a controlled inbox. Forced audit-failure triggers, session/factor revocation and destructive cleanup are permitted only inside the identified disposable environment.

## Combined candidate and focused integration review

Merge conflicts were confined to `docs/05_MASTER_PROGRESS.md`, `docs/progress/README.md`, `supabase/tests/foundation.test.mjs` and `vercel.json`.

- Retained both handoff/progress sets.
- Retained the entire #65 password SQL test block and entire #66 username block, plus #66's Auth-fixture `factor_type`/explicit-column inserts and correct anonymous role. No accepted assertions were removed.
- Retained both original deployment exclusions and added `test/security-hotfix-integration-20261109: false` before publishing.
- New code is test-only: `supabase/tests/hotfix-integration.test.mjs`, included by the existing database runner. No runtime authorization, migration or email policy code was changed beyond combining the exact reviewed sources.

Focused review checks passed: `features/authentication` is byte-identical to #65; `features/account` byte-identical to #66; each hotfix SQL file byte-identical to its reviewed parent; both complete test tails retained; three branch deployments disabled. The new fixture constructs disposable Auth tables and injected claims locally, never connects to a hosted URL, uses transaction-local roles and checks seeded snapshots immediately around each DDL application. Its explicit limitation is that these are synthetic claims, not signature validation. Independent final integration review remains required; this is developer integration review, not another Astra certification.

## Migration and compatibility rehearsal results

Executed repository baseline DDL in fresh disposable SQL fixtures, seeded verified users, sessions, native-factor fixtures, profiles (including an existing 3-character username), accounts/subscriptions, a farm and irrigation schedule. Then ran **both orders** of the unchanged forward migrations. Immediately after each migration, every seeded row snapshot is unchanged. Final security-function definitions and ACLs match across the two orders.

| Stage / contract | SQL-fixture result | Actual hosted app/provider |
| --- | --- | --- |
| Repository baseline and old username RPC | PASS: old caller works; new RPCs absent | BLOCKED |
| #65 forward migration | PASS: rows preserved, service-only password reserve permissions, username legacy compatibility until #66 | BLOCKED |
| #65 matching application | Existing actual-source synthetic action/browser tests pass in combined tree | BLOCKED; no hosted deployment |
| #66 forward migration | PASS: rows preserved, old username RPC denied; availability and short existing username preserved | BLOCKED |
| Combined new SQL contracts | PASS: password grant consumption and normalized username mutation/audit coexist; receipts remain consumed | BLOCKED |
| Reverse DDL order | PASS in independent fresh SQL fixtures; equivalent final function/ACL catalog | BLOCKED; does not authorize arbitrary runtime deployment order |
| Safe recovery contracts | PASS: retaining additive schema does not reopen consumed password/username grants or old RPC | BLOCKED; no live outage/rollback rehearsal |
| Signup/data/support regressions | Combined baseline/foundation/app suites pass | BLOCKED for real login, OAuth, delivery and browser sessions |

The supplemental rehearsal tests do not invoke provider password mutation or claim a real password was changed. Native PostgreSQL tests also create synthetic `auth.*` fixtures; they are not a hosted Auth service. Production's additional historical index is not included in these fixtures.

**Recommended eventual release order:** migration #65 → matching #65 app/email hook → migration #66 → combined app, after hosted acceptance and separate owner authorization. DDL commutes in fixtures, but app order still matters: a new app without its migration fails closed; old username clients intentionally fail after #66's migration. The old password app remains vulnerable until replaced. Keep transitions short and verify actual schema/ACLs and deployed SHA at each stage.

Rollback is containment/roll-forward: retain additive schemas, consumed receipts, the fresh password guard and the new username adapter. Never restore the vulnerable reset handler, legacy username execute or an old snapshot that reopens consumed grants. A full old-app rollback leaves username changes unavailable and can revive the password defect; it is not an acceptable working rollback. This policy was checked at SQL-contract level only; hosted operational rehearsal remains blocked.

## Executed validation and decisions

Local combined results: **312 JavaScript passed; 34 PGlite passed / four native-only skips (38 total); 68 Chromium scenarios passed; lint/typecheck/localization/build and 66 built-app HTTP checks passed**. Lint retains the existing `verification-pending.tsx` missing-`next` warning. Local native launcher failed before test process startup with EINVAL. Final combined Foundation must run all 38 tests natively, including both original concurrency groups and the two-order rehearsal; its exact commit, tree, complete log counts and URL are recorded in the separate integration PR. No native-local pass is claimed.

| Candidate | Source/fixture readiness | Release consideration |
| --- | --- | --- |
| #65 exact audited head | PASS to enter isolated hosted acceptance | **NO-GO**: H01–H03; live Auth/email/recovery evidence missing |
| #66 exact audited head | PASS to enter isolated hosted acceptance | **NO-GO**: H01/H02; live JWT/PostgREST/MFA/atomicity evidence missing |
| Combined candidate | Conflict resolution and local/CI rehearsal are reviewable separately | **NO-GO**: same hosted gates plus final independent integration review |

The next owner decision is the proposed organization and $0-only staging configuration, plus a controlled sender/inbox strategy and secure fresh staging credentials. No production approval is requested or implied. Once isolated resources are available, execute the CSV matrix and replace BLOCKED only with observed actual-provider results.
