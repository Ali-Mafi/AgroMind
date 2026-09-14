import test from "node:test";
import assert from "node:assert/strict";
import { loadTs, localRequire } from "../../weather/tests/helpers/load-ts.mjs";
import { localizedRenderer } from "../../settings/tests/helpers/render.mjs";

const { safeNextPath, isPrivatePath } = loadTs(
  "features/authentication/lib/redirects.ts",
);
const { signUpSchema } = loadTs("features/authentication/lib/validation.ts");

const form = (values) => {
  const value = new FormData();
  for (const [k, v] of Object.entries(values)) value.set(k, v);
  return value;
};

const signup = {
  username: "test_farmer",
  email: "farmer@example.test",
  password: "A long test passphrase",
  confirmPassword: "A long test passphrase",
  language: "fa",
};

function harness({
  error = null,
  user = {
    id: "user-a",
    email: signup.email,
    email_confirmed_at: "2026-09-13",
    identities: [{ id: "identity-a" }],
  },
  completed = false,
  usernameAvailable = true,
  pendingSignup = {
    email: signup.email,
    username: signup.username,
    watchToken: "watch-token",
  },
  pendingVerified = false,
} = {}) {
  const calls = [];
  const record =
    (name, result) =>
    async (...args) => {
      calls.push({ name, args });
      return result;
    };

  const client = {
    auth: {
      signUp: record("signUp", { data: { user, session: null }, error }),
      signInWithPassword: record("signIn", { data: { user }, error }),
      setSession: record("setSession", { data: { user }, error }),
      resetPasswordForEmail: record("forgot", { error }),
      resend: record("resend", { error }),
      verifyOtp: record("verify", { data: { user }, error }),
      getUser: record("getUser", { data: { user }, error }),
      updateUser: record("update", { data: { user }, error }),
      signOut: record("signOut", { error }),
      exchangeCodeForSession: record("exchange", { error }),
      mfa: {
        getAuthenticatorAssuranceLevel: record("assurance", {
          data: { currentLevel: "aal1", nextLevel: "aal1" },
          error: null,
        }),
      },
    },
    rpc: async (name, args) => {
      calls.push({ name: "rpc", args: [name, args] });
      if (name === "username_available") return { data: usernameAvailable, error: null };
      if (name === "pending_signup_verified") return { data: pendingVerified, error: null };
      return { data: null, error: null };
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { onboarding_completed: completed },
            error: null,
          }),
        }),
      }),
    }),
  };

  const pendingMocks = {
    createVerificationWatch: () => ({ token: "watch-token", hash: "a".repeat(64) }),
    rememberPendingSignup: record("rememberPending", undefined),
    readPendingSignup: async () => pendingSignup,
    clearPendingSignup: record("clearPending", undefined),
    hashVerificationWatch: () => "b".repeat(64),
  };

  const mocks = {
    "@/lib/supabase/server": { createClient: async () => client },
    "../lib/pending-signup": pendingMocks,
    "next/navigation": {
      redirect: (path) => {
        throw new Error("REDIRECT:" + path);
      },
    },
    "next/cache": { revalidatePath: () => {} },
  };

  return {
    calls,
    client,
    actions: loadTs("features/authentication/services/actions.ts", mocks),
    mocks,
  };
}

test("redirect allowlist rejects external, encoded, scheme-relative and path traversal targets", () => {
  for (const next of [
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/farms/../auth/callback",
    "/%2f%2fevil.test",
    "/dashboard?next=https://evil.test",
    "/sign-in",
    "/dashboard-malicious",
    "/farms/#token",
    null,
  ])
    assert.equal(safeNextPath(next), "/dashboard");
  for (const next of ["/farms/old_1/edit", "/account/profile", "/irrigation"])
    assert.equal(safeNextPath(next), next);
  for (const next of [
    "/dashboard",
    "/farms/a",
    "/irrigation",
    "/account",
    "/settings",
    "/onboarding",
  ])
    assert.equal(isPrivatePath(next), true);
  assert.equal(isPrivatePath("/dashboard-public"), false);
});

test("signup validates username, email and password without returning password values", async () => {
  const h = harness();
  for (const input of [
    { ...signup, email: "wrong" },
    { ...signup, username: "Bad Name" },
    { ...signup, password: "short" },
    { ...signup, confirmPassword: "different" },
  ]) {
    const state = await h.actions.signUpAction({}, form(input));
    assert.ok(state.fields);
    assert.equal(JSON.stringify(state).includes(signup.password), false);
  }
  assert.equal(h.calls.length, 0);
  assert.equal(signUpSchema.parse(signup).language, "fa");
  assert.equal(signUpSchema.parse({ ...signup, username: "TEST_FARMER" }).username, "test_farmer");
});

