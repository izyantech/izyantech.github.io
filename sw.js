/* Retired offline helper for "/".
   The website moved to /site/ and the Manager lives in /manager/, each with its own service worker.
   Phones that still have the old "/" helper pick up this file, clear its cache and remove it. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => /^itw-v\d+$/.test(k)).map(k => caches.delete(k)));
    await self.registration.unregister();
    const wins = await self.clients.matchAll({ type: 'window' });
    wins.forEach(w => { try { w.navigate(w.url); } catch (e) { /* page reloads on next visit */ } });
  })());
});
