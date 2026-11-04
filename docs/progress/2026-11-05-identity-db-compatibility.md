# 2026-11-05 — Single database identity bridge compatibility (research)

**Starting state:** PR #62 draft head `584926bbbf35e5a2249571e874d5bdd81a2205a7`, PR #61 predecessor `2a621f31b4784d3e5f10601d485e85a7fa811c20`, security PR #52 still Draft and blocked.

**Work:** One isolated test added to `supabase/tests/foundation.test.mjs` for authentic project migrations under test-only PGlite and native PostgreSQL. Simulates claims from new issuer, validates missing/valid native session, present/absent `auth.users`, foreign-tenant isolation, issuer collision at SQL policy level and post-session revocation. No production code or migration.

**Verification:** Existing isolated Node policy experiments 39/39 passed locally. Final-head CI is required to establish the result of this new database test in disposable PGlite/native PostgreSQL; it does not run locally in this environment without dependencies or PostgreSQL. No hosted Supabase/real IdP proof.

**Decision:** [Detailed limits](../SECURITY_SINGLE_DB_IDENTITY_BRIDGE_LAB.md). Keep existing PostgreSQL as a *possible* data plane; do not declare Auth migration ready, select a provider or add production identity tables. F01/F02 remain UNRESOLVED / NO-GO.
