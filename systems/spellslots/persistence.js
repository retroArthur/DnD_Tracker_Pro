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
let _foreignPersistWriteCount = 0;
let _foreignIdbWriteCount = 0;
const _persistWriterId = window.crypto?.randomUUID?.() || _newCampaignRevision();
// Harte Schreibsperre fuer loeschende/umziehende Ablaeufe (retireCampaignWrites): save(),
// saveImmediate(), der Debounce-Koerper, saveAutomatic() und das Verlassen schreiben nichts.
let _campaignWritesRetired = false;
// retireCampaignWrites() hat einen ausstehenden save() verworfen (resume holt ihn nach)
let _retireCancelledSave = false;
// War der von retireCampaignWrites() verworfene save() ein rein automatischer?
let _retireCancelledAutomaticOnly = false;
// Ein IndexedDB-Commit ist UNTER der Sperre gelandet: sein Nachlauf (LS-Schatten raeumen,
// _rev, Baseline) wurde uebersprungen. resumeCampaignWrites() holt ihn mit einem save() nach —
// sonst bliebe eine aeltere localStorage-Kopie MIT _ts liegen, die load() bevorzugt.
let _retiredPersistSkipped = false;
// Der ausstehende entprellte save() geht ausschliesslich auf automatische Schreiber zurueck
// (Session-Timer, Reparatur nach load(), Standard-Zufallstabellen, Markdown-Onboarding).
// D4: solche Saves schreiben in einem veralteten Tab nie — geprueft bei der Einplanung UND
// erneut im Timer-Koerper, weil der Tab in den 300 ms veralten kann. D5: ein solcher Timer
// zaehlt beim Verlassen nicht als ausdrueckliche Arbeit (_hasExplicitPendingWork).
let _pendingSaveAutomaticOnly = false;
// N58: Ein beim Kampagnenwechsel bereits vorgemerkter Save darf nur mit aktueller Baseline schreiben.
let _pendingSaveRequiresCurrent = false;
// persistOnUnload hat entschieden, den ausstehenden entprellten save() NICHT auszufuehren.
// Die Entlade-Sequenz feuert danach noch pagehide UND visibilitychange (hidden) — beide
// wuerden ihn ueber flushPendingSave() doch vorziehen und damit die Entscheidung umgehen
// (D4). Die Markierung gilt nur, solange genau dieser Timer aussteht: save() plant neu und
// hebt sie auf, cancelPendingSave() verwirft ihn, und laeuft er regulaer, greift in
// flushPendingSave() schon die Pruefung auf saveTimeout.
let _unloadFlushDeclined = false;
// Offene Save-Aufträge einschließlich Wartezeit, Abgleich und IndexedDB-Writes.
let _persistWritesInFlight = 0;
const _persistSettleWaiters = [];
// Ein vorbereiteter Snapshot wird erst nach seinem Commit in D übernommen.
// Währenddessen müssen weitere Saves mit der Aufnahme ihres Snapshots warten.
let _stagedSave = null;
// Der letzte Save ist endgueltig gescheitert — beim Verlassen wie ein ausstehender Save
let _lastPersistFailed = false;
// Anzahl bestaetigter Saves dieses Tabs (getPersistSuccessCount)
let _persistSuccessCount = 0;
// showMessage des ausstehenden entprellten save() (fuer den vorgezogenen Flush)
let _pendingSaveShowMessage = false;
// R06 (U8): > 0, solange reloadData() den gespeicherten Stand liest (runWithSavesSuspended) —
// ein faelliger entprellter save() schriebe sonst den gerade verdraengten Stand zurueck
let _saveSuspendDepth = 0;
let _campaignSwitchSaveProtected = false;
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
 * snapshot das JSON des geladenen D. idbRecord ist der gelesene Datensatz,
 * null bei bestätigter Abwesenheit und undefined ohne IDB-Lesung.
 */
