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

---

## Future architecture boundaries — approved roadmap 2026-10-30

The seven-phase [Roadmap](ROADMAP.md) establishes **intended capability boundaries**, not already existing modules, services, database tables or provider integrations. Keep the current feature-based architecture; make concrete design changes only through separately reviewed phase plans.

- **Agricultural data layer (planned extension):** canonical farm/garden identity, ownership/RLS, permissions, agronomic inputs, weather provider/source/time provenance, irrigation history and later geo/sensor event schemas. Validate tenant scope and data quality at ingestion; never invent unknown observations.
- **Intelligence layer (planned):** deterministic, testable weather/irrigation calculations and a separate constrained AI orchestration service. AI context retrieval must honor the same database authorization boundaries as ordinary UI. Advice should carry source, timestamp, assumptions and uncertainty. No AI-controlled actuator path.
- **Experience layer (planned):** localized source-aware alerts, charts, decision explanations and safe manual overrides in the existing responsive Dashboard/PWA. Reuse design tokens and accessible navigation.
- **Commercial layer (planned):** one server-authoritative entitlement model and verifiable, idempotent payment/provider events; never grant premium solely on a browser redirect.
- **Geospatial layer (planned):** permissioned field boundaries, dated satellite metadata, provider attribution, imagery licensing and uncertainty about NDVI/vegetation interpretations.
- **Device control boundary (planned):** separate authenticated sensor ingestion from remote actuation. Hardware fail-safes, explicit roles and independent deterministic interlocks are required before permitting valve/pump commands, including during connectivity or power failures.
- **Platform operations:** rate limiting, auditing, observability, feature flags, retention, tested migrations and incident recovery are cross-cutting gates; keep native provider limitations visible rather than claiming app-only controls enforce them.

**Security gate:** [Draft PR #52](https://github.com/Ali-Mafi/AgroMind/pull/52) remains NO-GO on 2026-10-30 pending F01/F02 assessment and hosted acceptance. Architecture planning does not authorize its merge or production release.
