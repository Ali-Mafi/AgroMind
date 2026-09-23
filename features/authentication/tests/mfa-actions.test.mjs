import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "../../weather/tests/helpers/load-ts.mjs";

function harness({ level = "aal2", statusError = null, statusThrow, cleanupError = null } = {}) {
  const calls = [];
  const mfa = {
    listFactors: async () => ({ data: { all: [{ id: "factor-a", factor_type: "totp", status: "verified" }], totp: [{ id: "factor-a", factor_type: "totp", status: "verified" }] }, error: null }),
    getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: level, nextLevel: "aal2" }, error: null }),
    unenroll: async ({ factorId }) => { calls.push(["totp", factorId]); return { error: null }; },
    recoveryCodes: {
      getStatus: async () => {
        calls.push(["status"]);
        if (statusThrow) throw statusThrow;
        return { data: { total: 10, remaining: 8 }, error: statusError };
      },
      unenroll: async () => { calls.push(["recovery"]); return { error: cleanupError }; },
    },
  };
  const actions = loadTs("features/authentication/services/mfa-actions.ts", {
    "@/lib/supabase/server": { createClient: async () => ({ rpc: async () => ({data:{created_at:"2026-09-16"},error:null}), auth: {
      mfa, refreshSession: async () => { calls.push(["refresh"]); return { error: null }; },
    } }) },
    "./fresh-auth": { verifyFreshIdentity: async () => null },
    "./session": { currentUser: async () => ({ id: "user-a", email_confirmed_at: "2026-09-14" }) },
    "next/cache": { revalidatePath: () => {} },
  });
  const form = new FormData();
  form.set("factor_id", "factor-a");
  return { calls, actions, disable: () => actions.disableTotpAction({}, form) };
}

test("missing hosted recovery endpoint does not block verified TOTP removal", async () => {
  for (const statusError of [
    { code: "validation_failed", status: 404 },
    { code: "not_implemented", status: 501 },
    { code: "mfa_recovery_codes_enroll_not_enabled", status: 403 },
    { code: "mfa_factor_not_found", status: 404 },
  ]) {
    const h = harness({ statusError });
    assert.match((await h.disable()).success, /disabled/);
    assert.deepEqual(h.calls, [["status"], ["totp", "factor-a"], ["refresh"]]);
  }
});

test("provider outages and authorization errors cannot skip recovery cleanup", async (t) => {
  t.mock.method(console, "error", () => {});
  for (const statusError of [
    { code: "validation_failed", status: 400 },
    { code: "unexpected_failure", status: 404 },
    { code: "unexpected_failure", status: 500 },
    { code: "session_expired", status: 401 },
    { code: "insufficient_aal", status: 403 },
    { code: "over_request_rate_limit", status: 429 },
  ]) {
    const h = harness({ statusError });
    assert.ok((await h.disable()).error);
    assert.deepEqual(h.calls, [["status"]]);
  }
  const network = harness({ statusThrow: new Error("Network unavailable") });
  assert.ok((await network.disable()).error);
  assert.deepEqual(network.calls, [["status"]]);
});

test("AAL1 cannot remove factors; existing codes are revoked before TOTP", async (t) => {
  t.mock.method(console, "error", () => {});
  const low = harness({ level: "aal1" });
  assert.ok((await low.disable()).error);
  assert.deepEqual(low.calls, []);
  const ready = harness();
  assert.ok((await ready.disable()).success);
  assert.deepEqual(ready.calls, [["status"], ["recovery"], ["totp", "factor-a"], ["refresh"]]);
  const failed = harness({ cleanupError: { code: "unexpected_failure", status: 500 } });
  assert.ok((await failed.disable()).error);
  assert.deepEqual(failed.calls, [["status"], ["recovery"]]);
});

test("known missing capability is shown honestly without logging a runtime error", async (t) => {
  const log = t.mock.method(console, "error", () => {});
  const h = harness({ statusError: { code: "validation_failed", status: 404 } });
  const state = await h.actions.readMfaSecurityState();
  assert.equal(state.enabled, true);
  assert.equal(state.recoveryCodes.available, false);
  assert.equal(state.recoveryCodes.enabled, false);
  assert.equal(log.mock.callCount(), 0);
});


test("adding a backup authenticator uses a distinct provider-friendly name", async () => {
  const calls = [];
  const primary = {
    id: "factor-primary",
    factor_type: "totp",
    status: "verified",
    friendly_name: "AgroMind Authenticator",
  };
  const mfa = {
    listFactors: async () => ({
      data: { all: [primary], totp: [primary] },
      error: null,
    }),
    unenroll: async () => ({ error: null }),
    enroll: async (options) => {
      calls.push(options);
      return {
        data: {
          id: "factor-backup",
          type: "totp",
          totp: {
            qr_code: "data:image/svg+xml;base64,PHN2Zy8+",
            secret: "TESTSECRET",
          },
        },
        error: null,
      };
    },
  };
  const actions = loadTs("features/authentication/services/mfa-actions.ts", {
    "@/lib/supabase/server": {
      createClient: async () => ({
        auth: { mfa },
      }),
    },
    "./fresh-auth": { verifyFreshIdentity: async () => null },
    "./session": {
      currentUser: async () => ({
        id: "user-a",
        email_confirmed_at: "2026-09-14",
      }),
    },
    "next/cache": { revalidatePath: () => {} },
  });

  const result = await actions.beginTotpEnrollmentAction(new FormData());
  assert.equal("error" in result, false);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    factorType: "totp",
    friendlyName: "AgroMind Backup Authenticator",
  });
});
