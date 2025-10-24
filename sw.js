self.addEventListener("install", (event) => {
  self.skipWaiting(); // Force the waiting service worker to become active immediately
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== "my-app-cache-v1") {
              return caches.delete(cache); // Remove old caches
            }
          })
        );
      })
      .then(() => {
        self.clients.claim(); // Take control of the page right away
      })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return caches.open("my-app-cache-v1").then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});
