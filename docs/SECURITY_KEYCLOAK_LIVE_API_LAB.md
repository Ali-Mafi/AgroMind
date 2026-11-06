# AgroMind — Real Keycloak native-API HTTP Lab

**2026-11-06 · research only · zero new paid resources · never production**

**Baseline:** Security [PR #52](https://github.com/Ali-Mafi/AgroMind/pull/52) F01/F02 **UNRESOLVED / NO-GO**. Prior [PR #61](https://github.com/Ali-Mafi/AgroMind/pull/61), [PR #62](https://github.com/Ali-Mafi/AgroMind/pull/62), [PR #63](https://github.com/Ali-Mafi/AgroMind/pull/63) contain synthetic policy, vendor screening and isolated PostgreSQL claim/RLS tests. This lab adds **actual unmodified vendor process / native HTTP** verification.

## Why Keycloak?

Keycloak provides an actual OIDC issuer, JWKS and MFA and supports free, local open-source experimentation. Official container quickstart: https://www.keycloak.org/getting-started/getting-started-docker . The pinned, open-source Keycloak **26.8.1** Docker image is launched in **development mode only**, with ephemeral H2 storage on a standard GitHub-hosted `ubuntu-latest` runner. This is **not a production configuration**. The repo has no added production runtime dependency.

**Source-based concern:** At version `26.8.1`, [`SessionResource.java`](https://github.com/keycloak/keycloak/blob/26.8.1/services/src/main/java/org/keycloak/services/resources/account/SessionResource.java) implements `DELETE /realms/{realm}/account/sessions?current=false` by requiring `MANAGE_ACCOUNT` and revoking other sessions; no newly supplied operation-bound TOTP proof is checked inside the handler. This requires **live confirmation**, not an automatic vulnerability assertion or proof of remote exploitability. [AccountCredentialResource.java](https://github.com/keycloak/keycloak/blob/26.8.1/services/src/main/java/org/keycloak/services/resources/account/AccountCredentialResource.java) has a deprecated credential-removal handler; its availability is probed, not assumed.

## Verified real-provider execution — 2026-11-06

**Executed on [GitHub Actions run 42196411433](https://github.com/Ali-Mafi/AgroMind/actions/runs/42196411433), commit `9ea3a80483d4b85c230d63bbefb49b47c3fb2f8d`.** `real-provider-http` completed successfully **after** correcting CI-only directory ownership, required Keycloak profile fields and imported OTP `secretEncoding: BASE32`.

**Actual unmodified image:** `quay.io/keycloak/keycloak@sha256:3f3c5f8e03c614774b4bd9173b88391fefa4153bfc010d8012d59ad825377332` (tag `26.8.1`).

| Real HTTP/crypto probe | Result |
| --- | --- |
| Real OIDC discovery + provider JWKS RSA signature check | **PASS** |
| Issuer, expiry, UUID subject, explicit `role: authenticated` claim | **PASS (JWT-level only)** |
| Synthetic Alice login without TOTP | **DENIED** |
| Two actual MFA-backed sessions for Alice | **CONFIRMED** |
| Anonymous account session listing | **DENIED** |
| Direct native `DELETE /realms/agromind-idp-lab/account/sessions?current=false` with an established bearer but **NO new TOTP/proof** | **ACCEPTED, other session genuinely revoked — F02 BYPASS REPRODUCED** |
| Target session refresh after revocation | **DENIED** |
| Current and foreign user's refresh after revocation | **BOTH PRESERVED** |
| JWT signature still cryptographically verifies after session revocation | **CONFIRMED**; do not equate signature validity with authorization |
| Native credential/factor deletion with no fresh TOTP | **NOT VERIFIED** (`FACTOR_NOT_LISTED` via account API) |
| Hosted Supabase Custom OIDC/RLS, password reset and Google OAuth | **NOT TESTED** |

**Security conclusion:** **UNMODIFIED KEYCLOAK 26.8.1 IS NOT AN ACCEPTABLE DROP-IN F02 FIX** for AgroMind's strict *new TOTP per remote/global revocation operation* policy, even where the user logged in with TOTP initially. The verified logout behavior is account-contained: the foreign user's token was not revoked. This should **not** be described as a cross-user exploit. F01 credential mutation was **not** independently proved in this run; no universal F01 fix is claimed.

**Workflow green means the experiment exposed the native policy gap successfully, NOT that Keycloak is production-approved.** The account API might be isolated, replaced or restricted in a different architecture, but this would need an **unavoidable network/authz boundary and new independent negative testing** before becoming a viable candidate.

## Real-HTTP lab design

Source: [`keycloak/lab.mjs`](../experiments/identity-boundary-poc/keycloak/lab.mjs) and [isolated workflow](../.github/workflows/identity-keycloak-lab.yml). A synthetic realm is generated **only inside the disposable runner** with two users, one with an actual imported TOTP credential. Secrets are randomly generated per run, saved with mode 0600 outside the import directory and removed during cleanup; no tokens/passwords are printed or uploaded as artifacts.

1. Boot unmodified `quay.io/keycloak/keycloak:26.8.1` on **127.0.0.1 only**, HTTPS not claimed. Allow built-in H2 **inside the disposable container**, not a new hosted or agricultural database.
2. Fetch actual OIDC Discovery and JWKS. Verify the provider-issued access JWT signature, issuer, expiry, UUID subject and an explicitly configured `role: authenticated` claim using Node crypto. **This does not constitute Supabase's actual token acceptance or HTTPS issuer availability.**
3. Try password-only login on TOTP-enrolled synthetic Alice (must be refused); create two **separate** sessions using authenticator codes from distinct TOTP time windows. Create a foreign-user session for Bob.
4. Call account session APIs with **real bearer access token**. Attempt direct native `DELETE /account/sessions?current=false` **without submitting any new TOTP code**. If response and before/after session evidence support it, show the other session's refresh is rejected while actor/current and foreign-user refresh remain valid.
5. Verify an already issued, revoked-session JWT can still pass **cryptographic signature verification**; this is why Supabase RLS must check authoritative live session state. A JWT signature alone is not a revocation oracle.
6. Optionally probe the native account credential deletion path. Treat it as **NOT VERIFIED** if the endpoint is disabled/unavailable or the existing factor cannot be located. This is **not a full F01 password-mutation/recovery test**.

A **green** verification of an **expected bypass** means *the research experiment worked*; it does **not** mean F01/F02 are fixed or this provider is suitable for production.

## Scope & remaining release gates

The lab does **not** integrate with Supabase Hosted Auth or configure Custom OIDC in a hosted project. It does not exercise actual Supabase RLS/Storage/Realtime/SSR, recovery, Google OAuth, account migration, all Keycloak credential routes, rotated signing keys, password-reset exception policies, or a fully isolated production-grade gateway. The disposable H2 database is only an in-container test fixture; it neither replaces nor adds any AgroMind production database.

**If the direct native remote logout bypass is reproduced, unmodified Keycloak is not acceptable for AgroMind's original universal F02 policy.** If the account REST route is blocked, mark the behavior NOT VERIFIED until configuration and authorized source behavior are reconciled; do not infer a security guarantee.

The final next decision requires a provider/architecture with **demonstrably unavoidable operation-bound fresh TOTP for *all* sensitive native endpoints**, supported recovery and a safe issuer+subject+session-bound data-layer design. A bypassable app proxy alone is insufficient. No vendor choice or migration is authorized.

**Release:** Security PR #52 **Draft / NO-GO** regardless of lab CI. Do not merge research PRs, deploy, migrate users, create paid resources or change provider settings in production.
