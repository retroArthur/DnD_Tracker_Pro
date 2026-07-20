// [SECTION:FILE_BACKUP_MANAGER]
// Datei-Backup-Dienst: after-save-Hook, Snapshot-Erstellung und Pruning (max 10)
// Implementierung: Phase 2, Welle 2 (Plan 02-04)
//
// Verhaltensuebersicht:
//   - initFileBackup(): Haengt sich per Live-Sync-Muster in window.save() ein;
//     stellt zuvor gewaehlten Backup-Ordner aus IDB wieder her (D-16).
//   - Nach jedem save(): schreibt je Kampagne eine -aktuell.json (atomar);
//     erstellt pro Spieltag genau einen Snapshot; behalt max FILE_BACKUP_MAX_SNAPSHOTS.
//   - Stoerungsfall (D-16): einmalig "Ordner wieder verbinden?"-Toast, danach
//     stiller Pausiert-Status; weitere Fehler nur ins Event-Log.
//   - file://-Modus (D-18): kein Ordner-Handle; einmalig Erinnerungs-Toast.

// ============================================================
// Modul-Konstanten (CLAUDE.md: Module-Level Fallback-Pattern)
// ============================================================
const FILE_BACKUP_MAX_SNAPSHOTS = 10; // D-12
const FILE_BACKUP_DEBOUNCE_MS = window.APP_CONFIG?.FILE_BACKUP_DEBOUNCE_MS || 500;

// Einzel-Fehlerguard pro Sitzung (D-16)
let _fileBackupPausedNotified = false;
// file://-Erinnerungs-Toast max 1x/Sitzung (D-18)
let _fileBackupFallbackNotified = false;
// Aktueller Backup-Zustand: 'active' | 'paused' | 'none'
let _fileBackupStatus = 'none';
// Uhrzeit des letzten erfolgreichen Backups (fuer Status-Anzeige)
let _fileBackupLastTime = null;
// Debounce-Timer
let _fileBackupDebounceTimer = null;

// ============================================================
// Hilfsfunktionen: Dateiname-Konvention
// ============================================================

/**
 * Erzeugt sichere Dateinamen fuer Backup-Dateien einer Kampagne.
 * Path-Traversal-Schutz: Bereinigt Kampagnennamen auf Whitelist
 * [a-z0-9aeoeuess-] (lowercase). Kein '../', kein Slash, keine
 * Sonderzeichen ausser Umlauten und Bindestrich.
 *
 * @param {string} campaignKey  - Storage-Key der Kampagne
 * @param {string} campaignName - Anzeigename der Kampagne
 * @returns {{ current: string, snapshot: string }}
 */
function getBackupFilenames(campaignKey, campaignName) {
    // Whitelist-Bereinigung: nur a-z, 0-9, Umlaute (ae, oe, ue, ss), Bindestrich
    const safeName = (campaignName || campaignKey || 'kampagne')
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
        .replace(/Ä/g, 'ae').replace(/Ö/g, 'oe').replace(/Ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9-]/gi, '-')
        .toLowerCase()
        .replace(/-+/g, '-')  // Mehrfache Bindestriche zusammenfassen
        .replace(/^-+|-+$/g, ''); // Fuehrende/nachfolgende Bindestriche entfernen

    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    return {
        current: `${safeName}-aktuell.json`,
        snapshot: `${safeName}-${today}.json`,
        safeName
    };
}

// ============================================================
// Atomares Schreiben
// ============================================================

/**
 * Schreibt Daten atomar in eine Datei im gewaehlten Backup-Ordner.
 * Verwendet createWritable() -> write() -> close() fuer Atomizitaet.
 *
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {string} filename
 * @param {object} data  - JSON-serialisierbares Objekt
 * @returns {Promise<void>}
 */
async function writeBackupFile(dirHandle, filename, data) {
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
}

// ============================================================
// Backup-Logik: aktuell + Tages-Snapshot
// ============================================================

