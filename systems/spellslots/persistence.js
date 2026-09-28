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
// persistOnUnload hat entschieden, den ausstehenden entprellten save() NICHT auszufuehren.
// Die Entlade-Sequenz feuert danach noch pagehide UND visibilitychange (hidden) — beide
// wuerden ihn ueber flushPendingSave() doch vorziehen und damit die Entscheidung umgehen
// (D4). Die Markierung gilt nur, solange genau dieser Timer aussteht: save() plant neu und
// hebt sie auf, cancelPendingSave() verwirft ihn, und laeuft er regulaer, greift in
// flushPendingSave() schon die Pruefung auf saveTimeout.
let _unloadFlushDeclined = false;
// Laufende IndexedDB-Schreibvorgaenge (saveToIndexedDBFallback) und wer auf ihr Ende wartet
let _persistWritesInFlight = 0;
const _persistSettleWaiters = [];
// Der letzte Save ist endgueltig gescheitert — beim Verlassen wie ein ausstehender Save
let _lastPersistFailed = false;
// Anzahl bestaetigter Saves dieses Tabs (getPersistSuccessCount)
let _persistSuccessCount = 0;
// showMessage des ausstehenden entprellten save() (fuer den vorgezogenen Flush)
let _pendingSaveShowMessage = false;
// R06 (U8): > 0, solange reloadData() den gespeicherten Stand liest (runWithSavesSuspended) —
// ein faelliger entprellter save() schriebe sonst den gerade verdraengten Stand zurueck
let _saveSuspendDepth = 0;
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
// R02-Nachtrag (F2, U7 minor:3/open:7): unter der Schreibsperre passiert hier NICHTS. Der
// Speicher gehoert waehrend eines loeschenden/umziehenden Ablaufs nicht mehr diesem Save —
// ein _rev und eine Baseline auf seinen Stand wuerden den Umzugs-Import ueberschreiben.
function _onPersistSuccess(key, lsValueNow, dataString) {
    if (_campaignWritesRetired) {
        _retiredPersistSkipped = true;
        return;
    }
    let rev = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    if (!StorageAPI.setQuiet(key + '_rev', rev).success) rev = StorageAPI.get(key + '_rev', null);
    _persistBaseline = { key, stored: lsValueNow, rev, snapshot: dataString, external: false };
    _lastPersistFailed = false;
    _persistSuccessCount++;
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
 */
function resumeCampaignWrites() {
    _campaignWritesRetired = false;
    if (!_retiredPersistSkipped && !_retireCancelledSave) return;
    const automaticOnly = _retiredPersistSkipped ? false : _retireCancelledAutomaticOnly;
    _retiredPersistSkipped = false;
    _retireCancelledSave = false;
    _retireCancelledAutomaticOnly = false;
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
// Ein veralteter Tab zieht nicht vor: sein ausstehender Save laeuft regulaer, solange die
// Seite lebt, und endet mit ihr, wenn der Nutzer sie nach der Rueckfrage verlaesst.
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
    cancelPendingSave();
    _persistNow(_pendingSaveShowMessage);
}
// Fuer interne Reload-Stellen (Kampagnenwechsel): festschreiben und den Commit abwarten
async function flushPendingSaveAndSettle() {
    flushPendingSave({ force: true });
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
 *  - gesperrt -> nichts
 *  - keine passende Baseline (load() gescheitert) -> nie schreiben; Rueckfrage nur fuer
 *    ausdrueckliche Arbeit, damit sie nicht still verfaellt (D5, F2)
 *  - unveraendert -> nichts (Rueckfrage nur, solange ein IndexedDB-Write laeuft)
 *  - veraltet -> nie schreiben; Rueckfrage nur fuer ausdrueckliche Arbeit (ausstehend,
 *    laufend, gescheitert). Harmlose Nebenaenderungen verfallen still.
 *  - > 5 MB -> nur fuer ausdrueckliche Arbeit einen IndexedDB-Save anstossen (asynchron,
 *    bestmoeglich). Fuer harmlose Nebenaenderungen NICHT: sein put wird nach einem laufenden
 *    Save eines anderen Tabs angelegt und committet danach (D4, F2).
 *  - sonst synchron nach localStorage mit _ts und _rev; scheitert der (Quota), bleibt nur der
 *    IndexedDB-Rueckfall — und der laeuft nach derselben Regel wie der >5-MB-Zweig: nur fuer
 *    ausdrueckliche Arbeit. Fuer nicht ausdrueckliche Arbeit wird der verworfene Timer neu
 *    eingeplant (nach "Bleiben" rettet er) und gefragt, aber kein put abgesetzt: bei voller
 *    Quota faellt auch der ausdrueckliche Save eines anderen Tabs auf IndexedDB zurueck, und
 *    unser put committete nach seinem (D4, F2).
 * "Ausdrueckliche Arbeit" ist _hasExplicitPendingWork(): ein rein automatischer Timer zaehlt
 * nicht. Der ausstehende Timer wird erst verworfen, wenn wirklich geschrieben wird — waehlt der
 * Nutzer "Bleiben", laeuft er danach regulaer.
 * Wird ein ausstehender Save NICHT ausgefuehrt, fragt der Tab nach (D5), damit der Nutzer
 * entscheidet, statt die Arbeit still verfallen zu lassen — und _unloadFlushDeclined haelt die
 * spaeteren Flushes der Entlade-Sequenz von genau diesem Save fern (F2).
 */
function persistOnUnload(event) {
    if (_campaignWritesRetired) return;
    // Bis eine Schreibentscheidung getroffen ist, gilt der ausstehende Save als abgelehnt
    _unloadFlushDeclined = true;
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
    if (_measureDataByteLength(current) / (1024 * 1024) > PERSIST_LS_LIMIT_MB) {
        if (!explicit) {
            // Kein put fuer nicht ausdrueckliche Arbeit (D4). Stand dennoch ein — dann
            // automatischer — Save aus, den wir damit nicht ausfuehren, entscheidet der
            // Nutzer: die Rueckfrage haelt das Schliessen auf (D5, F2).
            if (saveTimeout) _askToStay(event);
            return;
        }
        cancelPendingSave();
        _persistNow(false);
        _askToStay(event);
        return;
    }
    const standSaveAus = !!saveTimeout; // vor cancelPendingSave() erfassen
    cancelPendingSave();
    const generation = ++_persistGeneration;
    if (StorageAPI.set(key, current).success) {
        StorageAPI.set(key + '_ts', String(Date.now()));
        _lsWriteGeneration = generation;
        _persistFailureStreak = false;
        _onPersistSuccess(key, current, current);
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
    _persistNow(false);
    _askToStay(event);
}
// Einmalig: Verlassen-Schutz plus vorgezogener Flush beim Verstecken/pagehide — grosse
// Kampagnen sind so schon waehrend der Nutzung sicher, nicht erst beim Verlassen
function initUnloadPersistence() {
    if (window._unloadPersistenceBound) return;
    window._unloadPersistenceBound = true;
    window.addEventListener('beforeunload', persistOnUnload);
    // Ohne Argument: das Ereignisobjekt darf nicht als Optionen durchschlagen
    window.addEventListener('pagehide', () => flushPendingSave());
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushPendingSave();
    });
}
// Sofortiges Speichern (für kritische Aktionen).
// Ergebnis (R04): {success:true, backend:'localStorage'|'indexedDB'} erst nach bestaetigtem
// Write, {success:false, error} bei endgueltigem Fehler, {success:false, superseded:true,
// error:'superseded'}, wenn ein neuerer Save diesen ueberholt hat. R02: {success:false,
// error:'retired'} unter der Schreibsperre, {success:false, error:'no-campaign-key'} ohne Schluessel.
// 'superseded' heisst AUSSCHLIESSLICH "von diesem Aufruf nicht geschrieben" — kein Fehler:
// der neuere Save hat D vollstaendig serialisiert und meldet sein Ergebnis selbst. Beide
// catch-Ebenen (erster Versuch und IndexedDB-Retry) melden so (F2); ein ueberholter Aufruf
// fasst Anzeige, Toasts und Notfall-Export nicht an.
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
            // R04: erst nach dem Commit, nur ohne neueren LS-Write; F2: nie gesperrt.
            if (_lsWriteGeneration < generation && !_campaignWritesRetired) {
                StorageAPI.remove(key);
                StorageAPI.remove(key + '_ts');
            } else if (_lsWriteGeneration < generation) {
                _retiredPersistSkipped = true;
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
            // R02-Nachtrag (F2): nicht unter der Schreibsperre.
            if (_lsWriteGeneration < generation && !_campaignWritesRetired) {
                StorageAPI.remove(key + '_ts');
                if (dataSizeMB > LS_LIMIT_MB) StorageAPI.remove(key);
            } else if (_lsWriteGeneration < generation) {
                _retiredPersistSkipped = true;
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
            // R04-Nachtrag (F2): ueberholt — der neuere Save hat D vollstaendig serialisiert
            // und meldet selbst. Kein lauter Toast, kein Notfall-Export, keine Fehleranzeige
            // fuer Daten, die sicher liegen (gesperrte und schluessellose Saves kehren vor
            // ++_persistGeneration zurueck, eine neuere Generation ist also ein echter Save).
            if (generation !== _persistGeneration) {
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
 *
 * D-B (Nutzerentscheidung 2026-09-27): bei stage 'indexedDB' sagt `reason`, WARUM. 'open' =
 * die Datenbank liess sich gar nicht oeffnen (window.idb ist danach leer) — dann kann niemand
 * wissen, ob dort noch eine Kopie liegt, und der Aufrufer darf den Nutzer entscheiden lassen
 * (confirmLocalOnlyCampaignRemoval). 'commit' = die Transaktion einer GEOEFFNETEN Datenbank
 * wurde abgebrochen; dort ist belegt, dass eine erreichbare Kopie existiert, und der Aufrufer
 * bleibt fail-closed.
 * @param {string} key - Kampagnen-Speicherschluessel
 * @returns {Promise<{success: true} |
 *   {success: false, stage: string, reason?: 'open'|'commit', error: *}>}
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
            return {
                success: false,
                stage: 'indexedDB',
                reason: window.idb ? 'commit' : 'open',
                error
            };
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
 * @returns {{removed: boolean, error?: *}} removed: die localStorage-Kopie ist entfernt
 */
function confirmLocalOnlyCampaignRemoval(key, label) {
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
        StorageAPI.remove(key);
        StorageAPI.remove(key + '_ts');
        StorageAPI.remove(key + '_rev');
    } catch (error) {
        return { removed: false, error };
    }
    return { removed: true };
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
    // Ein neu eingeplanter Save ist nicht der beim Verlassen abgelehnte (F2)
    _unloadFlushDeclined = false;
    const updateSaveIndicator = window.updateSaveIndicator;
    updateSaveIndicator('saving');
    if (saveTimeout) clearTimeout(saveTimeout);
    _pendingSaveShowMessage = showMessage;
    saveTimeout = window.setTimeout(() => {
        saveTimeout = null;
        const automaticOnly = _pendingSaveAutomaticOnly;
        _pendingSaveAutomaticOnly = false;
        // R06: waehrend reloadData() nicht schreiben, sondern neu einplanen
        if (_saveSuspendDepth > 0) {
            save(showMessage);
            _pendingSaveAutomaticOnly = automaticOnly;
            return;
        }
        // D4-Nachtrag (F2): der Tab kann in den 300 ms veraltet sein. Ein rein automatischer
        // Save schreibt dann nicht — und stellt die Anzeige wieder her, die save() auf
        // 'saving' gesetzt hatte.
        if (automaticOnly) {
            const key = window.getActiveCampaignKey();
            if (!key || isCampaignStorageStale(key)) {
                window.updateSaveIndicator(_lastPersistFailed ? 'error' : 'saved');
                return;
            }
        }
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
            // R04: erst nach dem Commit, und nur ohne neueren LS-Write.
            // R02-Nachtrag (F2): nicht unter der Schreibsperre.
            if (_lsWriteGeneration < generation && !_campaignWritesRetired) {
                StorageAPI.remove(key);
                StorageAPI.remove(key + '_ts');
            } else if (_lsWriteGeneration < generation) {
                _retiredPersistSkipped = true;
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
            // R02-Nachtrag (F2): nicht unter der Schreibsperre raeumen
            if (_lsWriteGeneration < generation && !_campaignWritesRetired) {
                StorageAPI.remove(key + '_ts');
                if (dataSizeMB > LS_LIMIT_MB) StorageAPI.remove(key);
            } else if (_lsWriteGeneration < generation) {
                _retiredPersistSkipped = true;
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
            // R04-Nachtrag (F2): ueberholt — der neuere Save meldet selbst (siehe saveImmediate)
            if (generation !== _persistGeneration) return;
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
// D-B / D-C (Nutzerentscheidungen 2026-09-27)
window.confirmLocalOnlyCampaignRemoval = confirmLocalOnlyCampaignRemoval;
window.hasExplicitPendingWork = hasExplicitPendingWork;
// R02 (Code-Review 2026-09-21, U7)
window.setPersistBaseline = setPersistBaseline;
window.refreshPersistSnapshot = refreshPersistSnapshot;
window.markExternalCampaignWrite = markExternalCampaignWrite;
window.isCampaignStorageStale = isCampaignStorageStale;
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
// Note: load() is defined in systems/spellslots/quick-roll.js
