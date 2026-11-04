# Identity authority policy-boundary PoC — 2026-11-04

**Starting `main`:** `42a8eb2b54fd5852f11a2cc31e09dd7b598e4dc0`.
**Existing security PR #52:** Draft at `2cd65a5dbf7730a6bdd2a1824912cde52564794f`, F01/F02 unresolved.

## Completed

- Created independent Node 22 experiment under `experiments/identity-boundary-poc/` with **no dependencies** and no deployment entrypoint.
- Synthetic operation-bound fresh TOTP verification, 2-minute challenge / 60-second one-use grant, replay resistance, wrong-user/session/op/payload checks, password and email changes, remote logout `others`/`global`, independent recovery ticket fixture and synthetic RS256 JWT/JWKS.
- Negative HTTP tests bind a server to loopback; they are **not evidence that Supabase native Auth is unreachable**.
- **21/21 local Node tests passed** via `cd experiments/identity-boundary-poc && npm test`. Root `npm test` updated to include experiment; final-head repository CI evidence should be checked on the new PR.
- Read-only inventory of existing `auth.users` FK/bootstrap, `auth.sessions`/native MFA gate, UUID/issuer and SSR Auth coupling. [Documented architecture requirements](../SECURITY_IDENTITY_BOUNDARY_POC.md) and reproducible hosted acceptance matrix.

## Not performed

No real provider/OIDC implementation, actual Supabase third-party JWT trust or hosted provider test, real login or recovery mail, migration, RLS modification, production config, real users, spending, merge or deployment. Do not claim **F01/F02 fixed**. PR #52 remains Draft and NO-GO.

**Next gate:** validate one specific candidate identity provider in a disposable authorized hosted environment including direct sensitive endpoints, preserved account recovery, historical session migration and authoritative RLS denial.
