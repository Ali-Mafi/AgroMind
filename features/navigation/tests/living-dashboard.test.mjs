import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { workspaceFixture } from "./helpers/workspace-fixture.mjs";
import { localizedRenderer } from "../../settings/tests/helpers/render.mjs";
import { localRequire, loadTs } from "../../weather/tests/helpers/load-ts.mjs";
const React = localRequire("react");

for (const language of ["en", "fa"]) {
  test(`${language}: dashboard preserves scheduled values, farm identity and destinations`, () => {
    const html = workspaceFixture({ language });
    assert.match(html, language === "fa" ? /مزرعهٔ سبز/ : /Greenfield Farm/);
    assert.match(html, language === "fa" ? /برنامه‌ریزی‌شده/ : /Scheduled/);
    assert.match(html, language === "fa" ? /۰۶:۳۰/ : /06:30/);
    assert.match(html, language === "fa" ? /۴۵/ : /45/);
    assert.match(html, /href="\/weather\?farm=fixture-farm&amp;from=dashboard"/);
    assert.match(html, /href="\/irrigation\?farm=fixture-farm"/);
    assert.match(html, /href="\/farms\/fixture-farm\/insights"/);
    assert.match(html, /data-farm-type="farm"/);
    assert.match(html, /data-crop-key="corn"/);
    assert.match(html, /%2Fimages%2Fdashboard%2Fcrop-corn\.webp/);
    assert.doesNotMatch(html, /crop-sprite\.webp/);
    assert.doesNotMatch(html, /valve running|countdown|progressbar/i);
  });
  test(`${language}: missing coordinates and schedule keep honest empty actions`, () => {
    const html = workspaceFixture({ language, coordinates: false, scheduled: false });
    assert.match(html, /href="\/farms\/fixture-farm\/edit"/);
    assert.match(html, language === "fa" ? /آبیاری.*برنامه/ : /No irrigation scheduled/);
    assert.doesNotMatch(html, /href="\/weather\?|data-irrigation-event|data-condition=/);
    const empty = workspaceFixture({ language, empty: true });
    assert.match(empty, /href="\/farms\/new"/);
    assert.doesNotMatch(empty, /data-farm-overview|data-condition=|data-irrigation-event/);
  });
  test(`${language}: garden counts remain plant entries rather than fabricated crop readings`, () => {
    const html = workspaceFixture({ language, garden: true });
    assert.match(html, /lucide-trees/);
    assert.match(html, language === "fa" ? /۱ گیاه و درخت/ : /1 plants and trees/);
    assert.match(html, /data-farm-type="garden"/);
    assert.match(html, /data-crop-key="garden-tree"/);
    assert.match(html, /%2Fimages%2Fdashboard%2Fgarden-tree-v2\.webp/);
    assert.doesNotMatch(html, /soil.*\d+%|valve running/i);
  });
}

function renderWeather({ source = "weatherapi", returnTo = "/dashboard", state = {}, country = "IR" } = {}) {
  const ui = localizedRenderer({ country });
  const weather = {
    timezone: "Asia/Tehran", currentStatus: source === "open-meteo" ? "fallback" : "primary",
    current: {
      time: "2026-09-21T20:00:00Z", source, temperature: 20, windSpeed: 12,
      condition: { condition: "rain", label: "Moderate rain", isPrecipitation: true },
      isDay: false,
    },
    daily: [{ date: "2026-09-21", precipitationSum: 4 }],
  };
  const WeatherDashboard = ui.load("features/weather/components/weather-dashboard", {
    "@/features/weather/components/hooks/use-weather": { useWeather: () => ({
      weather, checkedAt: Date.parse("2026-09-21T20:00:00Z"), isLoading: false,
      isRefreshing: false, error: null, refreshError: null, refresh() {}, ...state,
    }) },
  }).default;
  return ui.renderToStaticMarkup(React.createElement(WeatherDashboard, {
    coordinates: { latitude: 36.27, longitude: 50 }, farmId: "field & garden",
    returnTo, appearance: "dashboard",
  }));
}

test("crop visual resolver normalizes Persian and English crop variants without AI", () => {
  const { resolveCropVisualKey, resolveCropVisual } = loadTs("features/farms/lib/resolve-farm-visual");
  assert.equal(resolveCropVisualKey("ذرت علوفه‌ای 704"), "corn");
  assert.equal(resolveCropVisualKey("گندم دوروم"), "wheat");
  assert.equal(resolveCropVisualKey("کلم سفید"), "cabbage");
  assert.equal(resolveCropVisualKey("Pinto Bean"), "pinto-bean");
  assert.equal(resolveCropVisualKey("محصول محلی ناشناخته"), "generic");
  assert.equal(resolveCropVisual({ type: "garden", crop: { name: "Apple" } }).key, "garden-tree");
});

test("dashboard photos are local, species-specific and do not substitute wheat for rice", () => {
  const { resolveCropVisual, resolveFarmHeaderBackground } = loadTs("features/farms/lib/resolve-farm-visual");
  for (const [name, asset] of [["ذرت علوفه‌ای", "corn"], ["گندم", "wheat"], ["برنج", "rice"], ["گوجه فرنگی", "tomato"], ["Unknown crop", "field"], ["Sorghum", "field"]]) {
    const visual = resolveCropVisual({ type: "farm", crop: { name } });
    assert.equal(visual.image, `/images/dashboard/crop-${asset}.webp`);
    assert.equal(visual.backgroundSize, "cover");
    assert.ok(statSync(`public${visual.image}`).size > 40_000);
  }
  const garden = resolveCropVisual({ type: "garden" });
  assert.equal(garden.backgroundSize, "cover", "fill the product card without letterboxing");
  for (const path of [garden.image, resolveFarmHeaderBackground("farm"), resolveFarmHeaderBackground("garden")]) {
    assert.ok(path.startsWith("/images/dashboard/"));
    assert.ok(statSync(`public${path}`).size > 40_000);
  }
  assert.notEqual(resolveFarmHeaderBackground("farm"), resolveFarmHeaderBackground("garden"));
});

test("PWA keeps native standard chrome, immersive routes and accessible edge-to-edge viewports", () => {
  const layout = readFileSync("app/dashboard/layout.tsx", "utf8");
  assert.match(layout, /viewportFit: "cover"/);
  assert.match(layout, /statusBarStyle: "black-translucent"/);
  assert.doesNotMatch(layout, /userScalable: false|maximumScale/);
  const root = readFileSync("app/layout.tsx", "utf8");
  assert.match(root, /viewportFit: "cover"/, "cover must be present before navigating from signup to Dashboard");
  assert.doesNotMatch(root, /userScalable: false|maximumScale/);
  assert.match(root, /statusBarStyle: "default"/, "standard and auth pages use native status-bar chrome");
  const weather = readFileSync("app/weather/page.tsx", "utf8");
  assert.match(weather, /statusBarStyle: "black-translucent"/);
  assert.doesNotMatch(weather, /userScalable: false|maximumScale/);
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(css, /body:not\(:has\(\[data-dashboard-immersive\]\)\)/);
  assert.match(css, /padding-top: env\(safe-area-inset-top/);
  assert.match(workspaceFixture(), /data-dashboard-immersive/);
  assert.match(workspaceFixture({ empty: true }), /data-dashboard-immersive/);
});

test("dashboard photos use responsive optimized requests, prioritizing only the header", () => {
  const html = workspaceFixture();
  const photos = [...html.matchAll(/<img\b[^>]*>/g)].map(([image]) => image);
  assert.equal(photos.length, 3);
  assert.equal(photos.filter(image => image.includes('fetchPriority="high"')).length, 1);
  assert.ok(photos[0].includes('loading="eager"'));
  assert.ok(photos.slice(1).every(image => image.includes('loading="lazy"')));
  for (const photo of photos) {
    assert.match(photo, /srcSet=.*640w/);
    assert.match(photo, /sizes=/);
    assert.match(photo, /data:image\/svg/); // Inline preview while the photograph loads.
    assert.match(photo, /alt=""/);
  }
  const srcset = image => image.match(/srcSet="([^"]+)"/)[1];
  assert.equal(srcset(photos[0]), srcset(photos[1]), "hero reuses the header download");
  const css = readFileSync("features/dashboard/components/dashboard-overview/dashboard-overview.module.css", "utf8");
  assert.match(css, /\.app-select-trigger \.app-icon-container\)[\s\S]*?color: var\(--app-hero-foreground\)/);
  assert.doesNotMatch(css, /--dashboard-property-bg/, "no competing full-resolution CSS download");
  const photo = readFileSync("features/farms/components/farm-photo.tsx", "utf8");
  assert.match(photo, /key=\{photo.src\}/, "reset only the image placeholder when switching artwork, not weather or cards");
});

