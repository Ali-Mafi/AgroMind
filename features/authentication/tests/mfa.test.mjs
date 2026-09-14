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

test("TOTP setup handles provider failures defensively and exposes a manual-key copy control", () => {
  const actions = source("features/authentication/services/mfa-actions.ts");
  const security = source("features/account/components/security-center.tsx");
  assert.match(actions, /totp-enroll-invalid-response/);
  assert.match(actions, /mfa_ip_address_mismatch/);
  assert.match(security, /navigator\.clipboard/);
  assert.match(security, /copy\(setup\.secret,\s*["']secret["']\)/);
});

test("recovery codes are experimental, one-time UI values and can satisfy the MFA challenge", () => {
  const server = source("lib/supabase/server.ts");
  const actions = source("features/authentication/services/mfa-actions.ts");
  const security = source("features/account/components/security-center.tsx");
  const challenge = source("features/authentication/components/mfa-challenge.tsx");
  assert.match(server, /recoveryCodes:\s*true/);
  assert.match(actions, /recoveryCodes\.generate/);
  assert.match(actions, /recoveryCodes\.regenerate/);
  assert.match(actions, /recoveryCodes\.verify/);
  assert.match(actions, /recoveryCodes\.getStatus/);
  assert.match(security, /Copy all backup codes/);
  assert.match(challenge, /Use a backup code/);
  assert.match(challenge, /verifyRecoveryCodeAction/);
  assert.doesNotMatch(actions, /codes.*console|console.*codes/i);
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
