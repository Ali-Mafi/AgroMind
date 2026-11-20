import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server.js";
import * as ssr from "@supabase/ssr";
import { loadTs } from "../../weather/tests/helpers/load-ts.mjs";

const { createChunks, createServerClient, stringToBase64URL } = ssr;
const origin = "https://app.example.test";
const provider = "https://project.example.test";
const subject = "00000000-0000-4000-8000-000000000001";
const otherSubject = "00000000-0000-4000-8000-000000000002";
const original = "00000000-0000-4000-8000-000000000010";
const replacement = "00000000-0000-4000-8000-000000000020";
const config = {
  isSupabaseConfigured: () => true,
  sessionCookieOptions: { path: "/", httpOnly: true, sameSite: "lax", secure: true },
  supabaseConfig: () => ({ url: provider, key: "fixture-only" }),
};
const { pendingMfaCancellationCookie, sessionCookieName } = loadTs(
  "lib/supabase/session-cookies.ts",
);
const sessionName = sessionCookieName(provider);
const { POST: cancel } = loadTs("app/mfa/cancel/route.ts", {
  "@/lib/supabase/config": config,
});

function session(sessionId, { aal = "aal1", userId = subject, recovery = false } = {}) {
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const header = stringToBase64URL(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = stringToBase64URL(JSON.stringify({
    sub: userId, aal, session_id: sessionId, exp: expires,
    amr: [{ method: recovery ? "otp" : "password" }],
  }));
  return {
    access_token: [header, payload, "Zml4dHVyZQ"].join("."),
    refresh_token: "fixture-refresh-token",
    expires_at: expires,
    expires_in: 3600,
    token_type: "bearer",
    user: { id: userId, email_confirmed_at: "2026-11-20", factors: [
      { id: "fixture-factor", status: "verified", factor_type: "totp" },
    ] },
  };
}

function authCookies(data, chunkSize) {
  return createChunks(
    sessionName,
    "base64-" + stringToBase64URL(JSON.stringify(data)),
    chunkSize,
  );
}

function cookieHeader(cookies) {
  return cookies.map(({ name, value }) => name + "=" + value).join("; ");
}

function request(path, cookies, options) {
  return new NextRequest(origin + path, {
    ...options,
    headers: { host: new URL(origin).host, cookie: cookieHeader(cookies), ...options?.headers },
  });
}

function post(cookies, attempt, source = origin) {
  const body = new URLSearchParams({ attempt }).toString();
  return cancel(request("/mfa/cancel", cookies, {
    method: "POST",
    body,
    headers: {
      origin: source,
      "content-type": "application/x-www-form-urlencoded",
      "content-length": String(body.length),
    },
  }));
}

function app(cookies) {
  const calls = [];
  const mocks = {
    "./config": config,
    "@/lib/supabase/config": config,
    "next/headers": { cookies: async () => ({
      getAll: () => cookies.map((cookie) => ({ ...cookie })),
      set(name, value, options) {
        const index = cookies.findIndex((cookie) => cookie.name === name);
        if (index >= 0) cookies.splice(index, 1);
        if (options.maxAge !== 0) cookies.push({ name, value });
      },
    }) },
    "@supabase/ssr": {
      ...ssr,
      createServerClient(url, key, options) {
        return createServerClient(url, key, {
          ...options,
          global: { fetch: async (input, init) => {
            const path = new URL(input).pathname;
            calls.push(path);
            const accessToken = new Headers(init?.headers).get("authorization")?.slice(7);
            if (path === "/auth/v1/user") {
              const data = cookies
                .filter(({ name }) => name === sessionName || name.startsWith(sessionName + "."))
                .map(({ value }) => value).join("");
              const state = JSON.parse(Buffer.from(data.slice(7), "base64url").toString());
              assert.equal(accessToken, state.access_token);
              return Response.json(state.user);
            }
            if (path === "/rest/v1/rpc/get_current_session")
              return Response.json({ created_at: "2026-11-20" });
            if (path === "/auth/v1/token") {
              return Response.json(session(replacement, { userId: otherSubject, aal: "aal2" }));
            }
            assert.fail("Unexpected provider call to " + path);
          } },
        });
      },
    },
  };
  const cache = new Map();
  const { authenticatedDestination, currentUser } = loadTs(
    "features/authentication/services/session.ts", mocks, cache,
  );
  const { createClient } = loadTs("lib/supabase/server.ts", mocks, cache);
  const { proxy } = loadTs("proxy.ts", mocks, cache);
  return { calls, authenticatedDestination, currentUser, createClient, proxy };
}

test("normal MFA cancellation returns to sign-in across tabs without a provider mutation", async () => {
  const cookies = authCookies(session(original));
  const attempt = await pendingMfaCancellationCookie(cookies, sessionName);
  assert.equal(await app(cookies).authenticatedDestination(), "/mfa?next=%2Fdashboard");

  const response = await post(cookies, attempt);
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/sign-in");
  assert.match(response.headers.get("cache-control"), /no-store/);
  const [marker] = response.cookies.getAll();
  assert.equal(marker.name, attempt);
  assert.equal(marker.httpOnly, true);
  assert.equal(marker.sameSite, "lax");
  assert.equal(marker.secure, true);
  assert.equal(marker.path, "/");

  cookies.push(marker);
  for (const path of ["/sign-in", "/mfa", "/account"]) {
    const tab = app(cookies);
    assert.equal(await tab.authenticatedDestination(), null);
    const result = await tab.proxy(request(path, cookies));
    assert.equal(result.status, path === "/account" ? 307 : 200);
    assert.equal(result.headers.has("set-cookie"), false);
    assert.deepEqual(tab.calls, []);
  }
  assert.equal((await post(cookies, attempt)).headers.has("set-cookie"), false);
});

test("recovery cancellation leaves no authenticated app session for a reset submission", async () => {
  const cookies = authCookies(session(original, { recovery: true }));
  const attempt = await pendingMfaCancellationCookie(cookies, sessionName);
  assert.equal((await app(cookies).currentUser()).id, subject);
  const response = await post(cookies, attempt);
  cookies.push(...response.cookies.getAll());
  assert.equal(response.headers.get("location"), "/sign-in");

  const tab = app(cookies);
  assert.equal(await tab.currentUser(), null);
  const supabase = await tab.createClient();
  assert.equal((await supabase.auth.getUser()).data.user, null);
  assert.deepEqual(tab.calls, []);
});

test("account switching replaces chunked credentials and preserves unrelated PKCE cookies", async () => {
  const cookies = authCookies(session(original), 110);
  const pkce = { name: sessionName + "-code-verifier", value: "fixture-pkce" };
  cookies.push(pkce);
  const attempt = await pendingMfaCancellationCookie(cookies, sessionName);
  cookies.push(...(await post(cookies, attempt)).cookies.getAll());
  const tab = app(cookies);
  const supabase = await tab.createClient();
  assert.equal((await supabase.auth.getUser()).data.user, null);
  assert.deepEqual(cookies.find(({ name }) => name === pkce.name), pkce);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: "fixture@example.test",
    password: "fixture",
  });
  assert.equal(error, null);
  assert.equal(data.user.id, otherSubject);
  assert.equal((await app(cookies).currentUser()).id, otherSubject);
  assert.equal(cookies.some(({ name }) => name.startsWith(sessionName + ".")), false);
  assert.deepEqual(tab.calls, ["/auth/v1/token"]);
});

