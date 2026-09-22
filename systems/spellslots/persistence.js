// [SECTION:PERSISTENCE]
// Extrahiert aus spellslots.js
// Save/Load Funktionen
// Zeilen: 164
// PERSISTENCE
// ============================================================
let saveTimeout = null;
// R04 (Code-Review 2026-09-21) — Ueberholschutz: jeder Save, der D serialisiert hat, zieht
// eine Generation. INVARIANTE: localStorage-Writes laufen synchron im selben Task wie
// ++_persistGeneration — zwischen beiden NIE ein await einfuegen, sonst ist
// _lsWriteGeneration nicht mehr monoton. Nach einem IDB-Commit werden LS-Eintraege nur
// entfernt, wenn seither kein neuerer LS-Write gelungen ist; ein ueberholter Save verwirft
// seinen Retry (der neuere Save enthaelt den vollstaendigen Stand und meldet selbst).
let _persistGeneration = 0;
let _lsWriteGeneration = 0;
// (D-03) Notfall-Export nur einmal pro Fehlerserie; jeder erfolgreiche Save setzt zurueck.
let _persistFailureStreak = false;
// ============================================================
// R02 (Code-Review 2026-09-21, U7) — Persist-Baseline und Schreibsteuerung
// ============================================================
// Was dieser Tab zuletzt gelesen (load) oder geschrieben (Save) hat: key, stored (der
// localStorage-Wert danach, null im IndexedDB-Modus), rev (der _rev-Marker danach), snapshot
// (JSON des damit gleichen D) und external (ein anderer Tab hat seither gespeichert —
// BroadcastChannel/storage-Ereignis, systems/undo.js). Nur ein Tab, dessen Baseline zum
// Speicher passt, schreibt ungefragt; ohne Baseline (load() gescheitert) nie beim Verlassen.
let _persistBaseline = null;
// Harte Schreibsperre fuer loeschende/umziehende Ablaeufe (retireCampaignWrites): save(),
// saveImmediate(), der Debounce-Koerper, saveAutomatic() und das Verlassen schreiben nichts.
let _campaignWritesRetired = false;
// retireCampaignWrites() hat einen ausstehenden save() verworfen (resume holt ihn nach)
let _retireCancelledSave = false;
// Laufende IndexedDB-Schreibvorgaenge (saveToIndexedDBFallback) und wer auf ihr Ende wartet
let _persistWritesInFlight = 0;
const _persistSettleWaiters = [];
// Der letzte Save ist endgueltig gescheitert — beim Verlassen wie ein ausstehender Save
let _lastPersistFailed = false;
// Anzahl bestaetigter Saves dieses Tabs (getPersistSuccessCount)
let _persistSuccessCount = 0;
// showMessage des ausstehenden entprellten save() (fuer den vorgezogenen Flush)
let _pendingSaveShowMessage = false;
// Ab dieser UTF-8-Groesse: IndexedDB-Modus (localStorage fasst ~5 MB)
const PERSIST_LS_LIMIT_MB = 5;
// Hoechstens so lange warten Sperre/Flush auf laufende IndexedDB-Writes
const PERSIST_SETTLE_CAP_MS = 5000;
// Generische Post-Save-Hooks: explizite Registrierung statt window.save-Monkey-Patch.
// WICHTIG: Bare save()-Aufrufe binden an die globale const-Deklaration und umgehen
// jeden window.save-Wrapper dauerhaft (UAT 02: Datei-Backup schrieb nie bei Entity-CRUD;
// DM-Screen-Live-Sync war identisch betroffen). Konsumenten registrieren sich via
// registerPostSaveHook(fn) — die Hooks feuern NACH dem tatsächlichen Write an jedem
// Persist-Erfolgspunkt (frische Daten lesbar, kein Stale-Read).
function registerPostSaveHook(fn) {
    if (typeof fn !== 'function') return;
    if (!Array.isArray(window._postSaveHooks)) window._postSaveHooks = [];
    if (!window._postSaveHooks.includes(fn)) window._postSaveHooks.push(fn);
}
function _notifyPostSaveHooks() {
    const hooks = window._postSaveHooks;
    if (!Array.isArray(hooks)) return;
    for (const fn of hooks) {
        try {
            fn();
        } catch (e) {
            // Ein defekter Hook darf weder das Speichern noch andere Hooks brechen
            if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
                window.ErrorHandler && window.ErrorHandler.log('postSaveHook', e, 'Hook fehlgeschlagen');
            }
        }
    }
}
// Byte-Größe von str: bevorzugt allokationsfrei über window.utf8ByteLength (PERF-01/D-08),
// mit Blob-Rückfall, falls die Funktion (noch) nicht aufgelöst werden kann — ein Save darf
// dadurch nicht scheitern. Parametername bewusst NICHT "dataString": hält den Blob-Rückfall
// textuell von den entfernten Alt-Aufrufstellen unterscheidbar (Nyquist-Grep in 13-06-PLAN.md).
function _measureDataByteLength(str) {
    if (typeof window.utf8ByteLength === 'function') return window.utf8ByteLength(str);
    return new Blob([str]).size;
}
// (D-03) Endgueltiger Save-Fehler: Anzeige und lauter Toast bei JEDEM Fehlschlag, der
// Notfall-Export nur einmal pro Fehlerserie — sonst laedt ein dauerhafter Quota-Fehler
// bei jeder Aenderung erneut ~5 MB herunter.
function _reportPersistFailure() {
    _lastPersistFailed = true;
    window.updateSaveIndicator('error');
    showToast(
        '❌ Speichern fehlgeschlagen! Daten gehen sonst verloren — JETZT exportieren!',
        'error',
        10000
    );
    if (!_persistFailureStreak && typeof window.exportAllDataAsFile === 'function') {
        window.exportAllDataAsFile();
    }
    _persistFailureStreak = true;
}
// Kein aktiver Kampagnenschluessel: nie unter "null"/"undefined" schreiben (R02)
function _persistKeyMissing(where) {
    _lastPersistFailed = true;
    window.updateSaveIndicator('error');
    if (window.ErrorHandler) {
        window.ErrorHandler.log(
            where,
            new Error('Kein aktiver Kampagnenschlüssel'),
            'Save abgebrochen'
        );
    }
    return { success: false, error: 'no-campaign-key' };
}
/**
 * Baseline nach load(): stored ist der localStorage-Rohwert VOR jeder IndexedDB-Ersetzung,
 * snapshot das JSON des geladenen D. Der _rev-Marker wird mitgelesen.
 */