function setPersistBaseline(key, stored, snapshot, idbRecord, stamp = StorageAPI.get(key + '_ts', null)) {
    _persistBaseline = {
        key,
        stored: stored === undefined ? null : stored,
        rev: StorageAPI.get(key + '_rev', null),
        stamp,
        idbRecord,
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
function markExternalCampaignWrite(key, source) {
    if (_persistBaseline && _persistBaseline.key === key) {
        // Normale Storage-Events sind bereits im lokalen Speichervergleich sichtbar.
        if (source === 'localStorage' && !isCampaignStorageStale(key)) return;
        _persistBaseline.external = true;
        if (source === 'indexedDB') _foreignIdbWriteCount++;
        else if (source !== 'localStorage') _foreignPersistWriteCount++;
    }
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
    if (StorageAPI.get(key + '_ts', null) !== b.stamp) return true;
    return StorageAPI.get(key, null) !== b.stored;
}
// Der tablokale Zaehler allein sieht fremde Saves nicht. Der Nachlauf eines
// IndexedDB-Saves darf nur die localStorage-Fassung bereinigen, die er vor
// dem asynchronen Write vorgefunden hat. Auch ein bewusstes Speichern in einem
// schon veralteten Tab darf nicht den erst DANACH gespeicherten Stand entfernen.
function _watchPersistStorage(
    key,
    generation,
    { automaticOnly = false, silent = false, observedIdb } = {}
) {
    const keys = [key + '_rev', key + '_ts', key];
    const previous = keys.map(k => StorageAPI.get(k, null));
    const foreignWrites = _foreignPersistWriteCount;
    let checkedIdbWrites = _foreignIdbWriteCount;
    let idbStateChanged = false;
    let idbObservation = observedIdb && Promise.resolve(observedIdb);
    let changed = false;
    const storageChanged = (beforeWrite = false) => {
        if (changed) return true;
        // Die Wartefrist der Schreibsperre kann enden, bevor sich die Datenbank
        // oeffnet. Dann darf kein alter put mehr beginnen. Ein laufender Commit
        // bleibt separat vom Nachlauf geschuetzt (siehe _onPersistSuccess).
        if (beforeWrite && _campaignWritesRetired) {
            if (!silent) _retiredPersistSkipped = true;
            changed = true;
            return true;
        }
        if (
            beforeWrite &&
            (_campaignSwitchSaveProtected ||
                (_persistBaseline?.key === key && _persistBaseline.rawIdbConflict))
        ) {
            changed = true;
            return true;
        }
        const current = keys.map(k => StorageAPI.get(k, null));
        const baseline = _persistBaseline;
        const ownGeneration = baseline?.key === key ? baseline.generation : undefined;
        // Die eigene Vorgaenger-Transaktion kann zuerst fertig werden. Deren
        // Revision ueberholt den juengeren Save dieses Tabs nicht.
        const ownPredecessor =
            ownGeneration < generation &&
            !baseline.external &&
            current[0] === baseline.rev &&
            current[1] === baseline.stamp &&
            current[2] === baseline.stored;
        // Ist localStorage voll, kann auch der Revisionsmarker fehlen. Das
        // Konfliktsignal unterscheidet dann einen fremden IDB-Save vom eigenen.
        changed =
            ownGeneration > generation ||
            _foreignPersistWriteCount !== foreignWrites ||
            idbStateChanged ||
            storageChanged.hasForeignIdbWrite() ||
            (!ownPredecessor && current.some((value, i) => value !== previous[i]));
        if (changed && !silent && generation === _persistGeneration && !_campaignWritesRetired) {
            if (baseline?.key === key) baseline.external = true;
            if (!automaticOnly) _lastPersistFailed = true;
            window.updateSaveIndicator(_lastPersistFailed ? 'error' : 'saved');
        }
        return changed;
    };
    storageChanged.hasForeignIdbWrite = () => _foreignIdbWriteCount !== checkedIdbWrites;
    storageChanged.confirmIdbState = (seen = _foreignIdbWriteCount) => {
        checkedIdbWrites = seen;
    };
    storageChanged.observeIdbState = () => {
        idbObservation ??= _observeCampaignRecord(key);
        return idbObservation;
    };
    storageChanged.rejectIdbState = () => {
        idbStateChanged = true;
    };
    storageChanged.generation = generation;
    return storageChanged;
}
// load() behandelt einen LS-Eintrag ohne _ts als Schatten und kann eine alte
// IndexedDB-Kopie vorziehen. Passen nur die Nutzdaten in die Quota, gilt der Save
// deshalb erst nach dem IDB-Fallback. Bis dahin den alten LS-Zustand erhalten.
function _writeLocalCampaign(key, dataString, quiet = false) {
    const previous = StorageAPI.get(key, null);
    const result = StorageAPI[quiet ? 'setQuiet' : 'set'](key, dataString);
    if (!result.success) return result;

    const stampKey = key + '_ts';
    const nextStamp = String(Date.now());
    const stamp = StorageAPI.setQuiet(stampKey, nextStamp);
    // load() benoetigt einen vorhandenen Marker, keinen neueren Zeitwert.
    const storedStamp = stamp.success ? nextStamp : StorageAPI.get(stampKey, null);
    if (storedStamp) return { ...result, stamp: storedStamp };

    if (StorageAPI.get(key, null) === dataString) {
        if (previous === null) StorageAPI.remove(key);
        else if (previous !== dataString) StorageAPI.setQuiet(key, previous);
    }
    return stamp;
}
// Gemeinsamer Erfolgspunkt aller Schreibpfade: neuer _rev-Marker (leise — kein zweiter
// Quota-Toast; scheitert er, gilt der vorhandene), neue Baseline. lsValueNow ist der
// localStorage-Wert NACH dem Save (im IndexedDB-Modus ggf. null).
// R02-Nachtrag (F2, U7 minor:3/open:7): unter der Schreibsperre passiert hier NICHTS. Der
function _newCampaignRevision() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function _writeCampaignRevision(key) {
    const rev = _newCampaignRevision();
    return StorageAPI.setQuiet(key + '_rev', rev).success ? rev : null;
}

function _broadcastCampaignOverwrite(key, change) {
    try {
        window.broadcastSave?.(key, change);
    } catch {
        // Die Revision bleibt auch bei nicht verfügbarem BroadcastChannel lesbar.
    }
}

function _publishCampaignOverwrite(key, backend, previousRevision = StorageAPI.get(key + '_rev', null)) {
    const revision = _writeCampaignRevision(key);
    _broadcastCampaignOverwrite(key, { backend, revision });
    return revision ?? previousRevision;
}

// Ein laufender Umzug besitzt den Speicher. Alte Saves dürfen ihre Baseline nicht nachziehen.
function _onPersistSuccess(key, lsValueNow, dataString, generation, idbRecord) {
    if (_campaignWritesRetired) {
        _retiredPersistSkipped = true;
        return;
    }
    const revision = _writeCampaignRevision(key);
    _persistBaseline = {
        key,
        stored: lsValueNow,
        rev: revision ?? StorageAPI.get(key + '_rev', null),
        stamp: StorageAPI.get(key + '_ts', null),
        idbRecord,
        generation,
        snapshot: dataString,
        external: false
    };
    _lastPersistFailed = false;
    _persistSuccessCount++;
    return revision;
}
function getPersistSuccessCount() {
    return _persistSuccessCount;
}
// Laeuft gerade ein loeschender/umziehender Ablauf? (retireCampaignWrites)
function areCampaignWritesRetired() {
    return _campaignWritesRetired;
}
// Aktuelle Save-Generation (R04-Ueberholschutz) — fuer Aufrufer, die erkennen wollen,
// ob ihr Stand seit einem Zeitpunkt von einem neueren Save ueberholt wurde
function getPersistGeneration() {
    return _persistGeneration;
}
// Loest auf, sobald kein IndexedDB-Write mehr laeuft (hoechstens PERSIST_SETTLE_CAP_MS)
function waitForPersistSettle() {
    return _waitForPersistSettle(PERSIST_SETTLE_CAP_MS);
}
// Verwirft einen noch nicht gestarteten entprellten save(); true, wenn einer ausstand.
// Auch fuer reloadData() (R06): der geladene Stand ersetzt den verdraengten.
function cancelPendingSave() {
    if (!saveTimeout) return false;
    clearTimeout(saveTimeout);
    saveTimeout = null;
    _pendingSaveAutomaticOnly = false;
    _pendingSaveRequiresCurrent = false;
    _unloadFlushDeclined = false;
    return true;
}
/**
 * Steht ausdrueckliche Arbeit aus? Ein ausstehender entprellter save() zaehlt nur, wenn er
 * nicht ausschliesslich von automatischen Schreibern kommt (D5, F2). Ein laufender
 * IndexedDB-Write und ein endgueltig gescheiterter Save zaehlen immer.
 */
function _hasExplicitPendingWork() {
    return (
        (!!saveTimeout && !_pendingSaveAutomaticOnly) ||
        _persistWritesInFlight > 0 ||
        _lastPersistFailed
    );
}
/**
 * Oeffentliche Fassung von _hasExplicitPendingWork() fuer Aufrufer ausserhalb dieses Moduls
 * (D-C, systems/campaign-manager/campaign-manager.js): ein Kampagnenwechsel muss wissen, ob
 * dieser Tab ausdrueckliche, noch nicht gespeicherte Arbeit hat — in einem VERALTETEN Tab darf
 * sie den neueren gespeicherten Stand nicht ueberschreiben, aber auch nicht verfallen.
 * @returns {boolean}
 */
function hasExplicitPendingWork() {
    return _hasExplicitPendingWork();
}
/**
 * R06 (Code-Review 2026-09-21, U8): fuehrt fn aus, waehrend entprellte Saves zurueckgestellt
 * sind (verschachtelbar). Ein in dieser Zeit faelliger save() schreibt nicht, sondern plant
 * sich neu ein — scheitert das Konflikt-Neuladen, landet die lokale Aenderung danach wie
 * gewohnt im Speicher; gelingt es, verwirft reloadData() den Lauf (cancelPendingSave).
 * saveImmediate() ist NICHT zurueckgestellt (reloadData schreibt danach neu fest).
 */
async function runWithSavesSuspended(fn) {
    _saveSuspendDepth++;
    try {
        return await fn();
    } finally {
        _saveSuspendDepth--;
    }
}
// N61: Die Sicherheitskopie darf schreiben, während Live-Saves zurückgestellt sind.
async function runWithCampaignSwitchProtection(fn) {
    if (_campaignSwitchSaveProtected || _campaignWritesRetired) return;
    _campaignSwitchSaveProtected = true;
    try {
        return await runWithSavesSuspended(fn);
    } finally {
        _campaignSwitchSaveProtected = false;
    }
}

function _campaignSaveBlock(key) {
    const rawConflict = _persistBaseline?.key === key && _persistBaseline.rawIdbConflict;
    if (!_campaignSwitchSaveProtected && !rawConflict) return null;
    _lastPersistFailed = true;
    window.updateSaveIndicator('error');
    if (_campaignSwitchSaveProtected) {
        showToast('⚠️ Die Sicherheitskopie für den Kampagnenwechsel läuft.', 'warning');
        return 'campaign-switch-pending';
    }
    showToast(
        '⚠️ Speichern abgebrochen. Ein anderer Tab hat diese Kampagne gespeichert. Lade den neueren Stand oder sichere deine Änderungen über den Kampagnenwechsel.',
        'warning',
        8000
    );
    return 'campaign-conflict';
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
    const warAutomatisch = _pendingSaveAutomaticOnly;
    if (cancelPendingSave()) {
        _retireCancelledSave = true;
        _retireCancelledAutomaticOnly = warAutomatisch;
    }
    return _waitForPersistSettle(PERSIST_SETTLE_CAP_MS);
}
/**
 * Abbruchpfade: Sperre aufheben; einen verworfenen save() nachholen. Ebenso nachgeholt wird
 * der unter der Sperre uebersprungene Nachlauf eines IndexedDB-Commits (F2): dieser save()
 * raeumt den LS-Schatten und zieht _rev und Baseline nach. Er ist dann NICHT automatisch —
 * ohne ihn bliebe eine aeltere localStorage-Kopie mit _ts liegen, die load() bevorzugt.
 * Beim gesicherten Wechsel eines veralteten Tabs bleibt der fremde Stand führend (N55).
 */
function resumeCampaignWrites({ retryPending = true } = {}) {
    _campaignWritesRetired = false;
    if (!_retiredPersistSkipped && !_retireCancelledSave) return;
    const automaticOnly = _retiredPersistSkipped ? false : _retireCancelledAutomaticOnly;
    _retiredPersistSkipped = false;
    _retireCancelledSave = false;
    _retireCancelledAutomaticOnly = false;
    if (!retryPending) {
        window.updateSaveIndicator('error');
        return;
    }
    save(_pendingSaveShowMessage);
    _pendingSaveAutomaticOnly = automaticOnly;
}
/**
 * Fuer Schreibvorgaenge, um die niemand ausdruecklich gebeten hat (Session-Timer-Autosave,
 * Reparatur nach load(), Standard-Zufallstabellen, Markdown-Onboarding): nur in einem nicht
 * gesperrten, nicht veralteten Tab mit Baseline (D4 = A). Ausdrueckliche Saves bleiben last-writer-wins.
 *
 * Der Tab kann in den 300 ms der Entprellung veralten. Deshalb merkt sich dieser Aufruf, dass
 * der ausstehende save() ausschliesslich automatisch ist (_pendingSaveAutomaticOnly), und der
 * Timer-Koerper prueft die Veraltung ERNEUT (F2). Ein spaeterer ausdruecklicher save() loescht
 * die Markierung und bleibt last-writer-wins.
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
    // Ein schon ausstehender ausdruecklicher save() bleibt ausdruecklich
    const automaticOnly = !saveTimeout || _pendingSaveAutomaticOnly;
    save();
    _pendingSaveAutomaticOnly = automaticOnly;
    return true;
}
// Ausstehenden entprellten Save sofort ausfuehren (pagehide, verstecken, vor dem Neuladen).
// Ein veralteter Tab zieht nicht vor. Bleibt der Nutzer nach der Rueckfrage, prueft
// der regulaere Timer, ob sein Save schon vor dem Fremdstand eingeplant war (N35).
// Hat persistOnUnload den Save schon abgelehnt, zieht ihn auch kein Flush der
// Entlade-Sequenz mehr vor (_unloadFlushDeclined, F2); interne Festschreib-Stellen
// verlangen ihn mit { force: true } ausdruecklich.
// Ein rein automatischer Save wird GENAUSO behandelt wie ein veralteter Tab (G1): nicht
// vorziehen. _unloadFlushDeclined half hier nicht — die Marke setzt nur persistOnUnload, also
// erst nach beforeunload, waehrend der visibilitychange-Zuhoerer bei JEDEM Tabwechsel und
// Minimieren feuert. Vorgezogen entstand sein put NACH dem laufenden ausdruecklichen Save
// eines anderen Tabs und committete danach ueber ihn hinweg (D4). Zurueckgestellt heisst nicht
// verworfen: der regulaere 300-ms-Timer schreibt ihn und prueft die Veraltung dabei erneut (F2).
function flushPendingSave(opts) {
    // R06: waehrend des Konflikt-Neuladens nicht vorziehen — der Save bleibt zurueckgestellt
    if (_campaignWritesRetired || !saveTimeout || _saveSuspendDepth > 0) return;
    if (_unloadFlushDeclined && !(opts && opts.force)) return;
    if (_pendingSaveAutomaticOnly && !(opts && opts.force)) return;
    const key = window.getActiveCampaignKey();
    if (!key || isCampaignStorageStale(key)) return;
    const automaticOnly = _pendingSaveAutomaticOnly;
    cancelPendingSave();
    _persistNow(_pendingSaveShowMessage, automaticOnly, { lifecycle: opts?.lifecycle });
}
// allowStale gilt nur beim Kampagnenwechsel, der offene Arbeit eines veralteten Tabs separat sichert.
async function flushPendingSaveAndSettle({ allowStale = false } = {}) {
    // Die Sicherheitskopie kann länger dauern als der bereits vorgemerkte Timer.
    if (allowStale && saveTimeout) _pendingSaveRequiresCurrent = true;
    if (_stagedSave) {
        await _waitForPersistSettle(PERSIST_SETTLE_CAP_MS);
        if (_persistWritesInFlight > 0 || _lastPersistFailed) return false;
    }
    flushPendingSave({ force: true });
    await _waitForPersistSettle(PERSIST_SETTLE_CAP_MS);
    if (_persistWritesInFlight > 0) return false;
    if (!saveTimeout && !_lastPersistFailed) return true;
    const key = window.getActiveCampaignKey();
    return allowStale && !!key && isCampaignStorageStale(key);
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
 *  - gesperrt -> nichts
 *  - keine passende Baseline (load() gescheitert) -> nie schreiben; Rueckfrage nur fuer
 *    ausdrueckliche Arbeit, damit sie nicht still verfaellt (D5, F2)
 *  - unveraendert -> nichts (Rueckfrage nur, solange ein IndexedDB-Write laeuft)
 *  - veraltet -> nie schreiben; Rueckfrage nur fuer ausdrueckliche Arbeit (ausstehend,
 *    laufend, gescheitert). Harmlose Nebenaenderungen verfallen still.
 *  - ohne führenden localStorage-Zeitstempel oder bei > 5 MiB die IDB-Transaktion
 *    für ausdrückliche Arbeit anstoßen. Der put folgt erst nach dem Abgleich mit der Baseline.
 *  - sonst synchron nach localStorage mit _ts und _rev. Scheitert das, nutzt ausdrückliche
 *    Arbeit denselben IDB-Abgleich. Ein rein automatischer Timer wird für „Bleiben“ neu
 *    eingeplant, mit Rückfrage beim Schließen (D4, F2).
 * "Ausdrueckliche Arbeit" ist _hasExplicitPendingWork(): ein rein automatischer Timer zaehlt
 * nicht. Waehlt der Nutzer "Bleiben", laeuft der Timer danach mit seiner Pruefung auf
 * einen seit der Einplanung hinzugekommenen Fremdstand weiter (N35).
 * Wird ein ausstehender Save NICHT ausgefuehrt, fragt der Tab nach (D5), damit der Nutzer
 * entscheidet, statt die Arbeit still verfallen zu lassen — und _unloadFlushDeclined haelt die
 * spaeteren Flushes der Entlade-Sequenz von genau diesem Save fern (F2).
 */
function persistOnUnload(event) {
    if (_campaignWritesRetired) return;
    // Bis eine Schreibentscheidung getroffen ist, gilt der ausstehende Save als abgelehnt
    _unloadFlushDeclined = true;
    if (_stagedSave || _campaignSwitchSaveProtected) {
        _askToStay(event);
        return;
    }
    const key = window.getActiveCampaignKey();
    const b = _persistBaseline;
    const explicit = _hasExplicitPendingWork();
    if (!key || !b || b.key !== key) {
        if (key && explicit) _askToStay(event);
        return;
    }
    let current;
    try {
        current = JSON.stringify(window.D);
    } catch {
        return;
    }
    if (current === b.snapshot) {
        if (_persistWritesInFlight > 0) _askToStay(event);
        else cancelPendingSave(); // nichts zu schreiben: identisch mit dem letzten Stand
        return;
    }
    if (isCampaignStorageStale(key)) {
        if (explicit) _askToStay(event);
        return;
    }
    // Ein laufender Autosave zählt für die Rückfrage. Ohne neue ausdrückliche
    // Arbeit darf daraus beim Verlassen kein zweiter Write ohne IDB-Abgleich werden.
    if (_persistWritesInFlight > 0 && (!saveTimeout || _pendingSaveAutomaticOnly)) {
        _askToStay(event);
        return;
    }
    const needsIdbGuard = !(b.stored && b.stamp);
    if (needsIdbGuard || _measureDataByteLength(current) / (1024 * 1024) > PERSIST_LS_LIMIT_MB) {
        if (!explicit) {
            // Kein put fuer nicht ausdrueckliche Arbeit (D4). Stand dennoch ein — dann
            // automatischer — Save aus, den wir damit nicht ausfuehren, entscheidet der
            // Nutzer: die Rueckfrage haelt das Schliessen auf (D5, F2).
            if (saveTimeout) _askToStay(event);
            return;
        }
        cancelPendingSave();
        _persistNow(false, false, { lifecycle: true });
        _askToStay(event);
        return;
    }
    const standSaveAus = !!saveTimeout; // vor cancelPendingSave() erfassen
    cancelPendingSave();
    const generation = ++_persistGeneration;
    if (_writeLocalCampaign(key, current).success) {
        _lsWriteGeneration = generation;
        _persistFailureStreak = false;
        _onPersistSuccess(key, current, current, generation);
        return;
    }
    // Notrettung "localStorage voll": der synchrone Write ist an der Quota gescheitert, der
    // IndexedDB-Rueckfall ist die letzte Gelegenheit. Dass die Quota zuschlug, sagt aber
    // NICHTS darueber, ob gerade ein anderer Tab speichert — faellt dessen ausdruecklicher
    // Save aus demselben Grund auf IndexedDB zurueck, wuerde unser put nach seinem angelegt
    // und committete danach ueber ihn hinweg (U9h/U9i). Deshalb symmetrisch zum >5-MB-Zweig:
    if (!explicit) {
        // Kein put fuer nicht ausdrueckliche Arbeit (D4). Stand ein — dann automatischer —
        // Save aus, planen wir ihn neu ein: bleibt der Nutzer, rettet er 300 ms spaeter nach
        // IndexedDB, und seine erneute Veraltungspruefung schuetzt dabei den anderen Tab.
        // save() loescht _unloadFlushDeclined, also erneut setzen — sonst zieht der
        // pagehide-Flush ihn doch vor und umgeht die Entscheidung. Die Rueckfrage haelt das
        // Schliessen auf, damit der Nutzer entscheidet (D5, F2).
        if (standSaveAus) {
            saveAutomatic();
            _unloadFlushDeclined = true;
            _askToStay(event);
        }
        return;
    }
    _persistNow(false, false, { lifecycle: true });
    _askToStay(event);
}
// Einmalig: Verlassen-Schutz plus vorgezogener Flush beim Verstecken/pagehide — grosse
// Kampagnen sind so schon waehrend der Nutzung sicher, nicht erst beim Verlassen
function initUnloadPersistence() {
    if (window._unloadPersistenceBound) return;
    window._unloadPersistenceBound = true;
    window.addEventListener('beforeunload', persistOnUnload);
    // Ohne Argument: das Ereignisobjekt darf nicht als Optionen durchschlagen
    window.addEventListener('pagehide', () => flushPendingSave({ lifecycle: true }));
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushPendingSave({ lifecycle: true });
    });
}
// Sofortiges Speichern (für kritische Aktionen).
// Ergebnis (R04): {success:true, backend:'localStorage'|'indexedDB'} erst nach bestaetigtem
// Write, {success:false, error} bei endgueltigem Fehler, {success:false, superseded:true,
// error:'superseded'}, wenn ein neuerer Save diesen ueberholt hat. R02: {success:false,
// error:'retired'} unter der Schreibsperre, {success:false, error:'no-campaign-key'} ohne Schluessel.
// 'superseded' heisst "von diesem Aufruf nicht geschrieben". Die Schreibpfade melden
// das ohne Toast oder Notfall-Export. Ein wartender Save ohne bestätigten Abgleich
// bleibt für den Kampagnenwechsel als offene Arbeit erkennbar (N56).
// prepare() liefert optional einen separaten Snapshot und dessen synchrone Übernahme in D.
// Die Übernahme erfolgt nach bestätigtem Write und vor den Post-Save-Hooks.
async function saveImmediate(prepare) {
    if (_campaignWritesRetired) return { success: false, error: 'retired' };
    const key = window.getActiveCampaignKey();
    if (!key) return _persistKeyMissing('saveImmediate');
    const blocked = _campaignSaveBlock(key);
    if (blocked) return { success: false, error: blocked };
    // N53: Der Auftrag ist auch beim Warten auf die Drop-Zuweisung und beim IDB-Abgleich offen.
    _persistWritesInFlight++;
    try {
        return await _saveImmediate(key, prepare);
    } finally {
        _endPersistWrite();
    }
}

