# MFA Back white-screen hotfix

Starting `main` was `a6822c9b9267f7648dac3b736a58ac8c2574dc04`. Chromium reproduced the white page after client-side sign-in. The `form` binding was valid. Both native submitters inherited the sign-in document's `no-referrer` policy and reached the POST with `Origin: null`, which received an empty 403.

The MFA page now handles both submitters in one form. The POST uses an explicit same-origin referrer policy and the existing cancellation checks. Success replaces the challenge with a fresh sign-in document. Failed requests show a localized error and leave the form available to retry. The native POST still uses a 303 on success.

Local checks passed for 291 application tests, 23 PGlite tests, 25 native PostgreSQL tests with TCP-only startup options, lint with one existing warning, type checking, localization, build, and HTTP smoke tests. Chromium covered both submitters, HTTP and network failures, retry, browser Back and Forward, and Persian RTL recovery without JavaScript. Hosted Auth and physical mobile testing are pending.

Review the draft and its Foundation checks before considering release. Vercel Git deployments are disabled for this hotfix branch.