function setPersistBaseline(key, stored, snapshot) {
    _persistBaseline = {
        key,
        stored: stored === undefined ? null : stored,
        rev: StorageAPI.get(key + '_rev', null),
        snapshot: typeof snapshot === 'string' ? snapshot : null,
        external: false
    };
}
// Snapshot an D angleichen (init: Render-Normalisierungen sind keine Aenderung) — nur ohne
// ausstehenden oder laufenden Save, sonst gaelte ungespeicherte Arbeit als gespeichert
function refreshPersistSnapshot() {
    if (!_persistBaseline || saveTimeout || _persistWritesInFlight > 0) return;
    try {
        _persistBaseline.snapshot = JSON.stringify(window.D);
    } catch {
        // Snapshot bleibt — der Tab gilt dann beim Verlassen als geaendert
    }
}
// Ein anderer Tab hat diese Kampagne gespeichert (systems/undo.js, Konflikt-Erkennung)
function markExternalCampaignWrite(key) {
    if (_persistBaseline && _persistBaseline.key === key) _persistBaseline.external = true;
}
/**
 * Veraltet: der Speicher entspricht nicht mehr dem, was dieser Tab zuletzt gelesen oder
 * geschrieben hat — keine Baseline, fremder Save gemeldet, anderer _rev oder anderer Inhalt
 * (die Inhaltspruefung faengt auch Schreiber ohne _rev und ohne Broadcast).
 */
