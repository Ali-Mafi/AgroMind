# AgroMind — Security-First Product & Engineering Policy

**Status:** standing product requirement / security strategy, **not** a completed security certification  
**Recorded:** 2026-10-27  
**Decision:** AgroMind may manage farms, irrigation operations, valuable agricultural assets and eventually financial workflows. Security, safety, confidentiality and recoverability are non-negotiable acceptance criteria for every relevant feature.

> **Product trust principle:** Users must be able to trust AgroMind with operational and economically valuable decisions. Protecting their farms, data and ability to recover from mistakes is more important than shipping a feature quickly.

## 1. What this document does — and does not — mean

This document records the owner's explicit long-term security priority and supplies security gates for future implementation, review and release. It is **not** approval to change production authorization, database policies, secrets, devices, payments or live accounts now.

**Requirements and planned controls below are not claims that they already exist.** Existing measures should be independently verified against the current code, database, provider settings and runtime. See [Account Security Hardening](ACCOUNT_SECURITY_HARDENING.md), [Privacy Data Flow](PRIVACY_DATA_FLOW.md), [Support Tickets](SUPPORT_TICKETS.md), [Project Rules](PROJECT_RULES.md) and the current [Roadmap](ROADMAP.md) for feature-specific context and evidence.

## 2. Assets and threat model

Protect at least:

- **Identity and authorization:** passwords, sessions, MFA factors, recovery flows, team membership, farm-owner/staff privileges and service credentials.
- **Farm and garden records:** ownership, boundaries and locations, crops, histories, contracts where later supported, private notes, personnel and collaboration.
- **Operational decisions:** irrigation schedules, sensor observations, weather provenance, AI suggestions, device commands and manual overrides. Incorrect actions may cause crop loss, water waste or equipment damage.
- **Financial interests:** subscriptions, invoices, payment confirmations, future transaction records and decisions with material economic impact.
- **Availability and integrity:** backups, ability to restore correct data, resilient offline behavior, usable audit history and safe behavior during outages.

Design against compromised accounts or devices, phishing, credential stuffing, unauthorized cross-farm access, insider/support privilege misuse, malicious or mistaken team members, API-key leaks, vulnerable dependencies, forged payment events, provider outages, stale or manipulated weather/sensor readings and inaccurate AI recommendations.

**Confidentiality, integrity and availability are all required.** For physical equipment, *safe failure* is particularly important: loss of connectivity must not cause uncontrolled actuation or silently override a farmer's safety limits.

## 3. Mandatory engineering controls

### Authentication and account recovery

- Continue using the managed Supabase Auth password-verification path; **never** store, email, log, cache or invent a parallel plaintext password store. Existing password hashing does not establish the security of every other layer.
- Require strong passwords, verified identities and MFA for roles/actions proportional to risk. Re-authenticate with **fresh proof** before high-impact changes.
- Review breached-password protection, login/reset/signup abuse controls, MFA recovery usability, session invalidation and unusual-account-activity notifications against **actual provider capabilities** before claiming coverage.
- Recovery must not become a weaker bypass around MFA or farm ownership. Support staff must not be able to retrieve passwords or silently take over accounts.

### Tenant isolation and permissions

- Treat **the farm/account ownership boundary** as a security boundary. Implement and test server-side authorization on every read, mutation, file, realtime channel and RPC, regardless of front-end UI.
- Use least-privilege permissions for owner, manager, worker, viewer, platform support and service accounts. Support access is **not** implicit access to user farms.
- Secure direct-object references, invites, member removal, role escalation and cross-farm queries with negative tests (other user, other farm, revoked member, stale token and anonymous request).
- Protect privileged database functions, enforce RLS where appropriate, and keep service-role/secret credentials on trusted servers only. Never expose credentials through `NEXT_PUBLIC_*`, client bundles, public docs or logs.

### Data protection and auditability

- Enforce encrypted transport; verify provider-managed encryption at rest and backup practices rather than assuming every storage surface is covered.
- Minimize collected personal/location data, control retention, deletion and exports, and avoid embedding sensitive farm data in analytics, emails, third-party AI prompts, logs or error reports.
- Maintain tamper-resistant, access-controlled audit records for important events: role/ownership changes, security settings, irrigation schedule edits, device commands, payment state changes and privileged operations. Record who/what/when and the affected scope, not passwords or tokens.
- Back up critical records and **test restoration** using measurable recovery targets. Backups alone do not prove recovery.

### Operational safety, weather, sensors and AI

