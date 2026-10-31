# Signature Premium transactional emails

`lib/email/layout.ts` is the single escaped HTML/text rendering boundary for authentication, farm invitations and all existing customer/staff support notifications. Email-specific content stays in the existing feature renderers. Delivery integrations, callback/token validation, permissions, triggers, leases, retries, idempotency and notification activation are unchanged.

## Presentation

A 600px warm-ivory card with an integrated photographic-style header: gold leaf/serif wordmark, live centered title and subtitle over a reference-derived agricultural landscape. A gold-edged forest-green HTML/VML action, compact security panel, separately centered ignore notice, three gold highlights with supporting copy, and an asymmetric gold-trimmed green footer reproduce the approved Signature identity. The requested centering takes precedence over the reference's left/right positioning; on narrow screens the three highlights stack.

All presentation tables/cells retain `align="center"` and inline text centering. Inline styles, solid background colors, legacy `background` attributes and an MSO VML header/CTA preserve readable fallbacks. Every title, body paragraph, action and social handle is live text, including when the decorative photo is blocked. Header/panel corners can become square in older clients. The imagery is locally hosted, with no tracking, external fonts or third-party hotlinks. See [original assets](../public/email/signature-v1/ASSETS.md) and [reference-matched artwork](../public/email/signature-v2/ASSETS.md).

Instagram: https://www.instagram.com/agromind.ir/ ; Telegram: https://t.me/agromindir ; website: https://agromind.ir . Both supplied social URLs returned HTTP 200 on 2026-10-28. Instagram can serve a login shell; HTTP success does not establish account ownership or access to posts.

## Dark-mode readability policy

Signature Premium intentionally retains its approved warm-ivory reading surface and forest-green header, rather than offering a separate dark palette. The shared HTML sets `color-scheme` to `light only` and `supported-color-schemes` to `light`. This allows compatible Gmail apps (Google accounts) and Apple Mail to preserve the original color contrast instead of inverting text independently of the agricultural background image. The prior explicit dark-mode media query/Outlook overrides have been removed.

The brand logo, live title and subtitle remain centered directly on the integrated agricultural photo, with **no additional solid boxes or backplates**: the temporary contrast panels were rejected in design review and removed. A solid forest-green fallback remains on the outer header cell if the background photo cannot load. Unsupported email apps (including forced-inversion modes of some clients) may still alter live text colors despite the light-only metadata; this cannot be guaranteed without real inbox testing. Verify with a newly delivered email, not an existing message. No authentication, CTA, or delivery behavior changed.

## Verification copy and expiration accuracy

The supplied Persian signup subject, title, subtitle, greeting, body, CTA, ignore notice and brand highlights are preserved verbatim. The duration in the approved reference was **24 hours**, but the project owner confirmed via the hosted Supabase Auth settings on 2026-10-28 that Production Email OTP Expiration is **3600 seconds (one hour)**. Therefore the security sentence accurately says `این لینک به دلایل امنیتی تنها یک‌بار قابل استفاده است و تا ۱ ساعت اعتبار دارد.` The English translation also states one hour. No hosted authentication settings were changed.

- Local `supabase/config.toml` independently specifies `auth.email.otp_expiry = 3600`, matching the user-reported hosted value. The connected API cannot independently inspect the hosted Auth configuration; this production value is based on the owner's explicit dashboard report.
- The approved image was supplied in the final-polish session. Direct before/after Persian desktop/mobile comparison is complete. Integrated landscape/branding/title, gold leaf and serif wordmark, warm ivory, gold CTA border, compact notice, highlight details/order and curved gold-edged footer were corrected. Deliberate differences: all content is centered, mobile highlights stack, only supplied social accounts are linked, and typography uses client-installed fonts. This is an email-compatible adaptation, not a pixel-identical flattened image.
- Both previously documented release gates (approved reference comparison and truthful OTP expiration wording) are now addressed. Release remains subject to final green CI, safe PR merge and Vercel production verification.

## Reproduce previews and checks

```bash
node scripts/preview-emails.mjs /tmp/agromind-email-previews
EMAIL_QA_ENGINES=chromium node scripts/qa-emails.mjs /tmp/agromind-email-previews
```

QA uses an installed `playwright` package, or `PLAYWRIGHT_MODULE_PATH` / the Work runtime package; install browsers using that package's CLI. Omit `EMAIL_QA_ENGINES` to run Chromium and WebKit, or use `EMAIL_QA_CHROMIUM_PATH` for an existing Chromium executable. It does not add a production dependency. The 18 fixtures cover signup/recovery/invitation plus created/reply/status for both customers and staff, in both locales. Exported fixture actions are inert, with even synthetic authentication/invitation tokens removed. No emails are sent. Images are served from local repository bytes in automated QA until the assets are deployed.

QA checks narrow/desktop widths, both reading directions, light/dark, image blocking and removed style sheets. Every visible text container/cell must compute to center; horizontal overflow fails the run. Screenshots and JSON evidence are generated outside the repository by default. Final-polish local evidence is 216 passing Chromium checks (18 fixtures × 3 widths × 4 environments), with 144 full-page screenshots at 375px/800px. QA also measures actual image/table/CTA centers within 2px of their containing cell, and checks decorative-background requests. This caught and fixed a narrow CSS-stripped highlight-table shift. WebKit could not run because required host libraries were unavailable. These are browser simulations, **not** physical Gmail/Apple Mail/Outlook inbox tests.

Classic Outlook uses a fixed 600px MSO wrapper, explicit widths, table centering and a VML rounded button. It may render card/information-panel corners square and ignore media queries/dark CSS. The raster footer wave works when images load and becomes a rectangular green footer when blocked. Gmail forced inversion, installed fonts and platform antialiasing can differ. Tahoma/Arial are reliable typography fallbacks; no pixel-perfect cross-client claim is made.

Production environment-name inspection on 2026-10-28 confirmed the support worker credential, activation flag, recipient, cron secret, Resend key and signed Auth-hook secret names exist. Values were not read or changed; activation and inbox delivery are not inferred from names.

## Account security candidate — 2026-10-28

[Advanced sessions](ACCOUNT_SESSIONS.md) adds FA/EN login alerts through this same shell and durable support outbox. `SECURITY_EMAIL_ENABLED` gates security delivery independently of support. Retry payloads are frozen per job and share the existing lease/ack and Resend idempotency flow. The preview script now includes two login-security fixtures (20 total). The shared retry cron candidate is every ten minutes, subject to the deployment prerequisites in that document. No production activation was performed.

## Retry hardening (2026-10-29 candidate)

The v2 worker saves complete recipient/sender/subject/HTML/text/locale/version before its first provider send and reuses those bytes on retries, including across deployments/year boundaries. Unknown prior legacy attempts are held for operator reconciliation. The existing Signature Premium renderer is unchanged. See [migration and delivery runbook](SECURITY_REMEDIATION_PR52.md). No production activation or real inbox acceptance is claimed.
