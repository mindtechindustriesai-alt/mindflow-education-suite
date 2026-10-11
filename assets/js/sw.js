// sw.js — Khensani AI Service Worker
// Cache-first for assets · Network-first for Firestore (handled by SDK)

const CACHE_VERSION = 'khensani-v1.0.0';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/particles.css',
  '/assets/css/splash.css',
  '/assets/css/branding.css',
  '/assets/css/sentinel.css',
  '/assets/js/firebase-config.js',
  '/assets/js/auth-manager.js',
  '/assets/js/particles-config.js',
  '/assets/js/splash.js',
  '/assets/js/branding.js',
  '/assets/js/i18n.js',
  '/assets/js/sync-manager.js',
  '/assets/js/sentinel-ai.js',
  '/assets/js/neural-network.js',
  '/assets/js/ai/khensani-ai.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Never cache Firebase Firestore / Auth — SDK handles persistence
  if (req.url.includes('firestore.googleapis.com') ||
      req.url.includes('identitytoolkit.googleapis.com') ||
      req.url.includes('securetoken.googleapis.com')) {
    return;
  }

  // HTML → network-first (fallback to cache)
  if (req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
    );
    return;
  }

  // Assets → cache-first
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res.status === 200 && req.method === 'GET') {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});