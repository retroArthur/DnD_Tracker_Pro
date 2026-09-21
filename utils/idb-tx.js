// [SECTION:IDB_TX]
// ============================================================
// IndexedDB-Schreibbestaetigung (Code-Review 2026-09-21, R04)
// ============================================================
// Ein erfolgreicher Request (put/add/delete/clear) bestaetigt NICHT, dass die Aenderung
// dauerhaft uebernommen ist — er heisst nur "in die Transaktion eingereiht". Erst das
// 'complete'-Event der Transaktion bestaetigt den Commit. Scheitert der Commit (z. B.
// QuotaExceededError, E/A-Fehler, Seitenwechsel), feuert die Transaktion AUSSCHLIESSLICH
// 'abort' — kein 'error', weil kein Request mehr offen ist. Wer bei request.onsuccess
// aufloest, meldet einen Erfolg, den es nie gab; wer nur oncomplete/onerror hoert, wartet ewig.
//
// Vertrag:
//  - JEDE schreibende (readwrite) Transaktion der App laeuft ueber idbWriteTx(). Einzige
//    dokumentierte Ausnahme: statsIdbPut() (Wuerfelstatistik, fire-and-forget).
//    tests/unit/idb-transaction-commit.test.js (G1) prueft das ueber alle Loader-Module.
//  - work(tx) laeuft synchron im selben Task, in dem die Transaktion entsteht — kein await
//    davor oder darin (die Transaktion waere sonst inaktiv).
//  - Aufrufer setzen tx.oncomplete/onabort/onerror NIE selbst; das tut nur dieses Modul.
//  - request.onsuccess ist KEINE Bestaetigung der Dauerhaftigkeit.
//  - Commit-Fehler kommen nur als 'abort' an; der Rueckgabewert lehnt dann mit tx.error ab
//    (oder einem AbortError-Ersatz, wenn der Browser keinen Fehler nennt).
//  - Kein Aufrufer "rettet" einen Request-Fehler per preventDefault().

// Plain Error statt DOMException: laeuft auch in den vm-Kontexten der Unit-Tests.
function _idbAbortError() {
    const err = new Error('IndexedDB-Transaktion abgebrochen');
    err.name = 'AbortError';
    return err;
}

/**
 * Promise, das mit dem Ende der Transaktion aufgeloest wird: 'complete' loest auf,
 * 'abort' und 'error' lehnen ab. Im selben synchronen Durchlauf wie idb.transaction()
 * aufrufen (IDB-Events kommen fruehestens im naechsten Task, es geht keines verloren).
 * @param {IDBTransaction} tx
 * @returns {Promise<void>}
 */
function idbTransactionDone(tx) {
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error || _idbAbortError());
        tx.onerror = e => reject((e && e.target && e.target.error) || tx.error || _idbAbortError());
    });
}

/**
 * Oeffnet eine readwrite-Transaktion, fuehrt work(tx) synchron aus und loest erst nach dem
 * bestaetigten Commit mit dem Rueckgabewert von work auf. Wirft work, wird die Transaktion
 * abgebrochen und der Fehler weitergereicht.
 * @param {string|string[]} storeNames - Object-Store(s) der Transaktion
 * @param {function(IDBTransaction): *} work - legt die Requests an (synchron)
 * @param {{durability?: 'strict'|'relaxed'|'default'}} [options] - 'strict' nur dort, wo der
 *   Aufrufer danach die einzige andere Kopie entfernt
 * @returns {Promise<*>} Rueckgabewert von work
 */
async function idbWriteTx(storeNames, work, options) {
    if (!window.idb) {
        if (typeof window.initIndexedDB !== 'function') {
            throw new Error('IndexedDB nicht verfügbar');
        }
        await window.initIndexedDB();
    }
    const db = window.idb;
    if (!db) throw new Error('IndexedDB nicht verfügbar');
    const tx = db.transaction(
        storeNames,
        'readwrite',
        options && options.durability ? { durability: options.durability } : undefined
    );
    const done = idbTransactionDone(tx);
    let result;
    try {
        result = work(tx);
    } catch (err) {
        // Kein unbehandeltes Reject, falls abort() selbst scheitert
        const settled = done.catch(() => undefined);
        let aborted = false;
        try {
            tx.abort();
            aborted = true;
        } catch {
            // Transaktion bereits beendet — nichts mehr abzubrechen
        }
        if (aborted) await settled;
        throw err;
    }
    await done;
    return result;
}

window.idbTransactionDone = idbTransactionDone;
window.idbWriteTx = idbWriteTx;