async function _saveImmediate(key, prepare) {
    let observedIdb;
    if (_stagedSave) {
        // N49: Die Beobachtung gehört zum Auftrag. Infinity lässt bestätigte eigene
        // Vorgänger zu, ohne schon vor dem Warten eine Schreibgeneration zu vergeben.
        const changedWhileQueued = _watchPersistStorage(key, Number.POSITIVE_INFINITY, {
            silent: true
        });
        const stale = () =>
            window.getActiveCampaignKey() !== key ||
            changedWhileQueued() ||
            isCampaignStorageStale(key);
        const unconfirmedSave = () => {
            // N56: Der Abgleich konnte den Live-Stand nicht bestätigen. Den Auftrag
            // vor _endPersistWrite() als offen markieren, damit der Wechsel darauf reagiert.
            if (typeof prepare !== 'function' && window.getActiveCampaignKey() === key) {
                _lastPersistFailed = true;
                window.updateSaveIndicator('error');
            }
            return { success: false, superseded: true, error: 'superseded' };
        };
        for (;;) {
            while (_stagedSave) await _stagedSave;
            if (_campaignWritesRetired) return { success: false, error: 'retired' };
            if (stale()) return unconfirmedSave();
            const baseline = _persistBaseline;
            if (baseline.stored && baseline.stamp) break;

            // Ohne führenden LS-Zeitstempel kann ein Fremdwrite vor seinem Signal
            // nur im Rohdatensatz sichtbar sein. Die bestätigte Baseline bleibt maßgeblich.
            const current = await _observeCampaignRecord(key);
            if (_campaignWritesRetired) return { success: false, error: 'retired' };
            if (stale()) return unconfirmedSave();
            if (_stagedSave || baseline !== _persistBaseline) continue;
            if (!current || baseline.idbRecord === undefined) return unconfirmedSave();
            if (!_matchesCampaignRecord(baseline.idbRecord, current.record)) {
                const ownNewerCommit =
                    current.record?.saveWriter === _persistWriterId &&
                    current.record.saveGeneration > (baseline.generation ?? -1);
                if (!ownNewerCommit) {
                    // N59: Der Rohdatensatz belegt den Fremdstand auch ohne Revision und Broadcast.
                    baseline.rawIdbConflict = true;
                    markExternalCampaignWrite(key, 'indexedDB');
                    window.showConflictBanner?.();
                }
                return unconfirmedSave();
            }
            observedIdb = current;
            break;
        }
    }
    const D = window.D;
    const updateSaveIndicator = window.updateSaveIndicator;
    const broadcastSave = window.broadcastSave;
    updateSaveIndicator('saving');
    let dataString;
    let staged;
    try {
        if (typeof prepare === 'function') {
            staged = prepare();
            if (!staged) {
                updateSaveIndicator(_lastPersistFailed ? 'error' : 'saved');
                return { success: false, error: 'cancelled' };
            }
        }
        dataString = JSON.stringify(staged?.snapshot ?? D);
    } catch (serializeError) {
        window.ErrorHandler &&
            window.ErrorHandler.log('saveImmediate', serializeError, 'JSON Serialisierung fehlgeschlagen');
        _lastPersistFailed = true;
        updateSaveIndicator('error');
        window.ErrorHandler && window.ErrorHandler.showError('Daten konnten nicht serialisiert werden');
        return { success: false, error: serializeError.message };
    }
    const generation = ++_persistGeneration;
    const storageChanged = _watchPersistStorage(key, generation, { observedIdb });
    const dataSizeMB = _measureDataByteLength(dataString) / (1024 * 1024);
    // localStorage Limit: ~5-10MB je nach Browser
    const LS_LIMIT_MB = PERSIST_LS_LIMIT_MB;
    const LS_WARNING_MB = 4;
    let finishStagedSave;
    if (staged) {
        _stagedSave = new Promise(resolve => {
            finishStagedSave = resolve;
        });
        _saveSuspendDepth++;
    }
    const confirmWrite = (lsValue, record) => {
        const revision = _onPersistSuccess(key, lsValue, dataString, generation, record);
        staged?.publish();
        return revision;
    };
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
            const record = await saveToIndexedDBFallback(key, dataString, { storageChanged, verifyForeignIdb: true });
            if (storageChanged()) return { success: false, superseded: true, error: 'superseded' };
            // R04: erst nach dem Commit, nur ohne neueren LS-Write; F2: nie gesperrt.
            if (_lsWriteGeneration < generation && !_campaignWritesRetired) {
                StorageAPI.remove(key);
                StorageAPI.remove(key + '_ts');
            } else if (_lsWriteGeneration < generation) {
                _retiredPersistSkipped = true;
            }
            _persistFailureStreak = false;
            const revision = confirmWrite(StorageAPI.get(key, null), record);
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
            broadcastSave(key, { backend: 'indexedDB', revision });
            _notifyPostSaveHooks();
            return { success: true, backend: 'indexedDB' };
        }
        // Normaler localStorage-Save
        const saveResult = _writeLocalCampaign(key, dataString);
        if (!saveResult.success) {
            // Fehler beim Speichern → werfe Error für catch-Block
            throw new Error(saveResult.error);
        }
        _lsWriteGeneration = generation;
        _persistFailureStreak = false;
        const revision = confirmWrite(dataString);
        updateSaveIndicator('saved');
        broadcastSave(key, { backend: 'localStorage', revision });
        _notifyPostSaveHooks();
        // Zusätzliches IndexedDB-Backup bei großen Daten (>2MB) — ohne strict-fsync:
        // localStorage bleibt hier die fuehrende Kopie
        if (dataSizeMB > 2) {
            const optionalStorageChanged = _watchPersistStorage(key, generation, { silent: true });
            saveToIndexedDBFallback(key, dataString, {
                optionalCopy: true,
                storageChanged: optionalStorageChanged
            }).catch(e => {
                if (!optionalStorageChanged() && window.APP_CONFIG?.DEBUG_MODE) {
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
        if (generation !== _persistGeneration || storageChanged()) {
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
            const record = await saveToIndexedDBFallback(key, dataString, { storageChanged, verifyForeignIdb: true });
            if (storageChanged()) return { success: false, superseded: true, error: 'superseded' };
            // (D-01) Begleit-Timestamp für IDB-Fallback entfernen (IDB hat eigenen timestamp).
            // R04: nur ohne neueren LS-Write; nach einem >5-MB-Retry auch keinen LS-Schatten
            // ohne _ts zuruecklassen (loest sonst beim Laden einen Schein-Konflikt aus).
            // R02-Nachtrag (F2): nicht unter der Schreibsperre.
            if (_lsWriteGeneration < generation && !_campaignWritesRetired) {
                StorageAPI.remove(key + '_ts');
                if (dataSizeMB > LS_LIMIT_MB) StorageAPI.remove(key);
            } else if (_lsWriteGeneration < generation) {
                _retiredPersistSkipped = true;
            }
            _persistFailureStreak = false;
            const revision = confirmWrite(StorageAPI.get(key, null), record);
            updateSaveIndicator('saved');
            showToast(
                retryAfterIdb
                    ? '💾 In IndexedDB gespeichert (zweiter Versuch)'
                    : '💾 In IndexedDB gespeichert (localStorage voll)',
                'warning'
            );
            broadcastSave(key, { backend: 'indexedDB', revision });
            _notifyPostSaveHooks();
            return { success: true, backend: 'indexedDB' };
        } catch (idbError) {
            // R04-Nachtrag (F2): ueberholt — der neuere Save hat D vollstaendig serialisiert
            // und meldet selbst. Kein lauter Toast, kein Notfall-Export, keine Fehleranzeige
            // fuer Daten, die sicher liegen (gesperrte und schluessellose Saves kehren vor
            // ++_persistGeneration zurueck, eine neuere Generation ist also ein echter Save).
            if (generation !== _persistGeneration || storageChanged()) {
                return { success: false, superseded: true, error: 'superseded' };
            }
            if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
                window.ErrorHandler &&
                    window.ErrorHandler.log('saveImmediate', idbError, 'IndexedDB fallback failed');
            }
            // (D-03) Lauter Fehler-Toast + Export-Versuch (einmal pro Fehlerserie)
            _reportPersistFailure();
            return { success: false, error: (idbError && idbError.message) || String(idbError) };
        }
    } finally {
        if (finishStagedSave) {
            _stagedSave = null;
            _saveSuspendDepth--;
            finishStagedSave();
        }
    }
}
async function _observeCampaignRecord(key) {
    try {
        return { record: await window.loadFromIndexedDBFallbackRaw(key) };
    } catch {
        // Ohne bestätigte Beobachtung bleiben Fremdsignale konservativ wirksam.
        return null;
    }
}

function _matchesCampaignRecord(a, b) {
    return a?.timestamp === b?.timestamp &&
        a?.data === b?.data &&
        a?.saveWriter === b?.saveWriter &&
        a?.saveGeneration === b?.saveGeneration &&
        a?.importRevision === b?.importRevision;
}

// Eine verspätete IDB-Meldung ohne sichtbare Revision zählt nur, wenn der
// gespeicherte Stand abweicht oder sich nicht zuverlässig prüfen lässt.
async function isCampaignIdbStateCurrent(key) {
    const baseline = _persistBaseline;
    if (isCampaignStorageStale(key)) return false;
    if (baseline.stored && baseline.stamp) return true;
    if (baseline.idbRecord === undefined || !window.idb) return false;
    const current = await _observeCampaignRecord(key);
    if (!current || isCampaignStorageStale(key)) return false;

    // Ein eigener Save kann während des Reads committen oder seine Baseline nachziehen.
    const latest = _persistBaseline;
    if (latest.stored && latest.stamp) return true;
    const record = current.record;
    return (latest.idbRecord !== undefined && _matchesCampaignRecord(latest.idbRecord, record)) ||
        (latest.generation > (baseline.generation ?? -1) &&
            _matchesCampaignRecord(baseline.idbRecord, record)) ||
        (_persistWritesInFlight > 0 && record?.saveWriter === _persistWriterId &&
            record.saveGeneration === _persistGeneration);
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
        const storageChanged = opts?.storageChanged;
        const protectedBaseline = opts?.protectedBaseline;
        const leadingLocal = protectedBaseline?.stored && protectedBaseline.stamp;
        const lifecycleLocal = opts?.lifecycle && leadingLocal;
        let before = null;
        if (protectedBaseline) {
            // Beim Entladen den get direkt in der Schreibtransaktion starten.
            // Eine spätere Beobachtung könnte bereits den fremden Stand erfassen.
            before = leadingLocal && !lifecycleLocal
                ? await _observeCampaignRecord(key)
                : { record: protectedBaseline.idbRecord };
            if (!before || (before.record === undefined && !lifecycleLocal)) {
                throw new Error('Kein bestätigter IndexedDB-Stand für diesen Save');
            }
        } else if (opts?.verifyForeignIdb) {
            before = await storageChanged.observeIdbState();
            if (!before) throw new Error('IndexedDB-Stand konnte vor dem Speichern nicht geprüft werden');
        }
        let record;
        await window.idbWriteTx(
            ['campaigns'],
            tx => {
                // Die Datenbank kann sich erst asynchron oeffnen. Vor dem put
                // erneut pruefen, damit ein inzwischen bestaetigter fremder
                // IndexedDB-Stand nicht schon innerhalb der Transaktion verloren geht.
                const store = tx.objectStore('campaigns');
                record = {
                    id: key,
                    data: dataString,
                    timestamp: Date.now()
                };
                if (storageChanged) {
                    record.saveWriter = _persistWriterId;
                    record.saveGeneration = storageChanged.generation;
                }
                if (opts?.optionalCopy) record.optionalCopy = true;
                if (before) {
                    const current = store.get(key);
                    current.onsuccess = () => {
                        // Der Read in der Schreibtransaktion sieht auch Commits, deren
                        // Nachricht noch unterwegs ist. Eigene ältere Saves sind Vorgänger.
                        const previousOwnSave = current.result?.saveWriter === _persistWriterId &&
                            current.result.saveGeneration < storageChanged.generation &&
                            (!protectedBaseline || lifecycleLocal ||
                                current.result.saveGeneration > (protectedBaseline.generation ?? -1));
                        // Bei führendem LS darf ein alter optionaler Schatten weichen.
                        // storageChanged prüft das lokale Tupel vor dem put erneut.
                        const copyOfLocalData = current.result?.optionalCopy &&
                            StorageAPI.get(key + '_ts', null) &&
                            (lifecycleLocal || current.result.data === StorageAPI.get(key, null));
                        const matches = before.record == null
                            ? current.result == null
                            : _matchesCampaignRecord(before.record, current.result);
                        if (matches || previousOwnSave || copyOfLocalData) {
                            if (!protectedBaseline) storageChanged.confirmIdbState();
                        } else {
                            storageChanged.rejectIdbState();
                        }
                        if (storageChanged(true)) tx.abort();
                        else store.put(record);
                    };
                    return;
                }
                if (storageChanged?.(true)) throw new Error('superseded');
                if (opts?.rollbackState) {
                    const previous = store.get(key);
                    previous.onsuccess = () => {
                        opts.rollbackState.record = previous.result;
                        store.put({ ...record, importRevision: opts.rollbackState.revision });
                    };
                } else if (opts?.createOnly) {
                    if (StorageAPI.get(key, null) !== null) {
                        throw Object.assign(new Error('Kampagnenschlüssel ist bereits belegt'), {
                            name: 'ConstraintError'
                        });
                    }
                    store.add(record);
                } else {
                    store.put(record);
                }
            },
            { durability: tracked ? 'strict' : undefined }
        );
        if (opts?.verifyForeignIdb && storageChanged.hasForeignIdbWrite()) {
            const seen = _foreignIdbWriteCount;
            const current = await _observeCampaignRecord(key);
            if (current && _matchesCampaignRecord(record, current.record)) {
                storageChanged.confirmIdbState(seen);
            }
        }
        return record;
    } finally {
        if (tracked) _endPersistWrite();
    }
}
/**
 * Entfernt ALLE localStorage-Schluessel einer Kampagne: Daten, `_ts`, `_rev` — und das
 * Kampfprotokoll.
 *
 * UAT-Befund U5 (Pruefrunde 1): der Loeschdialog verspricht woertlich "ALLE Kampagnendaten
 * unwiderruflich", hier standen aber nur die ersten drei Zeilen. Der von U5 angelegte vierte
 * Schluessel traegt Protokolleintraege und damit NAMEN von Charakteren, NSCs und Monstern —
 * er blieb liegen, wurde beim naechsten Start wieder gelesen und stand im Panel direkt unter
 * der Zeile "Alle Daten geloescht". Derselbe Pfad traegt deleteCampaign(); dort war es
 * zusaetzlich ein verwaister Eintrag, den nie wieder jemand aufgeraeumt hat.
 *
 * Der Zusatz kommt aus dem Protokollmodul (features/combat-log/) und wird hier NICHT
 * abgeschrieben: zwei Abschriften derselben Zeichenkette sind genau die Drift, die den Befund
 * erzeugt hat. Fehlt das Modul (Unit-Lagen, die es nicht laden), gibt es auch keinen
 * Protokollschluessel — dann bleibt dieser Schritt aus.
 * Bricht beim ersten fehlgeschlagenen Löschversuch ab. Der Aufrufer meldet den Fehler.
 * @param {string} key - Kampagnen-Speicherschluessel
 */
