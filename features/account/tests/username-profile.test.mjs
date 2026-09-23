import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { root } from "../../weather/tests/helpers/load-ts.mjs";

const read = (file) => readFileSync(path.join(root, file), "utf8");

test("profile keeps first name, last name and username as separate account concepts", () => {
  const profile = read("features/account/components/profile-form.tsx");
  const username = read("features/account/components/username-form.tsx");
  assert.match(profile, /First name/);
  assert.match(profile, /Last name/);
  assert.match(profile, /first_name/);
  assert.match(profile, /last_name/);
  assert.match(profile, /<UsernameForm/);
  assert.match(username, /Username not set/);
  assert.match(username, /FreshIdentityFields/);
  assert.match(username, /href="\/account\/security"/);
});

test("username mutation requires fresh MFA and preserves database uniqueness", () => {
  const action = read("features/account/services/username-actions.ts");
  const migration = read(
    "supabase/migrations/20260923111500_secure_username_change.sql",
  );
  assert.match(action, /username_available/);
  assert.match(action, /verifyFreshIdentity/);
  assert.match(action, /change_username/);
  assert.match(action, /This username is already taken/);
  assert.match(migration, /auth\.mfa_factors/);
  assert.match(migration, /MFA_REQUIRED/);
  assert.match(migration, /MFA_CHALLENGE_REQUIRED/);
  assert.match(migration, /auth\.jwt\(\)->>'aal'/);
  assert.match(migration, /unique_violation/);
  assert.doesNotMatch(migration, /create unique index/i);
});

test("RTL measurement inputs keep their Latin unit suffix on the same physical side as input padding", () => {
  for (const file of ["app/farms/new/page.tsx", "app/farms/[id]/edit/page.tsx"]) {
    const source = read(file);
    for (const match of source.matchAll(/<MeasurementInput[\s\S]*?\/>/g)) {
      const block = match[0];
      if (!/format\.symbol/.test(source.slice(match.index, match.index + block.length + 220))) continue;
      assert.match(block, /pr-(10|12|14)/, file);
      assert.doesNotMatch(block, /pe-(10|12|14)/, file);
    }
  }
});
