const CACHE_NAME = "pos-cache-v2";
const urlsToCache = [
  "/",
  "/dashboard",
  "/product",
  "/order",
  "/sale",
  "/suspend",
  "/customer",
  "/favicon.ico"
];

// Install Service Worker and Cache Static Assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate Service Worker and Clean Old Caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Request and Serve from Cache when Offline
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API requests (let the app handle them via IndexedDB)
  // But wait, if we want "offline page" for API calls that return HTML (unlikely in Next.js app router for data), 
  // we should be careful. 
  // For Next.js, pages are fetched as HTML or RSC payloads. We want to cache those.
  // We should NOT cache /api/ calls if we want fresh data, BUT if we are offline, 
  // the app's IDB logic handles the data. 
  // The SW should focus on ASSETS (JS, CSS, Images, HTML).

  if (event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // If fetch fails (offline), and not in cache, we might want to show a fallback?
        // But for a SPA/PWA, we usually hope the shell is cached.
        // If the user visits a new page offline, it will fail if not pre-cached.
        // We are using runtime caching above, so visited pages will work.
      });
    })
  );
});
