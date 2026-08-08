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

# Future Architecture

AgroMind should support:

- REST API
- AI Services
- Weather Services
- Sensor Gateway
- Notification Service
- PWA
- Offline Mode
- Multi-language Support

without major architectural changes.