/**
 * Service-Worker-Caches pro App und Scope — R08 (Code-Review 2026-09-21, Einheit U9)
 *
 * Cache Storage ist pro ORIGIN geteilt. Die App laeuft als GitHub-Pages-
 * Projektseite auf <user>.github.io (mit allen anderen Pages-Projekten
 * desselben Nutzers) und im CI-Smoke-Job unter localhost:8000. Der Service
 * Worker behandelte die Cache Storage trotzdem wie sein Eigentum:
 *   - activate loeschte JEDEN Cache, dessen Name nicht CACHE_VERSION war
 *     (fremde Apps, andere Tracker-Pfade derselben Origin),
 *   - fetch suchte mit caches.match() ohne cacheName in ALLEN Caches der
 *     Origin (fremde Antworten, im Warte-Fenster auch die der neuen Version),
 *   - der Offline-HTML-Fallback konnte undefined liefern (respondWith-TypeError),
 *   - ein abgelehntes delete() uebersprang clients.claim(), der Update-Banner-
 *     Ablauf (controllerchange) wartete dann auf seinen 3-s-Notnagel.
 *
 * Geladen wird der ECHTE Quelltext (fs + vm). Die Fake-Cache-Storage bildet die
 * Spezifikation nach, soweit der SW sie nutzt:
 *   - eine geordnete Name->Cache-Zuordnung pro Origin, geteilt von mehreren
 *     SW-Instanzen; open() legt an, keys()/has()/delete();
 *   - match(req, {cacheName}) sucht NUR in diesem Cache, legt nie an und liefert
 *     undefined, wenn er fehlt; match() OHNE cacheName durchsucht alle Caches in
 *     Anlagereihenfolge und zaehlt unscopedMatchCalls;
 *   - ein Cache-Objekt bleibt nach dem Loeschen benutzbar;
 *   - relative URLs werden gegen <scope>sw.js aufgeloest;
 *   - addAll() ist atomar und lehnt ab, sobald eine Antwort nicht ok ist.
 * Der eigene Cache-Name wird aus dem gelesen, was install oeffnet — das Format
 * wird ueber Eigenschaften geprueft, nicht hart kodiert.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SW_PFAD = path.join(__dirname, '../../sw.js');
const SW_QUELLE = fs.readFileSync(SW_PFAD, 'utf8');

// Von build.py --production durch 'dnd-tracker-v<VERSION>-<Zeitstempel>' ersetzt.
const PLATZHALTER = "'dnd-tracker-v3'";

const ORIGIN = 'https://arthur.github.io';
const SCOPE_HAUPT = ORIGIN + '/DnD_Tracker_Pro/';
const SCOPE_BETA = ORIGIN + '/tracker-beta/';
const SCOPE_WURZEL = ORIGIN + '/';
const HTML = 'dnd-tracker-optimized.html';
const MANIFEST = 'manifest.webmanifest';

const VERSION_NEU = 'dnd-tracker-v2.7.0-202609210000';
const VERSION_ALT = 'dnd-tracker-v2.6.1-202609010000';

/** Eine gespeicherte Antwort (reicht fuer body/status/type-Pruefungen). */
function gespeichert(body, status = 200) {
    return { body, status, type: 'basic' };
}

class FakeCacheStorage {
    constructor() {
        this.caches = new Map(); // Name -> { eintraege: Map<url, Antwort> }
        this.unscopedMatchCalls = 0;
        this.loeschFehler = null; // gesetzt: delete() lehnt ab
        this.loeschVersuche = [];
        this.geisterNamen = []; // stehen in keys(), existieren aber nicht (Wettlauf)
    }

    /** Testseite: Eintrag direkt setzen (wie eine andere App / ein anderer SW). */
    setze(name, url, body) {
        if (!this.caches.has(name)) this.caches.set(name, { eintraege: new Map() });
        this.caches.get(name).eintraege.set(url, gespeichert(body));
    }

    namen() {
        return [...this.caches.keys()];
    }

    urls(name) {
        const c = this.caches.get(name);
        return c ? [...c.eintraege.keys()] : [];
    }

