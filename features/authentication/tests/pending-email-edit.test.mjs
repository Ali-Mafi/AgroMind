import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { root } from "../../weather/tests/helpers/load-ts.mjs";

const read = (file) => readFileSync(path.join(root, file), "utf8");

test("pending verification shows an inline email edit control", () => {
  const source = read(
    "features/authentication/components/verification-pending.tsx",
  );

  assert.match(source, /Pencil/);
  assert.match(source, /aria-label=\{t\("Edit email"\)\}/);
  assert.match(source, /changePendingSignupEmailAction/);
  assert.match(source, /name="email"/);
  assert.match(source, /defaultValue=\{email\}/);
  assert.match(source, /Save and resend/);
});

test("pending email correction keeps the verification watch as authorization", () => {
  const actions = read("features/authentication/services/actions.ts");
  const migration = read(
    "supabase/migrations/20260923185414_pending_signup_email_edit.sql",
  );
  const handler = read(
    "supabase/functions/change-pending-email/handler.ts",
  );

  assert.match(actions, /hashVerificationWatch\(pending\.watchToken\)/);
  assert.match(actions, /rememberPendingSignup\(\{ \.\.\.pending, email \}\)/);
  assert.match(migration, /pending_signup_user_id/);
  assert.match(migration, /u\.email_confirmed_at is null/);
  assert.match(migration, /grant execute[\s\S]*service_role/);
  assert.match(migration, /revoke all[\s\S]*anon, authenticated/);
  assert.match(handler, /auth\.admin\.updateUserById/);
  assert.match(handler, /auth\.resend/);
  assert.match(handler, /pending_signup_expired/);
});