test("dashboard styling keeps safe areas, narrow-screen reflow, RTL and reduced-motion safeguards", () => {
  const css = readFileSync("features/dashboard/components/dashboard-overview/dashboard-overview.module.css", "utf8");
  for (const edge of ["top", "left", "right"]) assert.ok(css.includes(`safe-area-inset-${edge}`));
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\)/);
  assert.doesNotMatch(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); grid-auto-rows/);
  assert.match(css, /\.header::after[\s\S]*?linear-gradient\(to bottom, transparent, var\(--background\)\)/);
  assert.match(css, /farm-crop-backdrop\) \{[\s\S]*?inset: 0;[\s\S]*?width: 100%;/);
  assert.match(css, /:dir\(rtl\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(css, /backdrop-filter|filter: blur|auto-rows-fr/);
  const weatherCss = readFileSync("features/weather/components/weather-dashboard/weather-dashboard.module.css", "utf8");
  assert.doesNotMatch(weatherCss, /display:\s*none|backdrop-filter|filter: blur/);
  assert.match(weatherCss, /\.weather \.currentConditions \{ display: flex/);
});

test("weather atmosphere and report time use the provider's actual condition, night and farm timezone", () => {
  const html = renderWeather();
  assert.match(html, /data-day="false"/);
  assert.match(html, /data-condition="rain"/);
  assert.match(html, /data-precipitation="true"/);
  assert.match(html, /data-visual-state="rain-night"/);
  assert.match(html, /\/weather\/backgrounds\/rainy-night\.webp/);
  assert.match(html, /Report time/);
  assert.match(html, /dateTime="2026-09-21T20:00:00Z"/);
  assert.match(html, /23:30/);
  assert.match(html, /20 °C/);
  assert.match(html, /4\.0 mm/);
  assert.match(html, /farm=field%20%26%20garden&amp;from=dashboard/);
  assert.doesNotMatch(html, />Live</);
});

test("fallback, source labels, regional units and irrigation return path survive the visual treatment", () => {
  const html = renderWeather({ source: "open-meteo", returnTo: "/irrigation", country: "US" });
  assert.match(html, /Valid time/);
  assert.match(html, /WeatherAPI unavailable/);
  assert.match(html, /68 °F/);
  assert.match(html, /0\.16 in/);
  assert.match(html, /farm=field%20%26%20garden&amp;from=irrigation/);
});

test("weather loading, failures and refresh failures never acquire fabricated conditions", () => {
  const loading = renderWeather({ state: { weather: null, isLoading: true } });
  assert.match(loading, /aria-busy="true"/);
  assert.doesNotMatch(loading, /data-condition=|Report time/);
  const failure = renderWeather({ state: { weather: null, error: "Weather data is unavailable." } });
  assert.match(failure, /Try again/);
  assert.doesNotMatch(failure, /data-condition=|Report time/);
  const refreshFailure = renderWeather({ state: { refreshError: "Weather data is unavailable." } });
  assert.match(refreshFailure, /Weather data is unavailable/);
  assert.match(refreshFailure, /20 °C/);
});

test("farm switching preserves URL context, animates once per selection and honors reduced motion", async () => {
  const { interactionHooks, elements } = await import("../../settings/tests/helpers/interactions.mjs");
  const { loadTs } = await import("../../weather/tests/helpers/load-ts.mjs");
  const hooks = interactionHooks();
  const animations = [];
  let reduced = false;
  let query = new URLSearchParams("farm=first&context=kept");
  const state = {
    farms: [
      { id: "first", name: "First farm", coordinates: { latitude: 1, longitude: 1 } },
      { id: "second", name: "Second farm", coordinates: { latitude: 2, longitude: 2 } },
    ],
    selectedFarmId: "first", irrigationSchedules: {},
    setSelectedFarmId(id) { state.selectedFarmId = id; },
  };
  const oldWindow = globalThis.window;
  const oldGetComputedStyle = globalThis.getComputedStyle;
  globalThis.window = { location: { pathname: "/dashboard" }, matchMedia: () => ({ matches: reduced }) };
  globalThis.getComputedStyle = () => ({ getPropertyValue: (name) => name === "--motion-panel" ? "220ms" : "ease-out" });
  try {
    const { DashboardOverview } = loadTs("features/dashboard/components/dashboard-overview", {
      react: { ...hooks.react, useRef: () => ({ current: {
        animate: (frames, options) => { animations.push({ frames, options }); return { cancel() {} }; },
      } }) },
      "next/navigation": {
        useSearchParams: () => query,
        useRouter: () => ({ replace: (url, options) => {
          assert.equal(options.scroll, false);
          query = new URL(url, "https://example.test").searchParams;
        } }),
      },
      "../context/farm-context": { useFarm: () => state },
      "@/features/settings/hooks/use-translation": { useTranslation: () => text => text },
      "@/features/settings/context/settings-context": { useSettings: () => ({ format: {} }) },
    });
    let tree = hooks.render(DashboardOverview);
    assert.equal(animations.length, 1);
    elements(tree).find(node => node.props.action?.props.onFarmChange).props.action.props.onFarmChange("second");
    tree = hooks.render(DashboardOverview);
    assert.equal(query.get("context"), "kept");
    assert.equal(query.get("farm"), "second");
    assert.equal(state.selectedFarmId, "second");
    assert.ok(elements(tree).some(node => node.props.title === "Second farm"));
    assert.equal(animations.length, 2);
    assert.equal(animations[1].options.duration, 220);
    hooks.render(DashboardOverview);
    assert.equal(animations.length, 2, "ordinary renders must not replay the transition");
    reduced = true;
    elements(tree).find(node => node.props.action?.props.onFarmChange).props.action.props.onFarmChange("first");
    hooks.render(DashboardOverview);
    assert.equal(animations.length, 2, "reduced motion must not create an animation");
  } finally {
    if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow;
    if (oldGetComputedStyle === undefined) delete globalThis.getComputedStyle; else globalThis.getComputedStyle = oldGetComputedStyle;
  }
});