test("signup stores pending identity and rejects duplicate accounts explicitly", async () => {
  const h = harness();
  await assert.rejects(
    h.actions.signUpAction({}, form(signup)),
    /REDIRECT:\/verify-email\?status=pending/,
  );
  const sent = h.calls.find((call) => call.name === "signUp").args[0];
  assert.equal(sent.options.emailRedirectTo, "https://agromind.ir/auth/callback");
  assert.deepEqual(sent.options.data, {
    username: "test_farmer",
    full_name: "test_farmer",
    language: "fa",
    verification_watch_hash: "a".repeat(64),
  });
  assert.deepEqual(
    h.calls.find((call) => call.name === "rememberPending").args[0],
    {
      email: signup.email,
      username: signup.username,
      watchToken: "watch-token",
    },
  );

  const duplicate = harness({
    error: { code: "user_already_exists", status: 422, message: "private detail" },
  });
  assert.match(
    (await duplicate.actions.signUpAction({}, form(signup))).error,
    /already exists/i,
  );

  const hiddenDuplicate = harness({
    user: { id: "user-a", email: signup.email, identities: [] },
  });
  assert.match(
    (await hiddenDuplicate.actions.signUpAction({}, form(signup))).error,
    /already exists/i,
  );
});

test("signup fails closed if email confirmation was accidentally disabled", async () => {
  const h = harness();
  h.client.auth.signUp = async () => ({
    data: { user: { id: "user-a", identities: [{ id: "identity-a" }] }, session: {} },
    error: null,
  });
  const result = await h.actions.signUpAction({}, form(signup));
  assert.match(result.error, /unavailable/);
  assert.deepEqual(h.calls.find((call) => call.name === "signOut"), {
    name: "signOut",
    args: [{ scope: "local" }],
  });
});

test("login by email resumes onboarding and sanitizes the requested destination", async () => {
  for (const [completed, next, expected] of [
    [false, "/farms", "/onboarding"],
    [true, "/farms", "/farms"],
    [true, "//evil.test", "/dashboard"],
  ]) {
    const h = harness({ completed });
    await assert.rejects(
      h.actions.signInAction(
        {},
        form({ identifier: signup.email, password: signup.password, next }),
      ),
      (e) => e.message === "REDIRECT:" + expected,
    );
  }

  const h = harness({
    error: {
      code: "invalid_credentials",
      status: 400,
      message: "sensitive detail",
    },
  });
  assert.match(
    (
      await h.actions.signInAction(
        {},
        form({ identifier: signup.email, password: signup.password }),
      )
    ).error,
    /Email or password is incorrect/,
  );
});

test("forgot stays enumeration-safe and resend is restricted to pending signup", async () => {
  const results = [];
  for (const error of [
    null,
    { status: 400, code: "user_not_found" },
    { status: 429, code: "over_email_send_rate_limit" },
    { status: 500, code: "unexpected_failure" },
  ]) {
    const h = harness({ error });
    results.push(
      await h.actions.requestPasswordResetAction({}, form({ email: signup.email })),
    );
  }
  assert.deepEqual(results[0], results[1]);
  assert.deepEqual(results[0], results[2]);
  assert.deepEqual(results[0], results[3]);

  const pending = harness();
  assert.match(
    (await pending.actions.resendVerificationAction({}, new FormData())).success,
    /Verification email sent/,
  );
  assert.equal(
    pending.calls.find((call) => call.name === "resend").args[0].email,
    signup.email,
  );

  const noPending = harness({ pendingSignup: null });
  assert.match(
    (await noPending.actions.resendVerificationAction({}, form({ email: "other@example.test" }))).error,
    /after you create an account/,
  );
  assert.equal(noPending.calls.some((call) => call.name === "resend"), false);

  const h = harness();
  await h.actions.requestPasswordResetAction(
    {},
    form({ email: signup.email, website: "bot" }),
  );
  assert.equal(h.calls.length, 0);
});

test("pending verification status uses the opaque signup watch instead of an email lookup", async () => {
  const h = harness({ pendingVerified: true });
  assert.deepEqual(await h.actions.pendingVerificationStatusAction(), { verified: true });
  const statusCall = h.calls.find(
    (call) => call.name === "rpc" && call.args[0] === "pending_signup_verified",
  );
  assert.equal(statusCall.args[1].p_token_hash, "b".repeat(64));

  const noPending = harness({ pendingSignup: null });
  assert.deepEqual(await noPending.actions.pendingVerificationStatusAction(), { verified: false });
});

test("verification uses Supabase OTP verification and handles expired and invalid links", async () => {
  const h = harness();
  const token = "a".repeat(64);
  await assert.rejects(
    h.actions.verifyEmailAction(
      {},
      form({ token_hash: token, type: "recovery" }),
    ),
    /REDIRECT:\/reset-password/,
  );
  assert.deepEqual(h.calls.find((call) => call.name === "verify"), {
    name: "verify",
    args: [{ token_hash: token, type: "recovery" }],
  });
  assert.match(
    (await h.actions.verifyEmailAction({}, form({ token_hash: "bad" }))).error,
    /invalid/,
  );
  const expired = harness({ error: { code: "otp_expired", status: 403 } });
  assert.match(
    (await expired.actions.verifyEmailAction({}, form({ token_hash: token }))).error,
    /expired or was already used/,
  );
});

