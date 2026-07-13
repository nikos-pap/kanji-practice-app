// Cleanup-only service worker for users upgrading from an older cached version.
// New versions of the app do not register a service worker, so normal reloads
// retrieve changed files without requiring a hard refresh.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith('kanji-practice-'))
      .map((key) => caches.delete(key)));
    await self.registration.unregister();
    await self.clients.claim();
  })());
});
