# AgroMind UI Guidelines

Version: 1.0

---

# Purpose

This document defines the official UI language of AgroMind.

Every component must follow these rules before implementation.

Design decisions must never be made randomly.

Consistency is more important than creativity.

---

# Design Philosophy

AgroMind is a professional SaaS platform for Smart Agriculture **with a public marketing Landing Page**. Product data must not be confused with its illustrative marketing previews.

Every screen should communicate:

• Professional
• Clean
• Modern
• Natural
• Intelligent

Avoid unnecessary decoration.

Everything must have a purpose.

---

# Visual Principles

Hierarchy over decoration.

Whitespace over crowded layouts.

Content first.

Minimal but premium.

Consistency everywhere.

---

# Layout Rules

Use shared containers and consistent width tokens where appropriate. Full-viewport Dashboard, Weather and PWA experiences may own safe-area and immersive layouts rather than being forced into AppContainer.

Every section has generous spacing.

Sections breathe.

---

# Section Rules

Reuse the Section abstraction when it fits the active Landing structure. Feature-owned sections can have intentional scoped layouts; do not rewrite functioning sections solely to fit an obsolete component template.

---

# Hero Rules

Hero must express value, context and a clear action; supporting content can evolve with the current Landing implementation. An old five-item mockup is not a fixed structural contract.

Hero is the visual focus of the page.

---

# Widget Rules

Every widget follows the same structure.

Header

↓

Divider

↓

Content

↓

Footer (optional)

Widgets never contain random spacing.

Everything aligns to a grid.

---

# Card Rules

Cards use consistent:

Border Radius

Padding

Border

Background

Spacing

Cards should feel lightweight.

No heavy shadows.

---

# Radius

Default

rounded-2xl

Small

rounded-xl

Large

rounded-3xl

Do not mix many radius values.

---

# Shadows

Use soft shadows only.

Shadows provide depth.

Never use aggressive shadows.

---

# Grid

Desktop

Two-column layouts when appropriate.

Tablet

Adapt gracefully.

Mobile

Everything stacks vertically.

---

# Typography

Heading

Manrope

Body

Inter

Mono

Geist Mono

Hierarchy must be respected.

H1

Largest

↓

H2

↓

H3

↓

Body

↓

Caption

---

# Colors

Primary

#2E7D32

Accent

#4CAF50

Background

#FAFCFA

Foreground

Use Design System tokens.

Never hardcode colors.

---

# Buttons

Primary button

Filled

Brand Green

Secondary button

Outline

Never use more than two CTA buttons.

---

# Icons

Use Lucide React.

Keep icon size consistent.

Icons support content.

Icons never replace content.

---

# Dashboard Widgets

Dashboard widgets should be reusable.

The Landing Hero widget becomes a real dashboard widget later.

Never build throwaway UI.

---

# Component Philosophy

Every component must be one of:

Reusable

Feature-specific

Temporary Placeholder

If a component can be reused,
place it in shared components.

---

# Constants

Texts belong inside constants.

Never hardcode UI text inside components.

Components only render data.

---

# Spacing

Prefer generous spacing.

Avoid compressed layouts.

Consistency is mandatory.

---

# Animations

Animations should support usability.

No unnecessary movement.

Subtle is better.

---

# Responsive Design

Mobile-first.

Every new component must be checked on:

Mobile

Tablet

Desktop

---

# Accessibility

Use semantic HTML.

Buttons are buttons.

Links are links.

Provide visible focus states.

Maintain proper color contrast.

---

# Development Workflow

Design Review

↓

Approval

↓

Implementation

↓

Review

↓

Documentation

The user's approval of a full task authorizes its normal implementation steps. Request separate design approval for material new directions or full redesigns, not small authorized fixes. Follow [Project Rules](PROJECT_RULES.md).

---

# Golden Rule

If a new component does not look like it belongs to AgroMind,
it should be redesigned before implementation.
