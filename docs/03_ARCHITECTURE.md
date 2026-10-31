# AgroMind Architecture

Version: 1.0.0

---

# Architecture Style

AgroMind follows a Feature-Based Architecture.

The project must remain modular, scalable, and easy to maintain.

---

# Folder Structure

app/

components/

features/

constants/

lib/

types/

public/

---

# Responsibilities

## app/

Application routing only.

No business logic.

---

## components/

Reusable UI components shared across multiple features.

Examples:

- Button
- Navbar
- AppContainer
- FarmStatusCard

Components must not contain business logic.

---

## features/

Each feature owns its own:

- components
- constants
- data
- hooks
- services
- types

Example:

features/

landing/

dashboard/

farms/

weather/

authentication/

---

## constants/

Application-wide constants.

Example:

APP

NAVIGATION

LIMITS

ROUTES

---

## lib/

Shared helper utilities.

Examples:

cn()

formatDate()

formatArea()

---

## types/

Shared global TypeScript types.

Feature-specific types should remain inside the feature.

---

# Component Architecture

Every reusable component should follow this structure whenever appropriate:

component-name/

index.tsx

types.ts

constants.ts

helpers.ts

Only create additional files when necessary.

Avoid unnecessary complexity.

---

# Data Flow

API

↓

Feature

↓

Business Components

↓

UI Components

↓

User

Business components should never directly fetch data.

---

# State Management

Prefer local state.

Introduce global state only when necessary.

Avoid premature optimization.

---

# Reusability

Every component should answer:

Can another page reuse this?

If yes:

Move it into components.

If no:

Keep it inside its feature.

---

# Naming

Prefer business names.

Good:

FeatureHighlights

FarmStatusCard

WeatherOverview

Bad:

GreenCard

BigSection

TopBoxes

---

# TypeScript

Avoid any.

Use explicit interfaces.

Separate reusable types.

Prefer Props interfaces.

---

# Styling

Use Tailwind CSS.

Use Design Tokens.

Avoid inline styles.

Avoid duplicated utility groups when reusable components can solve the problem.

---

# Business Logic

Never mix business logic with presentation.

Business rules belong inside features.

Presentation belongs inside reusable components.

---

# Scalability

Always think one step ahead.

Before creating a new file ask:

Will this still make sense when the project is 10x larger?

If the answer is no,

redesign before implementation.

---

# Performance

Prefer Server Components when possible.

Use Client Components only when interaction is required.

Avoid unnecessary re-renders.

Lazy-load heavy features when appropriate.

---

# Testing Philosophy

Build components that are easy to test.

Pure components are preferred over stateful components.

---

# Implemented and planned services — 2026-10-25

Already integrated: App Router/API handlers, Supabase SSR authentication and cloud data, weather providers, localized PWA and offline fallback. Extend these actual boundaries rather than rebuilding them. Real AI chat and device/sensor gateways, advanced analytics and paid checkout remain planned or unverified.

See [current progress](05_MASTER_PROGRESS.md) and [workflow rules](PROJECT_RULES.md).

## Support service — 2026-10-26

`features/support` owns schemas, server actions, user/staff presentation and the notification worker. Existing Account Help hosts creation/list entry points; thin routes serve ticket details and `/admin/support`. Authenticated SSR clients call invoker RPCs backed by private transactional implementations. Public ticket/message tables have read-only customer grants plus RLS; private registry, command receipts, audit, read receipts and email outbox are never exposed to customers. Role authority is independent of farm membership and requires AAL2; staff writes also require recent TOTP proof. Notification jobs are committed with mutations and drained separately through the existing Resend transport. See [Support Tickets](SUPPORT_TICKETS.md) for limits, bootstrap, recovery and unconfigured operations.

## Account-session security candidate (2026-10-28)

`features/account-security` owns server session observation, remote-revocation orchestration, security email content, types and the session/history panel. It extends the existing Auth services, account settings shell/MFA dialog and shared durable outbox. See [Account Sessions](ACCOUNT_SESSIONS.md) for trust boundaries, RLS enforcement and release gates.

## PR #52 remediation (2026-10-29)

Credential grants now protect password changes/recovery and the database username mutation; username audit is atomic. Pending native revocation is reconciled without native writes, and a new login plus fresh TOTP is required for another logout attempt. The shared outbox freezes complete payloads before sending. See [remediation and unresolved provider boundary](SECURITY_REMEDIATION_PR52.md). Not released.
