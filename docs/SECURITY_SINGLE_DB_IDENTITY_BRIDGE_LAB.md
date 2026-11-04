# AgroMind — Single-PostgreSQL identity migration compatibility lab

**2026-11-05 · Research-only · No production changes or spend**

**Question:** Could AgroMind keep Supabase PostgreSQL as its agricultural data layer when replacing its identity authority? **Possibly yes**, but current application security/migrations are not drop-in compatible with third-party identities. An external provider might require its own identity/session storage; keeping one agricultural data store does not guarantee zero additional identity infrastructure.

## Evidence & limits

Official [Supabase third-party authentication overview](https://supabase.com/docs/guides/auth/third-party/overview) supports access to the existing Data API using selected trusted OIDC providers. [Custom OIDC](https://supabase.com/docs/guides/auth/third-party/custom-oidc) requires HTTPS OIDC discovery and JWKS, asymmetrically signed JWT with `kid`, issuer/subject handling and `role` claims. Native managed Supabase Auth **cannot be disabled** just by enabling third-party Auth. No production integration was configured.

A new test in `supabase/tests/foundation.test.mjs` runs against disposable PGlite and native PostgreSQL in the repository's existing Foundation workflow using **actual migrations**. It sets synthetic `iss`, `sub` and `session_id` **after bypassing signature verification on purpose** to examine SQL/RLS behavior, not to test JWT cryptography or a hosted provider.

| Scenario | SQL policy hypothesis under test |
|---|---|
| Correct UUID/foreign issuer but unrecognized native session | Deny profiles and farms because `private.session_is_active()` reads native `auth.sessions` |
| Recognized native user/session but foreign issuer | Existing RLS can allow profile/farm access because no issuer-bound guard is enforced by current SQL |
| Foreign tenant | Cross-tenant farm access denied |
| New external UUID without an `auth.users` row | No profile and FK prevents native account ownership insert |
| Once corresponding native session is revoked | Protected farm reads denied even with otherwise matching claims |

**Do not interpret the issuer collision case as a working real-world exploit:** the SQL fixture can set arbitrary claims. A real external token requires an independently configured trusted issuer, a valid asymmetric signature and matching session ID. No claim that an attacker could guess session IDs or forge JWTs is made.

## Single-DB design boundary

PostgreSQL can continue to hold farms, schedules, plans, support and collaboration. Identity itself requires durable credential, MFA and session state. Depending on the IdP's actual supported setup, its private data can reside in a restricted separate schema, a logical database on the same cluster, or a completely different system. **No second agricultural database is mandated.** However, using Supabase-managed `auth.users` and `auth.sessions` as unsupported manual identity tables is not an acceptable shortcut.

A safe cutover requires issuer-qualified immutable identity maps, restrictive issuer RLS on every path, authoritative live session/revocation state, deliberate handling of `auth.users` foreign keys/bootstrap, verified-email and MFA source of truth, SSR, OAuth/Google, account recovery, Storage/Realtime, rollbacks, and disposition of **old native Supabase authentication** which remains technically available. Merely adding a new JWT signer or Next.js proxy does **not** close F01/F02.

## Next mandatory real verification

Choose a provider with demonstrably unavoidable, operation-bound fresh MFA over **all native credential and remote/global logout endpoints**. Use isolated, synthetic accounts and an **approved disposable HTTPS OIDC + test Supabase database**, then execute signed HTTP/API negative matrix, subject binding and issuer collisions, PostgREST RLS, logout/refresh races and recovery. If this cannot be done without cost or production access, stop and seek explicit authorization; do not imply completed hosted verification. Candidate screen: [PR #62 report](SECURITY_REAL_IDP_PROVIDER_SCREEN.md).

**PR #52 F01/F02 remain UNRESOLVED / NO-GO.** No merge, migration, deploy, payment or live settings changes were made.
