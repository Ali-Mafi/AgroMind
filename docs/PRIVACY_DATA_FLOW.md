# AgroMind Privacy and Legal Readiness

Audited against `main` at a5596716e86fa4b785546674acbbeb7eac9454ff on 2026-10-25.

| Data / function | Source | Destination / lifespan |
| --- | --- | --- |
| Login and MFA | Supabase SSR Auth | HttpOnly, Secure production cookies, Supabase session data (provider-managed expiry) |
| Pending signup | `features/authentication/lib/pending-signup.ts` | Four HttpOnly `agromind_pending_*` cookies; max 24 hours |
| Display settings | `features/settings/lib/preferences-cookie.ts` | `agromind_display_v1` cookie for 365 days |
| Local preferences, theme, offline game score | Browser storage | localStorage; removable in browser |
| Public PWA assets | `public/sw.js` | CacheStorage; not authenticated farms/APIs |
| Farm records and collaboration | Supabase cloud, RLS | Stored farm data including coordinates and invited members |
| Location & weather | `/api/location`, `/api/weather` | BigDataCloud/Nominatim, WeatherAPI/Open-Meteo; coordinates in requests |
| Account email | Authentication email hook | Resend |
| Optional Google login | OAuth | Google/Supabase |
| Username anti-abuse | LoginCaptcha | Cloudflare Turnstile |
| Public badge | Landing footer | eNAMAD image/link |
| Support form | Account Help | Draft only; no submission backend |

## Release blockers and recurring checks

- [x] Public bilingual Privacy, Cookie and Terms pages linked from landing, signup and account.
- [x] Disclosure distinguishes essential cookies from non-existent optional tracking choices.
- [x] Public HTTP and source tests in both languages.
- [ ] Confirm legal registered operator identity and contact/address; obtain qualified jurisdiction-specific legal review before commercial launch.
- [ ] Define and implement account deletion/export workflows and auditable retention/backups schedule.
- [ ] Validate external service contracts, data-transfer regions and embedded-provider storage behavior (Cloudflare, eNAMAD).
- [ ] Before adding nonessential analytics/marketing cookies, implement working consent gating, reject and withdrawal controls where legally required; never ship trackers first.
- [ ] Add monitoring, incident procedures, dependency checks and routine restore tests.
- [ ] Verify physical iPhone PWA, keyboard/a11y, production rendering and provider behaviors.
- [ ] Publish real purchase, billing, refunds and cancellation conditions before commercial checkout.

This inventory describes inspected code, not a blanket legal compliance certification.
