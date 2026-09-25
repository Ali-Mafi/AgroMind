import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { root } from "../../weather/tests/helpers/load-ts.mjs";

const read = (file) => readFileSync(path.join(root, file), "utf8");

test("onboarding is five steps with a dedicated name step after welcome", () => {
  const source = read("features/account/components/onboarding.tsx");

  assert.match(
    source,
    /const steps = \[[\s\S]*"Welcome to AgroMind"[\s\S]*"Your name"[\s\S]*"Your region"[\s\S]*"Your language"[\s\S]*"Your first farm"/,
  );
  assert.match(source, /if \(step === 0\) \{\s*setStep\(1\);\s*return;/);
  assert.match(source, /step === 1/);
  assert.match(source, /autoComplete="given-name"/);
  assert.match(source, /autoComplete="family-name"/);
  assert.match(source, /first_name: trimmedFirstName/);
  assert.match(source, /last_name: trimmedLastName/);
  assert.match(source, /Math\.min\(4, step \+ 1\)/);
});

test("credential signup does not ask for profile names", () => {
  const form = read("features/authentication/components/auth-form.tsx");
  const action = read("features/authentication/services/actions.ts");

  assert.doesNotMatch(form, /name="firstName"/);
  assert.doesNotMatch(form, /name="lastName"/);
  assert.doesNotMatch(action, /parsed\.data\.firstName/);
  assert.doesNotMatch(action, /parsed\.data\.lastName/);
});

test("account profile still edits first and last name separately", () => {
  const profile = read("features/account/components/profile-form.tsx");

  assert.match(profile, /profile-first-name/);
  assert.match(profile, /profile-last-name/);
  assert.match(profile, /first_name: firstName/);
  assert.match(profile, /last_name: lastName/);
});

test("five-step completion records the final onboarding state and requires names", () => {
  const migration = read(
    "supabase/migrations/20260923171356_onboarding_name_step.sql",
  );

  assert.match(migration, /onboarding_step = 5/);
  assert.match(migration, /btrim\(first_name\) <> ''/);
  assert.match(migration, /btrim\(last_name\) <> ''/);
});
