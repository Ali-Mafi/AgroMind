import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { loadTs, localRequire } from "../../weather/tests/helpers/load-ts.mjs";

const user = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "farmer@example.test",
  email_confirmed_at: "2026-10-25T00:00:00Z",
  factors: [],
};
const first = "00000000-0000-4000-8000-000000000011";
const second = "00000000-0000-4000-8000-000000000012";
const authenticator = { id: first, status: "verified", factor_type: "totp" };
const token = "a".repeat(64);
const password = "Fixture#2026";
const cookieName = "agromind_password_recovery";

process.env.SUPABASE_AUTH_EMAIL_HOOK_SECRET = "synthetic-email-hook-secret";
process.env.SUPABASE_SERVICE_ROLE_KEY = "synthetic-service-key";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fixture.example.test";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "synthetic-publishable-key";
const { recoveryRequestUrl, attestRecoveryEmail, readRecoveryEmail } = loadTs(
  "features/authentication/services/recovery-email-proof.ts",
);
const resetLinkProof = () => attestRecoveryEmail(recoveryRequestUrl(user.email), user.email, user.id, token);

function form(values) {
  const data = new FormData();
  for (const [name, value] of Object.entries(values)) data.set(name, value);
  return data;
}

function harness({ factors = [], level = "aal1" } = {}) {
  const calls = [];
  const jar = new Map();
  let attempt;
  const state = {
    current: { ...user, factors },
    session: first,
    otpError: null,
    updateError: null,
    verifiedSession: first,
    signOutError: null,
  };
  const client = {
    auth: {
      getClaims: async (accessToken) => ({
        data: { claims: {
          sub: state.current.id,
          session_id: accessToken === "verified-totp" ? state.verifiedSession : state.session,
          aal: accessToken === "verified-totp" ? "aal2" : level,
        } },
        error: null,
      }),
      getUser: async () => ({ data: { user: state.current } }),
      setSession: async () => ({ data: { user: state.current } }),
      verifyOtp: async (args) => {
        calls.push(["otp", args]);
        return { data: { user, session: { access_token: "verified-email", refresh_token: "fixture-refresh" } }, error: state.otpError };
      },
      mfa: {
        challengeAndVerify: async ({ code }) => {
          calls.push(["totp"]);
          return code === "123456"
            ? { data: { access_token: "verified-totp" } }
            : { error: { code: "mfa_verification_failed" } };
        },
      },
      updateUser: async () => {
        calls.push(["update"]);
        if (state.updateError instanceof Error) throw state.updateError;
        return { data: { user: state.current }, error: state.updateError };
      },
      signOut: async (args) => {
        calls.push(["logout", args.scope]);
        return { error: state.signOutError };
      },
    },
  };
  const backend = {
    async rpc(name, args) {
      calls.push([name]);
      if (name === "issue_password_recovery") {
        if (attempt) return { data: false };
        attempt = args;
        return { data: true };
      }
      const active = attempt && args.p_user === attempt.p_user &&
        args.p_session === attempt.p_session && args.p_hash === attempt.p_hash &&
        !state.expired && !state.consumed;
      if (active && name === "consume_password_recovery") state.consumed = true;
      return { data: Boolean(active) };
    },
  };
  const mocks = {
    "@/lib/supabase/server": { createClient: async () => client },
    "@supabase/supabase-js": { createClient: (_url, key) => key === "synthetic-service-key" ? backend : client },
    "next/headers": {
      cookies: async () => ({
        get: (name) => jar.get(name),
        set: (name, value, options) => jar.set(name, { value, ...options }),
      }),
    },
    "next/cache": { revalidatePath: () => {} },
    "next/navigation": {
      redirect: (to) => { throw new Error("REDIRECT:" + to); },
    },
  };
  const actions = loadTs("features/authentication/services/actions.ts", mocks);
  const open = async () => {
    await assert.rejects(
      actions.verifyEmailAction({}, form({ type: "recovery", token_hash: token, recovery_proof: resetLinkProof() })),
      /REDIRECT:\/reset-password/,
    );
    const cookie = jar.get(cookieName);
    assert.equal(cookie.httpOnly, true);
    assert.equal(cookie.sameSite, "strict");
    return createHash("sha256").update(cookie.value).digest("hex");
  };
  const reset = (attemptToken = "stale", values = {}) => actions.resetPasswordAction(
    {},
    form({ password, confirmPassword: password, recovery_attempt: attemptToken, ...values }),
  );
  return { actions, calls, mocks, state, open, reset };
}

test("only app-requested, matching and unexpired signed email proofs are accepted", () => {
  const url = recoveryRequestUrl(user.email);
  assert.equal(attestRecoveryEmail(url, "other@example.test", user.id, token), null);
  assert.equal(attestRecoveryEmail("https://agromind.ir/auth/callback", user.email, user.id, token), null);
  const proof = resetLinkProof();
  assert.equal(readRecoveryEmail(token, proof).userId, user.id);
  assert.equal(readRecoveryEmail("b".repeat(64), proof), null);
  assert.equal(readRecoveryEmail(token, proof.replace(user.id, second)), null);
  const originalNow = Date.now;
  Date.now = () => originalNow() + 60 * 60 * 1000;
  try {
    assert.equal(readRecoveryEmail(token, proof), null);
    assert.equal(attestRecoveryEmail(url, user.email, user.id, token), null);
  } finally {
    Date.now = originalNow;
  }
});

