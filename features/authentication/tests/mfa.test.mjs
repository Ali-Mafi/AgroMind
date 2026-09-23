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

test("sign-in checks MFA before protected profile reads", () => {
  const session = source("features/authentication/services/session.ts");
  const actions = source("features/authentication/services/actions.ts");
  const authEntry = source("features/authentication/components/auth-entry.tsx");

  assert.ok(
    session.indexOf("needsSecondFactor()") < session.indexOf('.from("profiles")'),
    "authenticatedDestination must route aal1 MFA sessions before reading profiles",
  );
  assert.ok(
    actions.indexOf("getAuthenticatorAssuranceLevel") < actions.indexOf('.from("profiles")'),
    "signInAction must check AAL before reading profiles",
  );
  assert.match(actions, /mfaDestination\s*=\s*`\/mfa\?next=/);
  assert.match(authEntry, /authenticatedDestination\(next\)/);
});

test("account security and MFA challenge routes are wired", () => {
  const shell = source("features/account/components/account-overview.tsx");
  const proxy = source("proxy.ts");
  const challenge = source("features/authentication/components/mfa-challenge.tsx");
  assert.match(shell, /\/account\/security/);
  assert.match(proxy, /["']\/mfa["']/);
  assert.match(challenge, /autoComplete=["']one-time-code["']/);
  assert.match(challenge, /pattern=["']\[0-9\]\{6\}["']/);
});


test("account security actions use a focused modal flow instead of appending setup forms to the page", () => {
  const security = source("features/account/components/security-center.tsx");
  const dialog = source("features/account/components/security-action-dialog.tsx");
  const css = source("components/layout/app-shell.css");

  assert.match(security, /<SecurityActionDialog/);
  assert.match(security, /<FreshIdentityFields state=\{initialState\}/);
  assert.match(security, /Scan the QR code/);
  assert.doesNotMatch(security, /Authenticator name/);
  assert.doesNotMatch(security, /name=["']friendly_name["']/);

  assert.match(dialog, /<dialog/);
  assert.match(dialog, /showModal\(\)/);
  assert.match(dialog, /onCancel=/);
  assert.match(css, /\.security-action-dialog/);
  assert.match(css, /@media \(max-width: 639px\)/);
  assert.match(css, /prefers-reduced-motion/);
});


test("security dialog primary actions are explicit submit buttons", () => {
  const security = source("features/account/components/security-center.tsx");
  const submitButtons = [...security.matchAll(/<Button\s+type=["']submit["']/g)];
  assert.ok(
    submitButtons.length >= 3,
    "fresh identity, enrollment verification and generic security actions must submit their forms",
  );
});


test("security setup keeps mobile controls reachable after fresh identity confirmation", () => {
  const security = source("features/account/components/security-center.tsx");
  const css = source("components/layout/app-shell.css");

  assert.match(security, /document\.activeElement\.blur\(\)/);
  assert.ok(
    [...security.matchAll(/security-action-dialog__actions/g)].length >= 3,
    "security dialog action rows should use the sticky footer treatment",
  );
  assert.match(css, /\.security-action-dialog\[open\]\s*\{[\s\S]*grid-template-rows:\s*auto minmax\(0, 1fr\)/);
  assert.match(css, /\.security-action-dialog__body\s*\{[\s\S]*overflow-y:\s*auto/);
  assert.match(css, /-webkit-overflow-scrolling:\s*touch/);
  assert.match(css, /\.security-action-dialog__actions\s*\{[\s\S]*position:\s*sticky/);
});


test("security sheet exposes the final action and shows loading feedback on iOS", () => {
  const security = source("features/account/components/security-center.tsx");
  const css = source("components/layout/app-shell.css");

  assert.ok(
    [...security.matchAll(/LoaderCircle/g)].length >= 3,
    "security submit actions should show a spinner while busy",
  );
  assert.ok(
    [...security.matchAll(/aria-busy=\{busy\}/g)].length >= 3,
    "security submit actions should expose busy state",
  );
  assert.match(css, /\.security-action-dialog__actions\s*\{[\s\S]*bottom:\s*0/);
  assert.doesNotMatch(css, /\.security-action-dialog__actions\s*\{[\s\S]*\n\s*bottom:\s*-1\.25rem/);
  assert.match(
    css,
    /@media \(max-width: 639px\)[\s\S]*\.security-action-dialog--sheet\s*\{[\s\S]*safe-area-inset-top[\s\S]*safe-area-inset-bottom/,
  );
  assert.match(css, /scroll-padding-bottom:\s*5\.5rem/);
});


test("fresh identity confirmation uses a compact popup while QR setup keeps the scrollable sheet", () => {
  const security = source("features/account/components/security-center.tsx");
  const dialog = source("features/account/components/security-action-dialog.tsx");
  const css = source("components/layout/app-shell.css");

  assert.match(dialog, /variant\?: ["']compact["'] \| ["']sheet["']/);
  assert.match(
    security,
    /variant=\{setup \|\| backupCodes\.length \? ["']sheet["'] : ["']compact["']\}/,
  );
  assert.match(
    css,
    /\.security-action-dialog--compact\s*\{[\s\S]*height:\s*auto[\s\S]*translate:\s*-50% -50%/,
  );
  assert.match(
    css,
    /\.security-action-dialog--compact \.security-action-dialog__actions\s*\{[\s\S]*position:\s*static/,
  );
});


test("security confirmation renders as a true compact popup and busy state is event-driven", () => {
  const security = source("features/account/components/security-center.tsx");
  const css = source("components/layout/app-shell.css");

  assert.ok(
    [...security.matchAll(/onSubmit=\{/g)].length >= 3,
    "security forms should use explicit onSubmit handlers so busy state can paint before async work",
  );
  assert.match(security, /setBusy\(true\)/);
  assert.match(security, /LoaderCircle/);
  assert.match(
    css,
    /\.security-action-dialog--compact\s*\{[\s\S]*top:\s*50%[\s\S]*left:\s*50%[\s\S]*translate:\s*-50% -50%/,
  );
  assert.match(
    css,
    /\.security-action-dialog--compact\[open\]\s*\{[\s\S]*display:\s*block/,
  );
});


test("security submit loading state uses spinner only", () => {
  const security = source("features/account/components/security-center.tsx");
  assert.doesNotMatch(security, /Please wait…/);
  assert.ok(
    [...security.matchAll(/\{busy \? \(/g)].length >= 3,
    "security submit buttons should swap their label for a spinner while busy",
  );
});
