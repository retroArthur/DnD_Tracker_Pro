// [SECTION:BACKUPS]
// ============================================================
// AUTO-BACKUP SYSTEM - @backup @restore @save @recovery
// ============================================================
// Constants from APP_CONFIG
const BACKUP_INTERVAL = window.APP_CONFIG?.BACKUP_INTERVAL || 300000; // 5 minutes
const MAX_BACKUPS = window.APP_CONFIG?.MAX_BACKUPS || 5;
const MAX_BACKUP_SIZE_MB = window.APP_CONFIG?.MAX_BACKUP_SIZE_MB || 2;
const BACKUP_KEY = window.APP_CONFIG?.BACKUP_KEY || 'dnd-tracker-backups';

// Track if we already warned about backup failures (avoid console spam)
let _backupFailureLogged = false;

// Backups werden primär in IndexedDB gespeichert, localStorage als Fallback
async function createAutoBackup() {
    try {
        const D = window.D;
        const APP_CONFIG = window.APP_CONFIG;
        const ErrorHandler = window.ErrorHandler;
        // Nur speichern wenn Daten existieren
        if (!D.characters?.length && !D.npcs?.length && !D.quests?.length) return;
        const backup = {
            timestamp: Date.now(),
            campaignKey: window.STORAGE_KEY_OVERRIDE || STORAGE_KEY,
            data: JSON.stringify(D)
        };
        const backupSizeMB = new Blob([backup.data]).size / (1024 * 1024);
        // Versuche IndexedDB (bevorzugt, kein Quota-Limit)
        try {
            await saveBackupToIndexedDB(backup);
            return;
        } catch (idbError) {
            if (APP_CONFIG.DEBUG_MODE) {
                ErrorHandler.log(
                    'createAutoBackup',
                    idbError,
                    'IndexedDB failed, trying localStorage'
                );
            }
        }
        // Fallback: localStorage (nur für kleine Backups)
        if (backupSizeMB > MAX_BACKUP_SIZE_MB) {
            if (APP_CONFIG.DEBUG_MODE) {
                ErrorHandler.log(
                    'createAutoBackup',
                    new Error('Backup too large for localStorage'),
                    `${backupSizeMB.toFixed(1)}MB exceeds limit`
                );
            }
            return;
        }
        const backups = StorageAPI.getJSON(BACKUP_KEY, []) || [];
        backups.unshift(backup);
        // Max Backups einhalten
        while (backups.length > MAX_BACKUPS) {
            backups.pop();
        }
        const result = StorageAPI.setJSON(BACKUP_KEY, backups);
        if (!result.success) {
            // Bei Quota-Fehler: Alte Backups löschen und nochmal versuchen
            if (result.error?.includes('quota') || result.error?.includes('QUOTA')) {
                if (APP_CONFIG.DEBUG_MODE) {
                    ErrorHandler.log(
                        'createAutoBackup',
                        new Error('Quota exceeded'),
                        'Clearing old backups'
                    );
                }
                StorageAPI.remove(BACKUP_KEY);
                // Nur aktuelles Backup speichern
                StorageAPI.setJSON(BACKUP_KEY, [backup]);
            }
        }
    } catch (e) {
        const APP_CONFIG = window.APP_CONFIG;
        const ErrorHandler = window.ErrorHandler;
        if (APP_CONFIG?.DEBUG_MODE && !_backupFailureLogged) {
            ErrorHandler?.log(
                'createAutoBackup',
                e,
                'Auto-backup failed (weitere Fehler werden unterdrückt)'
            );
            _backupFailureLogged = true;
        }
    }
}
// IndexedDB Backup-Speicherung. R04: loest erst nach dem bestaetigten Commit auf; ein
// abgebrochener Commit lehnt ab, damit createAutoBackup() den localStorage-Rueckfall erreicht.
async function saveBackupToIndexedDB(backup) {
    return window.idbWriteTx(['backups'], transaction => {
        const store = transaction.objectStore('backups');
        // Alte Backups dieser Kampagne laden und begrenzen
        const request = store.index('campaign').getAll(backup.campaignKey);
        request.onsuccess = () => {
            const existingBackups = request.result || [];
            // Sortiere nach Timestamp (neueste zuerst)
            existingBackups.sort((a, b) => b.timestamp - a.timestamp);
            // Lösche alte Backups (behalte nur MAX_BACKUPS - 1)
            const toDelete = existingBackups.slice(MAX_BACKUPS - 1);
            toDelete.forEach(old => {
                if (old.id) store.delete(old.id);
            });
            // Neues Backup speichern
            backup.id = `${backup.campaignKey}-${backup.timestamp}`;
            store.put(backup);
        };
    });
}
// ============================================================
// BACKUP-LISTE & WIEDERHERSTELLUNG (Code-Review 2026-09-21, R01/R05)
// Nur Backups der AKTIVEN Kampagne werden angeboten und wiederhergestellt. Beide Quellen
// (gemeinsamer localStorage-Schluessel aller Kampagnen, IndexedDB-Store) werden VOR dem
// Zusammenfuehren formgeprueft und gefiltert; Alt-Backups ohne campaignKey werden nicht
// angeboten (Nutzerentscheidung D1). Stabile Backup-ID ist der Zeitstempel, nie eine
// Listenposition (die driftet, sobald ein neues Auto-Backup dazukommt).
// ============================================================
/**
 * Gehoert ein Backup zur Kampagne key? Nur ein nicht-leerer, exakt gleicher
 * campaignKey zaehlt.
 * @param {any} b - Backup-Datensatz
 * @param {string} key - Kampagnen-Speicherschluessel
 * @returns {boolean}
 */
