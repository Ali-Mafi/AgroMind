import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "../../weather/tests/helpers/load-ts.mjs";

const { DEFAULT_PREFERENCES, resolvePreferences } = loadTs("features/settings/lib/preferences.ts");
const { PREFERENCES_COOKIE, preferencesFromCookie, displayPreferencesCookie, syncDisplayPreferences } = loadTs("features/settings/lib/preferences-cookie.ts");
const persian = { ...DEFAULT_PREFERENCES, country: "IR", language: "fa", regionConfirmed: true };

test("display cookies round-trip locale/units and exclude unknown or private fields", () => {
  const value = displayPreferencesCookie({ ...persian, email: "private@example.test", token: "secret", farms: [{ name: "private" }] });
  assert.deepEqual(preferencesFromCookie(value), persian);
  assert.doesNotMatch(decodeURIComponent(value), /private|secret|farms|email|token/);
  const restored = preferencesFromCookie(encodeURIComponent(JSON.stringify({ version: 1, country: "__proto__", language: "unsupported", units: { area: "invalid" } })));
  assert.equal(resolvePreferences(restored).direction, "ltr");
  assert.equal(restored.units.area, "auto");
  for (const invalid of [undefined, "", "%bad", "null", "[]", "{}", '{"version":2}', "x".repeat(3001)])
    assert.equal(preferencesFromCookie(invalid), undefined);
});

function browser(t, initialCookie = "") {
  let cookie = initialCookie;
  const writes = [];
  for (const [name, value] of Object.entries({
    window: Object.assign(new EventTarget(), { location: { protocol: "https:" } }),
    document: { get cookie() { return cookie; }, set cookie(value) { writes.push(value); cookie = value.split(";")[0]; } },
    localStorage: { getItem() { return null; }, setItem() {} },
  })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => { if (previous) Object.defineProperty(globalThis, name, previous); else delete globalThis[name]; });
  }
  return writes;
}

test("saved preferences survive missing localStorage and cookie synchronization is idempotent", (t) => {
  const writes = browser(t, `another=value; ${PREFERENCES_COOKIE}=${displayPreferencesCookie(persian)}`);
  const store = loadTs("features/settings/lib/preferences-store.ts");
  assert.deepEqual(store.getPreferencesSnapshot().preferences, persian);
  syncDisplayPreferences(persian);
  assert.equal(writes.length, 0);
  store.updatePreferences({ language: "en" });
  assert.equal(writes.length, 1);
  assert.match(writes[0], /; Path=\/; Max-Age=31536000; SameSite=Lax; Secure$/);
  const reloaded = loadTs("features/settings/lib/preferences-store.ts").getPreferencesSnapshot();
  assert.equal(reloaded.preferences.language, "en");
});

test("blocked browser storage never prevents editing display preferences", (t) => {
  browser(t, `${PREFERENCES_COOKIE}=${displayPreferencesCookie(persian)}`);
  localStorage.getItem = () => { throw new Error("blocked"); };
  localStorage.setItem = () => { throw new Error("blocked"); };
  const store = loadTs("features/settings/lib/preferences-store.ts");
  assert.equal(store.getPreferencesSnapshot().preferences.language, "fa");
  Object.defineProperty(document, "cookie", { get() { throw new Error("blocked"); }, set() { throw new Error("blocked"); } });
  assert.doesNotThrow(() => store.updatePreferences({ language: "en" }));
  assert.equal(store.getPreferencesSnapshot().preferences.language, "en");
  assert.equal(store.getPreferencesSnapshot().saved, false);
});