function isCampaignStorageStale(key) {
    const b = _persistBaseline;
    if (!b || b.key !== key) return true;
    if (b.external) return true;
    if (StorageAPI.get(key + '_rev', null) !== b.rev) return true;
    return StorageAPI.get(key, null) !== b.stored;
}
// Gemeinsamer Erfolgspunkt aller Schreibpfade: neuer _rev-Marker (leise — kein zweiter
// Quota-Toast; scheitert er, gilt der vorhandene), neue Baseline. lsValueNow ist der
// localStorage-Wert NACH dem Save (im IndexedDB-Modus ggf. null).
function _onPersistSuccess(key, lsValueNow, dataString) {
    let rev = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    if (!StorageAPI.setQuiet(key + '_rev', rev).success) rev = StorageAPI.get(key + '_rev', null);
    _persistBaseline = { key, stored: lsValueNow, rev, snapshot: dataString, external: false };
    _lastPersistFailed = false;
    _persistSuccessCount++;
}
function getPersistSuccessCount() {
    return _persistSuccessCount;
}
function _cancelPendingSave() {
    if (!saveTimeout) return false;
    clearTimeout(saveTimeout);
    saveTimeout = null;
    return true;
}
function _endPersistWrite() {
    _persistWritesInFlight = Math.max(0, _persistWritesInFlight - 1);
    if (_persistWritesInFlight === 0) _persistSettleWaiters.splice(0).forEach(fn => fn());
}
// Loest auf, sobald kein IndexedDB-Write mehr laeuft — hoechstens nach capMs
function _waitForPersistSettle(capMs) {
    if (_persistWritesInFlight === 0) return Promise.resolve();
    return new Promise(resolve => {
        const done = () => {
            window.clearTimeout(timer);
            resolve();
        };
        const timer = window.setTimeout(() => {
            const i = _persistSettleWaiters.indexOf(done);
            if (i >= 0) _persistSettleWaiters.splice(i, 1);
            resolve();
        }, capMs);
        _persistSettleWaiters.push(done);
    });
}
/**
 * Harte Schreibsperre VOR dem Entfernen oder Ersetzen der gespeicherten Kampagne ("Alle Daten
 * loeschen", Kampagne loeschen, Umzugs-Import). Setzt die Sperre SYNCHRON und verwirft einen
 * ausstehenden save(); das Promise loest auf, wenn laufende IndexedDB-Writes fertig sind
 * (hoechstens PERSIST_SETTLE_CAP_MS). Danach schreiben save(), saveImmediate()
 * ({success:false, error:'retired'}), saveAutomatic() und das Verlassen nichts mehr.
 */
function retireCampaignWrites() {
    _campaignWritesRetired = true;
    if (_cancelPendingSave()) _retireCancelledSave = true;
    return _waitForPersistSettle(PERSIST_SETTLE_CAP_MS);
}
// Abbruchpfade: Sperre aufheben; einen verworfenen save() nachholen
function resumeCampaignWrites() {
    _campaignWritesRetired = false;
    if (_retireCancelledSave) {
        _retireCancelledSave = false;
        save(_pendingSaveShowMessage);
    }
}
/**
 * Fuer Schreibvorgaenge, um die niemand ausdruecklich gebeten hat (Session-Timer-Autosave,
 * Reparatur nach load(), Standard-Zufallstabellen): nur in einem nicht gesperrten, nicht
 * veralteten Tab (D4 = A). Ausdrueckliche Saves bleiben last-writer-wins.
 * @returns {boolean} true, wenn ein save() angestossen wurde
 */
function saveAutomatic() {
    const key = window.getActiveCampaignKey();
    if (_campaignWritesRetired || !key || isCampaignStorageStale(key)) {
        if (
            window.APP_CONFIG &&
            window.APP_CONFIG.DEBUG_MODE &&
            typeof window.debugLogAdd === 'function'
        ) {
            window.debugLogAdd(
                '[saveAutomatic] Übersprungen: Tab veraltet oder Schreiben gesperrt'
            );
        }
        return false;
    }
    save();
    return true;
}
// Ausstehenden entprellten Save sofort ausfuehren (pagehide, verstecken, vor dem Neuladen).
// Ein veralteter Tab zieht nicht vor: sein ausstehender Save laeuft regulaer, solange die
// Seite lebt, und endet mit ihr, wenn der Nutzer sie nach der Rueckfrage verlaesst.
function flushPendingSave() {
    if (_campaignWritesRetired || !saveTimeout) return;
    const key = window.getActiveCampaignKey();
    if (!key || isCampaignStorageStale(key)) return;
    _cancelPendingSave();
    _persistNow(_pendingSaveShowMessage);
}
// Fuer interne Reload-Stellen (Kampagnenwechsel): festschreiben und den Commit abwarten
async function flushPendingSaveAndSettle() {
    flushPendingSave();
    await _waitForPersistSettle(PERSIST_SETTLE_CAP_MS);
}
// Native "Seite verlassen?"-Rueckfrage anfordern (D5 = A). Browser zeigen sie nur nach einer
// Nutzeraktivierung und ohne eigenen Text.
function _askToStay(event) {
    if (!event) return;
    event.preventDefault();
    event.returnValue = '';
}
/**
 * beforeunload (R02): schreibt NIE blind.
 *  - gesperrt oder keine passende Baseline (load() gescheitert) -> nichts
 *  - unveraendert -> nichts (Rueckfrage nur, solange ein IndexedDB-Write laeuft)
 *  - veraltet -> nie schreiben; Rueckfrage nur fuer einen ausdruecklichen Save (ausstehend,
 *    laufend, gescheitert). Harmlose Nebenaenderungen verfallen still.
 *  - > 5 MB -> IndexedDB-Save anstossen (asynchron, bestmoeglich)
 *  - sonst synchron nach localStorage mit _ts und _rev
 * Der ausstehende Timer wird erst verworfen, wenn wirklich geschrieben wird — waehlt der
 * Nutzer "Bleiben", laeuft er danach regulaer.
 */
