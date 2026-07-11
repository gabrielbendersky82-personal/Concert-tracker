// Deliberately minimal service worker: qualifies the site for PWA install
// prompts without changing any network behavior. Every request passes
// straight through to the network — NOTHING is cached, so deploys are always
// fresh and live data is never stale. If we later want an offline shell,
// this is where a network-first cache would go.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