function removeLocalCampaignKeys(key) {
    const keys = [key, key + '_ts', key + '_rev'];
    const protokollZusatz = window.KPLOG_SCHLUESSEL_SUFFIX;
    if (typeof protokollZusatz === 'string' && protokollZusatz !== '') {
        keys.push(key + protokollZusatz);
    }
    for (const storageKey of keys) {
        const result = StorageAPI.remove(storageKey);
        if (!result.success) {
            throw new Error(
                `LocalStorage-Schlüssel „${storageKey}“ konnte nicht gelöscht werden (${result.error}).`
            );
        }
    }
}
/**
 * Entfernt alle gespeicherten Kopien einer Kampagne: IndexedDB ZUERST (bestaetigter Commit,
 * strict), erst danach localStorage (Daten, _ts, _rev, Kampfprotokoll). Scheitert der
 * IDB-Delete, bleibt
 * localStorage unangetastet — sonst holte load() eine womoeglich aeltere IDB-Kopie zurueck.
 * Wirft nie.
 *
 * D-B (Nutzerentscheidung 2026-09-27): bei stage 'indexedDB' sagt `reason`, WARUM. 'open' =
 * die Datenbank liess sich gar nicht oeffnen (window.idb ist danach leer) — dann kann niemand
 * wissen, ob dort noch eine Kopie liegt, und der Aufrufer darf den Nutzer entscheiden lassen
 * (confirmLocalOnlyCampaignRemoval). 'commit' = die Transaktion einer GEOEFFNETEN Datenbank
 * wurde abgebrochen; dort ist belegt, dass eine erreichbare Kopie existiert, und der Aufrufer
 * bleibt fail-closed.
 * @param {string} key - Kampagnen-Speicherschluessel
 * @param {() => void} [assertHeld] - Sperre vor jeder asynchron erreichbaren Änderung prüfen
 * @param {{idbRecord?: object|null}} [expected] - beim Datenreset zuvor gesicherter IDB-Stand
 * @returns {Promise<{success: true} |
 *   {success: false, stage: string, reason?: 'open'|'commit', error: *}>}
 */