function persistOnUnload(event) {
    if (_campaignWritesRetired) return;
    const key = window.getActiveCampaignKey();
    const b = _persistBaseline;
    if (!key || !b || b.key !== key) return;
    let current;
    try {
        current = JSON.stringify(window.D);
    } catch {
        return;
    }
    const explicit = !!saveTimeout || _persistWritesInFlight > 0 || _lastPersistFailed;
    if (current === b.snapshot) {
        if (_persistWritesInFlight > 0) _askToStay(event);
        else _cancelPendingSave(); // nichts zu schreiben: identisch mit dem letzten Stand
        return;
    }
    if (isCampaignStorageStale(key)) {
        if (explicit) _askToStay(event);
        return;
    }
    if (_measureDataByteLength(current) / (1024 * 1024) > PERSIST_LS_LIMIT_MB) {
        _cancelPendingSave();
        _persistNow(false);
        if (explicit) _askToStay(event);
        return;
    }
    _cancelPendingSave();
    const generation = ++_persistGeneration;
    if (StorageAPI.set(key, current).success) {
        StorageAPI.set(key + '_ts', String(Date.now()));
        _lsWriteGeneration = generation;
        _persistFailureStreak = false;
        _onPersistSuccess(key, current, current);
        return;
    }
    _persistNow(false);
    if (explicit) _askToStay(event);
}
// Einmalig: Verlassen-Schutz plus vorgezogener Flush beim Verstecken/pagehide — grosse
// Kampagnen sind so schon waehrend der Nutzung sicher, nicht erst beim Verlassen
function initUnloadPersistence() {
    if (window._unloadPersistenceBound) return;
    window._unloadPersistenceBound = true;
    window.addEventListener('beforeunload', persistOnUnload);
    window.addEventListener('pagehide', flushPendingSave);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushPendingSave();
    });
}
// Sofortiges Speichern (für kritische Aktionen).
// Ergebnis (R04): {success:true, backend:'localStorage'|'indexedDB'} erst nach bestaetigtem
// Write, {success:false, error} bei endgueltigem Fehler, {success:false, superseded:true,
// error:'superseded'}, wenn ein neuerer Save diesen ueberholt hat. R02: {success:false,
// error:'retired'} unter der Schreibsperre, {success:false, error:'no-campaign-key'} ohne Schluessel.
async function saveImmediate() {
    if (_campaignWritesRetired) return { success: false, error: 'retired' };
    const key = window.getActiveCampaignKey();
    const D = window.D;
    const updateSaveIndicator = window.updateSaveIndicator;
    const broadcastSave = window.broadcastSave;
    if (!key) return _persistKeyMissing('saveImmediate');
    updateSaveIndicator('saving');
    let dataString;
    try {
        dataString = JSON.stringify(D);
    } catch (serializeError) {
        window.ErrorHandler &&
            window.ErrorHandler.log('saveImmediate', serializeError, 'JSON Serialisierung fehlgeschlagen');
        _lastPersistFailed = true;
        updateSaveIndicator('error');
        window.ErrorHandler && window.ErrorHandler.showError('Daten konnten nicht serialisiert werden');
        return { success: false, error: serializeError.message };
    }
    const generation = ++_persistGeneration;
    const dataSizeMB = _measureDataByteLength(dataString) / (1024 * 1024);
    // localStorage Limit: ~5-10MB je nach Browser
    const LS_LIMIT_MB = PERSIST_LS_LIMIT_MB;
    const LS_WARNING_MB = 4;
    try {
        // (D-08) 4-MB-Warnung einmal pro Sitzung — kein Toast-Spam am Spieltisch
        if (dataSizeMB > LS_WARNING_MB && dataSizeMB <= LS_LIMIT_MB) {
            if (!window._sizeWarningSeen) {
                window._sizeWarningSeen = true;
                showToast(
                    `⚠️ Kampagne wird groß (${dataSizeMB.toFixed(1)}MB). Backup empfohlen!`,
                    'warning',
                    5000
                );
            }
        }
        // (D-01 / STAB-05) IDB-only-Pfad bei >5MB: LS-Schatten entfernen nach bestätigtem IDB-Write
        if (dataSizeMB > LS_LIMIT_MB) {
            await saveToIndexedDBFallback(key, dataString);
            // R04: erst nach dem Commit, und nur ohne neueren LS-Write
            if (_lsWriteGeneration < generation) {
                StorageAPI.remove(key);
                StorageAPI.remove(key + '_ts');
            }
            _persistFailureStreak = false;
            _onPersistSuccess(key, StorageAPI.get(key, null), dataString);
            updateSaveIndicator('saved');
            // (D-02) Sitzungs-Hinweis einmal pro Sitzung, kein Per-Save-Toast
            if (!window._idbModeSeen) {
                window._idbModeSeen = true;
                showToast(
                    '💾 Kampagne im IndexedDB-Modus (>5MB). Daten sicher gespeichert.',
                    'info',
                    4000
                );
            }
            broadcastSave();
            _notifyPostSaveHooks();
            return { success: true, backend: 'indexedDB' };
        }
        // Normaler localStorage-Save
        const saveResult = StorageAPI.set(key, dataString);
        if (!saveResult.success) {
            // Fehler beim Speichern → werfe Error für catch-Block
            throw new Error(saveResult.error);
        }
        // (D-01) Begleit-Timestamp für Konflikt-Erkennung beim Laden
        StorageAPI.set(key + '_ts', String(Date.now()));
        _lsWriteGeneration = generation;
        _persistFailureStreak = false;
        _onPersistSuccess(key, dataString, dataString);
        updateSaveIndicator('saved');
        broadcastSave();
        _notifyPostSaveHooks();
        // Zusätzliches IndexedDB-Backup bei großen Daten (>2MB) — ohne strict-fsync:
        // localStorage bleibt hier die fuehrende Kopie
        if (dataSizeMB > 2) {
            saveToIndexedDBFallback(key, dataString, { optionalCopy: true }).catch(e => {
                if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
                    window.ErrorHandler &&
                        window.ErrorHandler.log(
                            'saveImmediate',
                            e,
                            '[IDB Backup] Optional backup failed'
                        );
                }
            });
        }
        return { success: true, backend: 'localStorage' };
    } catch (e) {
        // R04: ueberholt — ein neuerer Save hat D bereits vollstaendig serialisiert und meldet
        // selbst. Ein spaeter Retry mit diesem aelteren Stand koennte ihn in IDB ueberschreiben.
        if (generation !== _persistGeneration) {
            return { success: false, superseded: true, error: 'superseded' };
        }
        if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
            window.ErrorHandler &&
                window.ErrorHandler.log('saveImmediate', e, 'localStorage save failed');
        }
        // >5 MB: der Fehler kam aus dem IDB-Zweig, dies ist der zweite Versuch
        const retryAfterIdb = dataSizeMB > LS_LIMIT_MB;
        // Fallback zu IndexedDB bei Fehler
        try {
            await saveToIndexedDBFallback(key, dataString);
            // (D-01) Begleit-Timestamp für IDB-Fallback entfernen (IDB hat eigenen timestamp).
            // R04: nur ohne neueren LS-Write; nach einem >5-MB-Retry auch keinen LS-Schatten
            // ohne _ts zuruecklassen (loest sonst beim Laden einen Schein-Konflikt aus).
            if (_lsWriteGeneration < generation) {
                StorageAPI.remove(key + '_ts');
                if (dataSizeMB > LS_LIMIT_MB) StorageAPI.remove(key);
            }
            _persistFailureStreak = false;
            _onPersistSuccess(key, StorageAPI.get(key, null), dataString);
            updateSaveIndicator('saved');
            showToast(
                retryAfterIdb
                    ? '💾 In IndexedDB gespeichert (zweiter Versuch)'
                    : '💾 In IndexedDB gespeichert (localStorage voll)',
                'warning'
            );
            broadcastSave();
            _notifyPostSaveHooks();
            return { success: true, backend: 'indexedDB' };
        } catch (idbError) {
            if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
                window.ErrorHandler &&
                    window.ErrorHandler.log('saveImmediate', idbError, 'IndexedDB fallback failed');
            }
            // (D-03) Lauter Fehler-Toast + Export-Versuch (einmal pro Fehlerserie)
            _reportPersistFailure();
            return { success: false, error: (idbError && idbError.message) || String(idbError) };
        }
    }
}
// IndexedDB Fallback für große Kampagnen. R04: loest erst nach dem bestaetigten Commit auf
// ('complete'); ein abgebrochener Commit lehnt ab. Standard ist durability 'strict', weil die
// Aufrufer danach die andere Kopie (LS-Schatten, _ts) entfernen; nur die optionale Zusatzkopie
// neben einem gelungenen localStorage-Save verzichtet darauf ({ optionalCopy: true }).
async function saveToIndexedDBFallback(key, dataString, opts) {
    // R02: laufende Writes zaehlen — Schreibsperre und Flush warten darauf, das Verlassen
    // fragt nach. Die optionale Zusatzkopie zaehlt nicht (localStorage fuehrt dort).
    const tracked = !(opts && opts.optionalCopy);
    if (tracked) _persistWritesInFlight++;
    try {
        await window.idbWriteTx(
            ['campaigns'],
            tx => {
                tx.objectStore('campaigns').put({
                    id: key,
                    data: dataString,
                    timestamp: Date.now()
                });
            },
            { durability: tracked ? 'strict' : undefined }
        );
    } finally {
        if (tracked) _endPersistWrite();
    }
    return key;
}
/**
 * Entfernt alle gespeicherten Kopien einer Kampagne: IndexedDB ZUERST (bestaetigter Commit,
 * strict), erst danach localStorage (Daten, _ts, _rev). Scheitert der IDB-Delete, bleibt
 * localStorage unangetastet — sonst holte load() eine womoeglich aeltere IDB-Kopie zurueck.
 * Wirft nie.
 * @param {string} key - Kampagnen-Speicherschluessel
 * @returns {Promise<{success: true} | {success: false, stage: string, error: *}>}
 */
