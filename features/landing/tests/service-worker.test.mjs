import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function worker({ response, brokenStorage = false } = {}) {
  const handlers = {};
  const entries = new Map();
  const fetched = [];
  const installed = [];
  const deleted = [];
  const key = request => typeof request === "string" ? request : request.url;
  const cache = {
    match: async request => entries.get(key(request))?.clone(),
    put: async (request, value) => { entries.set(key(request), value); },
    addAll: async urls => { installed.push(...urls); },
  };
  const state = { claimed: false };
  vm.runInNewContext(readFileSync("public/sw.js", "utf8"), {
    self: {
      location: { origin: "https://agromind.test" },
      addEventListener: (event, callback) => { handlers[event] = callback; },
      skipWaiting() {},
      clients: { claim() { state.claimed = true; } },
    }, URL, Response,
    caches: {
      open: async () => { if (brokenStorage) throw new Error("Storage unavailable"); return cache; },
      keys: async () => ["agromind-public-v3", "agromind-public-v4", "agromind-public-v5", "agromind-public-v6", "agromind-public-v7", "agromind-public-v8", "agromind-public-v9", "agromind-public-v10", "agromind-public-v11", "another-app"],
      delete: async name => { deleted.push(name); },
    },
    fetch: async request => {
      fetched.push(key(request));
      return response ? response(request) : new Response("asset", { headers: { "Content-Type": "application/javascript", "Cache-Control": "public, max-age=31536000, immutable" } });
    },
  });
  return {
    fetched, installed, deleted, entries, state,
    async lifecycle(name) { const waits = []; handlers[name]({ waitUntil: p => waits.push(p) }); await Promise.all(waits); },
    async request(path, options = {}) {
      const { mode, ...init } = options;
      const request = new Request(new URL(path, "https://agromind.test"), init);
      // Browsers create navigation Requests; the public constructor disallows
      // mode=navigate. Model that browser-supplied property for this SW test.
      if (mode) Object.defineProperty(request, "mode", { value: mode });
      const waits = [];
      let result;
      handlers.fetch({ request, respondWith: p => { result = p; }, waitUntil: p => waits.push(p) });
      const value = await result;
      await Promise.all(waits);
      return value;
    },
  };
}

test("PWA install does not redownload the 1.1 MB logo and activation drops stale public caches", async () => {
  const sw = worker();
  await sw.lifecycle("install");
  assert.deepEqual(sw.installed, ["/offline.html", "/offline/agro-runner/farmer-dino-sheet-v3.png"]);
  await sw.lifecycle("activate");
  assert.deepEqual(sw.deleted, ["agromind-public-v3", "agromind-public-v4", "agromind-public-v5", "agromind-public-v6", "agromind-public-v7", "agromind-public-v8", "agromind-public-v9", "agromind-public-v10", "agromind-public-v11"]);
  assert.equal(sw.state.claimed, true);
});

test("hashed assets and versioned logo reuse cache; new chunk URLs fetch fresh", async () => {
  const sw = worker();
  for (const path of ["/_next/static/chunks/abc123.js", "/logo/agromind-mark-132-v1.webp"]) {
    assert.equal(await (await sw.request(path)).text(), "asset");
    assert.equal(await (await sw.request(path)).text(), "asset");
    assert.equal(sw.fetched.filter(url => url.endsWith(path)).length, 1);
  }
  await sw.request("/_next/static/chunks/def456.js");
  assert.equal(sw.fetched.length, 3);
});

test("private routes, APIs, RSC and non-GET requests never use the asset cache", async () => {
  const sw = worker();
  for (const path of ["/dashboard", "/farms", "/farms/id", "/assistant", "/account", "/weather", "/api/weather", "/api/private", "/logo/agromind-logo.png"])
    assert.equal(await sw.request(path), undefined, path);
  assert.equal(await sw.request("/_next/static/chunks/test.js?_rsc=x"), undefined);
  assert.equal(await sw.request("/_next/static/chunks/test.js", { headers: { RSC: "1" } }), undefined);
  assert.equal(await sw.request("/account", { method: "POST" }), undefined);
  assert.equal(await sw.request("https://external.test/_next/static/chunks/test.js"), undefined);
  assert.equal(sw.entries.size, 0);
  assert.equal(sw.fetched.length, 0);
});

test("authenticated navigations always use the network; offline only returns public shell", async () => {
  let offline = false;
  const sw = worker({ response: () => {
    if (offline) throw new Error("Offline");
    return new Response("private-navigation", { headers: { "Cache-Control": "private, no-store" } });
  } });
  for (const path of ["/dashboard", "/farms/id", "/assistant", "/account", "/weather"]) {
    for (let run = 0; run < 2; run++)
      assert.equal(await (await sw.request(path, { mode: "navigate" })).text(), "private-navigation");
  }
  assert.equal(sw.fetched.length, 10);
  assert.equal(sw.entries.size, 0);
  sw.entries.set("/offline.html", new Response("public-offline-shell"));
  offline = true;
  assert.equal(await (await sw.request("/account", { mode: "navigate" })).text(), "public-offline-shell");
  assert.equal(sw.entries.size, 1);
});

test("verified Farmer Dino sprite is served from precache while fully offline", async () => {
  const sw = worker({ response: () => { throw new Error("Offline"); } });
  sw.entries.set(
    "https://agromind.test/offline/agro-runner/farmer-dino-sheet-v3.png",
    new Response("verified-dino", { headers: { "Content-Type": "image/png" } }),
  );
  const response = await sw.request("/offline/agro-runner/farmer-dino-sheet-v3.png");
  assert.equal(await response.text(), "verified-dino");
  assert.equal(sw.fetched.length, 0);
});

test("unversioned public icons still revalidate rather than staying stale", async () => {
  const sw = worker();
  await sw.request("/icons/icon-192.png");
  await sw.request("/icons/icon-192.png");
  assert.equal(sw.fetched.length, 2);
});

test("private, no-store, HTML, RSC, redirected and failed responses are not cached", async () => {
  for (const headers of [
    { "Cache-Control": "private, max-age=0" }, { "Cache-Control": "no-store" },
    { "Content-Type": "text/html" }, { "Content-Type": "text/x-component" },
  ]) {
    const sw = worker({ response: () => new Response("not public", { headers }) });
    await sw.request("/_next/static/chunks/test.js");
    await sw.request("/_next/static/chunks/test.js");
    assert.equal(sw.entries.size, 0);
    assert.equal(sw.fetched.length, 2);
  }
  for (const response of [new Response("error", { status: 500 }), Object.assign(new Response("redirected"), {})]) {
    if (response.status === 200) Object.defineProperty(response, "redirected", { value: true });
    const sw = worker({ response: () => response });
    await sw.request("/_next/static/chunks/test.js");
    assert.equal(sw.entries.size, 0);
  }
});

test("restricted CacheStorage cannot prevent fetching online assets", async () => {
  const sw = worker({ brokenStorage: true });
  assert.equal(await (await sw.request("/_next/static/chunks/test.js")).text(), "asset");
  assert.equal(sw.fetched.length, 1);
});