function isBackupOfCampaign(b, key) {
    return (
        !!b && typeof b.campaignKey === 'string' && b.campaignKey !== '' && b.campaignKey === key
    );
}
/**
 * Formpruefung fuer Backup-Datensaetze aus BEIDEN Quellen. Der Zeitstempel landet als
 * stabile ID im data-id-Attribut des Modals und muss deshalb eine sichere positive
 * Ganzzahl sein (ein String-Zeitstempel aus IndexedDB darf dort nie ankommen).
 * @param {any} b - Backup-Datensatz
 * @returns {boolean}
 */
function isValidBackupRecord(b) {
    return (
        isPlainDataObject(b) &&
        Number.isSafeInteger(b.timestamp) &&
        b.timestamp > 0 &&
        typeof b.data === 'string' &&
        typeof b.campaignKey === 'string'
    );
}
/**
 * Formgepruefte localStorage-Backup-Liste (ein Schluessel fuer ALLE Kampagnen —
 * Aufrufer filtern selbst nach Kampagne).
 * @returns {Array<Object>}
 */
function readLocalBackups() {
    const list = StorageAPI.getJSON(BACKUP_KEY, []);
    return Array.isArray(list) ? list.filter(isValidBackupRecord) : [];
}
/**
 * IndexedDB-Backups einer Kampagne ueber den 'campaign'-Index (nur lesend). Lehnt bei
 * jedem Fehler ab. key MUSS ein gueltiger Schluessel sein: index.getAll(undefined)
 * liefert ALLE Datensaetze.
 * @param {string} key - Kampagnen-Speicherschluessel
 * @returns {Promise<Array<Object>>}
 */
async function readIndexedDbBackups(key) {
    if (typeof key !== 'string' || key === '') throw new Error('Kein Kampagnenschlüssel');
    if (!window.idb) {
        if (typeof window.initIndexedDB !== 'function') {
            throw new Error('IndexedDB nicht verfügbar');
        }
        await window.initIndexedDB();
    }
    const idb = window.idb;
    if (!idb) throw new Error('IndexedDB nicht verfügbar');
    return new Promise((resolve, reject) => {
        const transaction = idb.transaction(['backups'], 'readonly');
        const request = transaction.objectStore('backups').index('campaign').getAll(key);
        request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
        request.onerror = () => reject(request.error || new Error('IndexedDB-Lesefehler'));
    });
}
/**
 * Nach Zeitstempel entdoppeln (erster Treffer gewinnt), neueste zuerst, auf MAX_BACKUPS
 * begrenzen. Erst NACH dem Filtern aufrufen — sonst verdraengen fremde Backups eigene.
 * @param {Array<Object>} list
 * @returns {Array<Object>}
 */
