/**
 * Unit Tests — Wuerfelstatistik-IDB: Deckel, Verdraengung, Loeschen, Cursor-Aggregat
 * (PERF-02, Plan 13-07)
 *
 * Handgerolltes IndexedDB-Mock-Muster (KEINE neue Abhaengigkeit — fake-indexeddb ist in
 * 13-RESEARCH.md § "Don't Hand-Roll" ausdruecklich abgelehnt). Erweitert das
 * createMockIDB()-Muster aus tests/unit/soundboard.test.js um count(), openCursor() und
 * index().openCursor() — das dritte Mal im selben Stil in diesem Projekt.
 *
 * Abgedeckte Anforderungen:
 *   PERF-02 — Deckel + Verdraengung der AELTESTEN Datensaetze (D-11)
 *   PERF-02 · Randfall `idempotency` — zweiter Durchsetzungslauf auf einem Store an/unter
 *             dem Deckel loescht nichts
 *   PERF-02 · Randfall `concurrency` — eine werfende/abbrechende Verdraengungs-Transaktion
 *             blockiert statsIdbPut() nicht und laesst den Store lesbar
 *   PERF-02 — Drosselung: der Deckel waechst zwischen zwei Durchsetzungen nie um mehr als
 *             STATS_CAP_CHECK_INTERVAL Datensaetze
 */

const fs = require('fs');
const path = require('path');

// window/APP_CONFIG VOR dem eval() setzen — dice-stats-idb.js liest DICE_STATS_MAX_RECORDS
// beim Modul-Load als Modulkonstante (Muster: systems/undo.js:8, UNDO_LIMIT). Kleiner
// Testwert, damit die Verdraengung ohne 50.000 Seed-Datensaetze pruefbar bleibt.
const TEST_MAX_RECORDS = 5;
// Muss mit STATS_CAP_CHECK_INTERVAL in features/dice-stats/dice-stats-idb.js uebereinstimmen —
// die Drosselung ist eine interne Implementierungskonstante ohne eigenen APP_CONFIG-Schluessel.
const TEST_THROTTLE = 50;

global.window = global.window || {};
global.window.APP_CONFIG = { DICE_STATS_MAX_RECORDS: TEST_MAX_RECORDS, DEBUG_MODE: false };
global.window.idb = null;
global.window.initIndexedDB = function () { return Promise.resolve(); };
global.window.D = { characters: [] };

const moduleSrc = fs.readFileSync(
    path.resolve(__dirname, '../../features/dice-stats/dice-stats-idb.js'),
    'utf8'
);
eval(moduleSrc); // eslint-disable-line no-eval
// Direktes eval() im sloppy-mode-Modulkontext leakt Top-Level-`const`/`function`-Deklarationen
// (enforceStatsCap, statsIdbPut, DICE_STATS_MAX_RECORDS, …) in diesen Funktionsscope — bare
// Identifier-Zugriff genuegt, kein `global.window.X`-Umweg noetig.

// ============================================================
// MOCK IDB — erweitert createMockIDB() (soundboard.test.js) um count()/openCursor()/
// clear()/index().openCursor() (D-11 Verdraengung + Loeschen, D-12 Cursor-Aggregat)
// ============================================================

