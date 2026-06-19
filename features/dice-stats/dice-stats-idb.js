// [SECTION:DICE_STATS_IDB]
// IndexedDB-Helper fuer Wuerfel-Statistiken (Phase 7 — UX-02)
// Schreibt jeden Wuerfelwurf in den "diceStats"-Store (additiv zu diceHistory, D-04/D-04a).
// Pattern: systems/backups.js saveBackupToIndexedDB() / getBackups()

// Boot-Session-ID: Identifiziert "diese Session" fuer den Session-Filter (D-05 / RESEARCH A6).
// Wird NICHT in D gespeichert — reiner Laufzeit-Wert.
const _sbSessionId = Date.now().toString();
window._currentSessionId = _sbSessionId;

/**
 * statsIdbPut — fire-and-forget write to diceStats IDB store (D-04).
 * Called from addToDiceHistory() via typeof guard.
 * @param {Object} record - { notation, result, rolls, timestamp, sessionId, charId }
 */
function statsIdbPut(record) {
    // Defensive: IDB may not be ready on very first roll
    if (!window.idb) return;
    try {
        const tx = window.idb.transaction(['diceStats'], 'readwrite');
        const store = tx.objectStore('diceStats');
        store.add(record); // autoIncrement id — no oncomplete needed (fire-and-forget)
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

window.statsIdbPut = statsIdbPut;
window.getAllStats = getAllStats;
window.getStatsForSession = getStatsForSession;
