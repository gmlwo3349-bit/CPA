
const CACHE_NAME = "cpa-pass-tracker-v3-push";
const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith("cpa-pass-tracker-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith((async () => {
    if (event.request.mode === "navigate") {
      try {
        return await fetch(
          new URL("./index.html", self.registration.scope)
        );
      } catch (error) {
        return await caches.match("./index.html") ||
          Response.error();
      }
    }

    const cached = await caches.match(event.request);
    if (cached) return cached;

    return fetch(event.request);
  })());
});


// CPA official notice Web Push (preserves existing offline cache and fetch behavior).
self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data?.json() || {}; }
  catch { payload = {body:event.data?.text() || ''}; }
  const title = String(payload.title || 'CPA PASS TRACKER · 공식 공고').slice(0,120);
  const body = String(payload.body || '새 공식 공고를 확인하세요.').slice(0,300);
  const target = (() => {
    try {
      const u = new URL(String(payload.url || './'), self.registration.scope);
      if (u.protocol !== 'https:') return self.registration.scope;
      if (u.origin === new URL(self.registration.scope).origin ||
          ['cpa.fss.or.kr', 'www.fsc.go.kr', 'fsc.go.kr'].includes(u.hostname)) return u.href;
    } catch (_) {}
    return self.registration.scope;
  })();
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: './icon.svg',
    badge: './icon.svg',
    tag: String(payload.tag || target).slice(0,180),
    data: {url: target}
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data?.url || self.registration.scope;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const sameOrigin = new URL(target, self.registration.scope).origin === new URL(self.registration.scope).origin;
    if (sameOrigin) {
      const existing = clients.find(c => c.url.startsWith(self.registration.scope));
      if (existing) { await existing.focus(); if (existing.navigate) await existing.navigate(target); return; }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
