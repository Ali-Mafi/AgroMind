# AgroMind Design System

Version: 1.0.0

---

# Design Philosophy

AgroMind is built for real farmers.

The interface must always feel:

- Clean
- Calm
- Professional
- Modern
- Friendly
- Easy to understand

Avoid unnecessary visual complexity.

---

# Design Principles

Every screen should answer three questions immediately:

1. Where am I?
2. What can I do?
3. What should I do next?

Never leave the user confused.

---

# Color Palette

Primary

Green

Purpose:

Agriculture

Growth

Success

---

Accent

Gold

Purpose:

Highlights

Premium Features

Important Information

---

Neutral

White

Light Gray

Dark Gray

Used for:

Backgrounds

Cards

Borders

Typography

---

# Typography

Prefer:

Geist

Hierarchy:

H1

H2

H3

Body

Caption

Maintain generous spacing.

Readable text is more important than decorative typography.

---

# Radius

Rounded interfaces.

Cards:

Large Radius

Buttons:

Medium Radius

Inputs:

Medium Radius

Consistency is more important than size.

---

# Spacing

Use generous whitespace.

Avoid crowded layouts.

Content should breathe.

---

# Cards

Cards are the primary UI building block.

Every card should include:

Clear hierarchy

Enough padding

Readable spacing

Subtle border

Soft shadow

---

# Icons

Use Lucide Icons.

Icons should communicate meaning.

Never use decorative icons without purpose.

---

# Buttons

Primary Button

Main action.

Secondary Button

Alternative action.

Ghost Button

Low priority.

Avoid more than one primary action per section.

---

# Animations

Animations should be:

Soft

Fast

Meaningful

Never distracting.

Purpose:

Improve feedback.

Improve perceived performance.

---

# Responsive Design

Mobile First.

Support:

Mobile

Tablet

Desktop

Large Desktop

Layouts should scale naturally.

---

# Accessibility

Maintain proper color contrast.

Support keyboard navigation.

Use semantic HTML.

Never rely on color alone to communicate meaning.

---

# Dashboard Style

Dashboard should feel:

Professional

Data-driven

Minimal

Focused

Avoid visual noise.

---

# Landing Page Style

Landing Page should communicate:

Trust

Innovation

Simplicity

Technology

without overwhelming users.

---

# Farm Dashboard

Every dashboard card should provide value immediately.

Users should never search for important information.

---

# Future Design Goals

Dark Mode

Charts

Maps

Sensor Widgets

Weather Widgets

AI Insights

without redesigning the overall visual language.

---

# UI Consistency Rule

If a new component does not visually fit with the existing system,

redesign the component,

never redesign the whole system.



# Brand Visual Language

AgroMind's primary visual identity is based on:

- Green
- Gold
- White

Green represents:

- Agriculture
- Growth
- Nature
- Success

Gold represents:

- Intelligence
- Premium Features
- Important Information
- Highlights

White and neutral colors provide:

- Clean backgrounds
- Readability
- Visual balance
- Professional appearance

The interface should visibly use the AgroMind brand palette.

A mostly white interface without meaningful Green and Gold usage should not be considered a completed implementation of the design system.

---

# Theme System

AgroMind must support three appearance modes:

- Light
- Dark
- System

System mode follows the user's operating system preference.

Dark Mode must use the same AgroMind visual language and brand identity.

Themes must be implemented through design tokens rather than component-specific colors.

Components should never hardcode theme-specific colors when a design token can be used.

---

# User Customization

Settings should provide user customization for supported visual and measurement preferences.

Initial preferences:

## Appearance

- Light
- Dark
- System

## Area Units

- Square meters (m²)
- Hectares (ha)

Additional preferences may be introduced later.

The settings architecture must be extensible and should not require rewriting existing components when new preferences are added.

---

# Select and Dropdown UX

Dropdowns, selects, menus, and popovers are part of the primary user experience.

They must:

- Match the AgroMind design system
- Have clear hover and selected states
- Have accessible keyboard navigation
- Have readable typography
- Have appropriate spacing
- Work well on touch devices
- Provide clear visual feedback
- Support Light and Dark themes

Native browser controls should not be used when they significantly reduce visual consistency or usability.

Reusable components should be preferred for custom select and menu experiences.

---

# Form UX

Forms must feel professional, simple, and predictable.

Inputs should have:

- Clear labels
- Helpful placeholders where appropriate
- Visible focus states
- Validation feedback
- Consistent spacing
- Consistent border radius
- Accessible interaction states

Multi-step forms should clearly communicate:

- Current step
- Completed steps
- Remaining steps
- Next action

---

# Product-Ready UI Rule

AgroMind is being developed as a real product.

Demo status is not an excuse for inconsistent visual design.

New UI should follow the design system from the moment it is created.

Do not intentionally create a temporary visual implementation when the production design can be implemented without significant additional complexity.

If a visual decision is expected to change later, prefer establishing the correct reusable foundation first.

---

# Property Type UI

UI components that represent agricultural properties should support both:

- Farm
- Garden

The visual language may adapt to the property type, but both must remain consistent with the AgroMind design system.

Avoid creating components that are permanently named or structured around only one property type.

---

# Naming in UI

User-facing examples and demo content should use generic names:

- My Farm
- My Garden

Avoid hardcoded location-specific demo names such as:

- Zaqeh Farm
- Caspian Farm

unless they are explicitly required for a real-world example.

This prevents unnecessary changes when AgroMind becomes a multi-user product.