async function removeCampaignData(key) {
    if (typeof key !== 'string' || key === '') {
        return { success: false, stage: 'key', error: new Error('Ungültiger Kampagnenschlüssel') };
    }
    if (window.indexedDB || window.idb) {
        try {
            await window.idbWriteTx(
                ['campaigns'],
                tx => {
                    tx.objectStore('campaigns').delete(key);
                },
                { durability: 'strict' }
            );
        } catch (error) {
            return { success: false, stage: 'indexedDB', error };
        }
    }
    try {
        StorageAPI.remove(key);
        StorageAPI.remove(key + '_ts');
        StorageAPI.remove(key + '_rev');
    } catch (error) {
        return { success: false, stage: 'localStorage', error };
    }
    return { success: true };
}
/**
 * Schreibt die Daten EINER Kampagne nach denselben Regeln wie save(), aber ohne
 * UI-Nebenwirkungen (kein Toast, keine Speicheranzeige, kein Broadcast, keine
 * Post-Save-Hooks) — fuer Kampagnen, die dieser Tab (noch) nicht anzeigt: neue Kampagne,
 * Import als neue Kampagne (Code-Review 2026-09-21, R07).
 *  - > 5 MB (UTF-8): nur IndexedDB (strict, bestaetigter Commit), danach localStorage-Kopie
 *    und _ts entfernen
 *  - sonst localStorage plus _ts-Begleiter (sonst haelt load() den Stand fuer einen
 *    veralteten Schatten)
 *  - scheitert localStorage: IndexedDB-Rueckfall (strict), _ts entfernen
 * Ein IndexedDB-Erfolg ist belastbar, weil saveToIndexedDBFallback() erst nach 'complete'
 * aufloest (R04). Wirft nie.
 * @param {string} key - Kampagnen-Speicherschluessel
 * @param {object|string} data - Kampagnenobjekt oder bereits serialisierter Text
 * @returns {Promise<{success: boolean, backend: 'localStorage'|'indexedDB'|null, error: string|null}>}
 */
