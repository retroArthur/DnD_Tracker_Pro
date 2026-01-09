// [SECTION:BACKUPS]
// ============================================================
// AUTO-BACKUP SYSTEM - @backup @restore @save @recovery
// ============================================================
// Aliase für Rückwärtskompatibilität
const BACKUP_KEY = window.APP_CONFIG.BACKUP_KEY;
const BACKUP_INTERVAL = window.APP_CONFIG.BACKUP_INTERVAL;
const MAX_BACKUPS = window.APP_CONFIG.MAX_BACKUPS;
const MAX_BACKUP_SIZE_MB = window.APP_CONFIG.MAX_BACKUP_SIZE_MB;
const STORAGE_KEY = window.STORAGE_KEY;
// Backups werden primär in IndexedDB gespeichert, localStorage als Fallback
async function createAutoBackup() {
    try {
        const D = window.D;
        const APP_CONFIG = window.APP_CONFIG;
        const ErrorHandler = window.ErrorHandler;
        // Nur speichern wenn Daten existieren
        if (!D.characters?.length && !D.npcs?.length && !D.quests?.length)
            return;
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
        }
        catch (idbError) {
            if (APP_CONFIG.DEBUG_MODE) {
                ErrorHandler.log('createAutoBackup', idbError, 'IndexedDB failed, trying localStorage');
            }
        }
        // Fallback: localStorage (nur für kleine Backups)
        if (backupSizeMB > MAX_BACKUP_SIZE_MB) {
            if (APP_CONFIG.DEBUG_MODE) {
                ErrorHandler.log('createAutoBackup', new Error('Backup too large for localStorage'), `${backupSizeMB.toFixed(1)}MB exceeds limit`);
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
                    ErrorHandler.log('createAutoBackup', new Error('Quota exceeded'), 'Clearing old backups');
                }
                StorageAPI.remove(BACKUP_KEY);
                // Nur aktuelles Backup speichern
                StorageAPI.setJSON(BACKUP_KEY, [backup]);
            }
        }
    }
    catch (e) {
        const APP_CONFIG = window.APP_CONFIG;
        const ErrorHandler = window.ErrorHandler;
        if (APP_CONFIG.DEBUG_MODE) {
            ErrorHandler.log('createAutoBackup', e, 'Auto-backup failed');
        }
    }
}
// IndexedDB Backup-Speicherung
async function saveBackupToIndexedDB(backup) {
    const initIndexedDB = window.initIndexedDB;
    await initIndexedDB();
    const idb = window.idb;
    return new Promise((resolve, reject) => {
        const transaction = idb.transaction(['backups'], 'readwrite');
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
                if (old.id)
                    store.delete(old.id);
            });
            // Neues Backup speichern
            backup.id = `${backup.campaignKey}-${backup.timestamp}`;
            store.put(backup);
        };
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}
// Backups aus beiden Quellen laden
async function getBackups() {
    const localBackups = StorageAPI.getJSON(BACKUP_KEY, []) || [];
    const APP_CONFIG = window.APP_CONFIG;
    const ErrorHandler = window.ErrorHandler;
    try {
        const initIndexedDB = window.initIndexedDB;
        await initIndexedDB();
        const campaignKey = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY;
        const idb = window.idb;
        const idbBackups = await new Promise((resolve, reject) => {
            const transaction = idb.transaction(['backups'], 'readonly');
            const store = transaction.objectStore('backups');
            const request = store.index('campaign').getAll(campaignKey);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => resolve([]); // Bei Fehler leeres Array
        });
        // Kombiniere und dedupliziere nach Timestamp
        const allBackups = [...localBackups, ...idbBackups];
        const uniqueBackups = [];
        const seen = new Set();
        allBackups.forEach(b => {
            if (!seen.has(b.timestamp)) {
                seen.add(b.timestamp);
                uniqueBackups.push(b);
            }
        });
        // Sortiere nach Timestamp (neueste zuerst)
        uniqueBackups.sort((a, b) => b.timestamp - a.timestamp);
        return uniqueBackups.slice(0, MAX_BACKUPS);
    }
    catch (e) {
        if (APP_CONFIG.DEBUG_MODE) {
            ErrorHandler.log('getBackups', e, 'Failed to load IndexedDB backups');
        }
        return localBackups;
    }
}
/**
 * Validiert und bereinigt Backup-Daten gegen ein Standardschema
 * @param parsed - Die geparsten Backup-Daten
 * @param defaultSchema - Das Standardschema mit Defaultwerten
 * @returns Bereinigte Daten
 */
