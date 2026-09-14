import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "../../weather/tests/helpers/load-ts.mjs";

const { DEFAULT_PREFERENCES } = loadTs("features/settings/lib/preferences.ts");
const { preferencesFromProfile } = loadTs("features/settings/lib/account-preferences.ts");

test("cloud profile wins over stale device locale without changing units or calendar", () => {
  const device = { ...DEFAULT_PREFERENCES, country: "US", language: "en", regionConfirmed: true, calendar: "gregory", units: { ...DEFAULT_PREFERENCES.units, area: "acre" } };
  const next = preferencesFromProfile(device, "IR", "fa");
  assert.equal(next.country, "IR");
  assert.equal(next.language, "fa");
  assert.deepEqual(next.units, device.units);
  assert.equal(next.calendar, "gregory");
  assert.equal(device.country, "US");
  const switched = preferencesFromProfile(next, "GB", "en");
  assert.equal(switched.country, "GB");
  assert.equal(switched.language, "en");
});

test("follow-region is preserved only when it matches the saved profile language", () => {
  const automatic = { ...DEFAULT_PREFERENCES, language: "auto" };
  assert.equal(preferencesFromProfile(automatic, "IR", "fa").language, "auto");
  assert.equal(preferencesFromProfile(automatic, "IR", "en").language, "en");
});

test("account hydration and profile refresh never send device data to Cloud", () => {
  let device = { ...DEFAULT_PREFERENCES, country: "US", language: "en", regionConfirmed: true };
  let writes = 0;
  const { AccountPreferenceSync } = loadTs("features/settings/components/account-preference-sync.tsx", {
    react: { useEffect: (effect) => effect() },
    "@/features/settings/context/settings-context": { useSettings: () => ({ isHydrated: true, update: (apply) => { device = apply(device); } }) },
    "@/features/settings/services/account-preferences": { saveAccountPreferences: () => { writes++; } },
  });
  AccountPreferenceSync({ userId: "a", profileCountry: "IR", profileLanguage: "fa" });
  assert.equal(device.country, "IR");
  AccountPreferenceSync({ userId: "a", profileCountry: "GB", profileLanguage: "en" });
  assert.equal(device.country, "GB");
  assert.equal(writes, 0);
});

test("explicit Settings edits persist first, while failed saves leave the device unchanged", async () => {
  for (const ok of [true, false]) {
    const calls = [];
    const { AccountSettingsPanel } = loadTs("features/settings/components/account-settings-panel.tsx", {
      "@/features/farms/context/farm-context": { useFarm: () => ({
        cloud: { user: { id: "user-a" } }, busy: false,
        run: async (operation) => (await operation()).ok,
      }) },
      "../context/settings-context": { useSettings: () => ({
        preferences: { ...DEFAULT_PREFERENCES, country: "US", language: "auto" },
        update: (change) => calls.push(["device", change]),
      }) },
      "../services/account-preferences": { saveAccountPreferences: async (input, id) => {
        calls.push(["cloud", input, id]); return { ok };
      } },
      "./settings-panel": { SettingsPanel: () => null },
    });
    const panel = AccountSettingsPanel();
    assert.deepEqual(calls, []);
    await panel.props.onLocaleChange({ country: "IR", regionConfirmed: true });
    assert.deepEqual(calls[0], ["cloud", { country_code: "IR", language: "fa" }, "user-a"]);
    assert.equal(calls.length, ok ? 2 : 1);
  }
});

test("locale saves enforce ownership, validate on the server and return refreshed Cloud data", async () => {
  const updates = [];
  const cloud = { user: { id: "user-a" }, profile: { country_code: "IR", language: "fa" } };
  const { saveAccountPreferences } = loadTs("features/settings/services/account-preferences.ts", {
    "@/lib/supabase/server": { createClient: async () => ({ from: () => ({ update: (input) => ({ eq: async (key, value) => {
      updates.push({ input, key, value }); return { error: null };
    } }) }) }) },
    "@/features/authentication/services/session": { requireUser: async () => ({ id: "user-a" }) },
    "@/features/cloud/services/data": { readCloudSnapshot: async () => cloud },
    "next/cache": { revalidatePath: () => {} },
  });
  const input = { country_code: "IR", language: "fa" };
  assert.equal((await saveAccountPreferences(input, "user-b")).ok, false);
  assert.equal((await saveAccountPreferences({ ...input, language: "bad" }, "user-a")).ok, false);
  assert.equal((await saveAccountPreferences({ ...input, full_name: "Wrong" }, "user-a")).ok, false);
  assert.deepEqual(updates, []);
  assert.deepEqual(await saveAccountPreferences(input, "user-a"), { ok: true, data: cloud });
  assert.deepEqual(updates, [{ input, key: "id", value: "user-a" }]);
});