async function writeCampaignData(key, data) {
    const LS_LIMIT_MB = PERSIST_LS_LIMIT_MB;
    const fail = error => ({ success: false, backend: null, error: String(error) });
    if (typeof key !== 'string' || key === '') return fail('Ungültiger Kampagnenschlüssel');
    let dataString;
    try {
        dataString = typeof data === 'string' ? data : JSON.stringify(data);
    } catch (serializeError) {
        return fail((serializeError && serializeError.message) || 'Serialisierung fehlgeschlagen');
    }
    if (typeof dataString !== 'string') return fail('Keine Kampagnendaten');
    try {
        if (_measureDataByteLength(dataString) / (1024 * 1024) > LS_LIMIT_MB) {
            await saveToIndexedDBFallback(key, dataString);
            StorageAPI.remove(key);
            StorageAPI.remove(key + '_ts');
            return { success: true, backend: 'indexedDB', error: null };
        }
        const lsResult = StorageAPI.setQuiet(key, dataString);
        if (lsResult.success) {
            StorageAPI.setQuiet(key + '_ts', String(Date.now()));
            return { success: true, backend: 'localStorage', error: null };
        }
        try {
            await saveToIndexedDBFallback(key, dataString);
        } catch (idbError) {
            if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE && window.ErrorHandler) {
                window.ErrorHandler.log('writeCampaignData', idbError, 'IndexedDB-Rueckfall fehlgeschlagen');
            }
            return fail(lsResult.error || 'Speichern fehlgeschlagen');
        }
        StorageAPI.remove(key + '_ts');
        return { success: true, backend: 'indexedDB', error: null };
    } catch (error) {
        return fail((error && error.message) || error);
    }
}
// Load mit IndexedDB-Fallback (gibt nur .data zurück)
async function loadFromIndexedDBFallback(key) {
    const initIndexedDB = window.initIndexedDB;
    let idb = window.idb;
    if (!idb) await initIndexedDB();
    idb = window.idb; // Reload after init
    return new Promise((resolve, reject) => {
        const transaction = idb.transaction(['campaigns'], 'readonly');
        const store = transaction.objectStore('campaigns');
        const request = store.get(key);
        request.onsuccess = () => {
            if (request.result) {
                resolve(request.result.data);
            } else {
                reject(new Error('No data found'));
            }
        };
        request.onerror = () => reject(request.error);
    });
}
// (D-01/D-07) Raw-Read: gibt das vollständige {id, data, timestamp}-Record zurück.
// Wird vom Load-Pfad in quick-roll.js für den Timestamp-Vergleich benötigt.
async function loadFromIndexedDBFallbackRaw(key) {
    const initIndexedDB = window.initIndexedDB;
    let idb = window.idb;
    if (!idb) await initIndexedDB();
    idb = window.idb;
    return new Promise((resolve, reject) => {
        const transaction = idb.transaction(['campaigns'], 'readonly');
        const store = transaction.objectStore('campaigns');
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || null); // {id, data, timestamp} | null
        request.onerror = () => reject(request.error);
    });
}
// Debounced Save (für häufige Änderungen)
// Als Variable definiert, um spätere Erweiterung (Decorator-Pattern) zu ermöglichen.
// Der Timer-Koerper ist _persistNow() — flushPendingSave() zieht ihn vor (R02).
const save = function (showMessage = false) {
    if (_campaignWritesRetired) return;
    const updateSaveIndicator = window.updateSaveIndicator;
    updateSaveIndicator('saving');
    if (saveTimeout) clearTimeout(saveTimeout);
    _pendingSaveShowMessage = showMessage;
    saveTimeout = window.setTimeout(() => {
        saveTimeout = null;
        _persistNow(showMessage);
    }, 300);
};
// Ein Save-Durchlauf des entprellten save() (auch vorgezogen durch flushPendingSave())
async function _persistNow(showMessage = false) {
    if (_campaignWritesRetired) return;
    const key = window.getActiveCampaignKey();
    const D = window.D;
    const ErrorHandler = window.ErrorHandler;
    const updateSaveIndicator = window.updateSaveIndicator;
    const broadcastSave = window.broadcastSave;
    if (!key) {
        _persistKeyMissing('save');
        return;
    }
    // Sichere JSON-Serialisierung
    let dataString;
    try {
        dataString = JSON.stringify(D);
    } catch (serializeError) {
        ErrorHandler.log('save', serializeError, 'JSON Serialisierung fehlgeschlagen');
        _lastPersistFailed = true;
        updateSaveIndicator('error');
        ErrorHandler.showError('Daten konnten nicht serialisiert werden');
        return;
    }
    const generation = ++_persistGeneration;
    const dataSizeMB = _measureDataByteLength(dataString) / (1024 * 1024);
    const LS_LIMIT_MB = PERSIST_LS_LIMIT_MB;
    try {
        // (D-01 / STAB-05) IDB-only-Pfad: LS-Schatten nach bestätigtem IDB-Write entfernen
        if (dataSizeMB > LS_LIMIT_MB) {
            await saveToIndexedDBFallback(key, dataString);
            // R04: erst nach dem Commit, und nur ohne neueren LS-Write
            if (_lsWriteGeneration < generation) {
                StorageAPI.remove(key);
                StorageAPI.remove(key + '_ts');
            }
            _persistFailureStreak = false;
            _onPersistSuccess(key, StorageAPI.get(key, null), dataString);
            updateSaveIndicator('saved');
            broadcastSave();
            _notifyPostSaveHooks();
            // (D-02) Sitzungs-Hinweis statt Per-Save-Toast
            if (!window._idbModeSeen) {
                window._idbModeSeen = true;
                showToast(
                    '💾 Kampagne im IndexedDB-Modus (>5MB). Daten sicher gespeichert.',
                    'info',
                    4000
                );
            }
            return;
        }
        const saveResult = StorageAPI.set(key, dataString);
        if (!saveResult.success) {
            throw new Error(saveResult.error);
        }
        // (D-01) Begleit-Timestamp setzen
        StorageAPI.set(key + '_ts', String(Date.now()));
        _lsWriteGeneration = generation;
        _persistFailureStreak = false;
        _onPersistSuccess(key, dataString, dataString);
        updateSaveIndicator('saved');
        broadcastSave();
        _notifyPostSaveHooks();
        if (showMessage) showToast('💾 Gespeichert', 'success');
    } catch (e) {
        // R04: ueberholt — der neuere Save meldet selbst, kein Retry mit altem Stand
        if (generation !== _persistGeneration) return;
        ErrorHandler.log('save', e, 'localStorage');
        const retryAfterIdb = dataSizeMB > LS_LIMIT_MB;
        // Fallback zu IndexedDB
        try {
            await saveToIndexedDBFallback(key, dataString);
            if (_lsWriteGeneration < generation) {
                StorageAPI.remove(key + '_ts');
                if (dataSizeMB > LS_LIMIT_MB) StorageAPI.remove(key);
            }
            _persistFailureStreak = false;
            _onPersistSuccess(key, StorageAPI.get(key, null), dataString);
            updateSaveIndicator('saved');
            broadcastSave();
            _notifyPostSaveHooks();
            showToast(
                retryAfterIdb
                    ? '💾 In IndexedDB gespeichert (zweiter Versuch)'
                    : '💾 In IndexedDB gespeichert (localStorage voll)',
                'warning'
            );
        } catch (idbError) {
            ErrorHandler.log('save', idbError, 'IndexedDB Fallback');
            // (D-03) Laut bei IDB-Fehler, Export einmal pro Fehlerserie
            _reportPersistFailure();
        }
    }
}

// Export to global scope
window.save = save;
window.saveImmediate = saveImmediate;
window.registerPostSaveHook = registerPostSaveHook;
window.loadFromIndexedDBFallbackRaw = loadFromIndexedDBFallbackRaw;
window.removeCampaignData = removeCampaignData;
window.writeCampaignData = writeCampaignData;
// R02 (Code-Review 2026-09-21, U7)
window.setPersistBaseline = setPersistBaseline;
window.refreshPersistSnapshot = refreshPersistSnapshot;
window.markExternalCampaignWrite = markExternalCampaignWrite;
window.isCampaignStorageStale = isCampaignStorageStale;
window.getPersistSuccessCount = getPersistSuccessCount;
window.retireCampaignWrites = retireCampaignWrites;
window.resumeCampaignWrites = resumeCampaignWrites;
window.saveAutomatic = saveAutomatic;
window.flushPendingSave = flushPendingSave;
window.flushPendingSaveAndSettle = flushPendingSaveAndSettle;
window.persistOnUnload = persistOnUnload;
window.initUnloadPersistence = initUnloadPersistence;
// Note: load() and loadFromBackup() are defined in systems/backups.js
