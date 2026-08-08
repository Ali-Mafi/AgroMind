# AgroMind Component Standards

Version: 1.0

---

# Purpose

This document defines how every component inside AgroMind should be built.

The goal is consistency, readability and scalability.

Every component must follow these standards.

---

# Folder Structure

Feature components

features/<feature>/components/

Shared components

components/

Layout components

components/layout/

UI primitives

components/ui/

---

# Component Rules

One component = One responsibility.

Components should stay small.

Avoid components longer than ~200 lines whenever possible.

Split large components into smaller reusable pieces.

---

# Naming

Use PascalCase.

Examples

Navbar

Hero

FeatureHighlights

FarmStatusCard

DashboardWidget

---

# File Naming

Component

hero.tsx

Type

hero.types.ts

Constants

hero.constants.ts

Hook

use-hero.ts

---

# Props

Always define interfaces.

Never use any.

Example

interface HeroProps {}

---

# Data Flow

Data

↓

Constants

↓

Component

↓

Render

Never hardcode business data.

---

# Constants

Texts

Numbers

Labels

Configuration

belong inside constants.

---

# Types

Every reusable component has its own types file when props become non-trivial.

Keep shared types inside types/.

---

# Styling

Use Tailwind only.

Avoid inline styles.

Prefer Design Tokens.

Never hardcode colors if tokens exist.

---

# Layout

Use AppContainer.

Use Section.

Reuse spacing.

Never duplicate layouts.

---

# Icons

Lucide React only.

Keep icon sizes consistent.

---

# Buttons

Always reuse Button component.

Never recreate buttons manually.

---

# Cards

Reuse shared Card when possible.

Don't duplicate card styles.

---

# Imports

Order:

1. React / Next
2. Libraries
3. Shared Components
4. Feature Components
5. Constants
6. Types
7. Styles

---

# Comments

Avoid unnecessary comments.

Good naming is better than comments.

---

# Reusability

Before creating a component ask:

Can another page reuse this?

If yes

Move it to shared components.

---

# Performance

Avoid unnecessary re-renders.

Keep props minimal.

---

# Accessibility

Semantic HTML.

Keyboard accessible.

Visible focus.

Proper labels.

---

# Documentation

Every Sprint updates:

05_MASTER_PROGRESS.md

Every new reusable component should be documented.

---

# Golden Rule

A component should be easy to:

Read

Reuse

Maintain

Extend