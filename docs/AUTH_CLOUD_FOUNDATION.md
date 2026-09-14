# Authentication and cloud data foundation

## Implementation and activation status

The application foundation is committed and the hosted Supabase database is provisioned. Project **AgroMind** (`gedwexwxaojpqyeiebwm`) belongs to the **AgroMind** organization, uses **Free** in Frankfurt (`eu-central-1`), and was created after the connector quoted **$0/month** and the owner authorized only zero-cost operations. No paid setting or upgrade was enabled.

All three migrations are applied. Their repository filenames now match the hosted migration ledger; SQL contents are unchanged from the tested foundation. `lib/supabase/database.generated.ts` is generated from that hosted schema and `database.types.ts` preserves the application's domain aliases.

Hosted SQL verification passed: all eight tables have RLS, anonymous table grants are absent, the Free entitlements match the seed, auth-user bootstrap succeeds, own-profile reads are isolated, farm creation/retries preserve the counter, a fourth farm is rejected, and irrigation cannot reference another owner's farm. The test transaction was rolled back; no test users or farms remain. Independent-session concurrency was also verified by the foundation GitHub CI run.

Hosted Auth configuration is saved: canonical production URL and the two exact callback URLs below, email/password signup with email confirmation, anonymous sign-in disabled, and a minimum password length of 12. OTP and access-token expiry are 3600 seconds; compromised refresh-token detection/rotation is enabled with a 10-second reuse interval. Hosted throttling remains enabled (150 refreshes, 30 verifications and 30 sign-up/sign-in requests per five minutes). IP forwarding remains disabled; the app does not use secret API keys or trust client-supplied IP headers.

**Production configuration is active:** on 2026-09-14, Vercel reports production deployment `dpl_5TreyFZQGsjLekMtDbt4wuPmhp3W` as **READY**, serving `agromind.ir` from main commit `522ce213f6599d07c0d9ad60a5d366b7cfae9055`. The owning project `ali-mafi/agro-mind` is now accessible through the connector. The owner completed the environment configuration and redeployment in the dashboards; no secret values were shared through chat or committed.

Live HTTP checks confirm that `/sign-in`, `/sign-up` and `/forgot-password` render their forms without the unavailable notice. Legacy `/login` and `/signup` redirect correctly; unauthenticated dashboard, farms, irrigation, account and settings requests redirect to sign-in. A reset page without a recovery session offers the email request flow, and an empty callback redirects to the invalid-link state. All checked auth/private responses use `no-store`.

An unsigned empty POST to `/api/auth-email` returns **401** with `no-store`, confirming that the deployed handler has both required email environment values and rejects unauthenticated requests. This does **not** establish that the hook signing secrets match or that the Resend credential can deliver email. The owner reports completing the Send Email Hook configuration; actual signed delivery, verification and recovery acceptance tests still require an owner-provided test inbox. No live test email has been sent. Do not recreate the Supabase project or reapply its migrations.

Security Advisors report three intentional authenticated `SECURITY DEFINER` entry points (`get_entitlements`, `complete_onboarding`, `import_legacy_data`). These explicitly verify identity, restrict the operation to the caller's account, use empty search paths, and reject anonymous execution. Their restricted writes/read aggregation require privileges withheld from clients; they are reviewed API boundaries, not blanket grants. See the [Supabase advisory](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). Performance Advisors only report the new `subscriptions_plan_id_idx` as unused; retain it for its foreign-key lookup purpose while the new database has no workload ([advisory](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)).

## Architecture