function sanitizeBackupData(parsed, defaultSchema) {
    const sanitized = {};
    // Kopiere alle erlaubten Keys mit Typprüfung
    for (const [key, defaultValue] of Object.entries(defaultSchema)) {
        if (!(key in parsed)) {
            // Key nicht im Backup - verwende Default
            sanitized[key] = structuredClone(defaultValue);
        }
        else if (Array.isArray(defaultValue)) {
            // Array-Typ erwartet
            sanitized[key] = Array.isArray(parsed[key])
                ? structuredClone(parsed[key])
                : structuredClone(defaultValue);
        }
        else if (typeof defaultValue === 'object' && defaultValue !== null) {
            // Object-Typ erwartet
            sanitized[key] = (typeof parsed[key] === 'object' && parsed[key] !== null && !Array.isArray(parsed[key]))
                ? structuredClone(parsed[key])
                : structuredClone(defaultValue);
        }
        else if (typeof defaultValue === 'number') {
            sanitized[key] = typeof parsed[key] === 'number' ? parsed[key] : defaultValue;
        }
        else if (typeof defaultValue === 'string') {
            sanitized[key] = typeof parsed[key] === 'string' ? parsed[key] : defaultValue;
        }
        else if (typeof defaultValue === 'boolean') {
            sanitized[key] = typeof parsed[key] === 'boolean' ? parsed[key] : defaultValue;
        }
        else {
            sanitized[key] = structuredClone(defaultValue);
        }
    }
    return sanitized;
}
async function restoreBackup(index) {
    const backups = await getBackups();
    if (!backups[index]) {
        showToast('❌ Backup nicht gefunden');
        return;
    }
    if (!confirm('Aktuellen Stand mit Backup überschreiben?'))
        return;
    const ErrorHandler = window.ErrorHandler;
    const renderAll = window.renderAll;
    const saveImmediate = window.saveImmediate;
    try {
        const parsed = JSON.parse(backups[index].data);
        // Validiere Backup-Struktur
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('Ungültiges Backup-Format');
        }
        // Prüfe auf erforderliche Arrays (mindestens leere Arrays)
        const requiredArrays = ['characters', 'npcs', 'quests', 'locations', 'loot'];
        for (const key of requiredArrays) {
            if (parsed[key] !== undefined && !Array.isArray(parsed[key])) {
                throw new Error(`Ungültiger Datentyp für ${key}`);
            }
        }
        // Prüfe initiative-Struktur
        if (parsed.initiative && typeof parsed.initiative !== 'object') {
            throw new Error('Ungültige Initiative-Daten');
        }
        // SICHER: Verwende Default-Schema aus core/data.js für Validierung
        // und erstelle Deep Clone statt direkter Zuweisung
        const defaultD = {
            characters: [],
            npcs: [],
            quests: [],
            locations: [],
            loot: [],
            encounters: [],
            filters: [],
            notes: [],
            shops: [],
            spells: [],
            wiki: [],
            links: [],
            storyArcs: [],
            mindmap: { nodes: [], edges: [] },
            initiative: { entries: [], round: 1 },
            lastSync: 0
        };
        // Validiere und bereinige gegen Schema (mit Deep Clone)
        // D is const, cannot reassign - clear and merge instead
        const sanitized = sanitizeBackupData(parsed, defaultD);
        const D = window.D;
        for (const key in D)
            delete D[key];
        Object.assign(D, sanitized);
        if (renderAll)
            renderAll();
        if (saveImmediate)
            saveImmediate();
        showToast('✅ Backup wiederhergestellt');
    }
    catch (e) {
        ErrorHandler.log('restoreBackup', e, 'Backup restore failed');
        showToast('❌ Backup fehlerhaft: ' + (e.message || 'Unbekannter Fehler'));
    }
}
async function showBackupsModal() {
    const backups = await getBackups();
    const renderEmptyState = window.renderEmptyState;
    const showModal = window.showModal;
    let content = '';
    if (backups.length === 0) {
        content = renderEmptyState({
            icon: '💾',
            titleEmpty: 'Keine Backups',
            descEmpty: 'Backups werden automatisch alle 5 Minuten erstellt.',
            gridSpan: 'auto'
        });
    }
    else {
        content = backups.map((b, i) => {
            const date = new Date(b.timestamp);
            const timeStr = date.toLocaleString('de-DE');
            const sizeMB = b.data ? (new Blob([b.data]).size / (1024 * 1024)).toFixed(1) : '?';
            return `<div class="backup-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg-dark); border-radius: 6px; margin-bottom: 8px;">
                <div>
                    <div style="font-weight: 500;">${timeStr}</div>
                    <div style="font-size: 0.85em; color: var(--text-dim);">Backup #${i + 1} (${sizeMB} MB)</div>
                </div>
                <button class="btn btn-sm" data-action="restore-backup" data-id="${i}">Wiederherstellen</button>
            </div>`;
        }).join('');
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
    if (list)
        list.innerHTML = content;
    if (showModal)
        showModal('backups-modal');
}
// Auto-Backup Interval starten
let backupInterval = null;
function startAutoBackup() {
    if (backupInterval)
        clearInterval(backupInterval);
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
function initPerformanceMonitoring() {
    // Überwache Entity-Größen
    updateEntityCounts();
    // Performance-Check alle 30 Sekunden
    setInterval(() => {
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
    performanceMetrics.renderTimes.push({ function: functionName, duration, timestamp: Date.now() });
    // Behalte nur letzte 50 Messungen
    if (performanceMetrics.renderTimes.length > 50) {
        performanceMetrics.renderTimes = performanceMetrics.renderTimes.slice(-50);
    }
    const APP_CONFIG = window.APP_CONFIG;
    const ErrorHandler = window.ErrorHandler;
    // Warnung bei langsamen Renders (>500ms)
    if (duration > 500 && APP_CONFIG.DEBUG_MODE) {
        ErrorHandler.log('trackRenderTime', new Error('Slow render detected'), `${functionName} took ${duration.toFixed(0)}ms`);
    }
}
function checkPerformance() {
    updateEntityCounts();
    const totalEntities = Object.values(performanceMetrics.entityCounts).reduce((a, b) => a + b, 0);
    const APP_CONFIG = window.APP_CONFIG;
    const ErrorHandler = window.ErrorHandler;
    // Warnung bei vielen Entities (>500 gesamt)
    if (totalEntities > 500 && APP_CONFIG.DEBUG_MODE) {
        ErrorHandler.log('checkPerformance', new Error('Large campaign detected'), `${totalEntities} total entities`);
        // Empfehlung für Virtual Scrolling
        if (totalEntities > 1000 && !window.performanceWarningShown) {
            showToast('⚠️ Große Kampagne erkannt. Performance könnte beeinträchtigt sein.', 'warning', 6000);
            window.performanceWarningShown = true;
        }
    }
    // Berechne durchschnittliche Render-Zeit
    if (performanceMetrics.renderTimes.length > 10) {
        const recentRenders = performanceMetrics.renderTimes.slice(-10);
        const avgTime = recentRenders.reduce((sum, r) => sum + r.duration, 0) / recentRenders.length;
        if (avgTime > 300 && APP_CONFIG.DEBUG_MODE) {
            ErrorHandler.log('checkPerformance', new Error('Slow average render time'), `${avgTime.toFixed(0)}ms average (should be <100ms)`);
        }
    }
}
function getPerformanceReport() {
    const report = {
        entities: performanceMetrics.entityCounts,
        totalEntities: Object.values(performanceMetrics.entityCounts).reduce((a, b) => a + b, 0),
        avgRenderTime: performanceMetrics.renderTimes.length > 0
            ? performanceMetrics.renderTimes.reduce((sum, r) => sum + r.duration, 0) / performanceMetrics.renderTimes.length
            : 0,
        slowestRenders: performanceMetrics.renderTimes
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5)
    };
    console.table(report.entities);
    console.log('Durchschnittliche Render-Zeit:', report.avgRenderTime.toFixed(2), 'ms');
    console.log('Langsamste Renders:', report.slowestRenders);
    return report;
}
// Expose für Console-Debugging
window.getPerformanceReport = getPerformanceReport;
// Export für Auto-Backup vor destruktiven Operationen
window.createAutoBackup = createAutoBackup;
// ============================================================
//# sourceMappingURL=backups.js.map