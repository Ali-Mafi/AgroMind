# 🌱 AgroMind Master Document

Version: 0.1
Status: Planning & Architecture
Last Updated: 2026-08-02

---

# 1. Vision

AgroMind is an AI-powered Smart Farming Platform.

هدف پروژه ساخت یک پلتفرم هوشمند کشاورزی است که مدیریت مزرعه، تحلیل داده‌ها، هوش مصنوعی، آب‌وهوا، آبیاری و سنسورها را در یک محیط ساده و حرفه‌ای در اختیار کشاورزان قرار دهد.

---

# 2. Mission

کمک به کشاورزان برای تصمیم‌گیری بهتر، افزایش بهره‌وری و کاهش مصرف آب با استفاده از هوش مصنوعی.

---

# 3. Core Principles

- Simplicity First
- AI First
- Mobile First
- Data Driven
- Professional UI
- High Performance
- Scalable Architecture

---

# 4. Target Users

Version 1

- Farmers
- Farm Owners
- Agricultural Engineers
- Contractors
- Greenhouses

Future

- Agricultural Companies
- Cooperatives
- Universities
- Government Organizations

---

# 5. Technology Stack

Framework

- Next.js 16

Language

- TypeScript

UI

- Tailwind CSS v4
- shadcn/ui

Icons

- Lucide

Version Control

- Git
- GitHub

---

# 6. UI Philosophy

Minimal

Modern

Professional

White Space

Large Cards

Large Radius

Smooth Animations

---

# 7. Brand Identity

Main Color

Green

Accent

Gold

Information

Blue

Background

White

Style

Nature + Technology + AI

---

# 8. UX Rules

کاربر نباید گیج شود.

هر صفحه باید در کمتر از 5 ثانیه قابل فهم باشد.

ابتدا Action سپس Data نمایش داده شود.

AI همیشه نقش دستیار داشته باشد.

---

# 9. Navigation

Desktop

Sidebar

Mobile

Bottom Navigation

Dashboard

Farms

Add

Reports

Profile

---

# 10. MVP Features

Authentication

Dashboard

Farm Registration

Farm Management

Weather

Irrigation

Crop Management

AI Recommendation

Notifications

Profile

---

# 11. Farm Registration

ثبت مزرعه به صورت Wizard چند مرحله‌ای.

Location اجباری است.

Length و Width اختیاری است.

اگر طول و عرض وارد شد:

Area به صورت خودکار محاسبه شود.

حداکثر 5 مزرعه برای هر کاربر.

---

# 12. Future Features

IoT Sensors

Satellite Data

Drone Support

Marketplace

Team Roles

Farm Ownership Verification

AI Chat

Disease Detection

---

# 13. Farm Ownership Verification

Status

Future Feature

فعلاً پیاده‌سازی نمی‌شود.

بعداً سیستم احراز مالکیت مزرعه طراحی خواهد شد.

---

# 14. Dashboard Philosophy

Dashboard فقط اطلاعات نمایش نمی‌دهد.

Dashboard تصمیم‌گیری می‌کند.

نمونه:

امروز آبیاری انجام بده.

امروز سمپاشی نکن.

بارندگی فردا.

باد شدید.

---

# 15. AI Philosophy

AI فقط ChatBot نیست.

AI باید در تمام صفحات حضور داشته باشد.

Weather

Irrigation

Reports

Farm

Timeline

---

# 16. Timeline

هر مزرعه Timeline اختصاصی خواهد داشت.

ثبت:

کشت

آبیاری

کود

سم

برداشت

آفات

بازدید

---

# 17. Long-term Goal

AgroMind تبدیل شود به کامل‌ترین پلتفرم مدیریت کشاورزی هوشمند در منطقه.

---

# 18. Development Rules

هر Feature ابتدا طراحی می‌شود.

سپس مستند می‌شود.

سپس پیاده‌سازی می‌شود.

هر مرحله Commit خواهد شد.

هیچ Feature بدون بررسی Merge نمی‌شود.

---

# 19. Current Sprint

Sprint 1

Product Design

Current Status

Design System






# Progress

# Step 004 - Navbar

## Completed
- Created reusable Navbar component
- Added AppContainer
- Connected APP constants
- Connected NAVIGATION constants
- Replaced default Next.js page

## Status
✅ Completed

## Next Step
Build Hero Section

## Weather current-data update — 2026-09-07

