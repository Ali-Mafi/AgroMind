import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "../../weather/tests/helpers/load-ts.mjs";
const { createUsernameLoginHandler } = loadTs(
  "supabase/functions/username-login/handler.ts",
);
const request = (payload) =>
  new Request("https://example.test/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
function harness({
  exists = true,
  limit = 10,
  limiterError = false,
  captchaSecret,
  captchaResult = {
    success: true,
    hostname: "agromind.ir",
    action: "username-login",
  },
} = {}) {
  const calls = [];
  let count = 0;
  const handler = createUsernameLoginHandler({
    hashKey: "test-only-hmac-key",
    captchaSecret,
    fetcher: async () => Response.json(captchaResult),
    admin: {
      rpc: async (name, args) => {
        calls.push([name, args.p_identifier_hash]);
        return { data: ++count <= limit, error: limiterError ? {} : null };
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => {
              calls.push(["lookup"]);
              return { data: exists ? { id: "user" } : null, error: null };
            },
          }),
        }),
      }),
      auth: {
        admin: {
          getUserById: async () => ({
            data: { user: { email: "owner@example.test" } },
            error: null,
          }),
        },
      },
    },
    auth: {
      auth: {
        signInWithPassword: async () => {
          calls.push(["password"]);
          return {
            data: { session: null },
            error: { code: "invalid_credentials", status: 400 },
          };
        },
      },
    },
  });
  return { handler, calls };
}
test("username abuse is limited before lookup, failures do not disclose account existence", async () => {
  for (const exists of [true, false]) {
    const h = harness({ exists, limit: 2 });
    for (let i = 0; i < 2; i++) {
      const r = await h.handler(
        request({ username: "target", password: "bad" }),
      );
      assert.equal(r.status, 401);
      assert.deepEqual(await r.json(), { error: "invalid_credentials" });
    }
    assert.equal(
      (await h.handler(request({ username: "target", password: "bad" })))
        .status,
      429,
    );
    assert.equal(h.calls.filter((c) => c[0] === "lookup").length, 2);
    assert.equal(h.calls.filter((c) => c[0] === "password").length, 2);
    for (const [, hash] of h.calls.filter(
      (c) => c[0] === "consume_username_login_attempt",
    ))
      assert.match(hash, /^[a-f0-9]{64}$/);
  }
});
test("broken limiter and oversized requests fail closed", async () => {
  const h = harness({ limiterError: true });
  assert.equal(
    (await h.handler(request({ username: "target", password: "bad" }))).status,
    503,
  );
  assert.equal(
    h.calls.some((c) => c[0] === "lookup"),
    false,
  );
  assert.equal(
    (
      await h.handler(
        request({ username: "target", password: "x".repeat(5000) }),
      )
    ).status,
    400,
  );
  assert.equal((await h.handler(request(null))).status, 400);
});
test("configured CAPTCHA requires a valid token, correct hostname and action", async () => {
  for (const captchaResult of [
    { success: false },
    { success: true, hostname: "evil.test", action: "username-login" },
    { success: true, hostname: "agromind.ir", action: "other" },
  ]) {
    const h = harness({ captchaSecret: "test-only", captchaResult });
    assert.equal(
      (
        await h.handler(
          request({
            username: "target",
            password: "bad",
            captcha_token: "test-token",
          }),
        )
      ).status,
      400,
    );
    assert.equal(
      h.calls.some((c) => c[0] === "lookup"),
      false,
    );
  }
  const h = harness({ captchaSecret: "test-only" });
  assert.equal(
    (await h.handler(request({ username: "target", password: "bad" }))).status,
    400,
  );
  assert.equal(
    (
      await h.handler(
        request({
          username: "target",
          password: "bad",
          captcha_token: "test-token",
        }),
      )
    ).status,
    401,
  );
});