async function removeCampaignData(key, assertHeld, expected) {
    if (typeof key !== 'string' || key === '') {
        return { success: false, stage: 'key', error: new Error('Ungültiger Kampagnenschlüssel') };
    }
    if (window.indexedDB || window.idb) {
        let verificationError;
        try {
            await window.idbWriteTx(
                ['campaigns'],
                tx => {
                    assertHeld?.();
                    const store = tx.objectStore('campaigns');
                    if (!expected) {
                        store.delete(key);
                        return;
                    }
                    const current = store.get(key);
                    current.onsuccess = () => {
                        try {
                            assertHeld?.();
                            if (expected.idbRecord === undefined ||
                                !_matchesCampaignRecord(expected.idbRecord, current.result)) {
                                throw new Error('Kampagnendaten haben sich seit der Sicherung geändert.');
                            }
                            store.delete(key);
                        } catch (error) {
                            verificationError = error;
                            tx.abort();
                        }
                    };
                },
                { durability: 'strict' }
            );
        } catch (error) {
            return {
                success: false,
                stage: 'indexedDB',
                reason: window.idb ? 'commit' : 'open',
                error: verificationError || error
            };
        }
    }
    try {
        assertHeld?.();
        removeLocalCampaignKeys(key);
    } catch (error) {
        return { success: false, stage: 'localStorage', error };
    }
    return { success: true };
}
/**
 * D-B (Nutzerentscheidung 2026-09-27): window.indexedDB ist gemeldet, die Datenbank liess sich
 * aber nicht OEFFNEN (aeltere Firefox-Privatfenster, manche file://-Aufbauten). Ein Loeschpfad
 * kann dann nicht wissen, ob dort noch eine Kopie dieser Kampagne liegt, und darf sie nicht
 * stillschweigend aufgeben — vorher scheiterte er deshalb ganz ("Es wurde nichts geloescht")
 * und die Kampagne war in so einer Umgebung nicht loeschbar.
 *
 * Statt fuer den Nutzer zu entscheiden, fragt diese Funktion ihn: abbrechen (empfohlen, erst
 * exportieren) oder nur die lokalen Daten loeschen, mit benannter Folge. NUR bei
 * ausdruecklicher Bestaetigung wird localStorage geleert; die Meldung des Aufrufers muss
 * danach sagen, was geloescht wurde und was nicht. Wirft nie.
 * @param {string} key - Kampagnen-Speicherschluessel
 * @param {string} [label] - Anzeigename der Kampagne fuer die Rueckfrage
 * @param {() => void} [assertCanRemove] - Sperre und gesicherten Stand nach der Rückfrage prüfen
 * @returns {{removed: boolean, error?: *}} removed: die localStorage-Kopie ist entfernt
 */
