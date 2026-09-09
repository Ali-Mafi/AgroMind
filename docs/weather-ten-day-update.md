# Weather follow-up — 2026-09-09

Base: `0269b88d1fc71f92166c8eb69b56cd0282b24b51`, clean `main`.
This update preserves the completed dashboard, refresh lifecycle, WebP assets and earlier rainfall fixes.

## Requested changes

- The hero's location line uses the farm's saved location, above its existing name. Empty text falls back to coordinates.
- The default forecast contains three WeatherAPI days followed by seven Open-Meteo days. Primary days are never overwritten. Each day's hours, totals, temperature range and chart retain that day's source. If WeatherAPI supplies ten days itself, the extension request is skipped.
- Sources appear on daily rows, selected chart readings and value tables. Overnight charts use absolute times and break their line at a provider boundary.
- The farm-list button reads **Add farm**.
- Detail sheets enter and leave with a vertical transform and opacity animation. They remain modal until exit completes, then restore scrolling and focus. Interrupted entry, navigation, Escape, repeated close actions and reduced motion are handled.
- Desktop rendering isolates the fixed background and canvas, keeps scrollbar space stable during dialogs, and memoizes forecast/cards and selected-day chart data. The canvas backing buffer is capped at approximately 900,000 pixels instead of 1.4 million. Heavy rain keeps its 320-drop desktop cap; strokes remain visible at the reduced buffer resolution. This is a draw-budget reduction, not a measured FPS improvement.

## Data and failure behavior

Current and Now still use the same WeatherAPI report. A failed extension retains the valid primary report and available days, with an explicit limited-horizon message. A failed primary request still falls back with the full dataset to Open-Meteo.

The ten-day window uses the farm's calendar. Open-Meteo is requested in that timezone with Unix timestamps, preserving absolute hourly spacing across half-hour offsets and daylight-saving changes. The extension is cached for 30 minutes, has a four-second timeout, and includes the calendar date range in its cache key to avoid retaining yesterday's horizon after midnight. Live current/fallback requests remain uncached.

Today's precipitation remains the provider's full local-day forecast. It is not substituted with the current accumulation, a measured daily total, or a value from the extension provider. Missing future days are not fabricated.

## Verification

- 48 tests passed: provider parsing and fallback, 3+7-day merge, preservation of primary rainfall and Now, day/hour/chart provenance, midnight, DST, cache date boundaries, refresh races, dense rain, and modal animation lifecycle.
- Repository lint and TypeScript checks passed; production build passed for all 12 routes.
- Browser: desktop Weather empty state, Add farm link, native dialog, stable scrollbar gutter, Escape dismissal and restored opener focus verified. The initial navigation timed out, but the page subsequently loaded; the supervised preview remained running.
- Live Open-Meteo adapter check returned provider/network unavailable. No WeatherAPI key was configured here. Combined live API responses, charts with live data and target-device FPS could not be verified. No FPS or local weather accuracy claim is made.

For account/device checks, use `scripts/check-weather-api.mjs --provider=auto` with the locally configured key and `scripts/measure-weather-fps.js` on the production Weather page. The API checker now verifies per-day/hour provenance and absolute timestamps and prints the source of each day.

## Main changed areas

- `features/weather/services/`: primary report plus bounded forecast extension; source tagging and Unix timestamp parsing.
- `features/weather/lib/`: calendar merge, provider-aware chart presentation, modal animation lifecycle.
- `features/weather/components/`: hero location, daily rows, detail charts/tables, farm button, sheets and desktop rendering.
- `features/weather/types/`: forecast provenance and extension status.
- `features/weather/tests/`: data integration, animation lifecycle and desktop pixel budget.
- `scripts/check-weather-api.mjs` and weather setup/progress documentation.
