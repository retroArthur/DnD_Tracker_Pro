// Service Worker for D&D Tracker
// Cache-First Strategie für Offline-Support

const CACHE_NAME = 'dnd-tracker-v2';
const STATIC_ASSETS = [
    './',
    './index.html',
    './loader.js',
    './assets/styles.css',
    './assets/body.html'
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
            .catch(() => self.skipWaiting())
    );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => caches.delete(name))
                );
            })
            .then(() => clients.claim())
    );
});

// Fetch: Cache-First für lokale Ressourcen, Network-First für externe
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Ignoriere nicht-GET Anfragen
    if (event.request.method !== 'GET') {
        return;
    }

    // Ignoriere externe Anfragen (z.B. Google Fonts)
    if (url.origin !== location.origin) {
        // Network-only für externe Ressourcen
        event.respondWith(
            fetch(event.request).catch(() => {
                // Bei Fehler: leere Response für Fonts etc.
                return new Response('', { status: 503 });
            })
        );
        return;
    }

    // Cache-First für lokale Ressourcen
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Im Hintergrund aktualisieren (Stale-While-Revalidate)
                    fetch(event.request)
                        .then(response => {
                            if (response && response.status === 200) {
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(event.request, response));
                            }
                        })
                        .catch(() => { /* Netzwerk nicht verfügbar */ });

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
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, responseToCache));

                        return response;
                    })
                    .catch(() => {
                        // Offline Fallback für HTML
                        if (event.request.headers.get('accept')?.includes('text/html')) {
                            return caches.match('./index.html');
                        }
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});
