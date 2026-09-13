const CACHE = "agromind-public-v3";
const SHELL = ["/offline.html", "/logo/agromind-logo.png"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("agromind-") && key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  // Navigation, RSC, API and authenticated responses are NEVER persisted.
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(async () => (await caches.match("/offline.html")) || Response.error()));
    return;
  }
  const publicAsset = /^\/(icons|logo|weather\/backgrounds)\//.test(url.pathname) || url.pathname.startsWith("/_next/static/");
  if (!publicAsset) return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok && !response.headers.get("Cache-Control")?.includes("no-store")) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy)));
    }
    return response;
  }).catch(async () => (await caches.match(event.request)) || Response.error()));
});
