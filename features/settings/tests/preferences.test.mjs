import test from "node:test";
import assert from "node:assert/strict";
import { loadTs, localRequire } from "../../weather/tests/helpers/load-ts.mjs";
import { localizedRenderer } from "./helpers/render.mjs";

const { DEFAULT_PREFERENCES, resolvePreferences, parsePreferences, countryFromLocale } = loadTs("features/settings/lib/preferences.ts");
const { createFormatters, fromCanonical, toCanonical, parseLocalizedNumber } = loadTs("features/settings/lib/units.ts");
const { METRIC_UNITS, US_UNITS } = loadTs("features/settings/constants/region-profiles.ts");
const resolve = (overrides) => resolvePreferences({ ...DEFAULT_PREFERENCES, ...overrides });

test("region defaults, language and explicit unit choices stay independent", () => {
  const iran = resolve({ country: "IR" });
  assert.equal(iran.language, "fa"); assert.equal(iran.direction, "rtl");
  assert.equal(iran.calendar, "persian"); assert.deepEqual(iran.units, METRIC_UNITS);
  const us = resolve({ country: "US" });
  assert.equal(us.language, "en"); assert.deepEqual(us.units, US_UNITS);
  const explicit = { country: "IR", language: "en", units: { ...DEFAULT_PREFERENCES.units, area: "sqm", wind: "kmh" } };
  const before = resolve(explicit);
  const after = resolve({ ...explicit, country: "US" });
  assert.equal(before.direction, "ltr"); assert.equal(before.units.temperature, "celsius");
  assert.equal(after.units.temperature, "fahrenheit"); assert.equal(after.units.area, "sqm"); assert.equal(after.units.wind, "kmh");
  assert.equal(resolve({ country: "US", language: "fa" }).units.temperature, "fahrenheit");
  assert.equal(resolve({ country: "US", language: "fa" }).direction, "rtl");
  assert.equal(resolve({ country: "US", language: "fa" }).numbering, "arabext");
  assert.equal(resolve({ country: "US", language: "fa" }).numbering, "arabext");
  assert.equal(resolve({ country: "JP" }).language, "en");
});

test("preferences restore valid choices, migrate legacy manual region and sanitize damaged storage", () => {
  const stored = { ...DEFAULT_PREFERENCES, country: "IR", language: "en", regionConfirmed: true, units: { ...DEFAULT_PREFERENCES.units, area: "acre" } };
  assert.deepEqual(parsePreferences(JSON.stringify(stored)), stored);
  assert.equal(parsePreferences(null, "fa-IR", "manual").regionConfirmed, true);
  assert.equal(parsePreferences(null, "en-US", "detected").regionConfirmed, false);
  assert.equal(parsePreferences("broken", "fa-IR", "manual").country, "IR");
  const invalid = parsePreferences(JSON.stringify({ version: 1, country: "__proto__", language: "unsupported", units: { area: "miles", volume: "imperial-gallon" } }));
  assert.equal(invalid.country, "US"); assert.equal(invalid.units.area, "auto"); assert.equal(invalid.units.volume, "auto");
  assert.equal(countryFromLocale("fa-IR"), "IR"); assert.equal(countryFromLocale("en-US"), "US"); assert.equal(countryFromLocale("fa"), "IR");
  assert.equal(countryFromLocale("de-DE"), "DE");
});

test("UI unit boundaries preserve farm area, dimensions and US liquid-gallon calculations", () => {
  const cases = [[4046.8564224, "area", 1], [160.9344, "distance", 100], [30.48, "length", 100], [16.09344, "wind", 10], [25.4, "precipitation", 1], [3.785411784, "volume", 1], [0, "temperature", 32]];
  for (const [canonical, kind, displayed] of cases) {
    assert.ok(Math.abs(fromCanonical(canonical, kind, US_UNITS) - displayed) < 1e-9, kind);
    assert.ok(Math.abs(toCanonical(displayed, kind, US_UNITS) - canonical) < 1e-9, kind);
  }
  const metric = createFormatters(resolve({ country: "IR", language: "en" }));
  const imperial = createFormatters(resolve({ country: "US" }));
  assert.equal(metric.parse("4", "area"), 40000);
  assert.equal(metric.input(40000, "area"), "4");
  assert.equal(imperial.input(92.90304, "gardenArea"), "1000");
  assert.ok(Math.abs(imperial.parse("100", "length") * imperial.parse("100", "length") - 929.0304) < 1e-8);
  assert.equal(parseLocalizedNumber("۱٬۲۳۴٫۵"), 1234.5);
  assert.ok(Number.isNaN(parseLocalizedNumber("")));
  assert.equal(imperial.temperature(null), "—"); assert.equal(imperial.measure(undefined, "precipitation"), "—");
  assert.equal(imperial.rain(4), "0.16"); assert.equal(imperial.rain(.4), "0.02"); assert.equal(imperial.rain(.01), "<0.01");
});

