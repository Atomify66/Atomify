// Atomify kill-switch service worker.
// Replaces the old caching SW. On install it takes over immediately; on
// activate it wipes every Cache Storage entry, unregisters itself, and
// reloads any open clients so they reload from the network. No fetch
// handler => the network is canonical from this point on.

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));

    await self.clients.claim();
    await self.registration.unregister();

    const windows = await self.clients.matchAll({ type: 'window' });
    for (const client of windows) {
      try { client.navigate(client.url); } catch (_) { /* ignore */ }
    }
  })());
});