- Supabase Auth owns passwords, OTPs, PKCE, access tokens, refresh tokens and session rotation. Next.js uses the official `@supabase/ssr` cookie integration.
- This application uses a server boundary for all auth and database operations. Server Components and Server Actions create a per-request Supabase client. Browser components receive a limited account/data DTO; they never receive session tokens or instantiate an auth client. Cookies are HttpOnly, SameSite=Lax and Secure in production.
- `proxy.ts` refreshes and checks claims and carries updated cookies to redirects. Protected layouts and every data action independently authenticate with `getUser()`; authorization does not depend on the proxy alone. Mutation identity is always derived from the authenticated session. A client account ID is used only as a stale-tab assertion.
- Private/auth responses have no-store headers. Supabase errors, passwords, OTPs, webhook bodies and secrets are never logged. Redirects accept only internal private paths and a configured canonical origin.
- `accounts` is a small personal ownership boundary. Farms, subscriptions and imports reference an account, not a request-supplied user. Future membership policies can extend this boundary without changing every farm/schedule foreign key. Team accounts are not implemented.
- `FarmProvider` retains addFarm/updateFarm/deleteFarm and schedule operations, now asynchronous. It updates visible data only after the server confirms a write. Failures retain the current data and form input. Cross-tab sign-out/account changes clear the workspace; bfcache restores reload it.
- Farm and irrigation JSON documents preserve every current field and unknown extensions. SQL constraints independently validate the domain fields. Irrigation uses a composite foreign key to a farm within the same account.

## Tables and migrations

| Table                | Purpose / client rights                                              |
| -------------------- | -------------------------------------------------------------------- |
| profiles             | Own confirmed user's profile; selected profile fields may be updated |
| accounts             | Own personal account; client read only, protected counter            |
| plans                | Active catalog and the account's assigned plan; client read only     |
| plan_entitlements    | Typed plan limits/capabilities; client read only                     |
| subscriptions        | Own assigned subscription; client read only                          |
| farms                | Own account CRUD; immutable ownership/ID                             |
| irrigation_schedules | Own account CRUD; same-account farm foreign key                      |
| legacy_imports       | Own immutable full backup and successful import receipt; read only   |

Apply migrations in order:

1. `20260913185754_auth_cloud_foundation.sql`: tables, constraints, profile/account/subscription bootstrap and existing-user backfill, RLS, limits, onboarding/import RPCs, versioned Free seed.
2. `20260913185809_mutation_rpcs.sql`: session-derived, retry-safe farm creation and schedule upsert.
3. `20260913185824_harden_entitlement_reads.sql`: entitlement verification guard, assigned retired-plan readability and subscription foreign-key index.

All eight tables have RLS enabled, explicit grants and no anonymous data access. Confirmed users can only access their personal workspace. Ownership, counters, subscription assignment and onboarding completion cannot be written directly by clients. Catalog writes are administrative only. Definer helpers use an empty search path, qualified objects, restricted execution and explicit identity checks. The `private` schema must **not** be exposed through the Data API.

## Entitlements and farm limit

`plans` and `plan_entitlements` supply all limits. The default-plan database flag determines signup assignment. No component branches on a plan code.

The seeded Free plan grants: farms 3, sensors 5, team members 0, AI requests/month 50, with advanced irrigation, automation and advanced analytics disabled. No paid prices or invented Pro/Business limits exist.

`private.account_entitlements` is the database resolution point; `get_entitlements` exposes only the current account's effective grants. `features/entitlements/lib/entitlements.ts` provides `can` and `getLimit`. Missing/inactive/expired grants fail closed. Subscription dates/status/source and this central resolution boundary allow future trials, overrides and contract grants; those systems are intentionally not implemented.

An AFTER INSERT trigger atomically increments the protected account counter only while it is below the effective limit. PostgreSQL rechecks the counter after a competing row update. Failure aborts the farm insert, including direct SQL/API inserts. AFTER timing avoids consuming a slot for an idempotent conflict/retry. Deletion decrements the counter in the same transaction.

Usage displays actual farm/schedule counts. Sensor, team and AI metering are labeled as not active, rather than presenting fabricated usage.

## Routes and flows

- `/sign-up`: full name, email, password/confirmation, server validation, accessible errors and duplicate-submit protection.
- `/verify-email`: pending/resend, scanner-safe confirmation POST, verified/already-verified, invalid/expired states.
- `/sign-in`: Supabase password login, onboarding resume or an allowlisted destination.
- `/forgot-password`, `/reset-password`: non-enumerating email request, Supabase recovery verification, password update and global session sign-out.
- `/auth/callback`: validates incoming links, defers OTP consumption until a user's POST and supports PKCE code exchange.
- `/onboarding`: persisted welcome/name/country/language/timezone/first-farm steps, with completion guarded in SQL.
- `/account`, `/account/profile`, `/account/subscription`, `/account/usage`: actual account information, read-only email, profile editing, entitlements, usage and legacy backup export.
- Logout uses Supabase session revocation and clears other open account tabs.
- `/login` and `/signup` remain compatible redirects, including the installed PWA entry point.
- Dashboard, farms, irrigation, account, settings, weather and onboarding require authentication. Dashboard/irrigation/settings/weather also require onboarding completion.