function createMockIDB(seedRecords, opts) {
    opts = opts || {};
    const mockStore = new Map(); // id (number, autoIncrement) -> record
    let nextId = 1;
    (seedRecords || []).forEach(function (r) {
        const id = nextId++;
        mockStore.set(id, Object.assign({ id: id }, r));
    });

    function sortedIds() {
        return Array.from(mockStore.keys()).sort(function (a, b) { return a - b; });
    }

    function asyncResolve(req, resultFn) {
        Promise.resolve().then(function () {
            req.result = resultFn();
            if (req.onsuccess) req.onsuccess({ target: req });
        });
    }

    // Simuliert einen IDBCursor ueber eine feste, bereits sortierte id-Liste. Jeder Schritt
    // (cursor.continue()) haengt einen weiteren Microtask an — asynchron wie die echte API.
    function makeCursorRequest(ids, errorAsync) {
        const req = { onsuccess: null, onerror: null, result: null };
        let idx = 0;
        function step() {
            Promise.resolve().then(function () {
                if (errorAsync) {
                    if (req.onerror) req.onerror({ target: req });
                    return;
                }
                if (idx >= ids.length) {
                    req.result = null;
                    if (req.onsuccess) req.onsuccess({ target: req });
                    return;
                }
                const id = ids[idx];
                req.result = {
                    value: mockStore.get(id),
                    delete: function () { mockStore.delete(id); },
                    continue: function () { idx++; step(); }
                };
                if (req.onsuccess) req.onsuccess({ target: req });
            });
        }
        step();
        return req;
    }

    function makeStore() {
        return {
            add: function (record) {
                const id = nextId++;
                mockStore.set(id, Object.assign({ id: id }, record));
                return { onsuccess: null, onerror: null, result: id };
            },
            count: function () {
                if (opts.throwOnCount) throw new Error('mock: count() failed');
                const req = { onsuccess: null, onerror: null, result: undefined };
                asyncResolve(req, function () { return mockStore.size; });
                return req;
            },
            openCursor: function () {
                if (opts.throwOnOpenCursor) throw new Error('mock: openCursor() failed');
                return makeCursorRequest(sortedIds(), opts.errorOnCursor);
            },
            clear: function () {
                if (opts.throwOnClear) throw new Error('mock: clear() failed');
                mockStore.clear();
                const req = { onsuccess: null, onerror: null };
                Promise.resolve().then(function () { if (req.onsuccess) req.onsuccess(); });
                return req;
            },
            getAll: function () {
                const req = { onsuccess: null, onerror: null, result: undefined };
                asyncResolve(req, function () {
                    return sortedIds().map(function (id) { return mockStore.get(id); });
                });
                return req;
            },
            index: function (name) {
                return {
                    getAll: function (value) {
                        const req = { onsuccess: null, onerror: null, result: undefined };
                        asyncResolve(req, function () {
                            return sortedIds()
                                .map(function (id) { return mockStore.get(id); })
                                .filter(function (r) { return r[name] === value; });
                        });
                        return req;
                    },
                    openCursor: function (value) {
                        const ids = sortedIds().filter(function (id) {
                            return mockStore.get(id)[name] === value;
                        });
                        return makeCursorRequest(ids, opts.errorOnCursor);
                    }
                };
            }
        };
    }

    return {
        mockStore: mockStore,
        idbInstance: {
            transaction: function () {
                return { objectStore: function () { return makeStore(); } };
            }
        }
    };
}

function installMockIDB(seedRecords, opts) {
    const mock = createMockIDB(seedRecords, opts);
    global.window.idb = mock.idbInstance;
    return mock;
}

// Cursor-Ketten haengen sich ueber mehrere Promise.resolve().then() aneinander — mehrfach
// "ticken" laesst alle bereits angestossenen Microtasks vollstaendig durchlaufen.
function tick(times) {
    let p = Promise.resolve();
    for (let i = 0; i < (times || 25); i++) {
        p = p.then(function () { return Promise.resolve(); });
    }
    return p;
}

function makeRecord(n) {
    return { notation: '1d20', result: n, rolls: [n % 20 || 20], timestamp: n, sessionId: 's', charId: null };
}

// ============================================================
// TESTS
// ============================================================

