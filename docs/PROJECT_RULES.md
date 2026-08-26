# AgroMind Project Rules

Version: 1.0.0
Last updated: 2026-08-26

---

## Purpose

This document defines the day-to-day engineering workflow for AgroMind.

AgroMind must be developed as a professional, production-ready application rather than a demo project. These rules complement the existing project documentation in `docs/01_PROJECT_GUIDE.md` through `docs/07_COMPONENT_STANDARDS.md`.

If a workflow rule here conflicts with an older workflow note, the latest explicit user-approved decision is the source of truth.

---

## 1. Start of Every Workday

Before implementing any new task, the AI must review the current GitHub repository state.

The review should include, as relevant:

- Repository root and current project structure
- Recent commits
- Files changed since the previous work session
- Existing documentation
- The feature files related to the next task
- Current types, context, services, hooks, components, and routes that may be affected

The AI must not assume that a file still matches an older conversation or cached version.

The repository is the primary technical source of truth.

---

## 2. Daily Progress Log

Every workday must have a progress file under:

`docs/progress/YYYY-MM-DD.md`

The daily log should record:

- Repository state reviewed
- Work completed
- Bugs fixed
- Architecture decisions
- Important implementation details
- Tests performed
- Relevant commits
- Current project status
- Next planned task

The daily log must be updated as meaningful milestones are completed.

---

## 3. One Step at a Time

Development must remain incremental.

Before each implementation step, the AI must explain:

- What will be changed
- Why the change is needed
- Which files are expected to be involved
- The proposed architecture or approach
- Important trade-offs or risks
- How the result will be tested

After explaining the step, the AI must wait for user approval before implementation when approval has not already been given.

After implementation, the AI must stop and wait for the user to confirm that the step is complete or provide an error.

Do not automatically continue into the next feature.

---

## 4. Error-First Rule

If an error is reported:

1. Stop new feature development.
2. Investigate the current implementation.
3. Fix the error at its root cause when reasonably possible.
4. Re-run the relevant quality checks.
5. Resume feature development only after the problem is confirmed resolved.

Avoid stacking new changes on top of a known broken state.

---

## 5. Production-First Engineering

Every feature must be designed for the future production application.

Prefer:

- Clear ownership of state
- Feature-based architecture
- Reusable components
- Explicit TypeScript types
- Small services and hooks with focused responsibilities
- Real loading, empty, and error states
- Accessible interactions
- Responsive layouts
- Theme compatibility
- Backend-ready data structures
- Maintainable code over short-term shortcuts

Avoid:

- Temporary hacks that create known technical debt
- Duplicate business logic
- Hardcoded user data
- Hidden coupling between unrelated features
- Large page components containing reusable business logic
- `any` unless there is a documented exceptional reason

---

## 6. Application Data vs Demo Data

The real AgroMind application must not depend on demo business data.

Demo/example data is allowed only in marketing or demonstration surfaces such as the Landing Page.

Actual application areas such as:

- Farms
- Farm Selector
- Dashboard
- Weather
- Irrigation
- AI recommendations
- Reports
- Settings tied to user data

must use real user-created or real persisted data.

When no real data exists, the application should show a purposeful empty state instead of silently inserting demo entities.

---

## 7. Architecture Direction

Prefer the following data flow where appropriate:

`UI -> hooks/context -> services -> API/data source`

Feature logic should live under its owning feature whenever practical.

Example:

`features/weather/`

- `components/`
- `hooks/`
- `services/`
- `types/`
- `utils/`

Pages should primarily compose features rather than contain duplicated feature logic.

---

## 8. Quality Gate

After a meaningful implementation step, run at minimum:

```bash
npm run lint
npm run build
```

When the feature has user interaction or persistence, also perform a focused functional test.

Examples:

- Create -> Refresh -> Verify persistence
- Edit -> Refresh -> Verify saved values
- Delete -> Verify redirect and persistence
- Change farm -> Verify dependent data updates
- Missing location -> Verify empty state
- API failure -> Verify error state

A step is not considered complete only because it visually works once.

---

## 9. Git and Repository Workflow

Use small, meaningful commits.

Commit messages should describe the actual outcome, for example:

- `fix: preserve farms across refresh`
- `feat(weather): add farm weather dashboard`
- `refactor(farms): remove demo farms from app state`

Before editing a repository file, fetch its current version when there is any chance it changed since the last review.

Do not overwrite newer user work with an older copy from the conversation.

---

## 10. UI and UX Standard

A feature is not complete merely because it functions.

Review:

- Desktop layout
- Mobile layout
- Tablet behavior where relevant
- Light theme
- Dark theme
- Empty state
- Loading state
- Error state
- Keyboard/focus behavior where applicable
- Clear wording
- Visual consistency with the AgroMind design system

The interface should remain calm, modern, readable, and agricultural without becoming visually noisy.

---

## 11. Decision Logging

Important architectural decisions must be documented in the daily progress log.

Examples:

- Moving state ownership
- Introducing a new service layer
- Changing persistence strategy
- Adding a new external API
- Changing entity types
- Removing demo data from production flows

The reason for the decision matters as much as the final code.

---

## 12. Session Continuity

At the start of a future work session, use the repository documentation and latest daily progress log to reconstruct the exact project state before proceeding.

Do not rely only on conversational memory for technical facts that can be verified from the repository.

The combination of Git history, project docs, and daily progress logs is the persistent project memory for AgroMind.
