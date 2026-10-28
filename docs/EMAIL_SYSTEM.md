# Signature Premium transactional emails

`lib/email/layout.ts` is the single escaped HTML/text rendering boundary for authentication, farm invitations and all existing customer/staff support notifications. Email-specific content stays in the existing feature renderers. Delivery integrations, callback/token validation, permissions, triggers, leases, retries, idempotency and notification activation are unchanged.

## Presentation

A 600px ivory card, forest-green/gold brand header, first-party real agricultural photograph, centered text/metadata, rounded HTML/VML action, information panel, three supporting brand highlights and raster curved green footer. All presentation tables and cells use `align="center"`; cells and visible text use inline `text-align:center`. Persian uses RTL for reading direction while retaining center alignment. On narrow screens the supporting highlights stack. Inline styles and a fixed-width MSO wrapper remain usable if embedded CSS is removed.

Persian and English content, descriptive hero alt text, visible brand/social labels and plain text remain usable without images. Dark environments retain a cream reading surface with a dark outer background where client CSS is supported. No scripts, tracking, third-party font requests, hotlinked images or base64 media are included. See [asset provenance](../public/email/signature-v1/ASSETS.md).

Instagram: https://www.instagram.com/agromind.ir/ ; Telegram: https://t.me/agromindir ; website: https://agromind.ir . Both supplied social URLs returned HTTP 200 on 2026-10-28. Instagram can serve a login shell; HTTP success does not establish account ownership or access to posts.

## Verification copy and release blockers

The supplied Persian signup subject, title, subtitle, greeting, body, CTA, ignore notice and brand highlights are preserved verbatim. The security sentence currently says only `این لینک به دلایل امنیتی تنها یک‌بار قابل استفاده است.` **The duration is intentionally pending, not approved final copy.**

- Local `supabase/config.toml` has `auth.email.otp_expiry = 3600` (1 hour), not 24 hours. This is not proof of the hosted setting.
- The connected Supabase API does not expose hosted Auth settings; the dashboard requires sign-in. No live setting was changed or inferred from local defaults. Confirm hosted Email OTP Expiration for project `gedwexwxaojpqyeiebwm`, then finish the sentence with the actual verified duration. For 86400 seconds, use the exact approved `این لینک به دلایل امنیتی تنها یک‌بار قابل استفاده است و تا ۲۴ ساعت اعتبار دارد.`
- The referenced Signature Premium image was absent from available request attachments. The implementation follows the detailed written specification; comparison against that approved image remains blocked.
- **Do not merge this candidate until the missing reference comparison and live expiry verification are complete.** This follows the requested release gates, not an additional approval requirement.

## Reproduce previews and checks

```bash
node scripts/preview-emails.mjs /tmp/agromind-email-previews
EMAIL_QA_ENGINES=chromium node scripts/qa-emails.mjs /tmp/agromind-email-previews
```

QA uses an installed `playwright` package, or `PLAYWRIGHT_MODULE_PATH` / the Work runtime package; install browsers using that package's CLI. Omit `EMAIL_QA_ENGINES` to run Chromium and WebKit, or use `EMAIL_QA_CHROMIUM_PATH` for an existing Chromium executable. It does not add a production dependency. The 18 fixtures cover signup/recovery/invitation plus created/reply/status for both customers and staff, in both locales. Exported fixture actions are inert, with even synthetic authentication/invitation tokens removed. No emails are sent. Images are served from local repository bytes in automated QA until the assets are deployed.

QA checks narrow/desktop widths, both reading directions, light/dark, image blocking and removed style sheets. Every visible text container/cell must compute to center; horizontal overflow fails the run. Screenshots and JSON evidence are generated outside the repository by default. The current local evidence is 216 passing Chromium checks (18 fixtures × 3 widths × 4 environments), with 144 full-page screenshots at 375px/800px. WebKit could not run because required host libraries were unavailable. These are browser simulations, **not** physical Gmail/Apple Mail/Outlook inbox tests.

Classic Outlook uses a fixed 600px MSO wrapper, explicit widths, table centering and a VML rounded button. It may render card/information-panel corners square and ignore media queries/dark CSS. The raster footer arc works when images load and becomes a rectangular green footer when blocked. Gmail forced inversion, installed fonts and platform antialiasing can differ. Tahoma/Arial are reliable typography fallbacks; no pixel-perfect cross-client claim is made.

Production environment-name inspection on 2026-10-28 confirmed the support worker credential, activation flag, recipient, cron secret, Resend key and signed Auth-hook secret names exist. Values were not read or changed; activation and inbox delivery are not inferred from names.
