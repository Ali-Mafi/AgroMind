# AgroMind Project Guide

Version: 1.0.0

---

# Vision

AgroMind is an AI-powered Smart Farming platform designed to help farmers manage their farms through intelligent software, automation, weather analysis, irrigation planning, sensor integration, and AI recommendations.

The goal is to build a production-ready SaaS platform, not a demo project.

---

# Mission

Create the simplest and most professional farming platform that anyone can use.

Even farmers with limited technical knowledge should be able to use AgroMind comfortably.

---

# Target Users

- Farmers
- Farm Owners
- Agricultural Engineers
- Irrigation Experts
- Contractors
- Agricultural Companies

---

# Product Principles

The product must always be:

- Simple
- Modern
- Fast
- Reliable
- Scalable
- Production Ready

Never sacrifice usability for visual complexity.

---

# Development Philosophy

Quality is always more important than speed.

Every feature should be designed for long-term scalability.

Avoid shortcuts that create technical debt.

---

# Long-Term Goal

AgroMind will eventually include:

- Authentication
- Farm Management
- Weather Intelligence
- Smart Irrigation
- AI Crop Assistant
- Reports
- Sensor Integration
- Notifications
- Offline Support
- Progressive Web App (PWA)
- Multi-language Support

---

# Current Development Stage

Sprint 1

Landing Page

Current focus:

- Build reusable architecture
- Establish design system
- Create production-ready components

---

# Folder Philosophy

Separate business logic from UI.

Keep components reusable.

Avoid duplicated code.

Prefer feature-based architecture.

---

# Farm Registration Philosophy

Farm registration must be simple.

The registration process will be multi-step.

Required:

- Farm Name
- GPS Location

Optional:

- Length
- Width

Farm area should be calculated automatically.

Maximum farms per account:

5

---

# UI Philosophy

The interface should feel:

- Calm
- Modern
- Clean
- Readable

Never overwhelm the user.

Large buttons.

Clear spacing.

Readable typography.

Minimal cognitive load.

---

# Design Inspiration

Inspired by products such as:

- Linear
- Stripe
- Notion
- Vercel

while maintaining a unique agricultural identity.

---

# Success Criteria

AgroMind should become software that farmers trust every day.

Every decision must improve:

- User Experience
- Maintainability
- Scalability
- Performance


# Property Types

AgroMind must support two primary agricultural property types:

- Farm
- Garden

The system must distinguish between these types from the beginning.

The architecture must not assume that every agricultural property is a traditional farm.

Business logic, forms, dashboards, and future AI features should be designed so that both property types can be supported without major architectural changes.

---

# Product Data Naming

AgroMind is a product, not a single user's farm.

Demo and seed data must use generic product-oriented names such as:

- My Farm
- My Garden
- Demo Farm
- Demo Garden

Avoid hardcoded personal or location-specific names such as:

- Zaqeh Farm
- Caspian Farm

unless the data is specifically intended as an example of a real location.

User-facing business data should be centralized whenever possible so that changing demo/default values does not require modifying multiple components.

---

# User Customization

AgroMind must provide user-level application customization through Settings.

The initial customization system should support:

## Appearance

- Light
- Dark
- System Default

System Default follows the user's operating system preference.

## Measurement Units

Area units should support:

- Square meters (m²)
- Hectares (ha)

The architecture must allow additional unit preferences to be added later without redesigning the settings system.

---

# Production-First Development

Even during the demo and MVP stages, features should be structured as if they will eventually connect to real backend data.

Avoid temporary UI decisions that would require major rewrites when backend services are introduced.

Demo data may be static, but:

- data structures should be realistic
- business entities should be reusable
- names should not be hardcoded inside UI components
- state ownership should be intentional
- components should remain reusable

The goal is to minimize future migration and technical debt.