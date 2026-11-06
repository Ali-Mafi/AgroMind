# 2026-11-06 — Isolated real Keycloak native API lab

- Starting research parent: PR #63 `d79bb9393a7b1f5e5065f41f9c4687086e9f6a53`. Release PR #52 `2cd65a5dbf7730a6bdd2a1824912cde52564794f`, Draft / NO-GO.
- Built a dedicated short-lived GitHub Actions lab to launch **real Keycloak 26.8.1** in a runner-local Docker container with synthetic MFA account and H2 data store, and to probe OIDC/JWKS and the **direct native remote-logout API**. Tests must demonstrate actual session/refresh postconditions and foreign-account isolation, not just status codes.
- Generated passwords/TOTP fixture secrets exist only inside the disposable runner and are not committed or printed.
- **Critical evidence boundary:** A real Keycloak API test does not verify hosted Supabase integration or all credential/recovery routes. F01/F02 stay unresolved until an enforceable production architecture is independently proved. No new migration, production account, service, database or paid environment.
- The actual outcome must be sourced from new-head GitHub CI logs; do not treat this design or a source-based finding as an executed HTTP test.
