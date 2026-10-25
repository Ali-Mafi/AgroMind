# Privacy, Cookies and Legal Launch — Data Flow

Source review: 2026-10-25, starting commit `05f6bd1a20e9431139cbf013c22c5eac63a60447`. This is a factual engineering inventory, not a legal compliance certification.

| Processing | Evidence | Storage/provider |
| --- | --- | --- |
| Session, MFA, security | `lib/supabase/server.ts`, `lib/supabase/config.ts` | Supabase; HttpOnly first-party auth cookies |
| Email verification in progress | `features/authentication/lib/pending-signup.ts` | `agromind_pending_*` cookies, around 24h |
| Locale/units | `features/settings/lib/preferences-cookie.ts` | `agromind_display_v1` up to 365 days |
| Themes, preferences, game scores | client components | localStorage |
| Farms, teams, irrigation | Supabase cloud migrations/actions | Supabase database and RLS |
| Weather, location | `app/api/weather`, `app/api/location` | WeatherAPI, Open-Meteo, BigDataCloud, Nominatim |
| Auth emails / external sign-in | Auth actions and providers | Resend; optional Google |
| Abuse prevention | LoginCaptcha | conditional Cloudflare Turnstile |
| Trust seal | landing footer | external eNAMAD resource |
| PWA offline mode | `public/sw.js` | public-only CacheStorage |

## Shipped now

- Public bilingual `/privacy`, `/cookies`, `/terms` and discoverable links from Landing, signup and Account About.
- Descriptions of current storage and vendors without promising nonexistent legal status or retention SLAs.
- Content and public HTTP checks.

## Before formal commercial launch

- [ ] Confirm registered operating entity name and service address; publish verified identity.
- [ ] Validate jurisdictions, vendor contracts, server/backup regions and third-party storage/identifiers with qualified legal review.
- [ ] Establish verified retention periods, user data export/deletion workflow and backup handling.
- [ ] If optional advertising or analytics tracking is introduced, implement pre-consent blocking and real reject/withdraw controls where required.
- [ ] Verify physical iPhone PWA, RTL, keyboard accessibility and live browser storage behavior.
- [ ] Establish error/uptime monitoring, security/dependency review, incident response and restore tests.
- [ ] Publish real purchase, cancellation, renewal and refund terms before activating payments.

This work cannot guarantee absence of current/future bugs or regulatory compliance.

## Google OAuth post-login consent (2026-10-26)

- Signup uses one compact checkbox located before the final email submit button.
- Google signup/signin begins without a pre-OAuth checkbox; Google accounts missing the latest policy acknowledgement are redirected to `/accept-terms` before onboarding and all private data snapshots.
- Accepting writes a version/date to Supabase auth user metadata; declining signs out. Existing Google users with the matching version bypass the step.
- **Limitation:** Supabase auth user_metadata is client-writable and is not a tamper-proof acceptance/audit ledger. Before relying on this for formal legal evidence, move acceptance to a server-controlled database audit record and verify RLS and retention.
