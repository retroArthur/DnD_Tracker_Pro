// [SECTION:QUICK_ROLL]
// Extrahiert aus spellslots.js
// Quick Roll System
// Zeilen: 113
// Quick Roll für Keyboard Shortcuts
function quickRoll(sides) {
    const result = Math.floor(Math.random() * sides) + 1;
    const isCrit = sides === 20 && result === 20;
    const isFail = sides === 20 && result === 1;
    let msg = `🎲 d${sides}: ${result}`;
    if (isCrit) msg = '🎉 Kritisch! d20: 20';
    if (isFail) msg = '💀 Patzer! d20: 1';
    showToast(msg, 'success', { kategorie: 'kampf' });
    // Zur Würfelhistorie hinzufügen
    const D = window.D;
    D.diceHistory = D.diceHistory || [];
    D.diceHistory.unshift({ dice: `d${sides}`, result, timestamp: Date.now() });
    if (D.diceHistory.length > 50) D.diceHistory = D.diceHistory.slice(0, 50);
    // D.diceHistory oben liest keine Ansicht. In Verlauf und Statistik kommt der
    // Wurf erst hier (07-CONTEXT D-04: "ALLE Würfe ... Quick-Rolls (R)").
    // Ohne Schadensart: der Chip des Wuerfel-Tabs gilt nicht fuer R/Alt+Ziffer.
    // typeof: die Multi-Tab-Werkbank der Unit-Tests laedt dieses Modul ohne
    // das Wuerfelmodul.
    if (typeof addToDiceHistory === 'function') {
        addToDiceHistory(`1d${sides}`, result, [result], { ohneSchadensart: true });
    }
}
// (D-07) Speicher-Konflikt auflösen. Es gibt (noch) keinen externen UI-Dialog —
// bei abweichendem Inhalt wird der neuere IDB-Stand bevorzugt (kein stiller Verlust).
// WICHTIG: KEINE Selbstreferenz über window.<eigener Name> — das war CR-01 (Endlosrekursion).
function resolveStorageConflict(lsData, idbData, onUseLS, onUseIDB) {
    // Identischer Inhalt: kein Konflikt, LS-Stand still nutzen
    if (lsData === idbData) {
        if (typeof onUseLS === 'function') onUseLS();
        return;
    }
    // Optionaler externer UI-Dialog (anders benannt als diese Funktion!)
    if (typeof window.showStorageConflictDialogUI === 'function') {
        window.showStorageConflictDialogUI(lsData, idbData, onUseLS, onUseIDB);
    } else {
        // Fallback: IDB-Daten bevorzugen (neuere Quelle) — kein stiller Sieg veralteter LS-Daten
        if (typeof onUseIDB === 'function') onUseIDB();
    }
}
// R06: gespeicherter Rohtext -> normalisiertes, migriertes Kampagnenobjekt ({p}) oder
// {reason: 'parse'|'invalid', error}. Meldet Parse-Fehler wie bisher.
function _parseStoredCampaign(s) {
    const ErrorHandler = window.ErrorHandler;
    const APP_CONFIG = window.APP_CONFIG;
    const CURRENT_VERSION = APP_CONFIG.VERSION;
    // Sichere JSON-Parse
    let p;
    try {
        p = JSON.parse(s);
    } catch (parseError) {
        ErrorHandler.log('load', parseError, 'JSON Parse fehlgeschlagen');
        ErrorHandler.showError('Kampagnendaten sind beschädigt');
        return { reason: 'parse', error: parseError };
    }
    // Prüfe auf valides Objekt
    if (!p || typeof p !== 'object') {
        const error = new Error('Ungültige Datenstruktur');
        ErrorHandler.log('load', error);
        return { reason: 'invalid', error };
    }
    // (D-05/STAB-06) Legacy-Stempel-Normalisierung: '2.11' wurde fälschlicherweise
    // als "neuer als 2.6.x" behandelt (compareVersions: 11 > 6).
    // Normalisierung auf '2.0.0' stellt sicher, dass Migration korrekt ausgeführt wird.
    if (p._version === '2.11') {
        p._version = '2.0.0';
        if (APP_CONFIG.DEBUG_MODE && typeof log === 'function') {
            log('[LOAD] Legacy-Stempel 2.11 auf 2.0.0 normalisiert');
        }
    }
    // Versionierung und Migration
    if (!p._version || compareVersions(p._version, CURRENT_VERSION) < 0) {
        if (APP_CONFIG.DEBUG_MODE && typeof log === 'function') {
            log(`[LOAD] Migriere von ${p._version || 'unbekannt'} auf ${CURRENT_VERSION}`);
        }
        try {
            p = migrateData(p);
        } catch (migrateError) {
            ErrorHandler.log('load', migrateError, 'Migration fehlgeschlagen');
            // Fahre trotzdem fort mit unmigierten Daten
        }
    }
    return { p };
}
// R06: Nachbearbeitung, NACHDEM der Stand in D uebernommen ist (Laufzeit-Container, Version,
// Integritaet, spellClasses). Wirft sie, bleibt der Stand trotzdem uebernommen.
function _finishAppliedCampaign(D) {
    const APP_CONFIG = window.APP_CONFIG;
    if (!D.encounters) D.encounters = [];
    if (!D.spells) D.spells = [];
    if (!D.links) D.links = [];
    if (!D.filters) D.filters = [];
    if (!D.calendar) D.calendar = { day: 1, month: 4, year: 1492, events: [] };
    if (!D._nextId) D._nextId = {};
    // Setze aktuelle Version
    D._version = APP_CONFIG.VERSION;
    // Validiere Datenintegrität
    const validateDataIntegrity = window.validateDataIntegrity;
    const validation = validateDataIntegrity();
    if (!validation.valid) {
        if (APP_CONFIG.DEBUG_MODE && typeof window.debugLogAdd === 'function') {
            // Selbstheilung ist Normalverhalten, kein Fehler — nur ins in-App-Debug-Log
            // (validateDataIntegrity loggt die Reparaturliste bereits separat dort;
            // console.error waere hier ein falscher Alarm, UAT 01).
            window.debugLogAdd(
                `[load] Daten-Reparaturen durchgeführt: ${validation.repairs.join('; ')}`
            );
        }
        // Speichere reparierte Daten — automatisch, also nur in einem nicht veralteten
        // Tab (R02, D4 = A)
        setTimeout(() => window.saveAutomatic(), 1000);
    }
    // Pre-compute spellClasses arrays for performance
    if (D.spells && Array.isArray(D.spells)) {
        D.spells.forEach(spell => {
            // Pre-compute spellClasses array from comma-separated string
            if (spell.spellClass && !spell.spellClasses) {
                spell.spellClasses = spell.spellClass.split(',').map(c => c.trim());
            }
        });
    }
}
/**
 * Laedt die aktive Kampagne (localStorage, bei Bedarf IndexedDB) und uebernimmt sie in D.
 * R06 (Code-Review 2026-09-21, U8): liefert ein LoadResult statt stillem undefined —
 * {ok, applied, source: 'localStorage'|'indexedDB'|null, reason?, degraded?, warning?, error?}.
 * ok: ein gespeicherter Stand wurde gelesen UND uebernommen. reason bei ok:false: 'no-key',
 * 'not-found', 'idb-error', 'parse', 'invalid', 'abandoned' oder 'exception'.
 * @param {{strictIdb?: boolean, replace?: boolean, shouldApply?: () => boolean}} [options]
 *   strictIdb (Neuladen): ein gescheitertes IndexedDB-Lesen ist ein Fehlschlag — beim Start
 *   geht es mit dem localStorage-Schatten weiter (degraded: true).
 *   replace (Neuladen, F3): den Stand ERSETZEN statt mischen — frische initializeData()-
 *   Standards plus die gespeicherten Schluessel. Ohne replace bleibt der Startpfad beim
 *   Mischen (lazy angelegte Schluessel wie randomTables bleiben dort erhalten).
 *   shouldApply: unmittelbar vor dem Uebernehmen gefragt; false -> reason 'abandoned'.
 */