## Auth email transport

Use the official Supabase **Send Email HTTPS Hook**, pointing at `https://agromind.ir/api/auth-email`. This transport was chosen to explicitly send both branded HTML and plain text in English/Persian, with one CTA and no tracking or advertising. It retains the existing Resend sending service and verified sender: **AgroMind <accounts@agromind.ir>**. It does not change domain DNS, sender identity or authentication-token management.

The endpoint verifies Standard Webhooks signatures and timestamps before processing a bounded body. Only signup/recovery events are supported in this phase. Links always use the configured canonical origin, not the hook payload's redirect URL. Resend requests have an abort deadline and a deterministic idempotency key so provider retries do not duplicate deliveries. Failed delivery is reported to Supabase as a retryable error; raw provider errors never escape.

Templates: `features/authentication/emails/templates.ts`. Transport: `features/authentication/services/email-hook.ts` and `resend-auth.ts`. Supabase's Send Email Hook replaces its SMTP sender for these flows; do not enable a second custom delivery path. Keep Resend open/click tracking disabled for authentication emails.

## Environment names

| Name                                 | Scope                                                               |
| ------------------------------------ | ------------------------------------------------------------------- |
| NEXT_PUBLIC_SUPABASE_URL             | Project URL                                                         |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Public/publishable project key, never service role                  |
| NEXT_PUBLIC_SITE_URL                 | Canonical app origin; production: https://agromind.ir               |
| RESEND_API_KEY                       | Existing server-only sending credential                             |
| SUPABASE_AUTH_EMAIL_HOOK_SECRET      | Server-only hook signing secret; same secret in Supabase and Vercel |

No Supabase service-role key is required by the application. `.env.example` contains names only. The CLI's deployment login/database credentials stay outside the repository.

## Hosted activation

1. **Done:** AgroMind created in the AgroMind organization on Free, Frankfurt, at the quoted $0/month. Further actions remain limited to $0 without new owner approval.
2. **Done:** all three migrations applied, hosted RLS/limit/isolation checks passed, advisors reviewed, and database TypeScript types generated. Keep the `private` schema outside the Data API.
3. **Done:** email/password signup and email confirmation enabled; anonymous sign-in disabled; minimum password length 12, OTP expiry 3600 seconds, token expiry 3600 seconds, refresh rotation on and reuse interval 10 seconds. Paid password-leak protection and paid session restrictions were not enabled.
4. **Done:** Site URL is `https://agromind.ir`. Redirect allowlist contains only `https://agromind.ir/auth/callback` and `https://agromind.ir/auth/callback?next=/reset-password`. Add exact localhost callback URLs to a development project; avoid broad production wildcard redirects.
5. **Done:** the owner configured the Supabase public values and canonical site origin in Vercel Production while preserving Resend, then redeployed main. The deployment is READY and live auth forms render successfully. No paid Vercel setting was enabled by the agent.
6. **Owner-configured; delivery acceptance pending:** the Send Email HTTPS Hook uses the endpoint above and its signing secret belongs in `SUPABASE_AUTH_EMAIL_HOOK_SECRET`. Production rejects unsigned requests with 401, confirming the hook secret and Resend key are present. Verify signature matching and delivery through the real signup/recovery flows with the owner's test inbox; never copy secrets into source or logs.
7. **Reviewed:** hosted refresh, verification and signup/login limits remain enabled at the values above; IP forwarding is off. Keep the built-in email cooldown (60 seconds) and review email sending limits when enabling the hook. `supabase/config.toml` records a local starting configuration. Server-side calls share Vercel egress; do not trust client-forwarded IPs. Honeypots, bounded inputs, pending locks and generic email responses provide additional basic abuse protection. CAPTCHA and a persistent application-wide limiter are not implemented.
8. Use an owner-provided test inbox to verify signup → inbox → confirmation → onboarding → farm → logout/login, recovery → password change → old session denial, sender identity and HTML/text MIME parts. Real inbox tests remain pending. Hosted RLS/limit/isolation SQL checks passed; independent-session concurrency passed in GitHub CI against native PostgreSQL.