test("password reset requires the current account, then globally signs out", async () => {
  const h = harness();
  assert.match(
    (
      await h.actions.resetPasswordAction(
        {},
        form({ ...signup, expected_user_id: "other-user" }),
      )
    ).error,
    /account changed/,
  );
  assert.equal(h.calls.some((c) => c.name === "update"), false);
  await assert.rejects(
    h.actions.resetPasswordAction(
      {},
      form({ ...signup, expected_user_id: "user-a" }),
    ),
    /REDIRECT:\/sign-in\?status=password-updated/,
  );
  assert.deepEqual(h.calls.at(-1), {
    name: "signOut",
    args: [{ scope: "global" }],
  });
  const expired = harness({ user: null });
  assert.match(
    (await expired.actions.resetPasswordAction({}, form(signup))).error,
    /session has expired/,
  );
});

test("logout calls Supabase, reports failures safely, and does not pretend success", async () => {
  const h = harness();
  assert.deepEqual(await h.actions.logoutAction(), {});
  assert.deepEqual(h.calls[0], { name: "signOut", args: [{ scope: "local" }] });
  const failed = harness({ error: { message: "secret detail" } });
  assert.match((await failed.actions.logoutAction()).error, /unavailable/);
});

test("email callback does not consume scanner GETs or permit an external redirect", async () => {
  const h = harness();
  const { NextRequest } = localRequire("next/server");
  const { handleAuthCallback } = loadTs(
    "features/authentication/services/callback.ts",
    h.mocks,
  );
  const token = "b".repeat(64);
  const response = await handleAuthCallback(
    new NextRequest(
      "https://agromind.ir/auth/callback?token_hash=" +
        token +
        "&type=signup&next=https://evil.test",
    ),
  );
  const destination = new URL(response.headers.get("location"));
  assert.equal(destination.origin, "https://agromind.ir");
  assert.equal(destination.pathname, "/verify-email");
  assert.equal(destination.searchParams.get("token_hash"), token);
  assert.equal(h.calls.length, 0);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  const invalid = await handleAuthCallback(
    new NextRequest(
      "https://agromind.ir/auth/callback?token_hash=wrong&type=invite",
    ),
  );
  assert.match(invalid.headers.get("location"), /status=invalid/);
});

test("proxy denies a cookie without verified claims and preserves refreshed cookies on redirects", async () => {
  const { NextRequest } = localRequire("next/server");
  const { proxy } = loadTs("proxy.ts", {
    "@/lib/supabase/config": {
      isSupabaseConfigured: () => true,
      supabaseConfig: () => ({
        url: "https://test.supabase.co",
        key: "test-public",
      }),
      sessionCookieOptions: {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
      },
    },
    "@supabase/ssr": {
      createServerClient: (_url, _key, options) => ({
        auth: {
          getClaims: async () => {
            options.cookies.setAll(
              [{ name: "sb-session", value: "", options: { maxAge: 0 } }],
              {},
            );
            return { data: null, error: { message: "invalid" } };
          },
        },
      }),
    },
  });
  const response = await proxy(
    new NextRequest("https://agromind.ir/account/profile", {
      headers: { cookie: "sb-session=untrusted" },
    }),
  );
  assert.equal(new URL(response.headers.get("location")).pathname, "/sign-in");
  assert.match(response.headers.get("set-cookie"), /HttpOnly/i);
  assert.match(response.headers.get("cache-control"), /no-store/);
});

for (const language of ["en", "fa"])
  test(
    language +
      ": accessible forms render signup, signin, recovery and reset controls",
    () => {
      const { load, renderToStaticMarkup: render } = localizedRenderer({ language });
      const { AuthForm } = load("features/authentication/components/auth-form.tsx");
      const React = localRequire("react");
      for (const mode of [
        "sign-up",
        "sign-in",
        "forgot",
        "reset",
        "verify",
        "recovery",
      ]) {
        const html = render(React.createElement(AuthForm, { mode }));
        assert.match(html, /<form/);
        assert.match(html, /type="submit"/);
        if (["sign-up", "sign-in", "reset"].includes(mode)) {
          assert.match(html, /type="password"/);
          assert.match(html, /aria-pressed="false"/);
          assert.match(html, new RegExp('for="' + mode + '-password"'));
        }
        if (mode === "sign-up") {
          assert.match(html, /name="username"/);
          assert.match(html, /name="confirmPassword"/);
        }
        if (mode === "sign-in") assert.match(html, /name="identifier"/);
      }
    },
  );