/**
 * Schreibt das Backup fuer eine Kampagne ins gewaehlte Verzeichnis:
 * 1. Immer: -aktuell.json (laufend ueberschrieben)
 * 2. Einmal pro Spieltag: datierter Snapshot (nur wenn noch keiner existiert)
 * 3. Danach: pruneOldSnapshots auf max FILE_BACKUP_MAX_SNAPSHOTS
 *
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {string} campaignKey
 * @param {string} campaignName
 * @param {object} data
 * @returns {Promise<void>}
 */
async function writeBackupForCampaign(dirHandle, campaignKey, campaignName, data) {
    const { current, snapshot, safeName } = getBackupFilenames(campaignKey, campaignName);

    // Immer: aktuelle Datei ueberschreiben (atomar)
    await writeBackupFile(dirHandle, current, data);

    // Nur wenn noch kein Snapshot fuer heute existiert: Snapshot schreiben (A2: erster Save des Tages)
    let snapshotExists = false;
    try {
        await dirHandle.getFileHandle(snapshot, { create: false });
        snapshotExists = true;
    } catch {
        snapshotExists = false;
    }

    if (!snapshotExists) {
        await writeBackupFile(dirHandle, snapshot, data);
        await pruneOldSnapshots(dirHandle, safeName);
    }
}

// ============================================================
// Snapshot-Pruning
// ============================================================

/**
 * Liefert den exakten Snapshot-Dateinamen-Regex fuer eine Kampagne:
 * ^{safeName}-YYYY-MM-DD.json$ — verankert, damit Kampagnen mit
 * Praefix-/Substring-Namen (z.B. "kampagne" vs. "kampagne-2") sich
 * NICHT gegenseitig matchen (CR-05).
 *
 * @param {string} safeName - Bereinigter Kampagnenname (aus getBackupFilenames)
 * @returns {RegExp}
 */
