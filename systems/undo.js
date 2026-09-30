// [SECTION:UNDO]
// ============================================================
// UNDO/REDO SYSTEM - @undo @redo @history
// ============================================================
const undoStack = [];
const redoStack = [];
// Alias für Rückwärtskompatibilität
const UNDO_LIMIT = window.APP_CONFIG?.UNDO_LIMIT || 30;
// Byte-Budget zusätzlich zu UNDO_LIMIT (PERF-01/D-09b) — siehe core/config.js für die Wahl
// der Zahlen. Untergrenze verhindert, dass die Undo-Tiefe bei einer sehr großen Kampagne auf
// einen einzigen Schritt zusammenfällt.
const UNDO_BYTE_BUDGET_MB = window.APP_CONFIG?.UNDO_BYTE_BUDGET_MB || 64;
const UNDO_BYTE_BUDGET = UNDO_BYTE_BUDGET_MB * 1024 * 1024;
const UNDO_MIN_STACK = window.APP_CONFIG?.UNDO_MIN_ENTRIES || 5;
// Verdrängt die ältesten Einträge von undoStack, solange dessen Gesamtgröße
// UNDO_BYTE_BUDGET überschreitet UND mehr als UNDO_MIN_STACK Einträge vorhanden sind
// (D-09b). Gilt nur für undoStack — redoStack ist davon bewusst ausgenommen (13-06-PLAN.md).
// Ohne aufgelöste Zählfunktion wird nicht verdrängt: ein fehlendes utf8ByteLength darf keinen
// Undo-Schritt kosten.
function enforceUndoByteBudget() {
    const utf8ByteLength = window.utf8ByteLength;
    if (typeof utf8ByteLength !== 'function') return;
    while (undoStack.length > UNDO_MIN_STACK) {
        let total = 0;
        for (const entry of undoStack) total += utf8ByteLength(entry.state);
        if (total <= UNDO_BYTE_BUDGET) break;
        undoStack.shift();
    }
}
function pushUndo(action) {
    // Serialisierbarkeit VOR dem Push prüfen (D-06): ein zirkuläres oder sonst nicht
    // serialisierbares window.D darf keinen kaputten Eintrag auf den Stack legen. Der
    // Aufrufer (die destruktive Operation) läuft trotzdem weiter — "am Spieltisch nie
    // blockieren" gilt hier genauso wie bei D-02; der Warn-Toast macht sichtbar, dass
    // dieser eine Schritt ohne Undo-Schutz lief.
    let stateJSON;
    try {
        stateJSON = JSON.stringify(window.D);
    } catch (e) {
        if (window.APP_CONFIG?.DEBUG_MODE && window.ErrorHandler) {
            window.ErrorHandler.log('pushUndo', e, action);
        }
        showToast('⚠️ Undo-Schutz für diese Aktion nicht verfügbar', 'warning');
        // Die destruktive Aktion des Aufrufers läuft laut D-06 trotz des gescheiterten
        // Pushs weiter und verändert D — ein noch vorhandener Redo-Eintrag wäre ab diesem
        // Moment inkonsistent und würde diese Zwischenaktion bei einem späteren Redo
        // stillschweigend überschreiben (WR-02).
        redoStack.length = 0;
        return;
    }
    _pushUndoSnapshot(action, stateJSON);
}
// Legt einen bereits serialisierten Stand auf den Undo-Stack — gemeinsam fuer pushUndo() und
// das Konflikt-Neuladen (reloadData, R06).
function _pushUndoSnapshot(action, stateJSON) {
    // Dedupe (D-09a): ein Snapshot, der zeichengleich zum aktuellen Stack-Kopf ist, wird
    // NICHT erneut gepusht — die Serialisierung in pushUndo() lief trotzdem, weil sie der
    // einzige Weg ist, das ueberhaupt festzustellen. Der Redo-Stack wird unten unabhaengig
    // davon geleert, weil der Aufrufer eine neue Aktion signalisiert hat (T-13-23).
    const currentTop = undoStack[undoStack.length - 1];
    if (!currentTop || currentTop.state !== stateJSON) {
        undoStack.push({
            action,
            state: stateJSON,
            timestamp: Date.now()
        });
        if (undoStack.length > UNDO_LIMIT) {
            undoStack.shift();
        }
        enforceUndoByteBudget();
    }
    // Redo-Stack leeren wenn neue Aktion
    redoStack.length = 0;
}
function saveUndoState(action = 'Änderung') {
    pushUndo(action);
}
function undo() {
    if (undoStack.length === 0) {
        showToast('↩️ Nichts zum Rückgängigmachen');
        return;
    }
    const D = window.D;
    // Erst ansehen (nicht entfernen) und parsen, bevor irgendein Stack angefasst wird.
    // Vorher: pop() lief VOR der Parse-Prüfung — bei einem Parse-Fehler war der Eintrag
    // unwiderruflich weg (D-06).
    const last = undoStack[undoStack.length - 1];
    const safeJSONParse = window.safeJSONParse;
    const parsed = safeJSONParse(last.state);
    if (!parsed) {
        // Beide Stacks bleiben unverändert. Bekannte Nebenwirkung: ein bereits vorhandener,
        // unparsbarer Eintrag bleibt liegen und lässt jeden weiteren Versuch scheitern, bis
        // clearUndoHistory() läuft — das kleinere Übel gegenüber stillem Verschwinden. Die
        // Push-Validierung in pushUndo() verhindert, dass solche Einträge neu entstehen.
        showToast('❌ Undo fehlgeschlagen', 'error');
        return;
    }
    // Aktuellen State für Redo sichern — NACH erfolgreichem Parse, sonst wächst der
    // Redo-Stack bei jedem gescheiterten Undo-Versuch um einen sinnlosen Eintrag.
    // Das Aktionslabel wandert mit (last.action statt fest 'Redo'), damit es über beide
    // Stacks hinweg erhalten bleibt (Plan 12-06 braucht es für den Undo-Hook).
    // SEC-02 (Plan 12-13): pushUndo() prüft die Serialisierbarkeit VOR dem Push (D-06) und
    // lässt die destruktive Aktion des Aufrufers bewusst weiterlaufen — window.D bleibt
    // dabei nicht serialisierbar. Genau diesen Zustand trifft das nächste Strg+Z hier beim
    // Ziehen: dieselbe Absicherung wie in pushUndo(), spiegelbildlich beim Pop statt beim
    // Push. Abbruch statt teilweiser Ausführung, weil ein Undo ohne Redo-Eintrag den
    // aktuellen Stand unwiederbringlich verlöre — schlimmer als ein verweigertes Undo.
    let redoStateJSON;
    try {
        redoStateJSON = JSON.stringify(D);
    } catch (e) {
        if (window.APP_CONFIG?.DEBUG_MODE && window.ErrorHandler) {
            window.ErrorHandler.log('undo', e, last.action);
        }
        showToast('⚠️ Rückgängigmachen nicht möglich — aktueller Stand lässt sich nicht sichern', 'warning');
        return;
    }
    redoStack.push({
        action: last.action,
        state: redoStateJSON,
        timestamp: Date.now()
    });
    if (redoStack.length > UNDO_LIMIT) {
        redoStack.shift();
    }
    undoStack.pop();
    // Update window.D by clearing and reassigning properties (D is now const)
    for (const key in D) delete D[key];
    Object.assign(D, parsed);
    // Validate and repair _nextId after restore
    const validation = validateAndRepairNextId();
    if (!validation.valid) {
        // Selbstheilung ist Normalverhalten, kein Fehler — nur ins in-App-Debug-Log (UAT 01)
        if (window.APP_CONFIG?.DEBUG_MODE && typeof window.debugLogAdd === 'function') {
            window.debugLogAdd(`[undo] Repaired _nextId inconsistencies: ${validation.repairs.join('; ')}`);
        }
    }
    const renderAll = window.renderAll;
    const saveImmediate = window.saveImmediate;
    if (renderAll) renderAll();
    if (saveImmediate) saveImmediate();
    showToast(`↩️ Rückgängig: ${last.action}`);
    _notifyUndoHooks({ action: last.action, direction: 'undo' });
}
function redo() {
    if (redoStack.length === 0) {
        showToast('↪️ Nichts zum Wiederholen');
        return;
    }
    const D = window.D;
    // Erst ansehen (nicht entfernen) und parsen — siehe undo() für die Begründung.
    const last = redoStack[redoStack.length - 1];
    const safeJSONParse = window.safeJSONParse;
    const parsed = safeJSONParse(last.state);
    if (!parsed) {
        showToast('❌ Redo fehlgeschlagen', 'error');
        return;
    }
    // Aktuellen State für Undo sichern — NACH erfolgreichem Parse.
    // SEC-02 (Plan 12-13): dieselbe Absicherung wie in undo() spiegelbildlich vor dem
    // Undo-Push — siehe dort für die ausführliche Begründung (D-06 lässt window.D bewusst
    // nicht serialisierbar zurück; ein Abbruch ohne Stack-Mutation ist hier wie dort dem
    // stillen Verlust des aktuellen Stands vorzuziehen).
    let undoStateJSON;
    try {
        undoStateJSON = JSON.stringify(D);
    } catch (e) {
        if (window.APP_CONFIG?.DEBUG_MODE && window.ErrorHandler) {
            window.ErrorHandler.log('redo', e, last.action);
        }
        showToast('⚠️ Wiederholen nicht möglich — aktueller Stand lässt sich nicht sichern', 'warning');
        return;
    }
    undoStack.push({
        action: last.action,
        state: undoStateJSON,
        timestamp: Date.now()
    });
    if (undoStack.length > UNDO_LIMIT) {
        undoStack.shift();
    }
    enforceUndoByteBudget();
    redoStack.pop();
    // Update window.D by clearing and reassigning properties (D is now const)
    for (const key in D) delete D[key];
    Object.assign(D, parsed);
    // Validate and repair _nextId after restore
    const validation = validateAndRepairNextId();
    if (!validation.valid) {
        // Selbstheilung ist Normalverhalten, kein Fehler — nur ins in-App-Debug-Log (UAT 01)
        if (window.APP_CONFIG?.DEBUG_MODE && typeof window.debugLogAdd === 'function') {
            window.debugLogAdd(`[redo] Repaired _nextId inconsistencies: ${validation.repairs.join('; ')}`);
        }
    }
    const renderAll = window.renderAll;
    const saveImmediate = window.saveImmediate;
    if (renderAll) renderAll();
    if (saveImmediate) saveImmediate();
    showToast('↪️ Wiederhergestellt');
    _notifyUndoHooks({ action: last.action, direction: 'redo' });
}
function clearUndoHistory() {
    undoStack.length = 0;
    redoStack.length = 0;
    showToast('🗑️ Undo-Historie geleert');
}
// ============================================================
// UNDO-HOOKS - @undo-hooks
// ============================================================
// Gleiche Bauart wie registerPostSaveHook()/_notifyPostSaveHooks()
// (systems/spellslots/persistence.js) — explizite Registrierung statt eines
// Wrappers um undo()/redo(). Konsument: Plan 12-06 (Wiederherstellen gelöschter
// Audiodateien nach Undo/Redo).
function registerUndoHook(fn) {
    if (typeof fn !== 'function') return;
    if (!Array.isArray(window._undoHooks)) window._undoHooks = [];
    if (!window._undoHooks.includes(fn)) window._undoHooks.push(fn);
}
function _notifyUndoHooks(info) {
    const hooks = window._undoHooks;
    if (!Array.isArray(hooks)) return;
    for (const fn of hooks) {
        try {
            fn(info);
        } catch (e) {
            // Ein defekter Hook darf weder das Rückgängigmachen noch andere Hooks brechen
            if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE && window.ErrorHandler) {
                window.ErrorHandler.log('undoHook', e, 'Hook fehlgeschlagen');
            }
        }
    }
}
window.registerUndoHook = registerUndoHook;
// ============================================================
// AUTO-SAVE INDIKATOR
// ============================================================
let lastSaveTime = Date.now();
const saveIndicatorTimeout = null;
function updateSaveIndicator(status = 'saved') {
    const indicator = $('save-indicator');
    if (!indicator) return;
    indicator.className = 'save-indicator ' + status;
    const textEl = indicator.querySelector('.save-indicator-text');
    if (status === 'saving') {
        if (textEl) textEl.textContent = 'Speichert...';
    } else if (status === 'saved') {
        if (textEl) textEl.textContent = 'Gespeichert';
        lastSaveTime = Date.now();
    } else if (status === 'error') {
        if (textEl) textEl.textContent = 'Fehler!';
    }
}
// ============================================================
// KONFLIKT-ERKENNUNG
// ============================================================
let broadcastChannel = null;
const tabId = Math.random().toString(36).substr(2, 9);
let conflictDismissed = false;
// R06 (Code-Review 2026-09-21, U8): laufendes Konflikt-Neuladen (ein Doppelklick teilt es) und
// Zaehler fremder Saves DIESER Kampagne — ein waehrend des Neuladens eingetroffener Save haelt
// die Konfliktanzeige offen (der gelesene Stand kann ihn verpasst haben)
let _reloadInFlight = null;
let _conflictSignalSeq = 0;
// Hoechstens so lange wartet das Neuladen auf den Speicher (initIndexedDB kennt kein
// onblocked); danach gilt es als gescheitert und ein spaetes Lesen wird verworfen
const RELOAD_WATCHDOG_MS = 10000;
// Ein anderer Tab hat DIESE Kampagne gespeichert: der Tab ist veraltet (R02 — seine
// automatischen Saves und das Verlassen schreiben nicht mehr zurueck), unabhaengig davon,
// ob der Nutzer das Banner weggeklickt hat; das Banner nur, solange nicht weggeklickt
function _noteForeignCampaignSave(campaignKey) {
    _conflictSignalSeq++;
    if (typeof window.markExternalCampaignWrite === 'function') {
        window.markExternalCampaignWrite(campaignKey);
    }
    if (!conflictDismissed) showConflictBanner();
}
function initConflictDetection() {
    try {
        const APP_CONFIG = window.APP_CONFIG;
        broadcastChannel = new BroadcastChannel(APP_CONFIG.BROADCAST_CHANNEL);
        broadcastChannel.onmessage = event => {
            const data = event.data || {};
            if (
                data.tabId !== tabId &&
                data.type === 'save' &&
                data.campaign === getCurrentStorageKey()
            ) {
                _noteForeignCampaignSave(data.campaign);
            }
        };
    } catch (e) {
        const log = window.log;
        if (log) log('BroadcastChannel nicht unterstützt, fallback auf localStorage events');
    }
    // storage-Ereignisse kommen nur aus ANDEREN Tabs — auch ohne BroadcastChannel. Der
    // _rev-Marker meldet Saves im IndexedDB-Modus (dort gibt es keinen Kampagnenschluessel in
    // localStorage); key === null ist localStorage.clear(). Andere Kampagnen: ignorieren.
    window.addEventListener('storage', e => {
        const k = getCurrentStorageKey();
        if (!k) return;
        if (e.key === k || e.key === k + '_rev' || e.key === null) {
            _noteForeignCampaignSave(k);
        }
    });
}
function broadcastSave() {
    if (broadcastChannel) {
        broadcastChannel.postMessage({
            type: 'save',
            tabId: tabId,
            campaign: getCurrentStorageKey(),
            timestamp: Date.now()
        });
    }
}
function showConflictBanner() {
    const banner = $('conflict-banner');
    if (banner) {
        banner.classList.add('show');
    }
}
// "✕ Ignorieren": weitere Konflikte dieser Sitzung bleiben stumm (bewusst unveraendert)
function dismissConflict() {
    const banner = $('conflict-banner');
    if (banner) {
        banner.classList.remove('show');
        conflictDismissed = true;
    }
}
// Banner schliessen, OHNE spaetere Konflikte stummzuschalten (erfolgreiches Neuladen, R06)
function hideConflictBanner() {
    const banner = $('conflict-banner');
    if (banner) banner.classList.remove('show');
}
/**
 * "🔄 Neu laden" im Konflikt-Banner (R06). Laedt den gespeicherten Stand VOLLSTAENDIG, bevor
 * gerendert und bestaetigt wird; ein Doppelklick teilt sich den Lauf. Lehnt nie ab — der
 * data-action-'call'-Dispatcher ignoriert das Promise.
 * @returns {Promise<Object>} das LoadResult des Laufs
 */