function confirmLocalOnlyCampaignRemoval(key, label, assertCanRemove) {
    if (typeof key !== 'string' || key === '') return { removed: false };
    const wen = label ? `von „${label}“` : 'dieser Kampagne';
    let bestaetigt = false;
    try {
        bestaetigt =
            confirm(
                '⚠️ IndexedDB kann nicht geöffnet werden.\n\n' +
                    'Der Browser meldet IndexedDB, aber die Datenbank lässt sich nicht öffnen. ' +
                    `Eine Kopie ${wen} kann dort liegen und ist jetzt nicht entfernbar.\n\n` +
                    'ABBRECHEN (empfohlen): Es wird nichts gelöscht. Erst exportieren, dann ' +
                    'später erneut versuchen.\n\n' +
                    'OK: Nur die lokalen Daten (localStorage) werden gelöscht. Die mögliche ' +
                    'IndexedDB-Kopie bleibt und kann beim nächsten Start wieder auftauchen.'
            ) === true;
    } catch (error) {
        return { removed: false, error };
    }
    if (!bestaetigt) return { removed: false };
    try {
        assertCanRemove?.();
        removeLocalCampaignKeys(key);
    } catch (error) {
        return { removed: false, error };
    }
    return { removed: true };
}
// Snapshot für den Datenreset unter dem Kampagnen-Mutex. Wie beim Laden führt
// eine gestempelte lokale Kopie, sonst hat der IDB-Datensatz Vorrang.
async function readCampaignResetSnapshot(key, hasLocalDraft) {
    if (!key) throw new Error('Kein aktiver Kampagnenschlüssel');
    const local = [key, key + '_ts', key + '_rev'].map(name => [name, localStorage.getItem(name)]);
    const assertLocal = () => {
        if (!local.every(([name, value]) => localStorage.getItem(name) === value)) {
            throw new Error('Kampagnendaten haben sich seit der Sicherung geändert.');
        }
    };
    const idbState = (window.indexedDB || window.idb)
        ? await _observeCampaignRecord(key)
        : { record: null };
    if (!idbState && window.idb) {
        throw new Error('IndexedDB-Kampagnendaten konnten nicht gelesen werden.');
    }
    assertLocal();
    const raw = local[0][1];
    const localLeads = raw !== null && !!local[1][1];
    const saved = localLeads ? raw : (idbState?.record?.data ?? raw);
    const ownDraft = hasLocalDraft && !isCampaignStorageStale(key) &&
        (localLeads || (idbState && _persistBaseline.idbRecord !== undefined &&
            _matchesCampaignRecord(_persistBaseline.idbRecord, idbState.record)));
    const data = ownDraft || (saved === null && idbState) ? JSON.stringify(window.D) : saved;
    return { key, data, assertLocal, idbRecord: idbState?.record };
}
function _readCampaignLocalState(key) {
    return [key, key + '_ts', key + '_rev'].map(name => [name, StorageAPI.get(name, null)]);
}

