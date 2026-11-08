# PR #65 — Astra form regression correction, 2026-11-08

## Starting state and scope

Original/actual remote head: `6233dd8922e9e57e25e85654b40efa9bd5318398`, branch `fix/password-reset-authorization-20261107`, open Draft PR #65. Original audit and PR #52 checkouts were clean and were preserved; corrections use a separate worktree. Read canonical project rules, the password hotfix handoff, installed Next.js forms documentation, and Astra's independent audit report dated 8 November 2026 (Asia/Tehran).

PR #66 remains `8852ac8483974974b806b644ecd05d58252c5338`; PR #52 remains `2cd65a5dbf7730a6bdd2a1824912cde52564794f`. Both are open Drafts and unmerged. Neither branch was edited. No merge, deployment, production operation, migration edit, secret edit or Auth-setting change was performed. Branch deployment exclusions remain intact. Universal provider-native F01/F02 remain unresolved.

## A65-01 reproduction and smallest correction

Before editing production source, independently ran the original real AuthForm with React 19.2.4 SSR + hydration + JSDOM interaction and synthetic serialized action metadata. Trace:

```text
SSR nonce submitter name:       $ACTION_ID_nonce
After hydration:               $ACTION_ID_nonce
After requesting code:         [nonce]
After Update password:         [nonce]         # password action blocked
Fresh-mount primary control:   [nonce, reset]
```

React warned that function-valued `formAction` overrides the button's explicit name. The form mistook a nonce request for the primary action and acquired `submitting.current`; separate nonce state did not reset that ref.

The newly committed interaction tests were also run against unchanged production source: **8 failed / 2 recovery controls passed**. Every nonce-followed-by-password case failed with zero reset calls. After the correction: **10/10 passed**, including English/Persian, MFA on/off, nonce success/error/retry/repetition, independent pending state, exact action routing, synchronous duplicate submissions, loading/error/status feedback, password rejection/retry, accessible input labels, and recovery proof fields. The primary form action is also exercised without a submitter.

Production change: read `data-password-action="request-nonce"` instead of React's reserved `name`; put that attribute on the secondary button and remove its explicit name. Both function-valued actions, loading states, localization, accessibility and the original primary duplicate guard remain. Fresh identity verification, recovery capabilities, replay handling and server authorization are unchanged.

## Real browser interaction evidence

Supplemental local Chromium **153.0.8010.0** / Playwright verification: **14/14 scenario groups passed**, with no hydration/runtime errors. The actual TSX form, Button, FreshIdentityFields, translation catalogs and React hooks were bundled and hydrated from SSR HTML; synthetic handlers replaced provider actions. No Supabase request was made.

Across EN/FA × MFA on/off, each of these three groups passed:

1. Click Send verification code → nonce called, reset not called → fill password/code → Update password calls reset exactly once, with no additional nonce call.
2. Keyboard Enter on the nonce button → provider-error feedback → Space retry → successful/repeated nonce request → Enter on Update password invokes only the password action.
3. Ordinary change without a nonce request → same-turn duplicate primary submits produce one password action, pending disables the fieldset → rejection resolves → Space on Update password permits retry and never invokes nonce.

Two further recovery groups (MFA off/on) passed: current-password and nonce-request controls remain absent; fresh MFA fields remain when enrolled; keyboard activation of Update password calls the primary action with recovery context. This checks native keyboard activation of each focused submit button, not a claim about every browser/device or full accessibility conformance.

Browser setup initially encountered a truncated Playwright archive. A packaged Chromium binary was extracted into scratch without archive ownership changes (the runtime rejects `chown`) and launched successfully. Fixture setup required browser environment constants and waiting for React's pending commit; a single browser page was retained for the serverless Chromium runtime. Those were test-environment corrections, not application changes. No browser verification limitation remains for the listed local synthetic scenarios; hosted Next.js/Supabase acceptance remains unverified.

## Low findings

- **A65-02 corrected:** known `current_password_required` / `current_password_mismatch` use definite-rejection guidance. Regression tests require rejection, no success/global logout, and one proof consumption. Ambiguous failures retain uncertainty; no proof is restored.
- **A65-03 documentation corrected:** OAuth-only without MFA cannot satisfy ordinary current-password verification and uses verified recovery. With MFA, the current implementation can authorize an ordinary first-password operation using fresh MFA without a recovery ticket. Hosted provider acceptance is unverified. No universal email-only rule is enforced or newly assumed. The overbroad claim in the PR description must also be replaced before handoff.

## Verification

| Check | Local result |
| --- | --- |
| Focused authentication/password/recovery/MFA/fresh-identity + interaction tests | 68 passed |
| New hydrated React interaction tests | 10 passed; 8 failed / 2 passed on original source |
| Chromium scenario groups | 14 passed |
| Full JavaScript suite | 306 passed, zero failures/skips |
| PGlite database suite | 26 passed; 3 native-only skips |
| Native PostgreSQL launcher | Blocked before test process starts: `EINVAL`; final-head Actions must supply native evidence |
| Lint | Passed, one pre-existing `verification-pending.tsx` missing-`next` dependency warning |
| Typecheck / localization / production build | Passed |
| Built-app HTTP checks | 66 passed |

New test infrastructure: `features/authentication/tests/auth-form-interaction.test.mjs`, `features/authentication/tests/helpers/hydrated-auth-form.mjs`, pinned dev-only `jsdom@26.1.0` and lockfile. Existing package versions are unchanged. Runtime edits are limited to `auth-form.tsx` and the two rejection-code additions in `actions.ts`; existing password tests and focused handoff/progress docs are updated. Final commit, changed-file inventory and final-head Actions status are recorded on the existing PR.

These results do not prove real email delivery, hosted provider policy/errors/nonce acceptance, signed recovery/PKCE behavior, OAuth first-password behavior, real provider MFA/backup-code semantics, actual session revocation, physical-device acceptance, or production readiness. Database fixtures do not run Supabase Auth. No new hosted acceptance is claimed.

Status: focused correction implemented and locally verified, ready for final-head CI and narrow independent Astra delta re-audit. After Astra approval, complete isolated hosted acceptance of #65 and #66 before any separately owner-authorized production release.
