# 2026-11-05 — Real IdP security screen / No spend

**Starting state:** PR #61 open Draft, HEAD `2a621f31b4784d3e5f10601d485e85a7fa811c20`, based on unchanged main `42a8eb2b54fd5852f11a2cc31e09dd7b598e4dc0`. PR #52 remains Draft at `2cd65a5dbf7730a6bdd2a1824912cde52564794f`, **F01/F02 unresolved**.

**Completed:**
- Independently screened two real upstream IdP candidates with official source/docs and recorded trust boundaries in [provider report](../SECURITY_REAL_IDP_PROVIDER_SCREEN.md).
- **Ory Kratos:** inspected pinned upstream public `DELETE /sessions` native handler; documented direct bearer-auth remote revocation without demonstrated per-operation fresh TOTP. **Reject as-is** for universal F02, without claiming a live exploit on Ory Network.
- **SuperTokens:** documented the requirement to isolate privileged Core behind backend, separate frontend account routes and **paid production MFA/step-up**. Conditional research only; OIDC, RLS, hosted provider behavior, prices/terms still unverified. No service selected.
- Added [offline provider metadata](../../experiments/identity-boundary-poc/provider-screen.json), a fail-closed screening helper and an isolated Node test suite. **39/39** local tests passed: prior 21 synthetic authority tests and 18 provider-screening logic tests. These tests do not run actual upstream software.
- Recorded official Supabase Custom OIDC conditions and **cannot-disable-native-Auth** limitation, plus existing `auth.users` FK/`auth.sessions` RLS constraints.

**Not done:** no hosted test IdP, paid resources, new account, backend production integration, SQL migration, credentials, external user data, commit to PR #52, deployment or merge. No real provider signed-HTTP/JWKS/refresh/RLS result; maintain **NO-GO**.

**Next:** owner approval for an actual isolated zero-cost or explicitly capped provider environment; then direct native-API negative tests and database/RLS compatibility. New PR CI must be checked on final head.
