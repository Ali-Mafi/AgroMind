import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { root } from "../../weather/tests/helpers/load-ts.mjs";

function source(file) {
  return readFileSync(path.join(root, file), "utf8");
}

test("TOTP enrollment uses Supabase MFA without exposing auth tokens to browser code", () => {
  const actions = source("features/authentication/services/mfa-actions.ts");
  assert.match(actions, /factorType:\s*["']totp["']/);
  assert.match(actions, /challengeAndVerify/);
  assert.match(actions, /mfa\.unenroll/);
  assert.doesNotMatch(actions, /service_role|SUPABASE_SERVICE|access_token/);
});

test("protected sessions require AAL2 after a verified factor is enrolled", () => {
  const session = source("features/authentication/services/session.ts");
  assert.match(session, /getAuthenticatorAssuranceLevel/);
  assert.match(session, /nextLevel === ["']aal2["']/);
  assert.match(session, /redirect\(["']\/mfa["']\)/);
});

test("account security and MFA challenge routes are wired", () => {
  const shell = source("features/account/components/account-shell.tsx");
  const proxy = source("proxy.ts");
  const challenge = source("features/authentication/components/mfa-challenge.tsx");
  assert.match(shell, /\/account\/security/);
  assert.match(proxy, /["']\/mfa["']/);
  assert.match(challenge, /autoComplete=["']one-time-code["']/);
  assert.match(challenge, /pattern=["']\[0-9\]\{6\}["']/);
});