test("stale forms are harmless after MFA, a new login, or a different account", async () => {
  const cookies = authCookies(session(original));
  const attempt = await pendingMfaCancellationCookie(cookies, sessionName);
  for (const data of [
    session(original, { aal: "aal2" }),
    session(replacement),
    session(replacement, { userId: otherSubject }),
  ]) {
    const current = authCookies(data);
    const response = await post(current, attempt);
    assert.equal(response.status, 303);
    assert.equal(response.headers.has("set-cookie"), false);
    assert.equal((await app(current).currentUser()).id, data.user.id);
  }
});

test("late cancellation writes only a marker and preserves a concurrent sign-in or MFA upgrade", async () => {
  const cookies = authCookies(session(original));
  const attempt = await pendingMfaCancellationCookie(cookies, sessionName);
  const inFlight = post(cookies, attempt);
  for (const data of [
    session(original, { aal: "aal2" }),
    session(replacement),
    session(replacement, { userId: otherSubject, recovery: true }),
  ]) {
    // The browser has accepted the new auth response before the old POST lands.
    const current = authCookies(data);
    current.push(...(await inFlight).cookies.getAll());
    const tab = app(current);
    assert.equal((await tab.currentUser()).id, data.user.id);
    assert.equal((await tab.proxy(request("/account", current))).status, 200);
  }

  // An old AAL1 refresh response for the cancelled session stays suppressed.
  const refreshed = authCookies({ ...session(original), refresh_token: "rotated-fixture" });
  refreshed.push(...(await inFlight).cookies.getAll());
  assert.equal(await app(refreshed).currentUser(), null);
});

test("cross-origin, forged, and unauthenticated cancellations cannot set a marker", async () => {
  const cookies = authCookies(session(original));
  const attempt = await pendingMfaCancellationCookie(cookies, sessionName);
  const crossOrigin = await post(cookies, attempt, "https://other.example.test");
  assert.equal(crossOrigin.status, 403);
  assert.equal(crossOrigin.headers.has("set-cookie"), false);
  assert.equal((await post(cookies, "forged")).headers.has("set-cookie"), false);
  assert.equal((await post([], attempt)).headers.has("set-cookie"), false);
});
