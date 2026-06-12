// Service Worker for D&D Tracker
// Cache-First Strategie für Offline-Support (Single-File-Build)

const CACHE_VERSION = 'dnd-tracker-v3'; // wird bei Production-Build via build.py gebumpt
const CACHED_ASSETS = [
    './',
    './dnd-tracker-optimized.html',
    './manifest.webmanifest',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './assets/fonts/roboto-400.woff2',
    './assets/fonts/roboto-700.woff2',
    './assets/fonts/inter-400.woff2',
    './assets/fonts/inter-500.woff2',
    './assets/fonts/inter-600.woff2',
    './assets/fonts/poppins-400.woff2',
    './assets/fonts/poppins-500.woff2',
    './assets/fonts/poppins-600.woff2',
    './assets/fonts/source-sans-pro-400.woff2',
    './assets/fonts/source-sans-pro-600.woff2'
];

// Install: Cache alle statischen Assets (KEIN self.skipWaiting() — D-03)
self.addEventListener('install', event => {
    event.waitUntil(
        caches
            .open(CACHE_VERSION)
            .then(cache => cache.addAll(CACHED_ASSETS))
    );
    // KEIN self.skipWaiting() hier — verhindert gleichzeitigen Betrieb
    // von altem und neuem Code (D-03 Anti-Pattern laut RESEARCH.md)
});

// Activate: Alte Caches bereinigen, Clients übernehmen
self.addEventListener('activate', event => {
    event.waitUntil(
        caches
            .keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.filter(name => name !== CACHE_VERSION).map(name => caches.delete(name))
                );
            })
            .then(() => clients.claim())
    );
});

// Fetch: Cache-First für lokale Ressourcen, externe Requests durchreichen
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Ignoriere nicht-GET Anfragen
    if (event.request.method !== 'GET') {
        return;
    }

    // Externe Requests (keine Google Fonts mehr nach D-07 — alle Fonts lokal):
    // Einfach durchreichen ohne Caching
    if (url.origin !== location.origin) {
        return;
    }

    // Cache-First für alle eigenen Assets
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            // Nicht im Cache: Netzwerk abrufen und cachen
            return fetch(event.request)
                .then(response => {
                    // Nur erfolgreiche Responses cachen
                    if (!response || response.status !== 200 || response.type === 'opaque') {
                        return response;
                    }

                    const responseToCache = response.clone();
                    caches
                        .open(CACHE_VERSION)
                        .then(cache => cache.put(event.request, responseToCache));

                    return response;
                })
                .catch(() => {
                    // Offline Fallback: Single-File-Build ausliefern
                    if (event.request.headers.get('accept')?.includes('text/html')) {
                        return caches.match('./dnd-tracker-optimized.html');
                    }
                    return new Response('Offline', { status: 503 });
                });
        })
    );
});

// Message Handler: SKIP_WAITING nur auf explizite Anfrage (D-03 konform)
self.addEventListener('message', event => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
