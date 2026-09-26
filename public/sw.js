const CACHE = "agromind-public-v14";
const LOGO = "/logo/agromind-mark-132-v1.webp";
const SHELL = ["/offline.html", "/offline/agro-runner/farmer-dino-sheet-v3.png"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("agromind-") && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (event.request.headers?.get("RSC") === "1" || url.searchParams.has("_rsc")) return;
  // Navigation, RSC, API and authenticated responses are NEVER persisted.
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(async () => {
      try {
        return (await (await caches.open(CACHE)).match("/offline.html")) || Response.error();
      } catch {
        return Response.error();
      }
    }));
    return;
  }
  const immutable = url.pathname.startsWith("/_next/static/") || url.pathname === LOGO;
  const offlineAsset = url.pathname.startsWith("/offline/agro-runner/");
  const publicAsset = immutable || offlineAsset || /^\\/(icons|weather\\/backgrounds)\\//.test(url.pathname);
  if (!publicAsset) return;
  event.respondWith((async () => {
    let cache;
    try {
      cache = await caches.open(CACHE);
    } catch {
      return fetch(event.request);
    }
    if (immutable || offlineAsset) {
      const hit = await cache.match(event.request).catch(() => undefined);
      if (hit) return hit;
    }
    try {
      const response = await fetch(event.request);
      if (response.ok && !response.redirected &&
          !/no-store|private/i.test(response.headers.get("Cache-Control") || "") &&
          !/text\\/html|text\\/x-component/i.test(response.headers.get("Content-Type") || "")) {
        const copy = response.clone();
        event.waitUntil(cache.put(event.request, copy).catch(() => {}));
      }
      return response;
    } catch {
      return (await cache.match(event.request).catch(() => undefined)) || Response.error();
    }
  })());
});