- Separate **advice** from **actuation**. Weather predictions and AI outputs must not directly authorize dangerous irrigation/equipment actions.
- Before any real-world device integration: use per-farm authorization, command allowlists, bounded durations/volumes, replay protection, rate limits, local interlocks, explicit manual stop/override, clear command acknowledgement and fail-safe disconnect behavior. Require human approval where material loss is possible.
- Present data source, timestamp, staleness and uncertainty for weather/sensors. Unavailable or contradictory readings must not be disguised as safe or current.
- Never replay offline/stale queued control commands blindly on reconnect; require validation and explicit reconciliation.

### Billing and integrations

- Use a vetted payment provider for card/payment secrets; never store raw card details. Verify webhook signatures, idempotency, amounts, currency, ownership, reconciliation and refund/cancellation paths server-side.
- Scope and rotate third-party credentials; enforce least-privilege network/API access, request quotas, anomaly monitoring, dependency review and safe configuration of production secrets.

### Production operations

- Require code review and tests for high-impact changes, a rollback plan, verified deployment provenance and environment separation.
- Monitor authentication anomalies, privileged actions, unauthorized access attempts, notification failures and operational error rates without collecting secrets.
- Maintain an incident playbook: detect → contain → rotate/revoke → preserve evidence → restore → notify appropriately → postmortem. Assign a human incident owner and test the process.

## 4. Risk-based release gates

| Gate | Required before | Evidence to retain |
| --- | --- | --- |
| **P0 — no exceptions** | Real equipment/irrigation control, sensitive farm ownership or high-value financial mutations | Threat model, least-privilege/RLS tests, MFA & fresh-auth checks where relevant, safe-failure/override tests, audit trail, rollback/restore exercise and reviewed deployment |
| **P1 — before wider commercial launch** | Scaling accounts, collaboration and subscriptions | External or independent security review proportionate to risk, dependency/security scanning, login abuse testing, verified backup restores, alerting/incident drill, privacy and data-retention review |
| **Ongoing — every material release** | Any changed authorization, account, farm, provider, sensor or payment workflow | Abuse-case checklist, targeted negative tests, CI result, current environment verification and explicit record of residual risks |

If a P0 control is absent, **do not turn on the high-risk capability** as a workaround. Provide a read-only/dry-run path or defer the feature. A successful build, green CI or Vercel READY deployment **is not** a penetration test or physical-device acceptance.

## 5. Security work backlog — prioritize at the time of authorization

1. **Identity/session posture review:** audit current Supabase Auth configuration, breached-password checks, MFA/recovery, login limits and logout semantics. Distinguish provider defaults from app-specific guarantees.
2. **Cross-tenant/RLS and privilege review:** enumerate all databases, RPCs, storage, admin/support actions, farm sharing, API routes and realtime access; test isolation and revoked privilege behavior.
3. **Secrets and supply chain:** inventory scopes and rotation procedure without printing secret values; inspect Vercel, GitHub, Supabase functions, Resend and weather providers; dependency and build provenance checks.
4. **Backups, incident response and observability:** set recovery point/time objectives, demonstrate restore, define incident roles and actionable alerts.
5. **Threat model real-world automation** *before* devices are connected; follow with payment and AI authorization reviews as those features become real.

Track findings with **severity, reproducible evidence, owner, remediation and verification**. Do not assert “fully secure” based solely on code inspection.

## 6. Definition of Done for security-sensitive changes

- [ ] Data at risk, trust boundaries and plausible abuse paths identified.
- [ ] Authorization enforced on the server/provider, including ownership and revocation.
- [ ] Success, denial, cross-user and malformed-input tests added as relevant.
- [ ] Sensitive data absent from logs, emails, browser bundles and client-visible errors.
- [ ] Fail-safe/outage behavior defined for any effect on farms or devices.
- [ ] Audit, monitoring, rollback and restoration implications documented.
- [ ] Latest code and provider configuration verified; CI and production acceptance clearly distinguished.
- [ ] Remaining risks explicitly accepted by the authorized project owner, or feature deferred.

## 7. Stewardship

This policy is a **persistent project requirement**, not a single sprint task. Read it when planning Auth, collaboration, farm data, AI, irrigation, automation, sensors, admin tools, subscriptions or payments. Update its risk register and the relevant feature docs as the system evolves. Security controls must be proportional to the potential harm, with **higher assurance before higher-stakes capabilities go live**.

Owner request recorded 2026-10-27: `Security is a core product priority because real farm operations and users' capital will depend on AgroMind. Keep this requirement visible in documentation for future work.`
