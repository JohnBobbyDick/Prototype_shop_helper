const CACHE_NAME = "voiceshop-v1";
const PRECACHE_URLS = ["/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept navigations or Next.js / API traffic — caching these
  // breaks App Router (pages spin / never finish loading).
  if (
    event.request.mode === "navigate" ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/") ||
    event.request.headers.get("RSC") === "1" ||
    event.request.headers.has("Next-Router-State-Tree")
  ) {
    return;
  }

  // Cache-first only for static assets
  if (!/\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ico|webmanifest)$/i.test(url.pathname)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetched;
    }),
  );
});
