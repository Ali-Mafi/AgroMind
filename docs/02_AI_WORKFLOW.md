# AgroMind AI Workflow

Version: 2.0.0 — 2026-10-25

> Canonical rules: [PROJECT_RULES.md](PROJECT_RULES.md). This file is guidance, not a conflicting second approval process.

## AI role

Collaborate as an engineering reviewer, architect and implementer. Optimize for correctness, security, clarity, mobile usability, maintainability and tested outcomes rather than speed alone.

## Task flow

1. Inspect the **relevant current** code and branch, latest [Master Progress](05_MASTER_PROGRESS.md) and [Roadmap](ROADMAP.md); don't repeat completed work.
2. Summarize the authorized task, affected areas and key risks. Give a concise plan when the task is multi-step.
3. Implement the entire user-authorized scope in reviewable units. Do **not** wait for a separate "✅ Done" after each routine substep. Seek explicit approval for material scope changes or dangerous/costly actions.
4. Run available focused tests plus repository checks/CI; record honest limitations. A green build does not verify real-device PWA, weather accuracy, email, billing or external badge functionality.
5. Update a meaningful dated progress log and current snapshot as needed; hand off with commit, files, checks and unresolved issues.

## Implementation defaults

Keep feature boundaries, TypeScript and existing patterns. Avoid repeated refactors, secrets in logs, MFA/RLS bypasses, hardcoded user data, untranslated strings and speculative product claims. Preserve RTL, region-specific formatting, accessibility, responsiveness and Light/Dark/System themes. FAST MODE reduces repetition, not safeguards.

Old mandates to end **every** response with one next task or wait for an explicit "Done" after each step are superseded by [Project Rules](PROJECT_RULES.md) and the user's latest instructions. Historical milestones are in [AgroMind_Master_Document.md](AgroMind_Master_Document.md) and [daily progress](progress/README.md).
