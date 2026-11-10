| Group | Result | Actual result / limitation |
| --- | --- | --- |
| 65-01 | PASS | Exact authorizePassword bundle with actual non-MFA current-password proof; real updateUser succeeded for expected user. Independent native logins rejected old and accepted new password. Wrong current password rejected. |
| 65-02 | PASS | Exact authorizePassword bundle with newly verified native owned TOTP; actual updateUser and independent old/new login outcomes matched expected identity. |
| 65-03 | NOT VERIFIED | Missing/wrong proof and disabled backup path rejected. Native wrong-TOTP error mfa_verification_failed. Full application stale/reuse/global-logout routing remains unverified. |
| 65-04 | NOT VERIFIED | Observed default native current-password policy OFF; application current-password proof worked. Native setting ON and transition behavior untested. |
| 65-05 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-06 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-07 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-08 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-09 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-10 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-11 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-12 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-13 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-14 | NOT VERIFIED | Actual provider returned weak_password and same_password; independent login confirmed credential unchanged. Application rejection wording untested. |
| 65-15 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-16 | BLOCKED | Not executed: approved real mailbox/fresh mail credential and Send Email Hook unavailable; Google also unconfigured where applicable. |
| 65-17 | NOT VERIFIED | Authorization helper rejects unauthorized proof. Full application action plus separate-session logout outcome untested. |
| 65-18 | NOT VERIFIED | Disabled backup-code path rejected. Enabled native supported-provider path not configured/verified. |
| 66-01 | PASS | Actual AAL2 signed-user legacy RPC and direct profiles.username DML each rejected with 42501. |
| 66-02 | PASS | Anon/authenticated reserve and attest RPCs rejected with 42501. Native service role reserve/attest succeeded; legacy and authorized-consume service calls rejected with 42501. |
| 66-03 | PASS | Native SDK getClaims verified expected signed subject/session identity; forged-subject token rejected by PostgREST HTTP 401. Revoked native session failed final consumption. |
| 66-04 | PASS | Existing signed AAL2 without a fresh grant rejected. Separate AAL1 native session rejected authorized consumption. |
| 66-05 | PASS | Exact candidate authorizeUsername bundle completed native fresh TOTP, service reserve/attest and signed-user consumption. Expected normalized profile and exactly one audit verified. |
| 66-06 | PASS | Actual foreign user, different native session, foreign factor and target mismatch rejected against live bound grants. |
| 66-07 | PASS | Unverified, naturally expired (202 seconds), consumed grant and exact reused proof rejected. Invalid moving-time-step probe is explicitly superseded in evidence. |
| 66-08 | PASS | Two independent concurrent PostgREST requests yielded one success and one rejection. SQL verified one consumed receipt and one audit for that mutation. |
| 66-09 | PASS | Uppercase public availability resolved normalized occupied username; authenticated case-normalized collision rejected with 23505. |
| 66-10 | PASS | Staging-only audit trigger raised QA67_FORCED_AUDIT_FAILURE through real PostgREST. SQL confirmed username unchanged, receipt unconsumed, no audit. Removed fixture; same grant retry succeeded. No fixture trigger remains. |
| 66-11 | NOT VERIFIED | Admin-confirmed synthetic accounts and real email/password login worked; unchanged username-login Edge Function returned HTTP 200 and expected signed identity. Genuine signup/email confirmation NOT TESTED. |
| 66-12 | PASS | Native factor unenrolled after attestation and native global session logout after attestation each caused final PostgREST consumption rejection. SQL confirmed factor/session absent and no consume/audit. |
| combined-01 | NOT VERIFIED | All 23 repository baseline SQL hashes verified; real legacy AAL2 RPC and synthetic farm seed succeeded. Baseline web application not deployed. |
| combined-02 | NOT VERIFIED | Exact #65 SQL installed first; seeded Auth/profile/account/subscription/farm fingerprints unchanged. Matching HTTPS web app/hook unavailable. |
| combined-03 | NOT VERIFIED | Exact #66 SQL installed second; seeded fingerprints unchanged; legacy RPC retired and new signed-native path succeeded. Combined HTTPS web app unavailable. |
| combined-04 | BLOCKED | No reverse-order hosted rehearsal. Existing consumed receipts/guards retained; no schema rewind/reset or additional project authorized/provisioned. |
| combined-05 | NOT VERIFIED | Actual audit rollback and same-grant retry verified; consumed receipts remain protected. Operational application rollback/roll-forward remains unverified. |
| combined-06 | NOT VERIFIED | Native login, JWT, MFA, password and username flows verified. Browser integration, Google and delivered recovery remain blocked. |
| combined-07 | BLOCKED | No approved recovery/notification inbox or fresh sending credential/hook; support notifications not sent. |
| combined-08 | PASS | Real forward #65 then #66 DDL preserved all seeded Auth users/profiles/accounts/subscriptions and synthetic farm fingerprints; no Auth user row changed. No irrigation schedule was seeded. |
