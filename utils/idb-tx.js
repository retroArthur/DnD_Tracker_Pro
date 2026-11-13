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
    return _idbWriteTx(db, storeNames, work, options);
}

async function _idbWriteTx(db, storeNames, work, options) {
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

function _openCampaignOperationDb(suffix, createStore) {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(APP_CONFIG.IDB_NAME + suffix, 1);
        request.onupgradeneeded = () => createStore(request.result);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

// Eine eigene DB hält das Journal auch in Browsern schreibbar, die Transaktionen
// derselben Datenbank selbst bei disjunkten Stores serialisieren.
async function _campaignImportJournal(work) {
    const db = await _openCampaignOperationDb('-campaign-import-recovery', database =>
        database.createObjectStore('import-recovery', { keyPath: 'id', autoIncrement: true })
    );
    try {
        const request = await _idbWriteTx(
            db,
            'import-recovery',
            tx => work(tx.objectStore('import-recovery')),
            { durability: 'strict' }
        );
        return request?.result;
    } finally {
        db.close();
    }
}

async function _withCampaignIdbLock(work) {
    let db;
    try {
        db = await _openCampaignOperationDb('-campaign-operations', database =>
            database.createObjectStore('mutex')
        );
    } catch (error) {
        throw new Error('Die tabübergreifende Kampagnensperre ist nicht verfügbar.', { cause: error });
    }

    let operation;
    let settled = false;
    try {
        // Eine eigene Datenbank hält die Kampagnen- und Backup-Transaktionen frei.
        // Der erste erfolgreiche Request bedeutet, dass diese Transaktion an der Reihe ist.
        const tx = db.transaction('mutex', 'readwrite');
        const done = idbTransactionDone(tx);
        const store = tx.objectStore('mutex');
        let lost;
        done.catch(error => {
            lost = error;
        });
        const assertHeld = () => {
            if (lost) throw lost;
        };
        // Rückbau nach Sperrverlust wartet auf den aktuellen Inhaber. Der äußere
        // Web Lock kann noch uns gehören, daher nur den gemeinsamen IDB-Mutex neu anfordern.
        const runRollback = async rollback => {
            if (!lost) {
                try {
                    const result = await rollback(assertHeld);
                    assertHeld();
                    return result;
                } catch (error) {
                    if (!lost) throw error;
                }
            }
            return _withCampaignIdbLock(rollback);
        };
        const keepAlive = () => {
            store.get(APP_CONFIG.CAMPAIGN_INDEX_KEY).onsuccess = () => {
                if (!operation) {
                    operation = Promise.resolve().then(() => work(assertHeld, runRollback, _campaignImportJournal));
                    const finish = () => {
                        settled = true;
                    };
                    operation.then(finish, finish);
                }
                // Solange die Arbeit läuft, bleibt durch den nächsten Request die Sperre aktiv.
                if (!settled) keepAlive();
            };
        };
        try {
            keepAlive();
            await done;
        } catch (error) {
            // Eine begonnene Operation auslaufen lassen und nicht erneut starten.
            await done.catch(() => {});
            if (operation) await operation;
            throw error;
        }
        return await operation;
    } finally {
        db.close();
    }
}

async function withCampaignIndexLock(work) {
    let started = false;
    try {
        const locks = window.navigator?.locks;
        if (locks?.request) {
            return await locks.request(APP_CONFIG.CAMPAIGN_INDEX_KEY, () => {
                started = true;
                // Auch unter Web Locks dieselbe IDB-Sperre nutzen wie Tabs ohne dieses API.
                return _withCampaignIdbLock(work);
            });
        }
    } catch (error) {
        if (started) throw error;
    }
    return _withCampaignIdbLock(work);
}

window.withCampaignIndexLock = withCampaignIndexLock;