function sortAndLimitBackups(list) {
    const seen = new Set();
    const unique = [];
    for (const b of list) {
        if (seen.has(b.timestamp)) continue;
        seen.add(b.timestamp);
        unique.push(b);
    }
    unique.sort((a, b) => b.timestamp - a.timestamp);
    return unique.slice(0, MAX_BACKUPS);
}
/**
 * Backups der aktiven Kampagne aus beiden Quellen. Faellt IndexedDB aus, bleibt es bei
 * der gefilterten localStorage-Liste (derselbe Filter, dieselbe Begrenzung).
 * @returns {Promise<Array<Object>>}
 */
async function getBackups() {
    const key =
        typeof window.getActiveCampaignKey === 'function' ? window.getActiveCampaignKey() : null;
    if (!key) return [];
    const own = readLocalBackups().filter(b => isBackupOfCampaign(b, key));
    let fromIdb = [];
    try {
        fromIdb = (await readIndexedDbBackups(key)).filter(
            b => isValidBackupRecord(b) && isBackupOfCampaign(b, key)
        );
    } catch (e) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            window.ErrorHandler?.log('getBackups', e, 'IndexedDB-Backups nicht lesbar');
        }
    }
    return sortAndLimitBackups([...own, ...fromIdb]);
}
/**
 * Loest eine Backup-ID (Zeitstempel aus data-id) gegen eine Backup-Liste auf. Rein.
 * 'foreign' ist Verteidigung in der Tiefe: getBackups() liefert nur eigene Backups.
 * @param {Array<Object>} backups
 * @param {number|string} backupId - Zeitstempel
 * @param {string} key - aktiver Kampagnenschluessel
 * @returns {{status: 'ok'|'missing'|'foreign', backup: Object|null}}
 */
function findBackupForRestore(backups, backupId, key) {
    const ts = parseEntityId(backupId);
    if (!Number.isSafeInteger(ts)) return { status: 'missing', backup: null };
    const backup = (Array.isArray(backups) ? backups : []).find(b => b && b.timestamp === ts);
    if (!backup) return { status: 'missing', backup: null };
    return isBackupOfCampaign(backup, key)
        ? { status: 'ok', backup }
        : { status: 'foreign', backup };
}
/**
 * Holt die Audio-Blobs zurueck, auf die die Soundboard-Szenen von data verweisen.
 * Grund: removeAudioFile() setzt nur einen Grabstein, und _cleanupStaleTombstones()
 * loescht Grabsteine frueherer Sitzungen beim naechsten Start endgueltig — eine
 * wiederhergestellte Szene spielte jetzt und verloere ihr Audio still in der naechsten
 * Sitzung. restoreSoundBlob() ist idempotent; false heisst "schon endgueltig weg".
 * @param {Object} data - Kampagnenobjekt
 * @returns {Promise<number>} Anzahl referenzierter Dateien, die es nicht mehr gibt
 */