describe('enforceStatsCap — Deckel und Verdraengung (PERF-02/D-11)', function () {
    test('Store unterhalb des Deckels: ein Durchsetzungslauf loescht nichts', async function () {
        const mock = installMockIDB([makeRecord(1), makeRecord(2), makeRecord(3)]);
        const store = mock.idbInstance.transaction().objectStore();
        enforceStatsCap(store);
        await tick();
        expect(mock.mockStore.size).toBe(3);
    });

    test('Store ueberschreitet den Deckel: verdraengt genau so viele wie noetig, AELTESTE (kleinste Keys) zuerst', async function () {
        // TEST_MAX_RECORDS(5) + 10 = 15 Seed-Datensaetze, ids 1..15
        const seeds = [];
        for (let i = 1; i <= 15; i++) seeds.push(makeRecord(i));
        const mock = installMockIDB(seeds);
        const store = mock.idbInstance.transaction().objectStore();
        enforceStatsCap(store);
        await tick();
        expect(mock.mockStore.size).toBe(TEST_MAX_RECORDS);
        // Verbliebene Keys muessen die GROESSTEN sein (11..15) — die kleinsten (aeltesten) sind weg
        const remainingIds = Array.from(mock.mockStore.keys()).sort(function (a, b) { return a - b; });
        expect(remainingIds).toEqual([11, 12, 13, 14, 15]);
    });

    test('Randfall `idempotency`: zweiter Durchsetzungslauf auf einem Store an der Grenze loescht nichts', async function () {
        const seeds = [];
        for (let i = 1; i <= TEST_MAX_RECORDS; i++) seeds.push(makeRecord(i));
        const mock = installMockIDB(seeds); // exakt an der Grenze
        const store = mock.idbInstance.transaction().objectStore();
        enforceStatsCap(store);
        await tick();
        expect(mock.mockStore.size).toBe(TEST_MAX_RECORDS);
        // Zweiter Lauf — darf nichts mehr aendern
        enforceStatsCap(store);
        await tick();
        expect(mock.mockStore.size).toBe(TEST_MAX_RECORDS);
    });

    test('Randfall `concurrency`: wirft der Verdraengungs-Cursor, bleibt der Store unveraendert lesbar und enforceStatsCap() wirft nicht nach aussen', async function () {
        const seeds = [];
        for (let i = 1; i <= TEST_MAX_RECORDS + 3; i++) seeds.push(makeRecord(i));
        const mock = installMockIDB(seeds, { errorOnCursor: true });
        const store = mock.idbInstance.transaction().objectStore();
        expect(function () { enforceStatsCap(store); }).not.toThrow();
        await tick();
        // Cursor ist abgebrochen, BEVOR ein einziger Datensatz geloescht wurde — Store unveraendert
        expect(mock.mockStore.size).toBe(TEST_MAX_RECORDS + 3);
    });

    test('Randfall `concurrency`: wirft bereits store.count(), bleibt der Store unveraendert und lesbar', async function () {
        const seeds = [makeRecord(1), makeRecord(2)];
        const mock = installMockIDB(seeds, { throwOnCount: true });
        const store = mock.idbInstance.transaction().objectStore();
        expect(function () { enforceStatsCap(store); }).not.toThrow();
        await tick();
        expect(mock.mockStore.size).toBe(2);
    });

    test('Drosselung: statsIdbPut() ueberschreitet den Deckel zwischen zwei Durchsetzungen nie um mehr als STATS_CAP_CHECK_INTERVAL', async function () {
        const mock = installMockIDB([makeRecord(0)]); // 1 Seed-Datensatz, weit unter dem Deckel
        let maxSizeSeen = mock.mockStore.size;
        const rounds = 3 * TEST_THROTTLE;
        for (let i = 0; i < rounds; i++) {
            statsIdbPut(makeRecord(i + 1));
            // Laesst eine eventuell angestossene enforceStatsCap()-Kette vollstaendig durchlaufen,
            // bevor der naechste (simulierte) Wurf kommt — wie am Spieltisch, wo zwischen zwei
            // Wuerfen immer mindestens ein Event-Loop-Tick liegt.
            await tick(5);
            if (mock.mockStore.size > maxSizeSeen) maxSizeSeen = mock.mockStore.size;
        }
        expect(maxSizeSeen).toBeLessThanOrEqual(TEST_MAX_RECORDS + TEST_THROTTLE);
        // Der letzte Schreibvorgang (rounds ist ein Vielfaches von TEST_THROTTLE) hat noch eine
        // Durchsetzung angestossen — genug Nach-Ticks geben, damit sie vollstaendig durchlaeuft,
        // bevor der Enddeckel geprueft wird.
        await tick(TEST_THROTTLE + 20);
        expect(mock.mockStore.size).toBe(TEST_MAX_RECORDS);
    });

    test('fehlt window.idb, verhaelt sich statsIdbPut() wie bisher: stiller Rueckzug, kein Wurf', function () {
        global.window.idb = null;
        expect(function () { statsIdbPut(makeRecord(1)); }).not.toThrow();
    });
});