    /** Die CacheStorage-Sicht eines SW-Globals (Basis = Skript-URL). */
    sicht(basis, netz, geoeffnet) {
        const speicher = this;
        const schluessel = r => (typeof r === 'string' ? new URL(r, basis).href : r.url);

        const cacheSicht = eintrag => {
            const addAll = async anfragen => {
                const urls = anfragen.map(schluessel);
                const antworten = urls.map(u => netz.hole(u)); // wirft offline
                if (antworten.some(a => a.status < 200 || a.status > 299)) {
                    throw new TypeError('addAll: Antwort nicht ok');
                }
                urls.forEach((u, i) => eintrag.eintraege.set(u, antworten[i]));
            };
            return {
                match: async r => eintrag.eintraege.get(schluessel(r)),
                put: async (r, antwort) => {
                    eintrag.eintraege.set(schluessel(r), antwort);
                },
                add: async r => addAll([r]),
                addAll,
                keys: async () => [...eintrag.eintraege.keys()].map(url => ({ url }))
            };
        };

        return {
            open: async name => {
                const n = String(name);
                geoeffnet.push(n);
                if (!speicher.caches.has(n)) speicher.caches.set(n, { eintraege: new Map() });
                return cacheSicht(speicher.caches.get(n));
            },
            has: async name => speicher.caches.has(String(name)),
            keys: async () => [...speicher.caches.keys(), ...speicher.geisterNamen],
            delete: async name => {
                speicher.loeschVersuche.push(String(name));
                if (speicher.loeschFehler) throw speicher.loeschFehler;
                return speicher.caches.delete(String(name));
            },
            match: async (r, optionen) => {
                const url = schluessel(r);
                if (optionen && optionen.cacheName !== undefined) {
                    const c = speicher.caches.get(String(optionen.cacheName));
                    return c ? c.eintraege.get(url) : undefined;
                }
                speicher.unscopedMatchCalls++;
                for (const c of speicher.caches.values()) {
                    if (c.eintraege.has(url)) return c.eintraege.get(url);
                }
                return undefined;
            }
        };
    }
}

/**
 * Laedt sw.js fuer einen Scope. version simuliert den build.py-Bump (erstes
 * und einziges Vorkommen des Platzhalters). mitRegistrierung=false prueft den
 * Rueckfall auf self.location.
 */
function ladeSw({
    scope = SCOPE_HAUPT,
    speicher = new FakeCacheStorage(),
    version = null,
    mitRegistrierung = true
} = {}) {
    const swUrl = scope + 'sw.js';
    const handler = {};
    const geoeffnet = [];
    const netz = {
        online: true,
        status: new Map(), // url -> HTTP-Status (Standard 200)
        hole(url) {
            if (!netz.online) throw new TypeError('Failed to fetch');
            const status = netz.status.has(url) ? netz.status.get(url) : 200;
            return {
                body: 'net:' + url,
                status,
                type: 'basic',
                clone() {
                    return this;
                }
            };
        }
    };
    const selbst = {
        addEventListener: (typ, fn) => {
            handler[typ] = fn;
        },
        registration: mitRegistrierung ? { scope } : undefined,
        location: new URL(swUrl),
        skipWaiting: jest.fn()
    };
    const clients = { claim: jest.fn(() => Promise.resolve()) };
    const code = version ? SW_QUELLE.replace(PLATZHALTER, `'${version}'`) : SW_QUELLE;
    const kontext = {
        self: selbst,
        caches: speicher.sicht(swUrl, netz, geoeffnet),
        clients,
        location: new URL(swUrl),
        fetch: jest.fn(async anfrage => netz.hole(anfrage.url)),
        URL,
        Response: class {
            constructor(body, init = {}) {
                this.body = body;
                this.status = init.status === undefined ? 200 : init.status;
                this.type = 'default';
            }
            static error() {
                return { type: 'error', status: 0 };
            }
        }
    };
    vm.createContext(kontext);
    vm.runInContext(code, kontext, { filename: 'sw.js' });

    /** Feuert ein Ereignis und wartet respondWith und alle waitUntil-Versprechen ab. */
    async function feuere(typ, extra = {}) {
        const lebenszeit = [];
        let antwortVersprechen;
        let geantwortet = false;
        handler[typ]({
            ...extra,
            waitUntil: p => {
                lebenszeit.push(Promise.resolve(p));
            },
            respondWith: p => {
                geantwortet = true;
                antwortVersprechen = Promise.resolve(p);
            }
        });
        const antwort = geantwortet ? await antwortVersprechen : undefined;
        const lauf = await Promise.allSettled(lebenszeit);
        return {
            geantwortet,
            antwort,
            fehler: lauf.filter(e => e.status === 'rejected').map(e => e.reason)
        };
    }

    /** install feuern; liefert den Namen des Caches, den install geoeffnet hat. */
    async function installiere() {
        const vorher = geoeffnet.length;
        const ergebnis = await feuere('install');
        const namen = [...new Set(geoeffnet.slice(vorher))];
        expect(namen).toHaveLength(1);
        return { name: namen[0], fehler: ergebnis.fehler };
    }

    const anfrage = (rel, accept = '*/*', method = 'GET') => ({
        url: new URL(rel, swUrl).href,
        method,
        headers: { get: h => (String(h).toLowerCase() === 'accept' ? accept : null) }
    });

    return { speicher, netz, selbst, clients, handler, feuere, installiere, anfrage };
}

