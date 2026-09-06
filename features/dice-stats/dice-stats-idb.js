// [SECTION:DICE_STATS_IDB]
// IndexedDB-Helper fuer Wuerfel-Statistiken (Phase 7 — UX-02)
// Schreibt jeden Wuerfelwurf in den "diceStats"-Store (additiv zu diceHistory, D-04/D-04a).
// Pattern: systems/backups.js saveBackupToIndexedDB() / getBackups()

// Boot-Session-ID: Identifiziert "diese Session" fuer den Session-Filter (D-05 / RESEARCH A6).
// Wird NICHT in D gespeichert — reiner Laufzeit-Wert.
const _sbSessionId = Date.now().toString();
window._currentSessionId = _sbSessionId;

// Harter Deckel auf die Datensatzzahl (PERF-02/D-11). Modulkonstante mit Rueckfallwert,
// Muster wie UNDO_LIMIT in systems/undo.js:8. Die konkrete Zahl (50.000) steht in
// core/config.js dokumentiert und begruendet.
const DICE_STATS_MAX_RECORDS = window.APP_CONFIG?.DICE_STATS_MAX_RECORDS || 50000;

// Drosselung der Deckel-Durchsetzung: enforceStatsCap() ruft store.count() auf — das bei
// JEDEM Wurf zu tun waere unnoetiger Overhead fuer einen Store, der ohnehin nur alle paar
// Jahre in die Naehe des Deckels kommt. Nur jeder STATS_CAP_CHECK_INTERVAL-te Schreibvorgang
// loest die Pruefung aus. Damit kann der Store zwischen zwei Pruefungen um hoechstens
// STATS_CAP_CHECK_INTERVAL Datensaetze ueber den Deckel hinaus wachsen — bewusst in Kauf
// genommen und durch einen eigenen Testfall (Drosselung) belegt.
const STATS_CAP_CHECK_INTERVAL = 50;
let _statsCapWriteCounter = 0;

/**
 * enforceStatsCap — verdraengt die AELTESTEN Datensaetze (kleinste autoIncrement-Keys, also
 * kleinste 'id'), wenn der Store den Deckel (DICE_STATS_MAX_RECORDS) ueberschreitet.
 * NIEMALS zeit- oder sitzungsbasiert (D-11-Verbot). Laeuft NACH store.add() und blockiert den
 * Schreibvorgang nicht — Statistiken sind unkritisch und duerfen einen Wuerfelwurf am
 * Spieltisch niemals aufhalten, deshalb wirft diese Funktion in KEINEM Fall nach aussen
 * (Randfall `concurrency`: eine werfende/abbrechende Verdraengungs-Transaktion laesst den
 * Store lesbar und statsIdbPut() unbeeintraechtigt).
 * @param {IDBObjectStore} store - dieselbe readwrite-Store-Instanz wie in statsIdbPut()
 */
function enforceStatsCap(store) {
    try {
        const countReq = store.count();
        countReq.onsuccess = function() {
            const total = countReq.result || 0;
            const excess = total - DICE_STATS_MAX_RECORDS;
            if (excess <= 0) return; // Randfall `idempotency`: an/unter dem Deckel wird nichts geloescht
            try {
                let deleted = 0;
                // Aufsteigende Schluesselreihenfolge (autoIncrement) = aeltestes zuerst
                const cursorReq = store.openCursor();
                cursorReq.onsuccess = function(e) {
                    const cursor = e.target.result;
                    if (!cursor || deleted >= excess) return;
                    try {
                        cursor.delete();
                    } catch (delErr) {
                        // Einzelnes Delete fehlgeschlagen — weiter versuchen, Statistik ist unkritisch
                    }
                    deleted++;
                    cursor.continue();
                };
                cursorReq.onerror = function() {
                    // Verdraengungs-Cursor abgebrochen — Store bleibt lesbar, kein Rethrow
                };
            } catch (cursorEx) {
                // openCursor() selbst geworfen — ignorieren, Store bleibt unangetastet
            }
        };
        countReq.onerror = function() {
            // count() abgebrochen — diesmal keine Verdraengung, kein Rethrow
        };
    } catch (e) {
        // Silently ignore — stats are non-critical
    }
}