- Added a server-side `/api/weather` route and optional `WEATHERAPI_API_KEY` configuration.
- WeatherAPI supplies the complete current report when configured; Open-Meteo hourly/daily forecasts retain explicit source labels.
- Normalized provider-native condition codes separately and retained the provider's condition text.
- Added visible-page refresh every five minutes, manual refresh, cancellation on location changes, and retention of the last report during connection failures.
- Show provider report/valid time in the farm timezone, explicit model fallback, and old-report status. Do not invent precipitation accumulation periods.
- Preserved the earlier static-background and rain performance work.
- Validation: 16 targeted tests, TypeScript, scoped lint and a successful production build. Live WeatherAPI credentials and farm-level accuracy remain unverified.
- Setup: `docs/weather-realtime-setup.md`.
- Next task: configure the user's API key and compare a report for the farm against local conditions at the same time.

## Unified weather source and Now card — 2026-09-07

- Replaced the mixed-provider request with WeatherAPI `forecast.json?days=3`, which supplies current, hourly and daily weather together.
- The highlighted Now card uses the exact same current report as the hero; upcoming cards begin after the current time and retain their forecast values.
- Daily totals, high/low temperatures and all condition labels now use the selected provider consistently. Missing measurements remain unknown; rain/snow probability labels retain their meaning.
- A failed primary request switches the complete weather dataset to Open-Meteo with an explicit source message.
- Validation: 21 targeted tests, TypeScript, scoped lint and production build. Live validation against the user's API account remains outstanding.
- Next task: install this update with the existing API key and verify the source label and Now card in the user's running app.


## Step 005 — Full-screen farm weather experience — 2026-09-08

### Completed work

- Replaced the bounded weather hero route with an atmospheric full-viewport experience inspired by the supplied iPhone reference, retaining AgroMind farm/garden navigation.
- Added an hourly strip, daily temperature ranges, a farm-location sheet and eight agricultural weather cards. UV and visibility are not primary cards; cloud cover is available in details.
- Added lazily loaded metric/day details with interactive SVG charts, keyboard hour selection and exact-value tables. Forecasts and the current report remain distinct; missing values remain unknown.
- Kept current, hourly and daily weather with one provider. Added an optional bounded WEATHERAPI_FORECAST_DAYS setting, defaulting to three, with no fabricated extra days.
- Preserved the daily precipitation forecast separately from the current amount and its known/unknown accumulation period. A measured daily total is explicitly unavailable without observations.
- Aligned night-temperature charts with the overnight card across midnight, and advanced report age during offline checks without rewriting the provider timestamp.
- Reused existing background asset mappings with WebP preference, weather-appropriate image fallback and no clear-sky fallback for rain/storms.
- Added bounded canvas rain/snow/hail and gentle storm illumination, reduced-motion and visibility handling, a saved animation toggle, and suspension while detail sheets are open. No per-frame React rendering or per-card live backdrop blur.
- Exposed the existing farm hydration status to prevent a premature empty-farm screen.

### Status

Implementation complete. Thirty-two focused tests, TypeScript and production build passed. Browser visual QA, device FPS and live WeatherAPI account/local forecast accuracy remain unverified. No deployment or external push was performed.

### Next task

Install the cumulative replacement ZIP in the user's existing VS Code checkout and review Weather with their existing API key and background images. Setup: docs/weather-realtime-setup.md.

## Step 006 — Weather continuation and repository reconciliation — 2026-09-09

- Inspected the existing main branch, all pending edits and the three local weather commits before changing code. Fetched and merged the newer upstream farm/dashboard changes and WebP assets; retained the completed Weather experience and pre-existing uncommitted optimization work.
- Fixed reconnect races in background refresh, including reconnecting while hidden. Old aborted responses cannot overwrite the latest state.
- Aligned farm-detail precipitation with the immersive dashboard's full local-day forecast total, preserving unknown/expired values and the distinction from current accumulation.
- Added animation lifecycle/draw-budget tests, API/FPS diagnostic scripts and reproducible test/typecheck commands.
- Validation: 38 tests, full-repository lint and production build passed. The initial browser flow and local test-farm creation worked. The preview then stopped; browser chart interaction and target-device FPS remain unverified. The real Open-Meteo adapter request timed out; the user's WeatherAPI key was unavailable.
- Detailed evidence and external reproduction steps: `docs/weather-verification-2026-09-09.md` and `docs/weather-realtime-setup.md`.
- Remaining external validation: run the committed API check with the configured WeatherAPI account and collect FPS on the target device. No claim of live accuracy or measured FPS is made.