function reloadData() {
    if (_reloadInFlight) return _reloadInFlight;
    _reloadInFlight = _reloadDataNow().finally(() => {
        _reloadInFlight = null;
    });
    return _reloadInFlight;
}
// Liest unter zurueckgestellten entprellten Saves, begrenzt durch den Waechter. Ein nach dem
// Waechter eintreffendes Lesen uebernimmt nichts mehr (shouldApply). onBeforeApply laeuft
// UNMITTELBAR vor dem Uebernehmen (F3): nur dort ist der Stand greifbar, den der Undo-Punkt
// halten muss — eine Aenderung aus dem Ladefenster gehoert hinein.
async function _loadForReload(onBeforeApply) {
    let abandoned = false;
    let watchdog = null;
    const suspend =
        typeof window.runWithSavesSuspended === 'function'
            ? window.runWithSavesSuspended
            : fn => fn();
    try {
        const result = await suspend(() =>
            Promise.race([
                Promise.resolve(
                    window.load({
                        strictIdb: true,
                        replace: true,
                        shouldApply: () => {
                            if (abandoned) return false;
                            if (onBeforeApply) onBeforeApply();
                            return true;
                        }
                    })
                ).then(r => {
                    // Der geladene Stand ersetzt den verdraengten — dessen Save nicht nachholen
                    if (r && r.applied && typeof window.cancelPendingSave === 'function') {
                        window.cancelPendingSave();
                    }
                    return r;
                }),
                new Promise(resolve => {
                    watchdog = setTimeout(() => {
                        abandoned = true;
                        resolve({ ok: false, applied: false, source: null, reason: 'timeout' });
                    }, RELOAD_WATCHDOG_MS);
                })
            ])
        );
        if (result && typeof result === 'object') return result;
        return { ok: false, applied: false, source: null, reason: 'exception' };
    } catch (e) {
        return { ok: false, applied: false, source: null, reason: 'exception', error: e };
    } finally {
        clearTimeout(watchdog);
    }
}
// Nach dem Uebernehmen: Undo-Punkt (D6 = A), Modulzustand, vollstaendiges Neuzeichnen und —
// falls dieser Tab im Ladefenster doch gespeichert hat (saveImmediate, z. B. per Strg+Z) — den
// geladenen Stand neu festschreiben. Nicht, wenn inzwischen ein fremder Save eintraf: der
// waere neuer als der gelesene Stand. true, wenn der Speicher D entspricht.
//
// F3 (U8 minor:1 / open:2): die Entscheidung haengt an der Save-GENERATION, nicht am
// Erfolgszaehler. Der Zaehler steigt erst nach dem IndexedDB-Commit, und ein im Ladefenster
// gestarteter Write committet nach dem gehaltenen Lesen (IndexedDB-Transaktionsreihenfolge) —
// beim Entscheiden stand er also noch auf dem alten Wert und das Neu-Festschreiben fiel aus.
// Die Generation steigt dagegen SYNCHRON beim Start des Saves. Danach wird der Commit
// abgewartet und der fremde Save ERST DANACH geprueft (als Funktion, nicht als vorab
// erfasster Wahrheitswert): sonst setzte der spaete Commit die Baseline zurueck und der Tab
// waere trotz stehendem Banner nicht mehr veraltet.
async function _afterReloadApplied(beforeJSON, generationAtStart, foreignSaveSinceFn) {
    const D = window.D;
    if (beforeJSON) _pushUndoSnapshot('Neu laden (anderer Tab)', beforeJSON);
    encounterRound = (D.initiative && D.initiative.round) || 1;
    try {
        (window.renderAfterDataReplace || window.renderAll)();
    } catch (e) {
        if (window.ErrorHandler) window.ErrorHandler.log('reloadData', e, 'Neuzeichnen');
    }
    const gen = window.getPersistGeneration;
    if (typeof gen !== 'function' || gen() === generationAtStart) return true;
    if (typeof window.waitForPersistSettle === 'function') await window.waitForPersistSettle();
    if (foreignSaveSinceFn()) return false;
    try {
        const res = await window.saveImmediate();
        return !!(res && res.success);
    } catch (e) {
        if (window.ErrorHandler) window.ErrorHandler.log('reloadData', e, 'Neu festschreiben');
        return false;
    }
}
async function _reloadDataNow() {
    try {
        if (typeof window.load !== 'function') {
            showToast('❌ Neu laden nicht möglich', 'error');
            return { ok: false, applied: false, source: null, reason: 'exception' };
        }
        const seqAtStart = _conflictSignalSeq;
        const generationAtStart =
            typeof window.getPersistGeneration === 'function'
                ? window.getPersistGeneration()
                : null;
        let beforeJSON = null;
        try {
            beforeJSON = JSON.stringify(window.D);
        } catch {
            // ohne Undo-Punkt weiter — wie pushUndo() (D-06)
        }
        // F3 (U8 minor:2): der Undo-Punkt haelt den Stand UNMITTELBAR VOR dem Uebernehmen.
        // Der Stand vom Klick liess eine Aenderung aus dem Ladefenster in keinem
        // Schnappschuss zurueck — ihr gleich lautender Push wurde dedupliziert.
        const result = await _loadForReload(() => {
            try {
                beforeJSON = JSON.stringify(window.D);
            } catch {
                beforeJSON = null;
            }
        });
        let persisted = true;
        if (result.applied) {
            persisted = await _afterReloadApplied(
                beforeJSON,
                generationAtStart,
                () => _conflictSignalSeq !== seqAtStart
            );
        }
        const signalDuringReload = _conflictSignalSeq !== seqAtStart;
        if (result.ok) {
            conflictDismissed = false;
            if (signalDuringReload) {
                // Der gelesene Stand kann den spaeteren Save verpasst haben: Banner bleibt,
                // der Tab bleibt veraltet (automatische Saves gesperrt, R02)
                if (typeof window.markExternalCampaignWrite === 'function') {
                    window.markExternalCampaignWrite(getCurrentStorageKey());
                }
            } else {
                hideConflictBanner();
            }
            if (persisted) updateSaveIndicator('saved');
            if (result.warning) {
                showToast('⚠️ Daten neu geladen (Nachbearbeitung unvollständig)', 'warning');
            } else {
                showToast('🔄 Daten neu geladen');
            }
        } else {
            if (window.ErrorHandler) {
                window.ErrorHandler.log(
                    'reloadData',
                    result.error || new Error(String(result.reason)),
                    'Neu laden fehlgeschlagen'
                );
            }
            // Banner bleibt; ein zurueckgestellter lokaler Save wird danach geschrieben
            let text = '❌ Neu laden fehlgeschlagen – aktueller Stand bleibt erhalten';
            if (result.reason === 'timeout') {
                text =
                    '❌ Neu laden fehlgeschlagen – Zeitüberschreitung, aktueller Stand bleibt erhalten';
            } else if (result.applied) {
                text = '⚠️ Daten neu geladen (Nachbearbeitung unvollständig)';
            }
            showToast(text, result.applied ? 'warning' : 'error');
        }
        return result;
    } catch (e) {
        if (window.ErrorHandler) window.ErrorHandler.log('reloadData', e);
        return { ok: false, applied: false, source: null, reason: 'exception', error: e };
    }
}
// Einziger Resolver: getActiveCampaignKey() (core/data.js, R02)
function getCurrentStorageKey() {
    return window.getActiveCampaignKey();
}
// ============================================================
// TASTENKÜRZEL-OVERLAY
// ============================================================
function showShortcutsOverlay() {
    const overlay = $('shortcuts-overlay');
    if (overlay) {
        overlay.classList.add('show');
    }
}
function hideShortcutsOverlay() {
    const overlay = $('shortcuts-overlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}
// ============================================================
// CONDITIONS / ZUSTÄNDE HELPER
// ============================================================
function renderConditionBadges(conditions = [], exhaustion = 0, small = false) {
    if (!conditions.length && !exhaustion) return '';
    const CONDITIONS = window.CONDITIONS;
    let html = '<div class="conditions-bar">';
    conditions.forEach(key => {
        const cond = CONDITIONS[key];
        if (cond) {
            html += `<span class="condition-badge ${key} active" title="${cond.name}: ${cond.desc}">${cond.icon}</span>`;
        }
    });
    if (exhaustion > 0) {
        html += `<span class="condition-badge exhaustion active" title="Erschöpfung Stufe ${exhaustion}">${CONDITIONS.exhaustion.icon}${exhaustion}</span>`;
    }
    html += '</div>';
    return html;
}
let currentRelationshipSource = null;
function showRelationshipsModal(type, id) {
    currentRelationshipSource = { type, id };
    const EntityLookup = window.EntityLookup;
    const entity = type === 'character' ? EntityLookup.character(id) : EntityLookup.npc(id);
    if (!entity) return;
    const sourceNameEl = $('relationship-source-name');
    if (sourceNameEl) sourceNameEl.textContent = `Beziehung für: ${entity.name}`;
    const D = window.D;
    const esc = window.esc;
    // Ziele populieren (alle Charaktere und NPCs außer sich selbst)
    const targets = [
        ...D.characters
            .filter(c => !(type === 'character' && c.id === id))
            .map(c => ({ id: c.id, name: c.name, type: 'character' })),
        ...D.npcs
            .filter(n => !(type === 'npc' && n.id === id))
            .map(n => ({ id: n.id, name: n.name, type: 'npc' }))
    ];
    const targetEl = $('relationship-target');
    if (targetEl) {
        targetEl.innerHTML = targets
            .map(
                t =>
                    `<option value="${t.type}:${t.id}">${t.type === 'character' ? '👤' : '🎭'} ${esc(t.name)}</option>`
            )
            .join('');
    }
    const noteEl = $('relationship-note');
    if (noteEl) noteEl.value = '';
    const showModal = window.showModal;
    if (showModal) showModal('relationships-modal');
}
function saveRelationship() {
    if (!currentRelationshipSource) return;
    const { type, id } = currentRelationshipSource;
    const targetVal = $('relationship-target')?.value;
    const relType = $('relationship-type')?.value;
    const note = $('relationship-note')?.value.trim();
    if (!targetVal) return;
    const [targetType, targetIdStr] = targetVal.split(':');
    const EntityLookup = window.EntityLookup;
    const entity = type === 'character' ? EntityLookup.character(id) : EntityLookup.npc(id);
    if (!entity) return;
    saveUndoState('Beziehung hinzugefügt');
    entity.relationships = entity.relationships || [];
    // Prüfe ob Beziehung bereits existiert
    const targetId = parseInt(targetIdStr);
    const existing = entity.relationships.find(
        r => r.targetType === targetType && r.targetId === targetId
    );
    if (existing) {
        existing.type = relType;
        existing.note = note;
    } else {
        entity.relationships.push({
            targetType,
            targetId,
            type: relType,
            note
        });
    }
    const save = window.save;
    const renderAll = window.renderAll;
    const hideModal = window.hideModal;
    if (save) save();
    if (renderAll) renderAll();
    if (hideModal) hideModal('relationships-modal');
    showToast('🔗 Beziehung gespeichert');
}
function removeRelationship(sourceType, sourceId, targetType, targetId) {
    const EntityLookup = window.EntityLookup;
    const entity =
        sourceType === 'character' ? EntityLookup.character(sourceId) : EntityLookup.npc(sourceId);
    if (!entity || !entity.relationships) return;
    saveUndoState('Beziehung entfernt');
    entity.relationships = entity.relationships.filter(
        r => !(r.targetType === targetType && r.targetId === targetId)
    );
    const save = window.save;
    const renderAll = window.renderAll;
    if (save) save();
    if (renderAll) renderAll();
}
function renderRelationshipBadges(relationships = [], sourceType, sourceId) {
    if (!relationships.length) return '';
    const typeLabels = {
        ally: '💚 Verbündeter',
        enemy: '❤️ Feind',
        neutral: '🤍 Neutral',
        family: '💕 Familie',
        rival: '🧡 Rivale',
        mentor: '💙 Mentor',
        student: '💜 Schüler'
    };
    const EntityLookup = window.EntityLookup;
    let html =
        '<div class="relationships-section"><small style="color: var(--text-dim);">Beziehungen:</small><div style="margin-top: 4px;">';
    relationships.forEach(rel => {
        const target =
            rel.targetType === 'character'
                ? EntityLookup.character(rel.targetId)
                : EntityLookup.npc(rel.targetId);
        const targetName = target?.name || '?';
        html += `<span class="relationship-badge ${rel.type}" title="${rel.note || typeLabels[rel.type]}">${targetName} <span data-action="remove-relationship-stop" data-source-type="${sourceType}" data-source-id="${sourceId}" data-target-type="${rel.targetType}" data-target-id="${rel.targetId}" style="cursor:pointer;opacity:0.6;">✕</span></span>`;
    });
    html += '</div></div>';
    return html;
}
// ============================================================
// MARKDOWN SUPPORT
// ============================================================
function parseMarkdown(text) {
    if (!text) return '';
    const esc = window.esc;
    // ERST escapen, DANN Markdown parsen (XSS-Schutz)
    const escaped = esc(text);
    return (
        escaped
            // Headers
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.+?)__/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/_(.+?)_/g, '<em>$1</em>')
            // Code
            .replace(/`(.+?)`/g, '<code>$1</code>')
            // Blockquote (escaped > becomes &gt;)
            .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
            // Lists
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
            // Line breaks
            .replace(/\n/g, '<br>')
            // HR
            .replace(/---/g, '<hr>')
    );
}
// ============================================================
// NOTIZEN-SUCHE
// ============================================================
function showNotesSearch() {
    const showModal = window.showModal;
    if (showModal) showModal('notes-search-modal');
    setTimeout(() => $('notes-search-input')?.focus(), 100);
}
function searchNotes() {
    const query = $('notes-search-input')?.value.toLowerCase().trim();
    const results = $('notes-search-results');
    if (!results) return;
    if (!query || query.length < 2) {
        results.innerHTML =
            '<div style="padding: 20px; text-align: center; color: var(--text-dim);">Mindestens 2 Zeichen eingeben.</div>';
        return;
    }
    const D = window.D;
    const matches = (D.sessionNotes || [])
        .filter(note => {
            const content = (note.content || note.text || '').toLowerCase().replace(/<[^>]+>/g, '');
            const name = (note.name || note.title || '').toLowerCase();
            const date = (note.date || '').toLowerCase();
            return content.includes(query) || name.includes(query) || date.includes(query);
        })
        .slice(0, 20);
    if (matches.length === 0) {
        results.innerHTML =
            '<div style="padding: 20px; text-align: center; color: var(--text-dim);">Keine Treffer gefunden.</div>';
        return;
    }
    const esc = window.esc;
    results.innerHTML = matches
        .map(note => {
            const content = note.content || note.text || '';
            const excerpt = highlightExcerpt(content.replace(/<[^>]+>/g, ''), query, 150);
            const name = note.name || note.title || '';
            return `
            <div class="notes-search-result" data-action="go-to-note" data-value="${note.date}">
                <div class="notes-search-date">${note.date}${name ? ' - ' + esc(name) : ''}</div>
                <div class="notes-search-excerpt">${excerpt}</div>
            </div>
        `;
        })
        .join('');
}
function highlightExcerpt(text, query, maxLength = 150) {
    const esc = window.esc;
    const lowerText = text.toLowerCase();
    const pos = lowerText.indexOf(query.toLowerCase());
    if (pos === -1) return esc(text.substring(0, maxLength)) + '...';
    const start = Math.max(0, pos - 50);
    const end = Math.min(text.length, pos + query.length + 100);
    let excerpt = text.substring(start, end);
    if (start > 0) excerpt = '...' + excerpt;
    if (end < text.length) excerpt = excerpt + '...';
    // Highlight
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return esc(excerpt).replace(regex, '<mark>$1</mark>');
}
function goToNote(date) {
    const hideModal = window.hideModal;
    const switchView = window.switchView;
    if (hideModal) hideModal('notes-search-modal');
    if (switchView) switchView('notes');
    // Scroll zur Notiz
    setTimeout(() => {
        /* ACHTUNG, dieser Zweig ist derzeit TOT (gefunden in der Pruefung
           W3-D, Runde 1): `data-note-date` kommt im ganzen Quellbaum genau
           einmal vor — in der Abfrage hier. Es gibt keinen Setzer, kein
           Template, kein setAttribute. Die Sitzungsnotizen werden nach
           `n.id` gerendert (features/sessions/sessions.js, data-id="${n.id}").
           `noteEl` ist damit immer null, das `if` greift, und nichts von dem,
           was darin steht, laeuft je. Wer das reparieren will, hat zwei Wege:
           `data-note-date` beim Rendern der Notizen setzen oder goToNote()
           auf `n.id` umstellen (dann auch die data-value der Suchtreffer
           weiter oben). Gefuehrt in .planning/HANDOFF-V3-OFFENE-PUNKTE.md
           unter W3-F-01 Teil D, Punkt D6; die Ratsche dazu ist R-22 in
           tests/unit/design-consistency.test.js. */
        const noteEl = document.querySelector(`[data-note-date="${date}"]`);
        if (noteEl) {
            noteEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            /* W3-D-05: der Ring kommt aus --ring-gold statt aus volldeckendem
               var(--gold) (2px -> 3px). DAZU eine Leuchte, weil --ring-gold
               allein 15 % deckend ist und auf --bg-card, der Flaeche des
               Notizzettels, nur 1,32 / 1,17 / 1,26 liest (dark/light/sepia;
               Contrast 13,46, dort traegt der Ring volles Gold). Die Marke
               verschwindet nach zwei Sekunden wieder und waere damit praktisch
               unsichtbar — heute sind es 8,28 / 3,25 / 6,58 / 13,46, mit der
               Leuchte 3,61 / 1,90 / 2,66 / 13,46. Zeichengleich mit
               entity-actions.js 'navigate-to-quest', weil es dieselbe Marke
               ist. Zahlen in W3-F-01 Teil D. */
            noteEl.style.boxShadow = 'var(--ring-gold), 0 0 12px var(--glow-gold)';
            setTimeout(() => (noteEl.style.boxShadow = ''), 2000);
        }
    }, 100);
}
// ============================================================
// ENCOUNTER RESET / RUNDEN-SYSTEM
// ============================================================
let encounterRound = 1;
function nextEncounterRound() {
    saveUndoState('Neue Runde');
    encounterRound++;
    const D = window.D;
    D.initiative.round = encounterRound;
    // Runden-basierte Effekte verarbeiten
    D.initiative.combatants.forEach(c => {
        // Hier könnten automatische Effekte pro Runde verarbeitet werden
        // z.B. Vergiftungsschaden, Regeneration, etc.
    });
    const save = window.save;
    if (save) save();
    updateEncounterDisplay();
    showToast(`⚔️ Runde ${encounterRound}`);
}
function resetEncounter() {
    if (
        !confirm('Encounter zurücksetzen? Alle Zustände und die Rundenanzahl werden zurückgesetzt.')
    )
        return;
    saveUndoState('Encounter Reset');
    const D = window.D;
    encounterRound = 1;
    D.initiative.round = 1;
    D.initiative.currentTurn = 0;
    // Alle temporären Zustände entfernen
    D.initiative.combatants.forEach(c => {
        c.conditions = [];
        c.exhaustion = 0;
        c.tempHp = 0;
        // HP auf Maximum setzen (optional)
        // c.hp = c.hpMax;
    });
    const save = window.save;
    const renderInit = window.renderInit;
    if (save) save();
    if (renderInit) renderInit();
    updateEncounterDisplay();
    showToast('🔄 Encounter zurückgesetzt');
}
function updateEncounterDisplay() {
    const roundEl = document.querySelector('.encounter-round-num');
    if (roundEl) {
        roundEl.textContent = String(encounterRound);
    }
}
// ============================================================
