import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Execute the installed SDK with an in-memory session and transport. These are
// wire-contract tests, NOT hosted Auth enforcement or JWT-signature verification.
// No network, live key, real user, or application authorization is involved.
function boundary({ status = 200, body } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const user = { id: "11111111-1111-4111-8111-111111111111", aud: "authenticated", email: "fixture@example.test" };
  const encoded = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = `${encoded({ alg: "HS256", typ: "JWT" })}.${encoded({
    sub: user.id, role: "authenticated", exp: now + 3600, iat: now - 3600,
    session_id: "22222222-2222-4222-8222-222222222222", aal: "aal2",
    amr: [{ method: "totp", timestamp: now - 3600 }],
  })}.c3ludGhldGlj`;
  const key = `boundary-${randomUUID()}`;
  const storage = new Map([[key, JSON.stringify({
    access_token: token, refresh_token: "synthetic-refresh", token_type: "bearer",
    expires_at: now + 3600, expires_in: 3600, user,
  })]]);
  const requests = [];
  const client = createClient("https://provider-boundary.invalid", "public-fixture-key", {
    global: { fetch: async (input, init) => {
      const url = new URL(String(input));
      assert.equal(url.origin, "https://provider-boundary.invalid");
      requests.push({ url, method: init.method, headers: new Headers(init.headers), body: init.body });
      return new Response(status === 204 ? null : JSON.stringify(body ?? user), {
        status, headers: { "content-type": "application/json", "x-supabase-api-version": "2024-01-01" },
      });
    } },
    auth: {
      storageKey: key, persistSession: true, autoRefreshToken: false, detectSessionInUrl: false,
      storage: {
        getItem: name => storage.get(name) ?? null,
        setItem: (name, value) => storage.set(name, value),
        removeItem: name => storage.delete(name),
      },
    },
  });
  return { client, requests, token, user };
}

test("F01 installed SDK sends stale-AAL2 password mutation directly without an AgroMind grant", async () => {
  const h = boundary();
  const result = await h.client.auth.updateUser({ password: "Synthetic#Password9" });
  assert.equal(result.error, null);
  assert.equal(h.requests.length, 1);
  const [request] = h.requests;
  assert.equal(request.method, "PUT");
  assert.equal(request.url.pathname, "/auth/v1/user");
  assert.equal(request.headers.get("authorization"), `Bearer ${h.token}`);
  assert.deepEqual(JSON.parse(request.body), {
    password: "Synthetic#Password9", code_challenge: null, code_challenge_method: null,
  });
});

test("F01 installed SDK forwards native current-password and nonce proofs without app authorization", async () => {
  const h = boundary();
  await h.client.auth.updateUser({ password: "Synthetic#Password9", current_password: "Synthetic#Old9", nonce: "1234567890" });
  assert.equal(h.requests.length, 1);
  const sent = JSON.parse(h.requests[0].body);
  assert.equal(sent.current_password, "Synthetic#Old9");
  assert.equal(sent.nonce, "1234567890");
  assert.equal(sent.fresh_code, undefined);
  assert.equal(sent.operation_id, undefined);
});

test("F01 installed SDK's error-free update alone does not prove a matching user response", async () => {
  const h = boundary({ body: {} });
  const result = await h.client.auth.updateUser({ password: "Synthetic#Password9" });
  assert.equal(result.error, null);
  assert.equal(result.data.user.id, undefined);
});

test("F01 installed SDK surfaces native policy rejection and uncertain server failure separately", async () => {
  for (const [status, code] of [[400, "current_password_required"], [500, "current_password_required"]]) {
    const h = boundary({ status, body: { code, msg: "Synthetic provider result" } });
    const result = await h.client.auth.updateUser({ password: "Synthetic#Password9" });
    assert.ok(result.error);
    assert.equal(result.data.user, null);
    assert.equal(result.error.code, status === 400 ? code : undefined);
  }
});

test("F02 installed SDK sends others/global native logout with bearer and scope only", async () => {
  for (const scope of ["others", "global"]) {
    const h = boundary({ status: 204 });
    assert.equal((await h.client.auth.signOut({ scope })).error, null);
    assert.equal(h.requests.length, 1);
    const [request] = h.requests;
    assert.equal(request.method, "POST");
    assert.equal(request.url.pathname, "/auth/v1/logout");
    assert.equal(request.url.search, `?scope=${scope}`);
    assert.equal(request.headers.get("authorization"), `Bearer ${h.token}`);
    assert.equal(request.body, undefined);
    const remaining = (await h.client.auth.getSession()).data.session;
    assert.equal(Boolean(remaining), scope === "others");
  }
});

test("F02 installed SDK suppresses native 401/403/404; null error cannot certify remote revocation", async () => {
  for (const scope of ["others", "global"]) {
    for (const status of [401, 403, 404]) {
      const h = boundary({ status, body: { code: "session_not_found", msg: "Synthetic missing session" } });
      assert.equal((await h.client.auth.signOut({ scope })).error, null);
      assert.equal(h.requests.length, 1);
    }
  }
});
