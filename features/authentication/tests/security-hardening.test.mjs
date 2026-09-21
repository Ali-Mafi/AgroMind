import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "../../weather/tests/helpers/load-ts.mjs";
const form = (values = {}) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
};
const user = {
  id: "user-a",
  email: "owner@example.test",
  email_confirmed_at: "2026-09-16",
};
function harness({ level = "aal2", two = true } = {}) {
  let factors = [
    {
      id: "primary",
      factor_type: "totp",
      status: "verified",
      friendly_name: "Primary",
    },
    ...(two
      ? [
          {
            id: "backup",
            factor_type: "totp",
            status: "verified",
            friendly_name: "Backup",
          },
        ]
      : []),
  ];
  const calls = [];
  const client = {
    rpc: async () => ({ data: { created_at: "2026-09-16" }, error: null }),
    auth: {
      refreshSession: async () => ({ error: null }),
      signOut: async ({ scope }) => {
        calls.push(["signOut", scope]);
        return { error: null };
      },
      mfa: {
        listFactors: async () => ({
          data: {
            all: factors,
            totp: factors.filter((f) => f.status === "verified"),
          },
          error: null,
        }),
        getAuthenticatorAssuranceLevel: async () => ({
          data: {
            currentLevel: level,
            nextLevel: factors.some((f) => f.status === "verified")
              ? "aal2"
              : "aal1",
          },
          error: null,
        }),
        challengeAndVerify: async ({ factorId, code }) => {
          calls.push(["challenge", factorId]);
          if (
            !factors.some((f) => f.id === factorId) ||
            code !== (factorId === "backup" ? "222222" : "111111")
          )
            return { error: { code: "invalid" } };
          level = "aal2";
          return { error: null, data: {} };
        },
        unenroll: async ({ factorId }) => {
          calls.push(["remove", factorId]);
          factors = factors.filter((f) => f.id !== factorId);
          return { error: null };
        },
        enroll: async () => {
          factors.push({
            id: "pending",
            factor_type: "totp",
            status: "unverified",
          });
          return {
            data: {
              id: "pending",
              type: "totp",
              totp: {
                secret: "TEST_SECRET",
                qr_code: "data:image/svg+xml,test",
              },
            },
            error: null,
          };
        },
        recoveryCodes: {
          getStatus: async () => ({
            error: { code: "mfa_factor_not_found", status: 404 },
          }),
          unenroll: async () => {
            calls.push(["recoveryRemove"]);
            return { error: null };
          },
        },
      },
    },
  };
  const actions = loadTs("features/authentication/services/mfa-actions.ts", {
    "@/lib/supabase/server": { createClient: async () => client },
    "./session": { currentUser: async () => user },
    "next/cache": { revalidatePath: () => {} },
    "next/navigation": {
      redirect: (path) => {
        throw new Error("REDIRECT:" + path);
      },
    },
  });
  return { actions, client, calls, factors: () => factors };
}
const backupProof = { proof_factor_id: "backup", fresh_code: "222222" };

test("AAL2 alone and a foreign factor cannot authorize sensitive changes", async () => {
  const h = harness();
  for (const proof of [
    {},
    { proof_factor_id: "foreign", fresh_code: "222222" },
    { ...backupProof, fresh_code: "000000" },
  ]) {
    assert.ok(
      (
        await h.actions.disableTotpAction(
          {},
          form({ factor_id: "primary", ...proof }),
        )
      ).error,
    );
    assert.equal(h.factors().length, 2);
    assert.ok(
      (
        await h.actions.signOutSessionsAction(
          {},
          form({ scope: "global", ...proof }),
        )
      ).error,
    );
  }
  assert.equal(
    h.calls.some((c) => c[0] === "remove" || c[0] === "signOut"),
    false,
  );
});

test("backup TOTP recovers AAL1 login and removes the lost primary without disabling MFA", async () => {
  const h = harness({ level: "aal1" });
  await assert.rejects(
    h.actions.verifyMfaChallengeAction(
      {},
      form({ factor_id: "backup", code: "222222", next: "/account/security" }),
    ),
    /REDIRECT:\/account\/security/,
  );
  const result = await h.actions.disableTotpAction(
    {},
    form({ factor_id: "primary", remove_only: "true", ...backupProof }),
  );
  assert.match(result.success, /other authenticator remains active/);
  assert.deepEqual(
    h.factors().map((f) => f.id),
    ["backup"],
  );
  assert.equal(
    h.calls.some((c) => c[0] === "recoveryRemove"),
    false,
  );
});