Missing configuration fails closed; it never re-enables placeholder authentication or local business storage. A Git push/build alone does not activate the hosted services.

## localStorage inventory and migration

| Existing storage                        | Behavior now                                                       |
| --------------------------------------- | ------------------------------------------------------------------ |
| agromind-farms                          | Read only as a legacy migration source; never overwritten/deleted  |
| agromind-irrigation-schedules           | Read only as a legacy migration source; never overwritten/deleted  |
| agromind-preferences-v1                 | Device preferences such as units/calendar; retained                |
| agromind-region, agromind-region-source | Legacy device-region preferences; existing compatibility retained  |
| agromind-weather-motion                 | Device animation preference; retained                              |
| agromind-location-banner-dismissed      | Device permission-prompt preference; retained                      |
| theme (next-themes)                     | Device theme; retained                                             |
| agromind-legacy-owner-v1 (new)          | Successful-import ownership bookkeeping only; never authentication |

A confirmed user sees a legacy backup with explicit account ownership consent. Import is offered only for an empty cloud workspace with no receipt. If there are more farms than the entitlement permits, the user chooses which farms become active; **the full snapshot including excess farms and schedules is stored in the cloud backup**.

One transaction locks the account, validates the entire snapshot, checks the limit, imports selected records and writes a fingerprint receipt. Invalid input, an orphan schedule, a concurrent limit conflict or any SQL error rolls everything back. Repeating the same snapshot/selection returns the existing receipt. Changed data cannot silently replace an import. Cloud and local backup exports remain available; corrupted originals can still be downloaded raw. Originals are never removed, even after success. The application uses cloud data after login, and failed reads are never treated as an empty workspace.

Profile language/country provide account defaults on login and when changed in the profile. Local settings remain available for device-specific units, calendar, appearance and temporary language/region preferences.

## PWA and verification

The new service worker removes prior AgroMind caches, never caches authenticated navigations, RSC responses, API responses or submissions, and caches only public static assets. Offline navigation shows a generic bilingual screen. Offline cloud mutations are not queued or presented as saved.

Verification commands:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:http
npm run localization:check
npm run test:db:native
```

`npm test` includes existing weather/settings/landing tests, auth actions/redirects/cookies/forms/email hooks, storage/entitlement validation, and real SQL migration/RLS/limit/import tests in PGlite. PGlite has one database session, so the eight-connection race test is explicitly skipped there. `test:db:native` executes the same SQL suite with independent native PostgreSQL sessions; the GitHub workflow includes this required separate check. This workspace's root-only UID mapping prevents running native PostgreSQL as an unprivileged user; no bypass is used.

`test:http` starts a production build with inert local configuration, checks unauthenticated route protection, no-store headers, rendered auth forms and compatible redirects, then terminates the test server. It makes no real signup or email calls.

The cloud browser rejected localhost preview access during implementation. Production browser verification now confirms that the sign-in form is interactive, its submit button is enabled, its show-password control changes the input type, and its signup link opens the complete signup form with an enabled submit button. Real email/session verification and responsive visual acceptance remain pending; successful HTTP/unit/SQL/build checks must not be described as those live checks.

The provisioned application commit passed lint, typecheck, application/SQL tests, build, and the independent-session native PostgreSQL CI gate ([workflow run](https://github.com/Ali-Mafi/AgroMind/actions/runs/34791225744)). The production activation update changes documentation only and does not alter the previously tested application or migrations.

## Official references

- [Supabase SSR for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Send Email Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook)
- [Supabase and Resend hook example](https://supabase.com/docs/guides/functions/examples/auth-send-email-hook-react-email-resend)
- [Resend email API with HTML and text](https://resend.com/docs/api-reference/emails/send-email)
