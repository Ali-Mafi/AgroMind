import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "../../weather/tests/helpers/load-ts.mjs";
const {
  readLegacyData,
  markLegacyImported,
  LEGACY_OWNER_KEY,
  LEGACY_FARMS_KEY,
  LEGACY_SCHEDULES_KEY,
} = loadTs("features/cloud/lib/legacy-storage.ts");
const { farmSchema, scheduleSchema, profileSchema } = loadTs(
  "features/cloud/lib/validation.ts",
);
const { can, getLimit, parseEntitlements } = loadTs(
  "features/entitlements/lib/entitlements.ts",
);
const farm = {
  id: "original-id",
  name: " My farm ",
  area: 100,
  type: "garden",
  location: "Tehran",
  coordinates: { latitude: 35, longitude: 51 },
  plants: [{ id: "plant", name: "Tree", quantity: 4, spacing: 2, age: 3 }],
  extension: { preserve: true },
};
const schedule = {
  id: "schedule",
  revision: 2,
  date: "2027-06-12",
  time: "07:30",
  duration: 20,
  timeZone: "Asia/Tehran",
  createdAt: "2026-09-13T00:00:00.000Z",
};
const store = (farms = [farm], schedules = { [farm.id]: schedule }) => {
  const values = new Map([
    [LEGACY_FARMS_KEY, JSON.stringify(farms)],
    [LEGACY_SCHEDULES_KEY, JSON.stringify(schedules)],
  ]);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    values,
  };
};
test("legacy reading preserves all existing fields, IDs, values and optional extensions without writing", () => {
  const storage = store();
  const before = new Map(storage.values);
  assert.deepEqual(readLegacyData(storage, "user-a").snapshot, {
    farms: [farm],
    schedules: { [farm.id]: schedule },
  });
  assert.deepEqual(storage.values, before);
  assert.deepEqual(farmSchema.parse(farm), farm);
  assert.deepEqual(scheduleSchema.parse(schedule), schedule);
});
test("corrupt, duplicate and orphan legacy backups stay available as raw data", () => {
  for (const storage of [
    store([farm, farm]),
    store([farm], { missing: schedule }),
    store([{ ...farm, coordinates: { latitude: 91, longitude: 2 } }]),
  ]) {
    const before = new Map(storage.values);
    const found = readLegacyData(storage, "user-a");
    assert.ok(found.error);
    assert.ok(found.raw);
    assert.equal(found.snapshot, undefined);
    assert.deepEqual(storage.values, before);
  }
  const corrupt = store();
  corrupt.setItem(LEGACY_FARMS_KEY, "{broken");
  assert.equal(readLegacyData(corrupt, "user-a").raw.farms, "{broken");
});
test("retrying an import can read the unchanged originals; owner markers never become authentication", () => {
  const storage = store();
  const before = readLegacyData(storage, "user-a").snapshot;
  assert.deepEqual(readLegacyData(storage, "user-a").snapshot, before);
  markLegacyImported(storage, "user-a");
  assert.equal(storage.getItem(LEGACY_OWNER_KEY), "user-a");
  assert.deepEqual(readLegacyData(storage, "user-a").snapshot, before);
  assert.deepEqual(readLegacyData(storage, "another-user"), {});
  assert.equal(storage.getItem(LEGACY_FARMS_KEY), JSON.stringify([farm]));
  assert.doesNotThrow(() =>
    markLegacyImported(
      {
        setItem: () => {
          throw Error("storage blocked");
        },
      },
      "user-a",
    ),
  );
  assert.match(
    readLegacyData(
      {
        getItem: () => {
          throw Error("storage blocked");
        },
      },
      "user-a",
    ).error,
    /unavailable/,
  );
});
test("central entitlements fail closed and respond to data changes independently of plan codes", () => {
  assert.equal(getLimit({}, "farms"), 0);
  const entitlements = parseEntitlements({
    max_farms: 3,
    automation_access: false,
    max_sensors: -1,
    max_team_members: "100",
    nan: NaN,
  });
  assert.deepEqual(entitlements, { max_farms: 3, automation_access: false });
  assert.equal(can({ entitlements, farmCount: 2 }, "farm:create"), true);
  assert.equal(can({ entitlements, farmCount: 3 }, "farm:create"), false);
  assert.equal(can({ entitlements, farmCount: 0 }, "automation:use"), false);
  assert.equal(
    can(
      { entitlements: { max_farms: 8, automation_access: true }, farmCount: 7 },
      "farm:create",
    ),
    true,
  );
  assert.equal(
    can(
      { entitlements: { automation_access: true }, farmCount: 0 },
      "automation:use",
    ),
    true,
  );
});
test("schedule and profile validation reject impossible dates, zones and hidden ownership/completion edits", () => {
  for (const bad of [
    { ...schedule, date: "2027-02-30" },
    { ...schedule, time: "25:00" },
    { ...schedule, timeZone: "unknown/zone" },
    { ...schedule, duration: 0 },
  ])
    assert.equal(scheduleSchema.safeParse(bad).success, false);
  const profile = {
    full_name: "User",
    country_code: "IR",
    language: "fa",
    timezone: "Asia/Tehran",
    onboarding_step: 3,
  };
  assert.equal(profileSchema.safeParse(profile).success, true);
  assert.equal(
    profileSchema.safeParse({ ...profile, onboarding_completed: true }).success,
    false,
  );
  assert.equal(
    profileSchema.safeParse({ ...profile, id: "other-user" }).success,
    false,
  );
});
test("server cloud mutations reject stale account identity before running a write", async () => {
  let writes = 0;
  const { createFarmAction } = loadTs("features/cloud/services/actions.ts", {
    "@/features/authentication/services/session": {
      requireUser: async () => ({ id: "current" }),
    },
    "./data": {
      mutationContext: async () => {
        writes++;
        throw new Error("must not execute");
      },
    },
    "next/cache": { revalidatePath: () => {} },
  });
  const result = await createFarmAction(farm, "previous-account");
  assert.equal(result.ok, false);
  assert.match(result.error, /account changed/);
  assert.equal(writes, 0);
});