/**
 * Findet alle Aufrufe caches.match(...) (auch ueber Zeilenumbrueche, wie Prettier
 * sie setzt) und liefert deren Argumenttext (klammerbalanciert).
 */
function cachesMatchAufrufe(quelle) {
    const re = /\bcaches\s*\.\s*match\s*\(/g;
    const aufrufe = [];
    let m;
    while ((m = re.exec(quelle)) !== null) {
        let tiefe = 1;
        let i = m.index + m[0].length;
        const start = i;
        while (i < quelle.length && tiefe > 0) {
            if (quelle[i] === '(') tiefe++;
            else if (quelle[i] === ')') tiefe--;
            i++;
        }
        aufrufe.push(quelle.slice(start, i - 1));
    }
    return aufrufe;
}

describe('R08 — Service-Worker-Caches bleiben im eigenen Namensraum', () => {
    test('S1: activate löscht nur den älteren eigenen Cache, ein fremder Cache bleibt', async () => {
        const speicher = new FakeCacheStorage();
        const sw = ladeSw({ scope: SCOPE_HAUPT, speicher, version: VERSION_NEU });
        const { name: aktuell } = await sw.installiere();
        const aelter = aktuell.replace(VERSION_NEU, VERSION_ALT);
        expect(aelter).not.toBe(aktuell);
        speicher.setze(aelter, SCOPE_HAUPT + HTML, 'alt');
        speicher.setze('another-app-cache', ORIGIN + '/other-app/index.html', 'x');

        await sw.feuere('activate');

        expect(speicher.namen()).toEqual([aktuell, 'another-app-cache']);
        expect(sw.clients.claim).toHaveBeenCalledTimes(1);
    });

    test('S2: Namensvertrag — Platzhalter genau einmal, Name = App-Kennung + Scope-Pfad + gebumpte Version', async () => {
        expect(SW_QUELLE.split(PLATZHALTER)).toHaveLength(2);
        const zeilen = SW_QUELLE.split(/\r?\n/).filter(z => z.includes(PLATZHALTER));
        expect(zeilen).toHaveLength(1);
        expect(zeilen[0]).toMatch(/^const CACHE_VERSION = 'dnd-tracker-v3';/);

        const { name } = await ladeSw({ scope: SCOPE_HAUPT, version: VERSION_NEU }).installiere();

        expect(name).not.toBe(VERSION_NEU);
        expect(name.startsWith('dnd-tracker:')).toBe(true);
        expect(name).toContain(encodeURIComponent(new URL(SCOPE_HAUPT).pathname));
        expect(name.endsWith(VERSION_NEU)).toBe(true);
    });

    test('S2b: ohne registration.scope leitet sich der Namensraum aus dem Skriptpfad ab', async () => {
        const mit = await ladeSw({ scope: SCOPE_HAUPT, version: VERSION_NEU }).installiere();
        const ohne = await ladeSw({
            scope: SCOPE_HAUPT,
            version: VERSION_NEU,
            mitRegistrierung: false
        }).installiere();
        expect(ohne.name).toBe(mit.name);
    });

    test('S3: zwei Installationen derselben Origin behalten ihre Caches', async () => {
        const speicher = new FakeCacheStorage();
        const beta = ladeSw({ scope: SCOPE_BETA, speicher, version: VERSION_ALT });
        const { name: betaName } = await beta.installiere();
        await beta.feuere('activate');

        const haupt = ladeSw({ scope: SCOPE_HAUPT, speicher, version: VERSION_NEU });
        const { name: hauptName } = await haupt.installiere();
        await haupt.feuere('activate');

        expect(hauptName).not.toBe(betaName);
        expect(speicher.namen()).toEqual([betaName, hauptName]);

        // Ein Update der Beta-Installation raeumt nur ihren eigenen alten Cache ab.
        const beta2 = ladeSw({ scope: SCOPE_BETA, speicher, version: VERSION_NEU });
        const { name: beta2Name } = await beta2.installiere();
        await beta2.feuere('activate');
        expect(speicher.namen()).toEqual([hauptName, beta2Name]);
    });

    test('S4: Migration — eigener Alt-Cache (vor R08) wird gelöscht, der von /tracker-beta/ bleibt', async () => {
        const speicher = new FakeCacheStorage();
        speicher.setze('dnd-tracker-v2.6.1-202609010000', SCOPE_HAUPT + HTML, 'alt');
        speicher.setze('dnd-tracker-v2.5.0-202512010000', SCOPE_BETA + HTML, 'beta');
        const sw = ladeSw({ scope: SCOPE_HAUPT, speicher, version: VERSION_NEU });
        const { name } = await sw.installiere();

        await sw.feuere('activate');

        expect(speicher.namen()).toEqual(['dnd-tracker-v2.5.0-202512010000', name]);
        expect(speicher.unscopedMatchCalls).toBe(0);
    });

    test('S4b: die Alt-Cache-Prüfung legt keinen Cache an (Wettlauf keys() -> Prüfung)', async () => {
        const speicher = new FakeCacheStorage();
        const sw = ladeSw({ scope: SCOPE_HAUPT, speicher, version: VERSION_NEU });
        const { name } = await sw.installiere();
        // Steht in keys(), wurde aber inzwischen von anderswo geloescht.
        speicher.geisterNamen = ['dnd-tracker-v2.4.0-202511010000'];

        await sw.feuere('activate');

        expect(speicher.namen()).toEqual([name]);
        expect(sw.clients.claim).toHaveBeenCalledTimes(1);
    });

    test('S5: Wurzel-Scope — nur der eigene Alt-Cache fällt, Unterpfad- und fremde Caches bleiben', async () => {
        const speicher = new FakeCacheStorage();
        speicher.setze('dnd-tracker-v2.5.0-202512010000', SCOPE_BETA + HTML, 'beta');
        speicher.setze('dnd-tracker-v2.6.0-202601010000', SCOPE_WURZEL + HTML, 'eigen-alt');
        speicher.setze('dnd-tracker-v1', ORIGIN + '/someones-dnd-tracker/index.html', 'fremd');
        const sw = ladeSw({ scope: SCOPE_WURZEL, speicher, version: VERSION_NEU });
        const { name } = await sw.installiere();

        await sw.feuere('activate');

        expect(speicher.namen()).toEqual([
            'dnd-tracker-v2.5.0-202512010000',
            'dnd-tracker-v1',
            name
        ]);
    });

    test('S6: verschachtelter Scope — der Alt-Cache von <scope>beta/ bleibt', async () => {
        const speicher = new FakeCacheStorage();
        speicher.setze('dnd-tracker-v2.5.0-202512010000', SCOPE_HAUPT + 'beta/' + HTML, 'nest');
        const sw = ladeSw({ scope: SCOPE_HAUPT, speicher, version: VERSION_NEU });
        const { name } = await sw.installiere();

        await sw.feuere('activate');

        expect(speicher.namen()).toEqual(['dnd-tracker-v2.5.0-202512010000', name]);
    });

    test('S7: fetch antwortet nie aus einem fremden Cache (kein caches.match ohne cacheName)', async () => {
        const speicher = new FakeCacheStorage();
        // Fremder Cache existiert VOR dem eigenen und enthaelt dieselbe URL.
        speicher.setze('another-app-cache', SCOPE_HAUPT + MANIFEST, 'FREMD');
        const sw = ladeSw({ scope: SCOPE_HAUPT, speicher });
        await sw.installiere();

        const { antwort } = await sw.feuere('fetch', { request: sw.anfrage('./' + MANIFEST) });

        expect(antwort.body).toBe('net:' + SCOPE_HAUPT + MANIFEST);
        expect(speicher.unscopedMatchCalls).toBe(0);
    });

    test('S7b: eine online nachgeladene Antwort landet NUR im eigenen Cache (Schreibseite)', async () => {
        // S7/S8/S9a pinnen die LESE-Seite. Die Schreibseite war ungepinnt: ein
        // entferntes cache.put() und ein put() in einen zusaetzlichen, nicht
        // namensraeumigen Cache (caches.open(CACHE_VERSION)) liessen die Suite
        // beide gruen. Dieser Test bindet sie (Korrekturrunde F7).
        const speicher = new FakeCacheStorage();
        speicher.setze('another-app-cache', ORIGIN + '/other-app/index.html', 'x');
        const sw = ladeSw({ scope: SCOPE_HAUPT, speicher, version: VERSION_NEU });
        const { name: eigen } = await sw.installiere();
        const namenVorher = speicher.namen();
        const anfrage = sw.anfrage('./assets/extra.js');

        const { antwort, fehler } = await sw.feuere('fetch', { request: anfrage });

        expect(antwort.body).toBe('net:' + anfrage.url);
        expect(fehler).toEqual([]);
        expect(speicher.urls(eigen)).toContain(anfrage.url); // put() ist passiert
        expect(speicher.namen()).toEqual(namenVorher); // und zwar in KEINEN neuen Cache
        expect(speicher.urls('another-app-cache')).not.toContain(anfrage.url);
    });

    test('S8: im Warte-Fenster antwortet der alte SW nicht aus dem Cache der neuen Version', async () => {
        const speicher = new FakeCacheStorage();
        const alt = ladeSw({ scope: SCOPE_HAUPT, speicher, version: VERSION_ALT });
        const { name: altName } = await alt.installiere();
        await alt.feuere('activate');
        speicher.caches.get(altName).eintraege.delete(SCOPE_HAUPT + MANIFEST);

        const neu = ladeSw({ scope: SCOPE_HAUPT, speicher, version: VERSION_NEU });
        const { name: neuName } = await neu.installiere(); // wartet, nicht aktiviert
        speicher.setze(neuName, SCOPE_HAUPT + MANIFEST, 'NEW-VERSION');
        alt.netz.online = false;

        const { antwort } = await alt.feuere('fetch', { request: alt.anfrage('./' + MANIFEST) });

        expect(antwort.body).not.toBe('NEW-VERSION');
        expect(antwort.status).toBe(503);
    });

    test('S9a: offline kommt die HTML-Seite aus dem eigenen Cache, nicht aus einem fremden', async () => {
        const speicher = new FakeCacheStorage();
        speicher.setze('another-app-cache', SCOPE_HAUPT + HTML, 'FREMD');
        const sw = ladeSw({ scope: SCOPE_HAUPT, speicher });
        await sw.installiere();
        sw.netz.online = false;

        const { antwort } = await sw.feuere('fetch', {
            request: sw.anfrage('./kampagne', 'text/html,application/xhtml+xml')
        });

        expect(antwort.body).toBe('net:' + SCOPE_HAUPT + HTML);
    });

    test('S9b: offline ohne eigenen Cache — definierte Fehlerantwort statt undefined', async () => {
        const speicher = new FakeCacheStorage();
        const sw = ladeSw({ scope: SCOPE_HAUPT, speicher });
        const { name } = await sw.installiere();
        await sw.feuere('activate');
        // Eine fremde App mit "alles ausser meinem loeschen" raeumt unseren Cache ab.
        speicher.caches.delete(name);
        sw.netz.online = false;

        const { geantwortet, antwort } = await sw.feuere('fetch', {
            request: sw.anfrage('./kampagne', 'text/html')
        });

        expect(geantwortet).toBe(true);
        expect(antwort).toBeDefined(); // respondWith(undefined) = TypeError im Browser
        expect(antwort.type).toBe('error');
    });

    test('S9c: offline ohne Treffer — Nicht-HTML-Anfrage bekommt 503', async () => {
        const sw = ladeSw({ scope: SCOPE_HAUPT });
        sw.netz.online = false;

        const { antwort } = await sw.feuere('fetch', {
            request: sw.anfrage('./icons/icon-192.png', 'image/*')
        });

        expect(antwort.status).toBe(503);
    });

    test('S10: ein abgelehntes delete() verhindert clients.claim() nicht', async () => {
        const speicher = new FakeCacheStorage();
        const sw = ladeSw({ scope: SCOPE_HAUPT, speicher, version: VERSION_NEU });
        const { name } = await sw.installiere();
        const aelter = name.replace(VERSION_NEU, VERSION_ALT);
        speicher.setze(aelter, SCOPE_HAUPT + HTML, 'alt');
        speicher.loeschFehler = new Error('QuotaExceeded/IO');

        const { fehler } = await sw.feuere('activate');

        expect(speicher.loeschVersuche).toContain(aelter);
        expect(sw.clients.claim).toHaveBeenCalledTimes(1);
        expect(fehler).toEqual([]);
    });

    test('S11a: CR-09 — ein 404 bei einem Kern-Asset lässt die Installation scheitern', async () => {
        const sw = ladeSw({ scope: SCOPE_HAUPT });
        sw.netz.status.set(SCOPE_HAUPT + MANIFEST, 404);

        const { fehler } = await sw.feuere('install');

        expect(fehler).toHaveLength(1);
    });

    test('S11b: CR-09 — ein 404 bei einem optionalen Asset lässt die Installation bestehen (kein skipWaiting)', async () => {
        const speicher = new FakeCacheStorage();
        const sw = ladeSw({ scope: SCOPE_HAUPT, speicher });
        sw.netz.status.set(SCOPE_HAUPT + 'icons/icon-192.png', 404);

        const { name, fehler } = await sw.installiere();

        expect(fehler).toEqual([]);
        expect(speicher.urls(name)).toEqual(
            expect.arrayContaining([
                SCOPE_HAUPT + HTML,
                SCOPE_HAUPT + MANIFEST,
                SCOPE_HAUPT + 'icons/icon-512.png'
            ])
        );
        expect(speicher.urls(name)).not.toContain(SCOPE_HAUPT + 'icons/icon-192.png');
        expect(sw.selbst.skipWaiting).not.toHaveBeenCalled(); // D-03
    });

    test('Kontrolle: Nicht-GET und fremde Origin werden nicht beantwortet, SKIP_WAITING nur auf Anfrage', async () => {
        const sw = ladeSw({ scope: SCOPE_HAUPT });
        const post = await sw.feuere('fetch', { request: sw.anfrage('./x', '*/*', 'POST') });
        expect(post.geantwortet).toBe(false);
        const fremd = await sw.feuere('fetch', {
            request: {
                url: 'https://example.org/a.js',
                method: 'GET',
                headers: { get: () => null }
            }
        });
        expect(fremd.geantwortet).toBe(false);

        sw.handler.message({ data: { type: 'ETWAS' } });
        expect(sw.selbst.skipWaiting).not.toHaveBeenCalled();
        sw.handler.message({ data: { type: 'SKIP_WAITING' } });
        expect(sw.selbst.skipWaiting).toHaveBeenCalledTimes(1);
    });

    test('Quelltext: jedes caches.match(...) übergibt eine cacheName-Option', () => {
        // Selbsttest der Suchlogik (auch ueber Zeilenumbrueche hinweg).
        expect(cachesMatchAufrufe('a(); caches.match(req).then(x => y(x));')).toEqual(['req']);
        expect(
            cachesMatchAufrufe('caches\n    .match(new URL(a, b).href, { cacheName: n })')
        ).toEqual(['new URL(a, b).href, { cacheName: n }']);
        expect(cachesMatchAufrufe('cache.match(req)')).toEqual([]);

        const ohneCacheName = cachesMatchAufrufe(SW_QUELLE).filter(
            args => !/\bcacheName\s*:/.test(args)
        );
        expect(ohneCacheName).toEqual([]);
    });
});