function getSnapshotRegex(safeName) {
    const escaped = String(safeName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('^' + escaped + '-\\d{4}-\\d{2}-\\d{2}\\.json$');
}

/**
 * Behaelt maximal MAX datierte Snapshots pro Kampagne;
 * loescht die aeltesten (alphabetisch/chronologisch) darueberhinaus.
 *
 * Erkennt Snapshot-Dateien ueber den verankerten Regex
 * ^{safeName}-YYYY-MM-DD.json$ — ein Substring-Match wuerde Snapshots
 * FREMDER Kampagnen mitzaehlen und zuerst loeschen (CR-05: Datenverlust).
 *
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {string} safeName  - Bereinigter Kampagnenname (aus getBackupFilenames)
 * @param {number} [MAX]     - Maximale Snapshot-Anzahl (default: FILE_BACKUP_MAX_SNAPSHOTS)
 * @returns {Promise<void>}
 */
async function pruneOldSnapshots(dirHandle, safeName, MAX) {
    const max = (MAX !== undefined && MAX !== null) ? MAX : FILE_BACKUP_MAX_SNAPSHOTS;
    const snapshotRe = getSnapshotRegex(safeName);
    const snapshots = [];

    // Alle Eintraege im Backup-Ordner durchsuchen
    for await (const [name] of dirHandle.entries()) {
        // Nur exakte Snapshot-Dateien DIESER Kampagne
        if (snapshotRe.test(name)) {
            snapshots.push(name);
        }
    }

    // Alphabetisch sortieren = chronologisch (da Dateiname YYYY-MM-DD enthaelt)
    snapshots.sort();

    // Aelteste loeschen bis max erreicht
    while (snapshots.length > max) {
        const oldest = snapshots.shift();
        await dirHandle.removeEntry(oldest);
    }
}

// ============================================================
// Status-Verwaltung
// ============================================================

/**
 * Setzt den aktuellen Backup-Status.
 * Steuert Header-Warnindikator und Einstellungs-Anzeige (D-17).
 * @param {'active'|'paused'|'none'} state
 */
function setBackupStatus(state) {
    _fileBackupStatus = state;

    // Header-Warnindikator aktualisieren (existiert bereits aus Plan 02-01)
    const indicator = typeof document !== 'undefined' && document.querySelector &&
        document.querySelector('.backup-warning-indicator');
    if (indicator) {
        if (state === 'paused') {
            indicator.style.display = 'flex';
            indicator.title = 'Datei-Backup pausiert. Klicken zum Einstellungen öffnen.';
        } else {
            indicator.style.display = 'none';
        }
    }

    // Status-Bereich in Einstellungen aktualisieren (falls sichtbar)
    if (typeof window !== 'undefined' && typeof window.renderBackupStatus === 'function') {
        window.renderBackupStatus();
    }
}

/**
 * Gibt den aktuellen Backup-Zustand zurueck.
 * @returns {'active'|'paused'|'none'}
 */
function getBackupStatus() {
    return _fileBackupStatus;
}

/**
 * Gibt den Zeitpunkt des letzten erfolgreichen Backups zurueck.
 * @returns {Date|null}
 */
function getLastBackupTime() {
    return _fileBackupLastTime;
}

// ============================================================
// After-Save-Hook: Backup ausloesen
// ============================================================

/**
 * Wird nach jedem save() aufgerufen.
 * Schreibt Backup fuer die aktive Kampagne; behandelt Fehler (D-16).
 * Im file://-Modus: einmalig Erinnerungs-Toast (D-18).
 */
function onAfterSave() {
    const isFileProtocol = typeof window !== 'undefined' &&
        window.location?.protocol === 'file:';

    // file://-Modus: kein Handle moeglich; max 1x/Sitzung Erinnerung (D-18)
    if (isFileProtocol) {
        if (!_fileBackupFallbackNotified) {
            _fileBackupFallbackNotified = true;
            if (typeof window.showToast === 'function') {
                window.showToast('Ungesicherte Änderungen — Backup herunterladen?', 'info');
            }
        }
        return;
    }

    const dirHandle = typeof window !== 'undefined' ? window._fileBackupDirHandle : null;
    if (!dirHandle || _fileBackupStatus === 'paused') return;

    // Debounced: verhindert Backup bei jedem winzigen save()
    if (_fileBackupDebounceTimer) clearTimeout(_fileBackupDebounceTimer);
    _fileBackupDebounceTimer = setTimeout(async () => {
        _fileBackupDebounceTimer = null;
        await _doBackup(dirHandle);
    }, FILE_BACKUP_DEBOUNCE_MS);
}

/**
 * Fuehrt das eigentliche Backup durch (Fehlerbehandlung D-16).
 * @param {FileSystemDirectoryHandle} dirHandle
 */
async function _doBackup(dirHandle) {
    try {
        // Aktive Kampagne ermitteln
        const campaignKey = (typeof window !== 'undefined' && window.APP_CONFIG?.STORAGE_KEY)
            ? (window.STORAGE_KEY_OVERRIDE || window.APP_CONFIG.STORAGE_KEY)
            : 'dnd-tracker-data';
        const campaignName = _getActiveCampaignName(campaignKey);

        // Kampagnendaten aus StorageAPI laden (D-13: je Kampagne einzeln)
        const data = typeof StorageAPI !== 'undefined'
            ? StorageAPI.getJSON(campaignKey, {})
            : (typeof window !== 'undefined' ? window.D || {} : {});

        await writeBackupForCampaign(dirHandle, campaignKey, campaignName, data);
        _fileBackupLastTime = new Date();
        setBackupStatus('active');
    } catch (e) {
        setBackupStatus('paused');

        // D-16: Einmalig "Ordner wieder verbinden?"-Toast pro Sitzung
        if (!_fileBackupPausedNotified) {
            _fileBackupPausedNotified = true;
            if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
                window.showToast(
                    '⚠️ Datei-Backup pausiert — Ordner wieder verbinden?',
                    'warning'
                );
            }
        } else {
            // Weitere Fehler nur ins Event-Log, kein Toast (D-16)
            if (typeof window !== 'undefined' && window.APP_CONFIG?.DEBUG_MODE) {
                window.ErrorHandler?.log('file-backup', e, 'Backup fehlgeschlagen (Fehler unterdrückt)');
            }
        }
    }
}