describe('clearAllStats / getStatsCount — Loeschfunktion mit Rueckfrage (PERF-02/D-11)', function () {
    test('erfolgreiches Leeren: clearAllStats() liefert true, Store ist danach leer', async function () {
        installMockIDB([makeRecord(1), makeRecord(2), makeRecord(3)]);
        const ok = await clearAllStats();
        expect(ok).toBe(true);
        const count = await getStatsCount();
        expect(count).toBe(0);
    });

    test('Fehlerfall: wirft die Loesch-Transaktion, liefert clearAllStats() false statt zu werfen', async function () {
        installMockIDB([makeRecord(1), makeRecord(2)], { throwOnClear: true });
        await expect(clearAllStats()).resolves.toBe(false);
    });

    test('fehlt window.idb, liefert clearAllStats() false und getStatsCount() 0', async function () {
        global.window.idb = null;
        await expect(clearAllStats()).resolves.toBe(false);
        await expect(getStatsCount()).resolves.toBe(0);
    });

    test('getStatsCount() liefert die exakte Datensatzzahl ohne den Store zu laden', async function () {
        const seeds = [];
        for (let i = 1; i <= 12; i++) seeds.push(makeRecord(i));
        installMockIDB(seeds);
        const count = await getStatsCount();
        expect(count).toBe(12);
    });
});

// ============================================================
// getStatsAggregate — cursor-basiertes Aggregat vs. bisheriger Array-Weg (PERF-02/D-12)
// ============================================================
//
// getStatsAggregate() ruft window._classifyD20Roll()/window.parseCharFromNotation() auf
// (echte Implementierung in dice-stats-render.js, hier NICHT mit-eval't — analog zu
// tests/unit/dice-stats.test.js, das dieselben reinen Helfer bereits als eigene Kopie fuer
// DOM-freie Tests haelt). Die Testdoubles unten sind bitgenau dieselbe Regel, damit der
// Vergleich mit dem "alten Weg" (computeD20CountsRef + attributeRollsRef) aussagekraeftig bleibt.

function computeD20CountsRef(records) {
    var counts = new Array(20).fill(0);
    if (!Array.isArray(records)) return counts;
    records.forEach(function (r) {
        if (!r.rolls || !Array.isArray(r.rolls)) return;
        var notation = (r.notation || '').toString();
        var isD20 = notation.includes('d20') || notation.includes('D20')
            || notation === 'Vorteil' || notation === 'Nachteil';
        if (!isD20) return;
        r.rolls.forEach(function (face) {
            if (typeof face === 'number' && face >= 1 && face <= 20) counts[face - 1]++;
        });
    });
    return counts;
}

function parseCharFromNotationRef(notation, characters) {
    if (!notation || typeof notation !== 'string') return 'Allgemein';
    var chars = Array.isArray(characters) ? characters : [];
    var colonIdx = notation.indexOf(': ');
    if (colonIdx > 0) {
        var prefix = notation.substring(0, colonIdx);
        for (var i = 0; i < chars.length; i++) {
            if (chars[i].name && chars[i].name === prefix) return chars[i].name;
        }
    }
    if (notation.endsWith(' Init')) {
        var namePart = notation.slice(0, -5);
        for (var j = 0; j < chars.length; j++) {
            if (chars[j].name && chars[j].name === namePart) return chars[j].name;
        }
    }
    return 'Allgemein';
}

function attributeRollsRef(records, characters) {
    var result = new Map();
    if (!Array.isArray(records)) return result;
    records.forEach(function (r) {
        var name = parseCharFromNotationRef(r.notation, characters);
        if (!result.has(name)) result.set(name, []);
        result.get(name).push(r);
    });
    return result;
}