async function reviveReferencedSoundBlobs(data) {
    const scenes = Array.isArray(data?.soundboard?.scenes) ? data.soundboard.scenes : [];
    const ids = new Set();
    for (const scene of scenes) {
        if (!scene || !Array.isArray(scene.tracks)) continue;
        for (const track of scene.tracks) {
            if (track && typeof track.blobId === 'string' && track.blobId !== '') {
                ids.add(track.blobId);
            }
        }
    }
    if (ids.size === 0 || typeof window.restoreSoundBlob !== 'function') return 0;
    let missing = 0;
    for (const id of ids) {
        try {
            const found = await window.restoreSoundBlob(id);
            if (found === false) missing++;
        } catch (e) {
            if (window.APP_CONFIG?.DEBUG_MODE) {
                window.ErrorHandler?.log('reviveReferencedSoundBlobs', e, id);
            }
        }
    }
    return missing;
}
/**
 * Gemeinsamer Schluss von restoreBackup() und restoreFromFileBackup(): uebernimmt eine
 * NORMALISIERTE Kampagne (normalizeCampaignData(...).data) als aktuellen Stand.
 * Reihenfolge: Undo-Punkt -> Audio stoppen -> D ersetzen -> Integritaet -> Audio-Blobs
 * wiederbeleben -> rendern -> speichern. Ein Fehler NACH dem Ersetzen (z. B. beim Rendern)
 * wird nur geloggt — der Stand ist gueltig und muss gespeichert werden. Erfolg wird nur
 * nach bestaetigtem Speichern gemeldet; saveImmediate() meldet Fehler selbst laut.
 * @param {Object} data - normalisierte Kampagne
 * @param {string} source - Aufrufer (fuer das Fehlerlog)
 * @returns {Promise<boolean>} true, wenn das Speichern bestaetigt wurde
 */
async function applyRestoredCampaign(data, source) {
    if (typeof window.saveUndoState === 'function') {
        window.saveUndoState('Backup wiederhergestellt');
    }
    // Soundboard-Audio stoppen — Web Audio überlebt sonst den Daten-Reset
    if (typeof window.stopAllTracks === 'function') window.stopAllTracks();
    window.replaceCampaignData(window.D, data);
    try {
        // Paritaet mit load(): Selbstheilung nach dem Uebernehmen
        if (typeof window.validateDataIntegrity === 'function') window.validateDataIntegrity();
    } catch (e) {
        window.ErrorHandler?.log(source, e, 'Integritätsprüfung nach Wiederherstellung');
    }
    const missing = await reviveReferencedSoundBlobs(window.D);
    if (missing > 0) {
        showToast(
            `⚠️ ${missing} Audiodatei(en) aus diesem Backup sind nicht mehr vorhanden`,
            'warning'
        );
    }
    try {
        if (typeof window.renderAll === 'function') window.renderAll();
        const quickNotes = $('quick-notes');
        if (quickNotes) quickNotes.value = window.D.quickNotes || '';
    } catch (e) {
        window.ErrorHandler?.log(source, e, 'Rendern nach Wiederherstellung fehlgeschlagen');
    }
    let res = null;
    try {
        res = typeof window.saveImmediate === 'function' ? await window.saveImmediate() : null;
    } catch (e) {
        window.ErrorHandler?.log(source, e, 'Speichern nach Wiederherstellung fehlgeschlagen');
    }
    if (res && res.success) {
        showToast('✅ Backup wiederhergestellt');
        return true;
    }
    return false;
}
/**
 * Stellt ein Auto-Backup der aktiven Kampagne wieder her.
 * Invariante: window.D, Undo-Stapel und Speicher bleiben unberuehrt, bis das Backup
 * vollstaendig geprueft und normalisiert ist. Kein Sicherungs-Backup vorab: dessen
 * Rotation verdraengte gerade die noch nicht probierten Backups — Strg+Z ist das Netz.
 * @param {number|string} backupId - Zeitstempel des Backups (data-id im Modal)
 */
