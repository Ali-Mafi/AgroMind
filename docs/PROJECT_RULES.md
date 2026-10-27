# AgroMind Project Rules

Version: 2.0.0  
Updated: 2026-10-25

## Authority and continuity

- The user's latest explicit request defines scope. A read-only audit does not authorize code edits, releases, billing, schema changes or account operations.
- The **actual current repository/branch and production SHA** are the technical source of truth. Do not substitute older chat notes, stale planning milestones or archived progress for inspected code.
- This file is the **canonical active workflow policy**. It supersedes conflicting approval, testing and documentation instructions in `01_*`–`07_*`, the historical `AgroMind_Master_Document.md` and dated reports, unless the user gives a new explicit instruction.
- Use [Master Progress](05_MASTER_PROGRESS.md) for current evidence, [Roadmap](ROADMAP.md) for priorities and [daily progress](progress/README.md) for historical checkpoints.
- Continue from the last verified state; do not repeat completed refactors, audits or redesigns without a technical reason.

## Scoped end-to-end execution

- For multi-step tasks, give a concise plan and identify important risks; inspect **relevant** live files first.
- When the user approves a full task, finish its ordinary dependent steps without asking for "Done" after each file or substep. Stop and ask only for meaningful out-of-scope, destructive, costly, irreversible or security-critical decisions.
- Prefer minimal, reviewable changes to sweeping refactors. Do not mix unrelated product changes into documentation or bug-fix work.
- Handle reported regressions at the root cause before dependent feature additions. FAST MODE means less redundant narration, **not** skipped tests or safety checks.
- Never promise background work; make clear what completed and what remains unverified.

## Security and architecture

- **Security-first product requirement:** Farm operations and users' capital may depend on AgroMind. Treat security, operational safety and recoverability as release gates, not optional polish. Follow [Security-First Policy](SECURITY_FIRST.md) for threat modeling, risk levels and future work. This document is a requirement, not authorization for unrequested production changes.
- Current stack: Next.js 16 App Router, React 19, TypeScript, feature-based architecture; inspect `AGENTS.md` and installed framework docs for version-specific API conventions.
- Keep route files thin, feature logic in its owning feature, secrets and sensitive mutations server-side. Maintain Supabase ownership, RLS, MFA, entitlements and account isolation.
- Never expose credentials, environment variable **values**, exact private locations or account data in commits, logs or reports. Reading non-secret variable names is not a live provider test.
- App areas use real persisted user data; label illustrations and marketing sample readings. Preserve localization, RTL, region/unit settings, accessibility, Light/Dark/System themes and reduced-motion support.
- Do not fabricate AI, sensors, weather observations, successful checkouts or working third-party badges.

## Quality and evidence

For relevant code changes, use the CI-equivalent scripts:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run test:db:native
npm run localization:check
npm run build
npm run test:http
```

- GitHub's existing Foundation checks are the authoritative repository CI gate. Run all feasible local checks; disclose environment barriers instead of claiming tests passed.
- Documentation-only work: validate markdown, link targets and diffs; then check CI on the **new** commit.
- UI/browser and external services also need real flow verification. "CI green", "Vercel READY", "implemented" and "verified on physical iPhone" describe different evidence levels.
- Note the tested SHA/environment and mark outcomes **implemented**, **verified**, **blocked** or **not tested**.
- Never suppress or delete tests solely to get green CI.

## Git and production boundaries

- Confirm the current branch head before writing; preserve concurrent user work. Use meaningful commits and PRs for risky/broad changes.
- Low-risk documentation-only updates may go straight to `main` when explicitly requested. Never force-push a stale branch or rewrite history.
- When production is in scope, match intended commit and deployed commit; check Vercel domain separately from build status.
- An inspection request alone never authorizes a new deployment, rollback, database migration, external paid resource or environment change. Follow the user's requested scope.

## Progress documentation

- Log meaningful sessions in `docs/progress/YYYY-MM-DD.md`: starting SHA, work and reasons, changed files, test results and limitations, status and next action.
- Update [progress index](progress/README.md) for actual logs; maintain the **current snapshot** in [05_MASTER_PROGRESS.md](05_MASTER_PROGRESS.md) and only update [ROADMAP.md](ROADMAP.md) when priorities or facts change.
- Preserve old logs as historical observations; never silently relabel outdated "next steps" or provider-state claims as current facts.
- Finish with commit SHA, changed paths, CI/test outcome, deployment status if checked, and any remaining blockers.

## Product/UI discipline

Prefer the existing minimal, calm green/gold design, responsive and accessible controls, explicit loading/empty/error states, native-safe viewport handling and measured performance. Avoid unnecessary rebuilding. A feature is not user-ready simply because its draft surface renders.