test("the recovery callback is scanner-safe and cannot mint proof from query flags or an exchange", async () => {
  const h = harness();
  const { NextRequest } = localRequire("next/server");
  const { handleAuthCallback } = loadTs("features/authentication/services/callback.ts", h.mocks);
  const proof = resetLinkProof();
  const base = "https://agromind.ir/auth/callback?type=recovery&";
  const valid = await handleAuthCallback(new NextRequest(base + "token_hash=" + token + "&proof=" + proof));
  assert.match(valid.headers.get("location"), /\/reset-password\?token_hash=/);
  assert.equal(valid.headers.get("referrer-policy"), "no-referrer");
  for (const query of ["code=legacy", "token_hash=" + token, "token_hash=" + token + "&proof=forged"]) {
    const result = await handleAuthCallback(new NextRequest(base + query));
    assert.match(result.headers.get("location"), /\/reset-password\?status=invalid$/);
  }
  assert.deepEqual(h.calls, []);
});

test("email provenance and a successful, matching provider OTP are both required", async () => {
  const h = harness();
  const verify = (proof) => h.actions.verifyEmailAction({}, form({
    type: "recovery", token_hash: token, recovery_proof: proof,
  }));
  assert.match((await verify("forged")).error, /invalid/);
  assert.equal(h.calls.length, 0);
  h.state.otpError = { code: "otp_expired" };
  assert.match((await verify(resetLinkProof())).error, /expired or was already used/);
  assert.equal(h.calls.some(([name]) => name === "issue_password_recovery"), false);
  h.state.otpError = null;
  h.state.current = { ...user, id: second };
  assert.match((await verify(resetLinkProof())).error, /invalid/);
  assert.equal(h.calls.some(([name]) => name === "issue_password_recovery"), false);
});

test("ordinary AAL1 and AAL2 actions, stale forms, switched accounts and expired grants are denied", async () => {
  for (const level of ["aal1", "aal2"]) {
    const h = harness({ level });
    assert.equal((await h.reset()).recoveryEnded, true);
    assert.deepEqual(h.calls, []);
    const attempt = await h.open();
    assert.equal((await h.reset("stale")).recoveryEnded, true);
    h.state.session = second;
    assert.equal((await h.reset(attempt)).recoveryEnded, true);
    h.state.session = first;
    h.state.current = { ...user, id: second };
    assert.equal((await h.reset(attempt)).recoveryEnded, true);
    h.state.current = user;
    h.state.expired = true;
    assert.equal((await h.reset(attempt)).recoveryEnded, true);
    assert.equal(h.calls.some(([name]) => name === "update" || name === "logout"), false);
  }
});

test("fresh TOTP is required even at AAL2 and the attempt is consumed before mutation", async () => {
  const h = harness({ factors: [authenticator], level: "aal2" });
  const attempt = await h.open();
  assert.match((await h.reset(attempt)).error, /code is not valid/);
  assert.match((await h.reset(attempt, { factor_id: second, code: "123456" })).error, /code is not valid/);
  assert.match((await h.reset(attempt, { factor_id: first, code: "000000" })).error, /code is not valid/);
  h.state.verifiedSession = second;
  assert.match((await h.reset(attempt, { factor_id: first, code: "123456" })).error, /code is not valid/);
  assert.equal(h.calls.some(([name]) => name === "consume_password_recovery"), false);
  h.state.verifiedSession = first;
  await assert.rejects(h.reset(attempt, { factor_id: first, code: "123456" }), /password-updated/);
  assert.deepEqual(h.calls.slice(-4), [
    ["totp"], ["consume_password_recovery"], ["update"], ["logout", "global"],
  ]);
  assert.equal((await h.reset(attempt)).recoveryEnded, true);
  assert.equal(h.calls.filter(([name]) => name === "update").length, 1);
});

test("a rejected or uncertain update never retries or restores a consumed email grant", async () => {
  for (const updateError of [{ code: "same_password" }, new Error("network failure")]) {
    const h = harness();
    const attempt = await h.open();
    h.state.updateError = updateError;
    assert.equal((await h.reset(attempt)).recoveryEnded, true);
    assert.match((await h.reset(attempt)).error, /expired/);
    assert.equal(h.calls.filter(([name]) => name === "update").length, 1);
    assert.equal(h.calls.some(([name]) => name === "logout"), false);
  }
  const h = harness();
  const attempt = await h.open();
  h.state.signOutError = { code: "unexpected_failure" };
  const result = await h.reset(attempt);
  assert.match(result.success, /Sign out from your account/);
  assert.equal(result.recoveryEnded, true);
});