function installClassifierStubs(characters) {
    global.window.D = { characters: characters || [] };
    global.window._classifyD20Roll = function (record, counts) {
        if (!record || !record.rolls || !Array.isArray(record.rolls)) return;
        var notation = (record.notation || '').toString();
        var isD20 = notation.includes('d20') || notation.includes('D20')
            || notation === 'Vorteil' || notation === 'Nachteil';
        if (!isD20) return;
        record.rolls.forEach(function (face) {
            if (typeof face === 'number' && face >= 1 && face <= 20) counts[face - 1]++;
        });
    };
    global.window.parseCharFromNotation = parseCharFromNotationRef;
}

function makeCharRecord(notation, rolls, sessionId) {
    return { notation: notation, result: rolls[0], rolls: rolls, timestamp: 1, sessionId: sessionId || 's', charId: null };
}

describe('getStatsAggregate — Cursor-Aggregat identisch zum bisherigen Array-Weg (PERF-02/D-12)', function () {
    afterEach(function () {
        delete global.window._classifyD20Roll;
        delete global.window.parseCharFromNotation;
    });

    test('gleiche Eingangsdaten: counts und byChar identisch zu computeD20Counts()/attributeRolls() ueber getAllStats()', async function () {
        const chars = [{ id: 1, name: 'Thorin' }, { id: 2, name: 'Gandalf' }];
        installClassifierStubs(chars);
        const seeds = [
            makeCharRecord('Thorin: STR', [12]),
            makeCharRecord('Thorin: STR Save', [8]),
            makeCharRecord('Gandalf: WIS', [17]),
            makeCharRecord('1d20', [20]),
            makeCharRecord('Vorteil', [14, 19]),
            makeCharRecord('Stats', ['irrelevant-non-d20'])
        ];
        installMockIDB(seeds);

        const aggregate = await getStatsAggregate();

        // "Alter Weg": getAllStats() (volles Array) + computeD20Counts()/attributeRolls()
        const oldCounts = computeD20CountsRef(seeds);
        const oldBreakdown = attributeRollsRef(seeds, chars);

        expect(aggregate.total).toBe(seeds.length);
        expect(aggregate.counts).toEqual(oldCounts);
        expect(Object.keys(aggregate.byChar).sort()).toEqual(Array.from(oldBreakdown.keys()).sort());
        oldBreakdown.forEach(function (recs, name) {
            expect(aggregate.byChar[name]).toEqual(computeD20CountsRef(recs));
        });
    });

    test('leerer Store: total 0, Nullen-Array (kein NaN)', async function () {
        installClassifierStubs([]);
        installMockIDB([]);
        const aggregate = await getStatsAggregate();
        expect(aggregate.total).toBe(0);
        expect(aggregate.counts).toEqual(new Array(20).fill(0));
        expect(Object.keys(aggregate.byChar)).toEqual([]);
        expect(Number.isNaN(aggregate.counts[0])).toBe(false);
    });

    test('Session-Filter: liefert dieselbe Menge wie getStatsForSession() + computeD20Counts()', async function () {
        installClassifierStubs([]);
        const seeds = [
            makeCharRecord('1d20', [15], 'A'),
            makeCharRecord('1d20', [3], 'A'),
            makeCharRecord('1d20', [18], 'A'),
            makeCharRecord('1d20', [7], 'B'),
            makeCharRecord('1d20', [12], 'B')
        ];
        installMockIDB(seeds);

        const aggregateA = await getStatsAggregate('A');
        const oldWay = seeds.filter(function (r) { return r.sessionId === 'A'; });
        expect(aggregateA.total).toBe(oldWay.length);
        expect(aggregateA.counts).toEqual(computeD20CountsRef(oldWay));

        const aggregateUnknown = await getStatsAggregate('X');
        expect(aggregateUnknown.total).toBe(0);
    });

    test('fehlt window.idb, liefert getStatsAggregate() das leere Aggregat statt zu werfen', async function () {
        installClassifierStubs([]);
        global.window.idb = null;
        const aggregate = await getStatsAggregate();
        expect(aggregate).toEqual({ total: 0, counts: new Array(20).fill(0), byChar: {} });
    });
});