/**
 * Liefert die Backup-Dateinamen ({current, snapshot, safeName}) der AKTIVEN Kampagne.
 * Wird vom Backup-Browser (file-backup-ui.js) genutzt, um nur Snapshots der
 * aktiven Kampagne zu listen/wiederherzustellen (WR-11).
 * @returns {{ current: string, snapshot: string, safeName: string }}
 */
function getActiveBackupFilenames() {
    const campaignKey = (typeof window !== 'undefined' && window.APP_CONFIG?.STORAGE_KEY)
        ? (window.STORAGE_KEY_OVERRIDE || window.APP_CONFIG.STORAGE_KEY)
        : 'dnd-tracker-data';
    return getBackupFilenames(campaignKey, _getActiveCampaignName(campaignKey));
}

/**
 * Ermittelt den Anzeigenamen der aktiven Kampagne.
 * @param {string} campaignKey
 * @returns {string}
 */
function _getActiveCampaignName(campaignKey) {
    try {
        if (typeof window !== 'undefined' && typeof window.getCampaignIndex === 'function') {
            const index = window.getCampaignIndex();
            const campaign = index?.campaigns?.find(c => c.key === campaignKey);
            if (campaign?.name) return campaign.name;
        }
    } catch {
        // ignore
    }
    return campaignKey;
}

// ============================================================
// Initialisierung: Live-Sync-Hook (CLAUDE.md-Muster)
// ============================================================

/**
 * Initialisiert das Datei-Backup-System:
 * 1. Haengt sich einmalig in window.save() ein (Live-Sync-Pattern)
 * 2. Stellt vorhandenen Backup-Ordner aus IDB wieder her
 *
 * Wird aus core/init.js defensiv aufgerufen:
 *   if (typeof window.initFileBackup === 'function') window.initFileBackup();
 */
function initFileBackup() {
    // KEIN window.save-Monkey-Patch mehr (UAT 02): bare save()-Aufrufe binden im
    // Bundle an die globale const-Deklaration und umgehen jeden window.save-Wrapper —
    // der Hook feuerte daher nie bei Entity-CRUD (Party/NPC/Quest ...). Stattdessen
    // ruft persistence.js an jedem Persist-Erfolgspunkt explizit
    // window.onFileBackupAfterSave() auf (siehe _notifyFileBackup).

    // Zuvor gewaehlten Backup-Ordner aus IDB laden (falls verfuegbar)
    if (typeof window !== 'undefined' && typeof window.restoreBackupFolder === 'function') {
        window.restoreBackupFolder().then(handle => {
            if (handle) {
                window._fileBackupDirHandle = handle;
                setBackupStatus('active');
            } else {
                setBackupStatus('none');
            }
        }).catch(() => {
            setBackupStatus('none');
        });
    }
}

// ============================================================
// Exports
// ============================================================
window.initFileBackup = initFileBackup;
window.onFileBackupAfterSave = onAfterSave;
window.writeBackupForCampaign = writeBackupForCampaign;
window.getBackupFilenames = getBackupFilenames;
window.getActiveBackupFilenames = getActiveBackupFilenames;
window.getSnapshotRegex = getSnapshotRegex;
window.pruneOldSnapshots = pruneOldSnapshots;
window.setBackupStatus = setBackupStatus;
window.getBackupStatus = getBackupStatus;
window.getLastBackupTime = getLastBackupTime;
