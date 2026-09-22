// Service Worker for D&D Tracker
// Cache-First Strategie für Offline-Support (Single-File-Build)

const CACHE_VERSION = 'dnd-tracker-v3'; // wird bei Production-Build via build.py gebumpt

// R08: Cache Storage ist pro ORIGIN geteilt. Auf GitHub Pages (<user>.github.io/<repo>/)
// und unter localhost:8000 liegen weitere Apps auf derselben Origin. Eigene Caches tragen
// deshalb einen Namensraum aus App-Kennung und Registrierungs-Scope (Pfad):
//   dnd-tracker:<encodeURIComponent(scope-pfad)>:<CACHE_VERSION>
// activate löscht NUR ältere Caches dieses Namensraums (und den eigenen Alt-Cache von
// vor R08), gesucht wird NUR im eigenen Cache. encodeURIComponent maskiert '/' und ':'
// im Pfad — ein fremder Scope kann den Präfix nicht zufällig teilen.
// Das Platzhalter-Literal in CACHE_VERSION (Zeile 4) muss sein EINZIGES Vorkommen in
// dieser Datei bleiben: build.py ersetzt genau dieses eine und bricht sonst ab.
const CACHE_APP_ID = 'dnd-tracker';
const CACHE_SCOPE =
    (self.registration && self.registration.scope) || new URL('./', self.location.href).href;
const CACHE_NAMESPACE =
    CACHE_APP_ID + ':' + encodeURIComponent(new URL(CACHE_SCOPE).pathname) + ':';
const CACHE_NAME = CACHE_NAMESPACE + CACHE_VERSION;

// Vor R08 hießen Tracker-Caches unqualifiziert "dnd-tracker-v<version>[-<zeitstempel>]".
// Regex statt Literal (siehe oben). Ob ein solcher Cache UNS gehört, prüft
// isOwnLegacyCache() — der Name allein beweist es nicht.
const LEGACY_CACHE_NAME_RE = /^dnd-tracker-v\d/;

const OFFLINE_HTML = './dnd-tracker-optimized.html';

// Kern-Assets: MÜSSEN cachebar sein, sonst soll die Installation hart fehlschlagen.
// KEIN './' — das Pages-Artefakt enthält kein index.html, GET /repo/ liefert 404
// und ein einziger 404 lässt cache.addAll() komplett scheitern (CR-09).
const CORE_ASSETS = [OFFLINE_HTML, './manifest.webmanifest'];

// Optionale Assets: einzeln cachen (Promise.allSettled) — ein 404 bei Icon/Font
// darf die SW-Installation und damit die Offline-Fähigkeit nicht killen (CR-09).
const OPTIONAL_ASSETS = [
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

// Alt-Cache (vor R08) DIESES Scopes? Geprüft wird exakt die eigene HTML-URL, kein
// URL-Präfix: bei Scope '/' wäre sonst jede URL der Origin ein Treffer, und eine
// Installation unter einem Unterpfad des eigenen Scopes ebenso. caches.match mit
// cacheName legt keinen Cache an (caches.open würde einen fehlenden neu anlegen).
function isOwnLegacyCache(name) {
    if (!LEGACY_CACHE_NAME_RE.test(name)) return Promise.resolve(false);
    return caches
        .match(new URL(OFFLINE_HTML, CACHE_SCOPE).href, { cacheName: name })
        .then(hit => !!hit)
        .catch(() => false);
}

function isObsoleteOwnCache(name) {
    if (name === CACHE_NAME) return false;
    if (name.startsWith(CACHE_NAMESPACE)) return true;
    return isOwnLegacyCache(name);
}

// Install: Cache statische Assets (KEIN self.skipWaiting() — D-03)
self.addEventListener('install', event => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(cache =>
                cache
                    .addAll(CORE_ASSETS)
                    .then(() => Promise.allSettled(OPTIONAL_ASSETS.map(asset => cache.add(asset))))
            )
    );
    // KEIN self.skipWaiting() hier — verhindert gleichzeitigen Betrieb
    // von altem und neuem Code (D-03 Anti-Pattern laut RESEARCH.md)
});

// Activate: NUR eigene alte Caches bereinigen (R08), Clients übernehmen
self.addEventListener('activate', event => {
    event.waitUntil(
        caches
            .keys()
            .then(names =>
                Promise.all(
                    names.map(name =>
                        Promise.resolve(isObsoleteOwnCache(name)).then(obsolete =>
                            obsolete ? caches.delete(name) : false
                        )
                    )
                )
            )
            // Ein gescheitertes Löschen darf die Übernahme nicht verhindern: der
            // Update-Banner-Ablauf wartet auf controllerchange (sonst 3-s-Notnagel).
            .catch(() => {})
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

    // Cache-First für alle eigenen Assets — NUR im eigenen Cache (R08): ein Match
    // über die CacheStorage ohne cacheName durchsucht alle Caches der Origin, also
    // auch fremde und im Warte-Fenster den der neuen Version.
    event.respondWith(
        caches.open(CACHE_NAME).then(cache =>
            cache.match(event.request).then(hit => {
                if (hit) return hit;

                // Nicht im Cache: Netzwerk abrufen und cachen
                return fetch(event.request)
                    .then(response => {
                        // Nur erfolgreiche Responses cachen
                        if (!response || response.status !== 200 || response.type === 'opaque') {
                            return response;
                        }
                        event.waitUntil(cache.put(event.request, response.clone()).catch(() => {}));
                        return response;
                    })
                    .catch(() => {
                        // Offline Fallback: Single-File-Build aus dem eigenen Cache. Fehlt er
                        // (z. B. weil eine andere App der Origin unseren Cache gelöscht hat):
                        // Response.error() — der Browser zeigt seine Offline-Seite, statt dass
                        // respondWith(undefined) mit einem TypeError scheitert.
                        if (event.request.headers.get('accept')?.includes('text/html')) {
                            return cache.match(OFFLINE_HTML).then(html => html || Response.error());
                        }
                        return new Response('Offline', { status: 503 });
                    });
            })
        )
    );
});

// Message Handler: SKIP_WAITING nur auf explizite Anfrage (D-03 konform)
self.addEventListener('message', event => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
