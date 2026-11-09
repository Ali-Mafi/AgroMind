# Password authorization correction — 2026-11-07

Started from clean current main `42a8eb2b54fd5852f11a2cc31e09dd7b598e4dc0`; production matched. Implemented reset/recovery authorization in an isolated branch, not PR #52. See [audit handoff](../SECURITY_PASSWORD_RESET_HOTFIX.md) for exact boundaries, original reproduction, tests, migration and recovery strategy. No production changes. Changed paths and exact final head are in the Draft PR diff; CI links/counts in the PR description. Next: independent Astra audit plus isolated hosted acceptance before any owner release decision.
