# Preserved independent audit evidence

These files are byte-for-byte copies from the completed audit of
`8e2c776c69283a2f891532dca8118ac79851d56f`. The report's findings and pinned
references have not been rewritten to describe remediation.

The `.mjs.txt` files preserve the original probes, including their original
workspace paths. They are historical evidence, not new-HEAD test entry points.
Reproduce them only in an isolated checkout of the audited SHA, adjusting local
import paths. Never point them at a hosted database. The execution summary
explicitly distinguishes the complete observed tool output from a partial log.

Current regression tests are in `features/account-security/tests/remediation.test.mjs`
and `supabase/tests/foundation.test.mjs`. See `../../SECURITY_REMEDIATION_PR52.md`.
