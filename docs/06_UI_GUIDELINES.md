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

AgroMind is not a marketing website.

AgroMind is a professional SaaS platform for Smart Agriculture.

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

Use AppContainer for every page.

Maximum width remains consistent.

Every section has generous spacing.

Sections breathe.

---

# Section Rules

Every landing section must use the reusable Section component.

Section controls:

• title
• subtitle
• alignment
• spacing
• variant

No duplicated section layouts.

---

# Hero Rules

Hero contains only:

• Badge
• Heading
• Subtitle
• CTA Buttons
• Dashboard Widget

Nothing else.

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

No implementation before design approval.

---

# Golden Rule

If a new component does not look like it belongs to AgroMind,
it should be redesigned before implementation.