function _campaignLocalStateMatches(state) {
    return state.every(([name, value]) => StorageAPI.get(name, null) === value);
}

async function _rollbackCampaignRecord(key, state) {
    let restored = false;
    await window.idbWriteTx(
        ['campaigns'],
        tx => {
            const store = tx.objectStore('campaigns');
            const current = store.get(key);
            current.onsuccess = () => {
                if (current.result?.importRevision !== state.revision) {
                    restored = state.restored === true && _matchesCampaignRecord(state.record, current.result);
                    return;
                }
                if (state.record === undefined) store.delete(key);
                else store.put(state.record);
                restored = true;
            };
        },
        { durability: 'strict' }
    );
    if (restored) state.restored = true;
    return restored;
}

async function rollbackCampaignOverwrite({ key, before, after, indexedDBState }) {
    // Beide Speicher getrennt auf Besitz prüfen. Ein fremder Save kann nur
    // localStorage geändert haben, während der IDB-Datensatz noch uns gehört.
    if (indexedDBState && !(await _rollbackCampaignRecord(key, indexedDBState))) return false;
    if (!_campaignLocalStateMatches(after)) return false;

    const changes = before
        .map(([name, value], i) => ({ name, value, current: after[i][1] }))
        .filter(({ value, current }) => value !== current);
    // Kürzere Werte zuerst zurückschreiben, damit der alte Stand wieder in die Quota passt.
    const growth = ({ name, value, current }) =>
        (value === null ? 0 : name.length + value.length) -
        (current === null ? 0 : name.length + current.length);
    changes.sort((a, b) => growth(a) - growth(b));
    const failed = [];
    for (const { name, value } of changes) {
        const result = value === null ? StorageAPI.remove(name) : StorageAPI.setQuiet(name, value);
        if (!result.success) failed.push(name);
    }
    if (changes.length || indexedDBState) _broadcastCampaignOverwrite(key);
    if (failed.length) {
        throw new Error(`Vorherige Speicherwerte für ${failed.join(', ')} konnten nicht wiederhergestellt werden`);
    }
    return true;
}

/**
 * Schreibt eine Kampagne nach denselben Backend-Regeln wie save(). Ein Überschreiben
 * meldet den bestätigten Stand an andere Tabs, ohne die Baseline dieses Tabs zu ändern.
 *  - > 5 MB (UTF-8): nur IndexedDB (strict, bestaetigter Commit), danach localStorage-Kopie
 *    und _ts entfernen
 *  - sonst localStorage plus _ts-Begleiter (sonst haelt load() den Stand fuer einen
 *    veralteten Schatten)
 *  - scheitert localStorage: IndexedDB-Rueckfall (strict), _ts entfernen
 * Ein IndexedDB-Erfolg ist belastbar, weil saveToIndexedDBFallback() erst nach 'complete'
 * aufloest (R04). Wirft nie.
 * @param {string} key - Kampagnen-Speicherschluessel
 * @param {object|string} data - Kampagnenobjekt oder bereits serialisierter Text
 * @param {{createOnly?: boolean, withRollback?: boolean}} [options]
 * @returns {Promise<WriteCampaignDataResult>}
 */