test("farm-local wall clocks do not get shifted again, and dates follow the chosen calendar", () => {
  const fa = createFormatters(resolve({ country: "IR" }));
  const en = createFormatters(resolve({ country: "US" }));
  assert.equal(fa.clock("2026-09-09T17:30"), "۱۷:۳۰");
  assert.match(en.clock("2026-09-09T17:30"), /05:30 PM/);
  assert.match(fa.date(new Date("2026-03-21T12:00:00Z"), { timeZone: "UTC" }), /۱۴۰۵/);
  assert.match(en.date(new Date("2026-03-21T12:00:00Z"), { timeZone: "UTC" }), /2026/);
});

test("Persian month navigation keeps canonical ISO dates including Nowruz and leap Esfand", () => {
  const { calendarMonth, parseLocalDate, localDateValue } = loadTs("features/settings/lib/calendar.ts");
  const month = calendarMonth(parseLocalDate("2025-03-15"), "persian");
  assert.equal(localDateValue(month.first), "2025-02-19");
  assert.equal(month.days.length, 30);
  assert.equal(localDateValue(month.next), "2025-03-21");
  assert.equal(calendarMonth(month.next, "persian").days.length, 31);
  assert.equal(calendarMonth(parseLocalDate("2024-02-15"), "gregory").days.length, 29);
  assert.equal(parseLocalDate("2026-02-30"), null);
});

test("preference store survives reload, synchronizes tabs and retains edits when storage is blocked", (t) => {
  const savedWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const savedStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const values = new Map();
  const window = new EventTarget();
  let blocked = false;
  Object.defineProperty(globalThis, "window", { configurable: true, value: window });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { if (blocked) throw new Error("blocked"); values.set(key, value); },
  } });
  t.after(() => {
    if (savedWindow) Object.defineProperty(globalThis, "window", savedWindow); else delete globalThis.window;
    if (savedStorage) Object.defineProperty(globalThis, "localStorage", savedStorage); else delete globalThis.localStorage;
  });
  const store = loadTs("features/settings/lib/preferences-store.ts");
  let notifications = 0;
  const unsubscribe = store.subscribeToPreferences(() => notifications++);
  store.updatePreferences({ country: "IR", regionConfirmed: true });
  assert.equal(notifications, 1);
  assert.equal(loadTs("features/settings/lib/preferences-store.ts").getPreferencesSnapshot().preferences.country, "IR");
  const event = new Event("storage");
  Object.assign(event, { key: store.PREFERENCES_KEY, newValue: JSON.stringify({ ...DEFAULT_PREFERENCES, country: "GB", language: "fa" }) });
  window.dispatchEvent(event);
  assert.equal(store.getPreferencesSnapshot().preferences.country, "GB");
  blocked = true; store.updatePreferences({ language: "en" });
  assert.equal(store.getPreferencesSnapshot().saved, false);
  assert.equal(store.getPreferencesSnapshot().preferences.language, "en");
  unsubscribe(); const before = notifications; window.dispatchEvent(event); assert.equal(notifications, before);
});

test("charts convert primary, secondary, domains and freezing reference without mutating source data", () => {
  const { displayChart } = loadTs("features/weather/lib/weather-display-units.ts");
  const points = [{ key: "a", time: "2026-09-09T01:00", position: 1, value: -2, secondary: -4 }, { key: "b", time: "2026-09-09T02:00", position: 2, value: null, secondary: null }];
  const before = structuredClone(points);
  const converted = displayChart(points, "temperature", US_UNITS);
  assert.equal(converted.points[0].value, 28.4); assert.equal(converted.points[0].secondary, 24.8);
  assert.equal(converted.freezing, 32); assert.equal(converted.points[1].value, null); assert.deepEqual(points, before);
  const rain = displayChart([{ ...points[0], value: 4, secondary: null }], "precipitation", US_UNITS);
  assert.ok(rain.domain[1] < .2); assert.equal(rain.points[0].value, 4 / 25.4);
});

