# PR #65 — A65-04 keyboard routing, 2026-11-09

## State and correction

Started from clean exact remote head `258848242223eb53d3a4f08bc97075c08f81d1d4`, existing open Draft PR #65, branch `fix/password-reset-authorization-20261107`. Prior scratch files had been pruned; recovered the committed source from GitHub and read Astra's final delta report. No replacement PR or whole-PR security research. A65-01/02/03 were already independently FIXED and remain preserved.

[HTML implicit submission](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission) chooses the first submit button whose **form owner** is the submitted form. Previously, nonce was first and its function-valued `formAction` overrode the password action. [React function actions reset uncontrolled fields](https://react.dev/reference/react-dom/components/form), including when an action returns an ordinary error object rather than throwing. Consequently, implicit Enter requested nonce and cleared proof.

Runtime change is limited to `features/authentication/components/auth-form.tsx`:

- Use `useId` to associate the nonce button with a sibling hidden form, whose `action` is the existing `nonceAction`. Both existing `useActionState` hooks and feedback remain.
- Remove the button's function-valued `formAction` and data discriminator; its native `form` association now selects the independent action. The main form's only owned submit button is Update password.
- Remove the nonce exception from primary `onSubmit`; only primary submissions can reach that guard. Preserve the original synchronous ref/pending protection.
- No nested forms, intercepted keyboard events, IME logic, additional visible UI or server/security changes. The nonce action requires no password/proof payload, so its empty form is sufficient. Its automatic reset cannot clear fields owned by the password form.

## Before and after

Before editing application source, the new committed browser runner was executed in reproduction mode against the unchanged starting head. Chromium 153.0.8010.0 observed all four EN/FA × MFA off/on cases:

```text
Confirm-password Enter -> nonce=1, reset=0; current-password proof cleared
```

After correction, the normal browser runner passes **68/68 scenarios**, with zero hydration/runtime errors:

| Coverage | Assertions |
| --- | --- |
| Native input Enter, EN/FA, MFA off/on, ordinary/recovery | Password, confirmation, TOTP, current-password and nonce fields where present invoke reset exactly once and nonce zero times; submitted proof/context/language are preserved in the payload. |
| Explicit button routing | Mouse click, touch tap, focused Enter and Space activate only the intended action. Nonce does not mutate passwords or clear password/current-password/TOTP/nonce inputs. |
| Accessibility/navigation | Real native Tab from nonce input to nonce button, Enter activation, then Tab to primary and Space activation; existing labels and role alert/status feedback retained. |
| Failures/repetition | Nonce returned error, retry, repeated success, and editing proof while nonce is pending preserve all entered fields; subsequent implicit password submission works. |
| Overlap and duplicate submission | Deferred nonce/reset resolve in both orders; fieldset unlocks after both settle, proof can be re-entered and retry succeeds. Same-turn duplicate primary submissions produce one reset and no nonce, including after completion. |
| Recovery | No nonce/current-password controls; owned MFA proof remains when enabled; implicit input Enter invokes only reset with recovery context. |

The runner uses actual AuthForm, Button, FreshIdentityFields, translation catalogs, React 19.2.4 SSR and hydration. Provider actions and settings/consent context are synthetic; action serialization metadata is modeled. React refs/effects/actions and native browser submission/reset behavior are real. This is **not** a hosted Next.js/Supabase acceptance test. Recovery browser tests check form routing/fields; genuine recovery/PKCE authorization remains covered by unchanged actual-source server tests with synthetic provider dependencies, pending hosted acceptance.

React can entangle concurrent transitions, so pending may remain until both deferred actions settle. Tests require both completion orders to unlock correctly rather than assuming an earlier independent render commit. Initial local Chromium setup required the packaged binary/software graphics libraries because archive ownership changes are unsupported here; no application workaround was added for the environment.

## Durable tests and verification

`npm run test:auth-form:browser` runs the committed `scripts/test-password-form-browser.mjs`. Use `npx playwright install --with-deps chromium` first. A local executable can be selected with `AGROMIND_CHROMIUM_EXECUTABLE`; CI uses Playwright's standard Chromium. Reproduction-only `--reproduce-a65-04` expects the old defect and must run with the original application source in a separate checkout, using this runner and its dev dependencies.

Foundation now installs Chromium and runs the suite on every PR. Pinned test-only `esbuild@0.25.12` and `playwright@1.61.1` plus lockfile added; existing package versions are unchanged. Hydrated React tests now assert separate form owners, no nested forms, no password payload in nonce FormData and proof preservation. The existing lightweight signup test mock gains stable `useId` support and locates the actual form inside the new fragment; its signup/duplicate assertions remain unchanged.

| Check | Local result |
| --- | --- |
| Pre-fix Chromium reproduction | 4/4 reproduced incorrect nonce routing and cleared proof |
| Corrected Chromium | 68 passed |
| Hydrated React interactions | 10 passed |
| Complete JavaScript suite, including password/recovery/PKCE/MFA | 306 passed, zero failures/skips |
| PGlite | 26 passed, 3 native-only skips |
| Native PostgreSQL | Launcher blocked before test start: EINVAL; final-head Foundation result recorded in PR |
| Lint | Passed; existing `verification-pending.tsx` missing-`next` dependency warning |
| Typecheck / localization / production build | Passed |
| Built-app HTTP checks | 66 passed |

All password authorization services, rejection classification, genuine recovery/PKCE bootstrap, fresh TOTP, grant binding/expiry/consumption/replay, unknown-outcome handling, SQL migrations and Vercel exclusions are byte-for-byte unchanged from the audited head. PR #66, PR #52 and research branches were not modified. No merge, deployment, production operation, secret or Auth-setting change occurred. Universal provider-native F01/F02 remain unresolved.

Status: implemented and locally verified; exact final SHA, CI/native/Chromium results and correction diff are in existing PR #65. Next: focused independent Astra A65-04 check, then isolated hosted Supabase acceptance alongside unchanged PR #66. Actual provider email/nonce/current-password policy, signed recovery/PKCE, OAuth first-password, MFA/backup-code semantics and real session outcomes remain unverified. No Production GO is claimed.