/**
 * statsIdbPut — fire-and-forget write to diceStats IDB store (D-04).
 * Called from addToDiceHistory() via typeof guard.
 * Nach dem Schreiben (gedrosselt, siehe STATS_CAP_CHECK_INTERVAL): Deckel durchsetzen (PERF-02/D-11).
 * @param {Object} record - { notation, result, rolls, timestamp, sessionId, charId }
 */
function statsIdbPut(record) {
    // Defensive: IDB may not be ready on very first roll
    if (!window.idb) return;
    try {
        const tx = window.idb.transaction(['diceStats'], 'readwrite');
        const store = tx.objectStore('diceStats');
        store.add(record); // autoIncrement id — no oncomplete needed (fire-and-forget)
        _statsCapWriteCounter++;
        if (_statsCapWriteCounter % STATS_CAP_CHECK_INTERVAL === 0) {
            enforceStatsCap(store);
        }
    } catch (e) {
        // Silently ignore — stats are non-critical
    }
}

/**
 * getAllStats — returns all dice stats records from IDB.
 * @returns {Promise<Array>}
 */
async function getAllStats() {
    if (!window.initIndexedDB) return [];
    await window.initIndexedDB();
    return new Promise(function(resolve) {
        if (!window.idb) { resolve([]); return; }
        try {
            var tx = window.idb.transaction(['diceStats'], 'readonly');
            var store = tx.objectStore('diceStats');
            var req = store.getAll();
            req.onsuccess = function() { resolve(req.result || []); };
            req.onerror = function() { resolve([]); };
        } catch (e) {
            resolve([]);
        }
    });
}

/**
 * getStatsForSession — returns dice stats records filtered by sessionId.
 * @param {string} sessionId
 * @returns {Promise<Array>}
 */
async function getStatsForSession(sessionId) {
    if (!window.initIndexedDB) return [];
    await window.initIndexedDB();
    return new Promise(function(resolve) {
        if (!window.idb) { resolve([]); return; }
        try {
            var tx = window.idb.transaction(['diceStats'], 'readonly');
            var store = tx.objectStore('diceStats');
            var index = store.index('sessionId');
            var req = index.getAll(sessionId);
            req.onsuccess = function() { resolve(req.result || []); };
            req.onerror = function() { resolve([]); };
        } catch (e) {
            resolve([]);
        }
    });
}

/**
 * getStatsAggregate — cursor-basiertes Aggregat ueber den diceStats-Store, OHNE das
 * Datensatz-Array je zu materialisieren (PERF-02/D-12). Ersetzt fuer den heissen Konsumenten
 * dice-stats-render.js:233 den bisherigen Weg ueber getAllStats()/getStatsForSession() +
 * computeD20Counts(). getAllStats() selbst bleibt UNVERAENDERT fuer den einmaligen
 * Umzugs-Export (systems/migration/audio-export.js) erhalten — das ist die D-12-Grenze.
 *
 * Ruft window._classifyD20Roll()/window.parseCharFromNotation() (dice-stats-render.js) auf,
 * statt die Klassifikationsregel zu kopieren (DEBT-17/18-Vermeidung, siehe dortiger Kommentar).
 *
 * @param {string} [sessionId] - wenn gesetzt: nur Datensaetze dieser Session, ueber den
 *   bestehenden sessionId-Index (Formvorlage: getStatsForSession() oben). Sonst der gesamte Store.
 * @returns {Promise<{ total: number, counts: number[], byChar: Object<string, number[]> }>}
 */