async function writeCampaignData(key, data, { createOnly = false, withRollback = false } = {}) {
    const LS_LIMIT_MB = PERSIST_LS_LIMIT_MB;
    const fail = error => ({ success: false, backend: null, error: String(error) });
    const collision = () => ({ ...fail('Kampagnenschlüssel ist bereits belegt'), collision: true });
    if (typeof key !== 'string' || key === '') return fail('Ungültiger Kampagnenschlüssel');
    let dataString;
    try {
        dataString = typeof data === 'string' ? data : JSON.stringify(data);
    } catch (serializeError) {
        return fail((serializeError && serializeError.message) || 'Serialisierung fehlgeschlagen');
    }
    if (typeof dataString !== 'string') return fail('Keine Kampagnendaten');
    try {
        const before = withRollback && !createOnly ? _readCampaignLocalState(key) : null;
        const rollbackState = before ? { revision: _newCampaignRevision(), record: undefined } : null;
        const confirmWrite = (backend, value, stamp) => {
            const rev = createOnly ? null : _publishCampaignOverwrite(key, backend, before?.[2][1]);
            const result = { success: true, backend, error: null };
            if (before) {
                // Nur selbst geschriebene Werte gelten als Besitznachweis, auch wenn
                // ein zweiter Tab schon während der Veröffentlichung speichert.
                const after = [[key, value], [key + '_ts', stamp], [key + '_rev', rev]];
                const indexedDBState = backend === 'indexedDB' ? rollbackState : null;
                result.rollback = { key, before, after, indexedDBState };
            }
            return result;
        };
        const confirmIndexedDB = async removeLocalData => {
            if (before && !_campaignLocalStateMatches(before)) {
                await _rollbackCampaignRecord(key, rollbackState);
                return fail('Kampagne wurde während des Imports in einem anderen Tab geändert');
            }
            if (!createOnly) {
                const obsolete = removeLocalData ? [key, key + '_ts'] : [key + '_ts'];
                const remaining = before?.map(entry => [...entry]);
                for (const name of obsolete) {
                    if (StorageAPI.get(name, null) === null || StorageAPI.remove(name).success) {
                        const entry = remaining?.find(([entryName]) => entryName === name);
                        if (entry) entry[1] = null;
                        continue;
                    }
                    if (before) {
                        try {
                            await rollbackCampaignOverwrite({ key, before, after: remaining, indexedDBState: rollbackState });
                        } catch (error) {
                            return fail(`Rückabwicklung nach fehlgeschlagener Speicherbereinigung fehlgeschlagen (${error.message})`);
                        }
                    }
                    return fail(`Vorheriger Speicherwert für ${name} konnte nicht entfernt werden`);
                }
            }
            return confirmWrite('indexedDB', removeLocalData ? null : before?.[0][1], null);
        };
        if (createOnly && StorageAPI.get(key, null) !== null) return collision();
        if (_measureDataByteLength(dataString) / (1024 * 1024) > LS_LIMIT_MB) {
            await saveToIndexedDBFallback(key, dataString, { createOnly, rollbackState });
            return await confirmIndexedDB(true);
        }
        if (createOnly && window.idb) {
            // Ein kleines lokales Objekt darf keine schon vorhandene IDB-only-Kampagne
            // mit demselben Schluessel verdecken. Ein nicht lesbarer IDB-Store darf
            // eine eigenstaendig moegliche localStorage-Anlage aber nicht verhindern.
            const existing = await window.loadFromIndexedDBFallbackRaw(key).catch(() => null);
            if (existing || StorageAPI.get(key, null) !== null) return collision();
        }
        const lsResult = _writeLocalCampaign(key, dataString, true);
        if (lsResult.success) {
            return confirmWrite('localStorage', dataString, lsResult.stamp);
        }
        try {
            await saveToIndexedDBFallback(key, dataString, { createOnly, rollbackState });
        } catch (idbError) {
            if (createOnly && idbError?.name === 'ConstraintError') return collision();
            if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE && window.ErrorHandler) {
                window.ErrorHandler.log('writeCampaignData', idbError, 'IndexedDB-Rueckfall fehlgeschlagen');
            }
            return fail(lsResult.error || 'Speichern fehlgeschlagen');
        }
        return await confirmIndexedDB(false);
    } catch (error) {
        if (createOnly && error?.name === 'ConstraintError') return collision();
        return fail((error && error.message) || error);
    }
}
// Load mit IndexedDB-Fallback (gibt nur .data zurück)
async function loadFromIndexedDBFallback(key, onRead) {
    const initIndexedDB = window.initIndexedDB;
    let idb = window.idb;
    if (!idb) await initIndexedDB();
    idb = window.idb; // Reload after init
    return new Promise((resolve, reject) => {
        const transaction = idb.transaction(['campaigns'], 'readonly');
        const store = transaction.objectStore('campaigns');
        const request = store.get(key);
        request.onsuccess = () => {
            onRead?.(request.result || null);
            if (request.result) {
                resolve(request.result.data);
            } else {
                // R06: "nichts gespeichert" von einem echten IDB-Lesefehler unterscheidbar
                const notFound = new Error('No data found');
                notFound.code = 'NOT_FOUND';
                reject(notFound);
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
    // Ein Aufruf ueber save() ist ausdruecklich; saveAutomatic() setzt die Markierung danach
    // wieder (F2)
    _pendingSaveAutomaticOnly = false;
    _pendingSaveRequiresCurrent = _campaignSwitchSaveProtected;
    // Ein neu eingeplanter Save ist nicht der beim Verlassen abgelehnte (F2)
    _unloadFlushDeclined = false;
    const updateSaveIndicator = window.updateSaveIndicator;
    updateSaveIndicator('saving');
    if (saveTimeout) clearTimeout(saveTimeout);
    _pendingSaveShowMessage = showMessage;
    const keyAtSchedule = window.getActiveCampaignKey();
    const storageChangedSinceSchedule = keyAtSchedule
        ? _watchPersistStorage(keyAtSchedule, _persistGeneration, { silent: true })
        : null;
    const persistPending = () => {
        // R06: beim Konflikt-Neuladen denselben Save mit seiner ursprünglichen
        // Vergleichsbasis zurückstellen.
        if (_saveSuspendDepth > 0) {
            saveTimeout = window.setTimeout(persistPending, 300);
            return;
        }
        saveTimeout = null;
        const automaticOnly = _pendingSaveAutomaticOnly;
        const requiresCurrent =
            automaticOnly ||
            _pendingSaveRequiresCurrent ||
            (_unloadFlushDeclined && storageChangedSinceSchedule?.());
        _pendingSaveAutomaticOnly = false;
        _pendingSaveRequiresCurrent = false;
        // D4-Nachtrag (F2): der Tab kann in den 300 ms veraltet sein. Ein rein automatischer
        // Save schreibt dann nicht — und stellt die Anzeige wieder her, die save() auf
        // 'saving' gesetzt hatte.
        // N35: „Bleiben“ lässt einen überholten Save als ungesicherte Arbeit im Tab.
        if (requiresCurrent) {
            const key = window.getActiveCampaignKey();
            if (!key || isCampaignStorageStale(key)) {
                if (!automaticOnly) _lastPersistFailed = true;
                updateSaveIndicator(_lastPersistFailed ? 'error' : 'saved');
                return;
            }
        }
        _persistNow(showMessage, automaticOnly);
    };
    saveTimeout = window.setTimeout(persistPending, 300);
};
// Ein Save-Durchlauf des entprellten save() (auch vorgezogen durch flushPendingSave())
async function _persistNow(showMessage = false, automaticOnly = false, { lifecycle = false } = {}) {
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
    if (_campaignSaveBlock(key)) return;
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
    const storageChanged = _watchPersistStorage(key, generation, { automaticOnly });
    const protectedBaseline = automaticOnly || lifecycle ? _persistBaseline : null;
    const indexedDbOptions = {
        storageChanged,
        protectedBaseline,
        lifecycle,
        verifyForeignIdb: !protectedBaseline
    };
    const dataSizeMB = _measureDataByteLength(dataString) / (1024 * 1024);
    const LS_LIMIT_MB = PERSIST_LS_LIMIT_MB;
    // Ohne führenden LS-Zeitstempel könnte ein kleiner LS-Save einen neueren
    // IDB-Stand verdecken. Auch hier muss der Vergleich in der IDB-Transaktion liegen.
    const useIdb = dataSizeMB > LS_LIMIT_MB ||
        (protectedBaseline && !(protectedBaseline.stored && protectedBaseline.stamp));
    _persistWritesInFlight++;
    try {
        // (D-01 / STAB-05) IDB-only-Pfad: LS-Schatten nach bestätigtem IDB-Write entfernen
        if (useIdb) {
            const record = await saveToIndexedDBFallback(key, dataString, indexedDbOptions);
            if (storageChanged()) return;
            // R04: erst nach dem Commit, und nur ohne neueren LS-Write.
            // R02-Nachtrag (F2): nicht unter der Schreibsperre.
            if (_lsWriteGeneration < generation && !_campaignWritesRetired) {
                StorageAPI.remove(key);
                StorageAPI.remove(key + '_ts');
            } else if (_lsWriteGeneration < generation) {
                _retiredPersistSkipped = true;
            }
            _persistFailureStreak = false;
            const revision = _onPersistSuccess(key, StorageAPI.get(key, null), dataString, generation, record);
            updateSaveIndicator('saved');
            broadcastSave(key, { backend: 'indexedDB', revision });
            _notifyPostSaveHooks();
            // (D-02) Sitzungs-Hinweis statt Per-Save-Toast
            if (dataSizeMB > LS_LIMIT_MB && !window._idbModeSeen) {
                window._idbModeSeen = true;
                showToast(
                    '💾 Kampagne im IndexedDB-Modus (>5MB). Daten sicher gespeichert.',
                    'info',
                    4000
                );
            }
            return;
        }
        const saveResult = _writeLocalCampaign(key, dataString);
        if (!saveResult.success) {
            throw new Error(saveResult.error);
        }
        _lsWriteGeneration = generation;
        _persistFailureStreak = false;
        const revision = _onPersistSuccess(key, dataString, dataString, generation);
        updateSaveIndicator('saved');
        broadcastSave(key, { backend: 'localStorage', revision });
        _notifyPostSaveHooks();
        if (showMessage) showToast('💾 Gespeichert', 'success');
    } catch (e) {
        // R04: ueberholt — der neuere Save meldet selbst, kein Retry mit altem Stand
        if (generation !== _persistGeneration || storageChanged()) return;
        ErrorHandler.log('save', e, 'localStorage');
        const retryAfterIdb = useIdb;
        // Fallback zu IndexedDB
        try {
            const record = await saveToIndexedDBFallback(key, dataString, indexedDbOptions);
            if (storageChanged()) return;
            // R02-Nachtrag (F2): nicht unter der Schreibsperre raeumen
            if (_lsWriteGeneration < generation && !_campaignWritesRetired) {
                StorageAPI.remove(key + '_ts');
                if (useIdb) StorageAPI.remove(key);
            } else if (_lsWriteGeneration < generation) {
                _retiredPersistSkipped = true;
            }
            _persistFailureStreak = false;
            const revision = _onPersistSuccess(key, StorageAPI.get(key, null), dataString, generation, record);
            updateSaveIndicator('saved');
            broadcastSave(key, { backend: 'indexedDB', revision });
            _notifyPostSaveHooks();
            showToast(
                retryAfterIdb
                    ? '💾 In IndexedDB gespeichert (zweiter Versuch)'
                    : '💾 In IndexedDB gespeichert (localStorage voll)',
                'warning'
            );
        } catch (idbError) {
            // R04-Nachtrag (F2): ueberholt — der neuere Save meldet selbst (siehe saveImmediate)
            if (generation !== _persistGeneration || storageChanged()) return;
            ErrorHandler.log('save', idbError, 'IndexedDB Fallback');
            // (D-03) Laut bei IDB-Fehler, Export einmal pro Fehlerserie
            _reportPersistFailure();
        }
    } finally {
        _endPersistWrite();
    }
}

// Export to global scope
window.save = save;
window.saveImmediate = saveImmediate;
window.registerPostSaveHook = registerPostSaveHook;
window.loadFromIndexedDBFallbackRaw = loadFromIndexedDBFallbackRaw;
window.removeCampaignData = removeCampaignData;
window.readCampaignResetSnapshot = readCampaignResetSnapshot;
window.writeCampaignData = writeCampaignData;
window.rollbackCampaignOverwrite = rollbackCampaignOverwrite;
// D-B / D-C (Nutzerentscheidungen 2026-09-27)
window.confirmLocalOnlyCampaignRemoval = confirmLocalOnlyCampaignRemoval;
window.hasExplicitPendingWork = hasExplicitPendingWork;
// R02 (Code-Review 2026-09-21, U7)
window.setPersistBaseline = setPersistBaseline;
window.refreshPersistSnapshot = refreshPersistSnapshot;
window.markExternalCampaignWrite = markExternalCampaignWrite;
window.isCampaignStorageStale = isCampaignStorageStale;
window.isCampaignIdbStateCurrent = isCampaignIdbStateCurrent;
window.getPersistSuccessCount = getPersistSuccessCount;
window.areCampaignWritesRetired = areCampaignWritesRetired;
window.getPersistGeneration = getPersistGeneration;
window.waitForPersistSettle = waitForPersistSettle;
window.retireCampaignWrites = retireCampaignWrites;
window.resumeCampaignWrites = resumeCampaignWrites;
window.saveAutomatic = saveAutomatic;
window.flushPendingSave = flushPendingSave;
window.flushPendingSaveAndSettle = flushPendingSaveAndSettle;
window.persistOnUnload = persistOnUnload;
window.initUnloadPersistence = initUnloadPersistence;
// R06 (Code-Review 2026-09-21, U8)
window.cancelPendingSave = cancelPendingSave;
window.runWithSavesSuspended = runWithSavesSuspended;
window.runWithCampaignSwitchProtection = runWithCampaignSwitchProtection;
// Note: load() is defined in systems/spellslots/quick-roll.js