async function load(options = {}) {
    const opts = options && typeof options === 'object' ? options : {};
    const key = window.getActiveCampaignKey();
    const D = window.D;
    const ErrorHandler = window.ErrorHandler;
    const APP_CONFIG = window.APP_CONFIG;
    if (!key) {
        const error = new Error('Kein aktiver Kampagnenschlüssel');
        ErrorHandler.log('load', error);
        return { ok: false, applied: false, source: null, reason: 'no-key', error };
    }
    let source = null;
    let applied = false;
    let degraded = false;
    try {
        let s = StorageAPI.get(key, null);
        // R02: localStorage-Rohwert VOR jeder IndexedDB-Ersetzung — Basis der Veraltungspruefung
        const lsRaw = s;
        if (s) source = 'localStorage';
        const lsTimestamp = StorageAPI.get(key + '_ts', null);
        // (D-01/D-07) Stale-Shadow-Detection: LS vorhanden, aber ohne _ts
        // → prüfe ob IDB neuere Daten hat
        if (s && !lsTimestamp) {
            try {
                const idbRecord = await window.loadFromIndexedDBFallbackRaw(key);
                if (idbRecord && idbRecord.data && idbRecord.data !== s) {
                    // IDB hat andere (neuere) Daten — Konflikt auflösen
                    resolveStorageConflict(
                        s,
                        idbRecord.data,
                        () => {
                            /* LS-Daten nutzen — s bleibt unverändert */
                        },
                        () => {
                            s = idbRecord.data;
                            source = 'indexedDB';
                        }
                    );
                }
                // Identischer Inhalt: kein Dialog, s bleibt (kein Datenverlust)
            } catch (e) {
                // R06: beim Neuladen ist ein ungeprüfter Schatten kein belastbarer Stand —
                // Fehlschlag, BEVOR etwas uebernommen wird
                if (opts.strictIdb) {
                    ErrorHandler.log('load', e, '[D-07] IDB-Konfliktprüfung fehlgeschlagen');
                    return {
                        ok: false,
                        applied: false,
                        source: null,
                        reason: 'idb-error',
                        error: e
                    };
                }
                // Start: IDB nicht verfügbar — LS-Daten nutzen, aber als eingeschraenkt melden
                degraded = true;
                if (APP_CONFIG.DEBUG_MODE) {
                    ErrorHandler &&
                        ErrorHandler.log('load', e, '[D-07] IDB-Konfliktprüfung fehlgeschlagen');
                }
            }
        }
        // Fallback zu IndexedDB wenn localStorage leer
        if (!s) {
            try {
                const loadFromIndexedDBFallback = window.loadFromIndexedDBFallback;
                s = await loadFromIndexedDBFallback(key);
                if (s) {
                    source = 'indexedDB';
                    if (APP_CONFIG.DEBUG_MODE && typeof log === 'function') {
                        // Erfolgsmeldung, kein Fehler — nicht rot via ErrorHandler.log (UAT 01)
                        log('[LOAD] Daten aus IndexedDB geladen');
                    }
                    showToast('💾 Kampagne aus IndexedDB geladen', 'info', 3000);
                }
            } catch (e) {
                // R06: nur "nichts gespeichert" (NOT_FOUND) ist ein normaler, frischer Start. Ein
                // echter Lesefehler setzt KEINE Baseline — automatische Saves schreiben dann nicht
                // ueber die ungelesene IndexedDB-Kampagne (R02).
                if (!(e && e.code === 'NOT_FOUND')) {
                    ErrorHandler.log('load', e, 'IndexedDB-Lesefehler');
                    showToast('⚠️ Kampagne konnte nicht aus IndexedDB gelesen werden', 'warning');
                    return {
                        ok: false,
                        applied: false,
                        source: null,
                        reason: 'idb-error',
                        error: e
                    };
                }
                if (APP_CONFIG.DEBUG_MODE && typeof log === 'function') {
                    // Erwarteter Pfad bei frischem Boot (keine IDB-Daten) — kein roter Fehler
                    log('[LOAD] Keine Daten in IndexedDB:', e.message);
                }
            }
        }
        if (!s) {
            // Nichts gespeichert (frische Kampagne). R02: der Start setzt die Baseline. Beim
            // Neuladen (strictIdb) bleibt die bisherige — ein anderer Tab hat die Kampagne
            // entfernt; automatische Saves schreiben den verdraengten Stand nicht zurueck.
            if (!opts.strictIdb && typeof window.setPersistBaseline === 'function') {
                window.setPersistBaseline(key, lsRaw, JSON.stringify(D));
            }
            return { ok: false, applied: false, source: null, reason: 'not-found' };
        }
        const parsed = _parseStoredCampaign(s);
        if (!parsed.p) {
            return {
                ok: false,
                applied: false,
                source,
                reason: parsed.reason,
                error: parsed.error
            };
        }
        // R06: ein aufgegebenes Neuladen (Waechter abgelaufen) uebernimmt nichts mehr
        if (typeof opts.shouldApply === 'function' && !opts.shouldApply()) {
            return { ok: false, applied: false, source, reason: 'abandoned' };
        }
        if (opts.replace) {
            // R06-Nachtrag (F3, holistisch "user-flows" major / U8 open:1): das
            // Konflikt-Neuladen ERSETZT. Frische Standards plus die gespeicherten
            // Schluessel = dieselbe Gestalt, die ein Start erzeugt. Ein Schluessel, den nur
            // das verdraengte D trug, ueberlebt nicht und wird nicht zurueckgeschrieben —
            // sonst holte dieser Tab zurueck, was ein "Überschreiben"-Import oder ein
            // Restore in einem anderen Tab entfernt hat. '__proto__', 'constructor' und
            // 'prototype' werden dabei nie zugewiesen (CAMPAIGN_FORBIDDEN_KEYS).
            const next = window.initializeData();
            for (const k of Object.keys(parsed.p)) {
                if (!window.CAMPAIGN_FORBIDDEN_KEYS.includes(k)) next[k] = parsed.p[k];
            }
            window.replaceCampaignData(D, next);
        } else {
            // Startpfad: mischen wie bisher (D is now const, cannot reassign)
            Object.assign(D, parsed.p);
        }
        applied = true;
        let warning = null;
        try {
            _finishAppliedCampaign(D);
        } catch (postError) {
            // Der Stand IST uebernommen — ehrlich als Warnung, nicht als "nichts geaendert"
            warning = (postError && postError.message) || String(postError);
            ErrorHandler.log('load', postError, 'Nachbearbeitung nach dem Laden fehlgeschlagen');
        }
        // R02: Baseline erst nach erfolgreichem Laden. Die fruehen Returns (Lesefehler,
        // Parse-Fehler, ungueltige Struktur, aufgegeben) und der catch setzen keine — ein Tab,
        // der nicht laden konnte, schreibt beim Verlassen nie blind ueber die Daten.
        if (typeof window.setPersistBaseline === 'function') {
            window.setPersistBaseline(key, lsRaw, JSON.stringify(D));
        }
        if (degraded) {
            // R06-Nachtrag (F3, holistisch "write-paths" major): der localStorage-Schatten
            // ist UNGEPRUEFT — IndexedDB war nicht lesbar und kann den neueren Stand halten.
            // Der Tab gilt darum als veraltet: keine automatischen Saves, kein Entlade-Write
            // (die schrieben den Schatten MIT _ts, und ab dann uebersprang jedes spaetere
            // load() die IndexedDB-Pruefung). Ein ausdruecklicher Save schreibt weiter (D4)
            // und setzt die Baseline neu.
            if (typeof window.markExternalCampaignWrite === 'function') {
                window.markExternalCampaignWrite(key);
            }
            showToast('⚠️ Kampagne konnte nicht aus IndexedDB gelesen werden', 'warning');
        }
        const result = { ok: true, applied: true, source };
        if (degraded) result.degraded = true;
        if (warning) result.warning = warning;
        return result;
    } catch (e) {
        ErrorHandler.log('load', e);
        ErrorHandler.showError('Fehler beim Laden der Kampagne');
        return { ok: false, applied, source, reason: 'exception', error: e };
    }
}
function exportAllDataAsFile() {
    const D = window.D;
    const APP_CONFIG = window.APP_CONFIG;
    try {
        const exp = { ...D };
        delete exp._nextId;
        // Kampagnennamen hinzufügen
        const getCampaignIndex = window.getCampaignIndex;
        const index = getCampaignIndex();
        if (index.active === APP_CONFIG.STORAGE_KEY) {
            exp._campaignName = 'Standard-Kampagne';
        } else {
            const campaign = index.campaigns.find(c => c.key === index.active);
            exp._campaignName = campaign?.name || 'Unbenannte Kampagne';
        }
        exp._exportDate = new Date().toISOString();
        // (D-05/STAB-06) Dynamische Versionsnummer statt hartkodiertem Stempel '2.11'
        exp._version = APP_CONFIG.VERSION;
        const filename = exp._campaignName
            .replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '')
            .replace(/\s+/g, '-');
        const json = JSON.stringify(exp, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        showToast('📁 Daten exportiert');
    } catch (err) {
        showToast('❌ Export fehlgeschlagen: ' + err.message, 'error');
        // Ausnahme (c): Export-Fehler koennten stillen Datenverlust verdecken, kein Guard
        if (window.ErrorHandler) {
            window.ErrorHandler.log('Export', err);
        }
    }
}
// ============================================================
