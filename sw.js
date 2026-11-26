/* CPA PASS TRACKER — network-first app shell, offline fallback, official notice push. */
'use strict';
const CACHE_NAME = 'cpa-pass-tracker-network-v79-1';
const scope = new URL(self.registration.scope);
const indexURL = new URL('index.html', scope).href;
const versionURL = new URL('version.json', scope).href;
const assets = new Set(['manifest.webmanifest','manifest-icon-v41.webmanifest','icon.svg','apple-touch-icon-v41.png','favicon-v41-32.png','icon-v41-192.png','icon-v41-512.png'].map(x => new URL(x, scope).href));
const isHTML = r => r.ok && (r.headers.get('content-type') || '').toLowerCase().includes('text/html');
async function fresh(request) { return fetch(request, {cache:'no-store'}); }
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const response = await fresh(indexURL);
    if (!isHTML(response)) throw new Error('App shell unavailable');
    await cache.put(indexURL, response);
    await Promise.allSettled([...assets].map(async url => {
      const r = await fresh(url);
      if (r.ok) await cache.put(url, r);
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('cpa-pass-tracker-') && k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const canonical = url.origin + url.pathname;
  if (canonical === versionURL) {
    event.respondWith(fresh(req)); // Never report a stale release descriptor as current.
    return;
  }
  if (req.mode === 'navigate' && (url.pathname === scope.pathname || canonical === indexURL)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME).catch(() => null);
      try {
        const response = await fresh(req);
        if (isHTML(response)) {
          // Only keep the public shell, not authentication callbacks or other query URLs.
          if (cache && !url.search) await cache.put(indexURL, response.clone()).catch(() => {});
          return response;
        }
        if (response.status < 500) return response;
        return (cache && await cache.match(indexURL)) || response;
      } catch (err) {
        return (cache && await cache.match(indexURL)) || Response.error();
      }
    })());
    return;
  }
  if (assets.has(canonical)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME).catch(() => null);
      try {
        const r = await fresh(req);
        if (r.ok) {
          if (cache && !url.search) await cache.put(canonical, r.clone()).catch(() => {});
          return r;
        }
        return (cache && await cache.match(canonical)) || r;
      } catch (_) { return (cache && await cache.match(canonical)) || Response.error(); }
    })());
  }
  // All other requests (including Supabase and external APIs) are untouched.
});
// Preserve official notice Web Push and restrict notification destinations.
self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data?.json() || {}; }
  catch { payload = {body:event.data?.text() || ''}; }
  const title = String(payload.title || 'CPA PASS TRACKER · 공식 공고').slice(0,120);
  const body = String(payload.body || '새 공식 공고를 확인하세요.').slice(0,300);
  let target = scope.href;
  try {
    const u = new URL(String(payload.url || './'), scope);
    if (u.protocol === 'https:' && (u.origin === scope.origin || ['cpa.fss.or.kr','www.fsc.go.kr','fsc.go.kr'].includes(u.hostname))) target = u.href;
  } catch (_) {}
  event.waitUntil(self.registration.showNotification(title, {body,icon:'./icon.svg',badge:'./icon.svg',tag:String(payload.tag || target).slice(0,180),data:{url:target}}));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data?.url || scope.href;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({type:'window',includeUncontrolled:true});
    if (new URL(target, scope).origin === scope.origin) {
      const existing = clients.find(c => c.url.startsWith(scope.href));
      if (existing) { await existing.focus(); if (existing.navigate) await existing.navigate(target); return; }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
