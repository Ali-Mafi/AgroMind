import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "../../weather/tests/helpers/load-ts.mjs";
import { interactionHooks, elements } from "./helpers/interactions.mjs";

const { DEFAULT_PREFERENCES } = loadTs("features/settings/lib/preferences.ts");

function harness(detect, { path = "/", confirmed = false, hydrated = true, language = "en" } = {}) {
  const hooks = interactionHooks();
  const writes = [];
  const { RegionOnboarding } = loadTs("features/settings/components/region-onboarding.tsx", {
    react: hooks.react,
    "next/navigation": { usePathname: () => path },
    "../hooks/use-translation": { useTranslation: () => (text) => text },
    "../context/settings-context": { useSettings: () => ({
      country: "US", language, isHydrated: hydrated,
      preferences: { ...DEFAULT_PREFERENCES, language, regionConfirmed: confirmed },
      update: (value) => writes.push(value),
    }) },
    "@/features/region/context/region-context": { useRegion: () => ({ detectRegionFromLocation: detect }) },
    "./preference-select": { PreferenceSelect: () => null },
  });
  const entry = RegionOnboarding();
  const tree = () => entry ? hooks.render(entry.type) : null;
  return {
    writes, entry,
    select: (label) => elements(tree()).find((node) => node.props.label === label).props,
    button: (label) => elements(tree()).find((node) => node.type === "button" && node.props.children.includes(label)).props,
  };
}

test("first-visit location suggests both region and its supported language, applying only on Continue", async () => {
  for (const [detected, country, language] of [["fa-IR", "IR", "fa"], ["en-US", "US", "en"], ["fa-AF", "AF", "fa"]]) {
    const h = harness(async () => detected, { language: language === "en" ? "fa" : "en" });
    await h.button("Suggest from my location").onClick();
    assert.equal(h.select("Region").value, country);
    assert.equal(h.select("Language").value, language);
    assert.deepEqual(h.writes, []);
    h.button("Continue").onClick();
    assert.deepEqual(h.writes, [{ country, language, regionConfirmed: true, regionSource: "detected" }]);
  }
});

test("manual language selection wins over an in-flight location suggestion", async () => {
  let resolve;
  const h = harness(() => new Promise((done) => { resolve = done; }));
  const request = h.button("Suggest from my location").onClick();
  h.select("Language").onChange("en");
  resolve("fa-IR");
  await request;
  assert.equal(h.select("Region").value, "IR");
  assert.equal(h.select("Language").value, "en");
});

test("manual region selection prevents a late location result from overwriting either choice", async () => {
  let resolve;
  const h = harness(() => new Promise((done) => { resolve = done; }));
  const request = h.button("Suggest from my location").onClick();
  h.select("Region").onChange("GB");
  resolve("fa-IR");
  await request;
  assert.equal(h.select("Region").value, "GB");
  assert.equal(h.select("Language").value, "en");
});

test("denied or unknown location preserves the existing popup choices", async () => {
  for (const detect of [async () => null, async () => "invalid", async () => { throw new Error("denied"); }]) {
    const h = harness(detect);
    const country = h.select("Region").value;
    await h.button("Suggest from my location").onClick();
    assert.equal(h.select("Region").value, country);
    assert.equal(h.select("Language").value, "en");
    assert.equal(h.button("Suggest from my location").disabled, false);
    assert.deepEqual(h.writes, []);
  }
});

test("location-language coupling is restricted to the unconfirmed landing popup", () => {
  for (const options of [{ path: "/settings" }, { path: "/sign-up" }, { confirmed: true }, { hydrated: false }]) {
    assert.equal(harness(async () => "fa-IR", options).entry, null);
  }
});