test("disable all authenticators requires fresh proof and removes each owned factor", async () => {
  const h = harness();
  assert.ok(
    (
      await h.actions.disableTotpAction(
        {},
        form({ factor_id: "primary", ...backupProof }),
      )
    ).success,
  );
  assert.equal(h.factors().length, 0);
  assert.deepEqual(
    h.calls.filter((c) => c[0] === "remove"),
    [
      ["remove", "primary"],
      ["remove", "backup"],
    ],
  );
});

test("cancel cannot remove verified factors; restarting discards an incomplete enrollment", async () => {
  const h = harness({ two: false });
  const proof = { proof_factor_id: "primary", fresh_code: "111111" };
  assert.ok((await h.actions.cancelTotpEnrollmentAction("primary")).error);
  assert.ok((await h.actions.beginTotpEnrollmentAction(form(proof))).factorId);
  assert.ok((await h.actions.beginTotpEnrollmentAction(form(proof))).factorId);
  assert.equal(h.factors().filter((f) => f.status === "unverified").length, 1);
  assert.ok((await h.actions.cancelTotpEnrollmentAction("pending")).success);
  assert.deepEqual(
    h.factors().map((f) => f.id),
    ["primary"],
  );
});

test("all and other-session logout use provider scopes only after fresh confirmation", async () => {
  const h = harness();
  assert.ok(
    (
      await h.actions.signOutSessionsAction(
        {},
        form({ scope: "others", ...backupProof }),
      )
    ).success,
  );
  await assert.rejects(
    h.actions.signOutSessionsAction(
      {},
      form({ scope: "global", ...backupProof }),
    ),
    /REDIRECT:\/sign-in/,
  );
  assert.deepEqual(
    h.calls.filter((c) => c[0] === "signOut"),
    [
      ["signOut", "others"],
      ["signOut", "global"],
    ],
  );
  assert.ok(
    (
      await h.actions.signOutSessionsAction(
        {},
        form({ scope: "selective", ...backupProof }),
      )
    ).error,
  );
});

test("disabled recovery provider cannot be used as a fake recovery or fresh-auth method", async () => {
  const h = harness();
  assert.ok(
    (await h.actions.generateRecoveryCodesAction(form(backupProof))).error,
  );
  assert.ok(
    (await h.actions.regenerateRecoveryCodesAction(form(backupProof))).error,
  );
  assert.ok(
    (
      await h.actions.verifyRecoveryCodeAction(
        {},
        form({ recovery_code: "not-a-real-code" }),
      )
    ).error,
  );
  assert.ok(
    (
      await h.actions.signOutSessionsAction(
        {},
        form({
          scope: "global",
          proof_method: "recovery",
          fresh_recovery_code: "not-a-real-code",
        }),
      )
    ).error,
  );
});

test("password-only reauthentication isolates and cleans its temporary session", async () => {
  const calls = [];
  let id = user.id;
  let enrolled = false;
  const isolated = {
    auth: {
      signInWithPassword: async (args) => {
        calls.push(args.email);
        return { data: { user: { id } }, error: null };
      },
      mfa: {
        listFactors: async () => ({
          data: { all: enrolled ? [{ status: "verified" }] : [] },
          error: null,
        }),
      },
      signOut: async (args) => {
        calls.push(args.scope);
        return { error: null };
      },
    },
  };
  const { verifyFreshIdentity } = loadTs(
    "features/authentication/services/fresh-auth.ts",
    {
      "@supabase/supabase-js": { createClient: () => isolated },
      "@/lib/supabase/config": {
        supabaseConfig: () => ({
          url: "https://example.test",
          key: "public-test-key",
        }),
      },
    },
  );
  const original = {
    auth: {
      mfa: {
        listFactors: async () => ({ data: { all: [], totp: [] }, error: null }),
      },
    },
  };
  const proof = form({ current_password: "test-only-passphrase" });
  assert.equal(await verifyFreshIdentity(original, user, proof), null);
  id = "other-user";
  assert.ok(await verifyFreshIdentity(original, user, proof));
  id = user.id;
  enrolled = true;
  assert.ok(await verifyFreshIdentity(original, user, proof));
  assert.deepEqual(calls, [
    user.email,
    "local",
    user.email,
    "local",
    user.email,
    "local",
  ]);
});