test("rendered US charts and forms show converted values; Persian preview stays translated", () => {
  const React = localRequire("react");
  const us = localizedRenderer({ country: "US" });
  const { WeatherChart } = us.load("features/weather/components/weather-chart/index.tsx");
  const points = [-2, 0, 2].map((value, position) => ({ key: String(position), time: `2026-09-09T0${position}:00`, position, value, secondary: null }));
  const chart = us.renderToStaticMarkup(React.createElement(WeatherChart, { points, metric: "temperature", selectedIndex: 1, onSelect() {} }));
  assert.match(chart, /data-unit="°F"/); assert.match(chart, /data-freezing-reference="32"/); assert.match(chart, /32 °F/);
  const { MeasurementInput } = us.load("features/settings/components/measurement-input.tsx");
  const area = us.renderToStaticMarkup(React.createElement(MeasurementInput, { kind: "area", value: 4046.8564224, onValueChange() {} }));
  assert.match(area, /value="1"/);
  const { Hero } = us.load("features/landing/components/hero.tsx");
  const hero = us.renderToStaticMarkup(React.createElement(Hero));
  assert.match(hero, /Fresno, California/); assert.match(hero, /81°F|81 °F/); assert.match(hero, /20 ac/); assert.match(hero, /Not live data/);
  const fa = localizedRenderer({ country: "IR", language: "auto", calendar: "auto" });
  const PersianHero = fa.load("features/landing/components/hero.tsx").Hero;
  const persian = fa.renderToStaticMarkup(React.createElement(PersianHero));
  assert.match(persian, /قزوین، ایران/); assert.match(persian, /۲۷ °C/); assert.match(persian, /۴ ha/);
});

test("changing units while editing never reinterprets an existing canonical form value", () => {
  const React = localRequire("react");
  let draft = null;
  let settings = resolve({ country: "US" });
  let value = "";
  let writes = 0;
  const { MeasurementInput } = loadTs("features/settings/components/measurement-input.tsx", {
    react: { ...React, useState: () => [draft, (next) => { draft = next; }] },
    "../context/settings-context": { useSettings: () => ({ ...settings, format: createFormatters(settings) }) },
  });
  const render = () => MeasurementInput({ kind: "area", value, onValueChange: (next) => { value = next; writes++; } });
  render().props.onChange({ target: { value: "1." } });
  assert.equal(render().props.value, "1.");
  assert.equal(Number(value), 4046.8564224);
  settings = resolve({ country: "IR" });
  const display = render().props.value;
  assert.ok(Math.abs(Number(display) - .40468564224) < 1e-8);
  assert.equal(Number(value), 4046.8564224); assert.equal(writes, 1);
  render().props.onChange({ target: { value: "4.2" } });
  assert.equal(Number(value), 42000);
  render().props.onChange({ target: { value: "" } });
  assert.equal(value, ""); assert.equal(render().props.value, "");
});

test("sensor water-flow displays convert US gallons without altering the time period", () => {
  const { sensorReading } = loadTs("features/settings/lib/sensor-reading.ts");
  const format = createFormatters(resolve({ country: "US" }));
  assert.deepEqual(sensorReading("3.785411784", "L/min", format), { value: "1", unit: "gal (US)/min" });
  assert.deepEqual(sensorReading("0", "°C", format), { value: "32", unit: "°F" });
  assert.deepEqual(sensorReading("—", "L", format), { value: "—", unit: "L" });
});

test("Settings renders country, independent language, units and live previews in either language", () => {
  const React = localRequire("react");
  for (const preferences of [{ country: "US", language: "en" }, { country: "IR", language: "fa", calendar: "auto" }]) {
    const ui = localizedRenderer(preferences);
    const { SettingsPanel } = ui.load("features/settings/components/settings-panel.tsx");
    const html = ui.renderToStaticMarkup(React.createElement(SettingsPanel));
    assert.match(html, /role="combobox"/);
    assert.match(html, preferences.language === "fa" ? /منطقه و زبان/ : /Region &amp; language/);
    assert.match(html, preferences.country === "IR" ? /قزوین، ایران/ : /Fresno, California/);
  }
});

test("only complete locale catalogs are selectable and incomplete locale requests are rejected", () => {
  const { translator } = loadTs("features/settings/lib/translation.ts");
  const { LANGUAGE_OPTIONS } = loadTs("features/settings/constants/locale-options.ts");
  assert.deepEqual(LANGUAGE_OPTIONS.map(({ value }) => value), ["en", "fa"]);
  for (const { value } of LANGUAGE_OPTIONS) {
    if (value === "en") continue;
    assert.notEqual(translator(value)("Settings"), "Settings", value);
  }
  for (const language of ["ar", "fr", "zh", "es", "de", "ru", "hi", "tr", "ja", "ko"]) {
    const restored = parsePreferences(JSON.stringify({ ...DEFAULT_PREFERENCES, language }));
    assert.equal(resolvePreferences(restored).language, "en", language);
  }
});