async function getStatsAggregate(sessionId) {
    function emptyAggregate() { return { total: 0, counts: new Array(20).fill(0), byChar: {} }; }
    if (!window.initIndexedDB) return emptyAggregate();
    await window.initIndexedDB();
    return new Promise(function(resolve) {
        if (!window.idb) { resolve(emptyAggregate()); return; }
        try {
            var tx = window.idb.transaction(['diceStats'], 'readonly');
            var store = tx.objectStore('diceStats');
            var chars = (window.D && Array.isArray(window.D.characters)) ? window.D.characters : [];
            var total = 0;
            var counts = new Array(20).fill(0);
            var byChar = {};

            function classify(record) {
                total++;
                var name = (typeof window.parseCharFromNotation === 'function')
                    ? window.parseCharFromNotation(record.notation, chars)
                    : 'Allgemein';
                if (!byChar[name]) byChar[name] = new Array(20).fill(0);
                if (typeof window._classifyD20Roll === 'function') {
                    window._classifyD20Roll(record, counts);
                    window._classifyD20Roll(record, byChar[name]);
                }
            }

            var cursorReq = sessionId
                ? store.index('sessionId').openCursor(sessionId)
                : store.openCursor();

            cursorReq.onsuccess = function(e) {
                var cursor = e.target.result;
                if (!cursor) {
                    resolve({ total: total, counts: counts, byChar: byChar });
                    return;
                }
                classify(cursor.value);
                cursor.continue();
            };
            cursorReq.onerror = function() {
                resolve({ total: total, counts: counts, byChar: byChar });
            };
        } catch (e) {
            resolve(emptyAggregate());
        }
    });
}

/**
 * getStatsCount — Gesamtzahl aller Datensaetze im diceStats-Store, ueber store.count()
 * (kein Cursor, kein Array). Wird vom Loeschen-Knopf gebraucht, um den Verlust vor der
 * Rueckfrage zu beziffern (D-11) — ohne dafuer den Store voll zu laden (D-12-Geist).
 * @returns {Promise<number>}
 */
async function getStatsCount() {
    if (!window.initIndexedDB) return 0;
    await window.initIndexedDB();
    return new Promise(function(resolve) {
        if (!window.idb) { resolve(0); return; }
        try {
            var tx = window.idb.transaction(['diceStats'], 'readonly');
            var store = tx.objectStore('diceStats');
            var req = store.count();
            req.onsuccess = function() { resolve(req.result || 0); };
            req.onerror = function() { resolve(0); };
        } catch (e) {
            resolve(0);
        }
    });
}

/**
 * clearAllStats — loescht den GESAMTEN diceStats-Store (Nutzer-ausgeloest, mit Rueckfrage in
 * system-actions.js 'clear-dice-stats'). Liefert true bei Erfolg, false in JEDEM Fehler-/
 * Abbruchfall — dieselbe defensive Form wie getAllStats()/getStatsForSession() (D-11: Loeschen
 * ist endgueltig und unabhaengig von der Deckel-Verdraengung, darf aber niemals werfen).
 * @returns {Promise<boolean>}
 */
async function clearAllStats() {
    if (!window.initIndexedDB) return false;
    await window.initIndexedDB();
    return new Promise(function(resolve) {
        if (!window.idb) { resolve(false); return; }
        try {
            var tx = window.idb.transaction(['diceStats'], 'readwrite');
            var store = tx.objectStore('diceStats');
            var req = store.clear();
            if (req) {
                req.onsuccess = function() { resolve(true); };
                req.onerror = function() { resolve(false); };
            } else {
                resolve(true);
            }
        } catch (e) {
            resolve(false);
        }
    });
}

window.statsIdbPut = statsIdbPut;
window.getAllStats = getAllStats;
window.getStatsForSession = getStatsForSession;
window.getStatsCount = getStatsCount;
window.clearAllStats = clearAllStats;
window.getStatsAggregate = getStatsAggregate;
// enforceStatsCap ist intern (statsIdbPut ruft sie gedrosselt auf) — Export existiert nur,
// damit tests/unit/dice-stats-idb.test.js sie deterministisch einzeln aufrufen kann, ohne
// erst STATS_CAP_CHECK_INTERVAL Schreibvorgaenge zu simulieren.
window.enforceStatsCap = enforceStatsCap;
