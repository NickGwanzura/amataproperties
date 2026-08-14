// Amata Properties — Service Worker
// Cache-first strategy for static assets, network-first for API routes.

const CACHE_NAME = "amata-v3";

// Assets to pre-cache on install (the app shell)
const PRECACHE_URLS = [
  "/",
  "/amata-mark.svg",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/apple-touch-icon.png",
  "/manifest.json",
];

// Install: pre-cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // Activate immediately without waiting for old tabs to close
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch: cache-first for hashed static assets, network-first for everything else.
// Page documents MUST be network-first — Next.js embeds a build-specific ID and
// per-deploy Server Action hashes in the HTML. Serving a stale cached page after
// a deploy causes "Failed to find Server Action" errors on form submits.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and browser extension requests
  if (request.method !== "GET" || !url.protocol.startsWith("http")) return;

  // API routes and page navigations → network-first (always prefer fresh)
  if (url.pathname.startsWith("/api/") || request.destination === "document") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Hashed static assets (JS/CSS/images/fonts) → cache-first
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // Only cache valid responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline and not in cache — return a fallback
    if (request.destination === "document") {
      return caches.match("/");
    }
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "You are offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}