async function restoreBackup(backupId) {
    const key =
        typeof window.getActiveCampaignKey === 'function' ? window.getActiveCampaignKey() : null;
    if (!key) {
        showToast('❌ Keine aktive Kampagne', 'error');
        return;
    }
    const { status, backup } = findBackupForRestore(await getBackups(), backupId, key);
    if (status === 'foreign') {
        showToast(
            '❌ Dieses Backup gehört nicht zur aktiven Kampagne — Wiederherstellung abgebrochen.',
            'error'
        );
        return;
    }
    if (status !== 'ok') {
        showToast('❌ Backup nicht gefunden', 'error');
        return;
    }
    const label =
        typeof window.getCampaignDisplayName === 'function'
            ? window.getCampaignDisplayName(key)
            : key;
    // confirm() zeigt Klartext — esc() würde sichtbare Entities erzeugen (WR-05)
    const when = new Date(backup.timestamp).toLocaleString('de-DE');
    if (
        !confirm(
            `Kampagne „${label}“ auf das Backup vom ${when} zurücksetzen?\n\nDer aktuelle Stand wird überschrieben. Dieser Vorgang kann mit Strg+Z rückgängig gemacht werden.`
        )
    ) {
        return;
    }
    const result = window.normalizeCampaignData(backup.data);
    if (!result.ok) {
        window.ErrorHandler?.log('restoreBackup', new Error(result.error), 'Backup restore failed');
        showToast('❌ Backup fehlerhaft: ' + result.error, 'error');
        return;
    }
    await applyRestoredCampaign(result.data, 'restoreBackup');
}
async function showBackupsModal() {
    const key =
        typeof window.getActiveCampaignKey === 'function' ? window.getActiveCampaignKey() : null;
    const label =
        key && typeof window.getCampaignDisplayName === 'function'
            ? window.getCampaignDisplayName(key)
            : key || '';
    const backups = await getBackups();
    const renderEmptyState = window.renderEmptyState;
    const showModal = window.showModal;
    // Welche Kampagne diese Liste zeigt (auch im leeren Zustand)
    let content = `<div class="meta-text">Kampagne: ${esc(label)}</div>`;
    if (backups.length === 0) {
        content += renderEmptyState({
            icon: '💾',
            titleEmpty: 'Keine Backups',
            descEmpty: 'Backups werden automatisch alle 5 Minuten erstellt.',
            gridSpan: 'auto'
        });
    } else {
        // data-id = Zeitstempel: von isValidBackupRecord() als sichere Ganzzahl geprueft
        content += backups
            .map((b, i) => {
                const date = new Date(b.timestamp);
                const timeStr = date.toLocaleString('de-DE');
                const sizeMB = b.data ? (new Blob([b.data]).size / (1024 * 1024)).toFixed(1) : '?';
                return `<div class="backup-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg-dark); border-radius: 6px; margin-bottom: 8px;">
                <div>
                    <div style="font-weight: 500;">${timeStr}</div>
                    <div style="font-size: 0.85em; color: var(--text-dim);">Backup #${i + 1} (${sizeMB} MB)</div>
                </div>
                <button class="btn btn-sm" data-action="restore-backup" data-id="${b.timestamp}">Wiederherstellen</button>
            </div>`;
            })
            .join('');
    }
    // Dynamisches Modal erstellen
    let modal = $('backups-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'backups-modal';
        modal.innerHTML = `
            <div class="modal" style="max-width: 450px;">
                <div class="modal-header">
                    <span class="modal-title">💾 Auto-Backups</span>
                    <button class="btn btn-sm" data-action="hide-modal" data-value="backups-modal">✕</button>
                </div>
                <div id="backups-list"></div>
                <div style="margin-top: 12px; font-size: 0.85em; color: var(--text-dim);">
                    Backups werden alle 5 Minuten erstellt (max. ${MAX_BACKUPS}).
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    const list = $('backups-list');
    if (list) list.innerHTML = content;
    if (showModal) showModal('backups-modal');
}
// Auto-Backup Interval starten
let backupInterval = null;
function startAutoBackup() {
    if (backupInterval) clearInterval(backupInterval);
    backupInterval = window.setInterval(createAutoBackup, BACKUP_INTERVAL);
    // Erstes Backup nach 1 Minute
    setTimeout(createAutoBackup, 60000);
}
// ============================================================
// PERFORMANCE MONITORING SYSTEM
// ============================================================
const performanceMetrics = {
    renderTimes: [],
    saveTimes: [],
    entityCounts: {},
    lastCheck: Date.now()
};
let perfMonitoringInterval = null;
function initPerformanceMonitoring() {
    // Überwache Entity-Größen
    updateEntityCounts();
    // Performance-Check alle 30 Sekunden
    if (perfMonitoringInterval) clearInterval(perfMonitoringInterval);
    perfMonitoringInterval = window.setInterval(() => {
        checkPerformance();
    }, 30000);
    // Initial Check
    checkPerformance();
}
function updateEntityCounts() {
    const D = window.D;
    performanceMetrics.entityCounts = {
        characters: D.characters?.length || 0,
        npcs: D.npcs?.length || 0,
        quests: D.quests?.length || 0,
        locations: D.locations?.length || 0,
        encounters: D.encounters?.length || 0,
        loot: D.loot?.length || 0,
        notes: D.notes?.length || 0
    };
}
function trackRenderTime(functionName, startTime) {
    const duration = performance.now() - startTime;
    performanceMetrics.renderTimes.push({
        function: functionName,
        duration,
        timestamp: Date.now()
    });
    // Behalte nur letzte 50 Messungen
    if (performanceMetrics.renderTimes.length > 50) {
        performanceMetrics.renderTimes = performanceMetrics.renderTimes.slice(-50);
    }
    const APP_CONFIG = window.APP_CONFIG;
    const ErrorHandler = window.ErrorHandler;
    // Warnung bei langsamen Renders (>500ms)
    if (duration > 500 && APP_CONFIG.DEBUG_MODE) {
        ErrorHandler.log(
            'trackRenderTime',
            new Error('Slow render detected'),
            `${functionName} took ${duration.toFixed(0)}ms`
        );
    }
}
function checkPerformance() {
    updateEntityCounts();
    const totalEntities = Object.values(performanceMetrics.entityCounts).reduce((a, b) => a + b, 0);
    const APP_CONFIG = window.APP_CONFIG;
    const ErrorHandler = window.ErrorHandler;
    // Warnung bei vielen Entities (>500 gesamt)
    if (totalEntities > 500 && APP_CONFIG.DEBUG_MODE) {
        ErrorHandler.log(
            'checkPerformance',
            new Error('Large campaign detected'),
            `${totalEntities} total entities`
        );
        // Empfehlung für Virtual Scrolling
        if (totalEntities > 1000 && !window.performanceWarningShown) {
            showToast(
                '⚠️ Große Kampagne erkannt. Performance könnte beeinträchtigt sein.',
                'warning',
                6000
            );
            window.performanceWarningShown = true;
        }
    }
    // Berechne durchschnittliche Render-Zeit
    if (performanceMetrics.renderTimes.length > 10) {
        const recentRenders = performanceMetrics.renderTimes.slice(-10);
        const avgTime =
            recentRenders.reduce((sum, r) => sum + r.duration, 0) / recentRenders.length;
        if (avgTime > 300 && APP_CONFIG.DEBUG_MODE) {
            ErrorHandler.log(
                'checkPerformance',
                new Error('Slow average render time'),
                `${avgTime.toFixed(0)}ms average (should be <100ms)`
            );
        }
    }
}
function getPerformanceReport() {
    const report = {
        entities: performanceMetrics.entityCounts,
        totalEntities: Object.values(performanceMetrics.entityCounts).reduce((a, b) => a + b, 0),
        avgRenderTime:
            performanceMetrics.renderTimes.length > 0
                ? performanceMetrics.renderTimes.reduce((sum, r) => sum + r.duration, 0) /
                  performanceMetrics.renderTimes.length
                : 0,
        slowestRenders: performanceMetrics.renderTimes
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5)
    };
    console.table(report.entities);
    if (window.APP_CONFIG?.DEBUG_MODE && window.ErrorHandler) {
        window.ErrorHandler.log(
            'getPerformanceReport',
            new Error(`Durchschnittliche Render-Zeit: ${report.avgRenderTime.toFixed(2)}ms`),
            JSON.stringify(report.slowestRenders)
        );
    }
    return report;
}
// Export für Auto-Backup vor destruktiven Operationen
window.createAutoBackup = createAutoBackup;
// Gemeinsamer Restore-Schluss (restoreFromFileBackup in file-backup-ui.js) und
// Audio-Wiederbelebung (Code-Review 2026-09-21, R01)
window.applyRestoredCampaign = applyRestoredCampaign;
window.reviveReferencedSoundBlobs = reviveReferencedSoundBlobs;
// ============================================================
