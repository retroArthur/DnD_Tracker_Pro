// [SECTION:FILE_BACKUP_MANAGER]
// Datei-Backup-Dienst: after-save-Hook, Snapshot-Erstellung und Pruning (max 10)
// Implementierung: Phase 2, Welle 2 (Plan 02-04)
//
// Verhaltensuebersicht:
//   - initFileBackup(): Haengt sich per Live-Sync-Muster in window.save() ein;
//     stellt zuvor gewaehlten Backup-Ordner aus IDB wieder her (D-16).
//   - Nach jedem save(): iteriert ueber ALLE Kampagnen des Index (Standard-Kampagne
//     + getCampaignIndex(), D-03) und schreibt je Kampagne eine -aktuell.json (atomar);
//     erstellt pro Spieltag genau einen Snapshot; behaelt max FILE_BACKUP_MAX_SNAPSHOTS
//     PRO KAMPAGNE. Ein Fehler oder eine unlesbare Kampagne kostet nur diese eine
//     Kampagne — die uebrigen werden trotzdem gesichert (kein throw in der Schleife).
//   - Namenskollisionen zweier Kampagnen bekommen ein Kollisions-Suffix (D-04);
//     ohne Kollision bleibt der Dateiname unveraendert wie bisher.
//   - Stoerungsfall (D-16): einmalig "Ordner wieder verbinden?"-Toast, danach
//     stiller Pausiert-Status (nur wenn KEINE einzige Kampagne geschrieben werden
//     konnte); weitere Fehler nur ins Event-Log.
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
 * Whitelist-Bereinigung fuer Dateinamensbestandteile: nur a-z, 0-9,
 * Umlaute (ae, oe, ue, ss), Bindestrich. Kein '../', kein Slash, keine
 * sonstigen Sonderzeichen. Wird sowohl fuer Kampagnennamen als auch fuer
 * das Kollisions-Suffix (T-12-08) benutzt — beide sind Dateinamensbestandteile
 * und muessen denselben Path-Traversal-Schutz durchlaufen.
 *
 * @param {string} str
 * @returns {string}
 */
function _sanitizeForFilename(str) {
    return String(str || '')
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
        .replace(/Ä/g, 'ae').replace(/Ö/g, 'oe').replace(/Ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9-]/gi, '-')
        .toLowerCase()
        .replace(/-+/g, '-')  // Mehrfache Bindestriche zusammenfassen
        .replace(/^-+|-+$/g, ''); // Fuehrende/nachfolgende Bindestriche entfernen
}

/**
 * Erzeugt sichere Dateinamen fuer Backup-Dateien einer Kampagne.
 * Path-Traversal-Schutz: siehe _sanitizeForFilename().
 *
 * @param {string} campaignKey  - Storage-Key der Kampagne
 * @param {string} campaignName - Anzeigename der Kampagne
 * @param {string} [suffix]     - Optionales Kollisions-Suffix (D-04); nur gesetzt,
 *                                wenn resolveBackupTargets() eine echte Namenskollision
 *                                erkannt hat. Ohne Suffix bleibt das Verhalten exakt wie
 *                                bisher — vorhandene Backup-Dateien laufen nahtlos weiter.
 * @returns {{ current: string, snapshot: string, safeName: string }}
 */
function getBackupFilenames(campaignKey, campaignName, suffix) {
    let safeName = _sanitizeForFilename(campaignName || campaignKey || 'kampagne');

    if (suffix) {
        const safeSuffix = _sanitizeForFilename(suffix);
        if (safeSuffix) {
            safeName = safeName ? `${safeName}-${safeSuffix}` : safeSuffix;
        }
    }

    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    return {
        current: `${safeName}-aktuell.json`,
        snapshot: `${safeName}-${today}.json`,
        safeName
    };
}

/**
 * Leitet aus einem Kampagnen-Key ein kurzes, dateinamentaugliches
 * Kollisions-Suffix ab (D-04): die Epoch-Ziffernfolge aus
 * `dnd-campaign-<epoch>`, oder das Wort "standard" aus einem
 * `dnd-tracker`-Key. Das Ergebnis durchlaeuft danach dieselbe
 * Whitelist wie der Kampagnenname (T-12-08).
 *
 * @param {string} campaignKey
 * @returns {string}
 */
function _sanitizeKeySuffix(campaignKey) {
    let raw = campaignKey || '';
    const campaignMatch = /^dnd-campaign-(\d+)$/.exec(raw);
    if (campaignMatch) {
        raw = campaignMatch[1];
    } else if (/^dnd-tracker/.test(raw)) {
        raw = 'standard';
    }
    return _sanitizeForFilename(raw);
}

/**
 * Ermittelt alle zu sichernden Kampagnen (Standard-Kampagne + Index) und
 * berechnet je Kampagne die endgueltigen Backup-Dateinamen (D-03/D-04).
 *
 * Der Kampagnen-Key wird dem Dateinamen NUR bei einer echten Kollision des
 * bereinigten Namens (safeName) angehaengt — ohne Kollision bleibt der
 * Dateiname exakt wie bisher, damit vorhandene Snapshot-Historien nicht
 * abreissen. Ein leerer safeName (rein nicht-lateinischer Name) kollidiert
 * per Definition mit jedem anderen leeren und bekommt das Suffix deshalb
 * immer, auch als einzige Kampagne (D-04).
 *
 * @param {{ campaigns?: Array<{key: string, name: string}> }|null} campaignIndex
 * @param {string} storageKey - Storage-Key der Standard-Kampagne
 * @returns {Array<{ key: string, name: string, filenames: { current: string, snapshot: string, safeName: string } }>}
 */
function resolveBackupTargets(campaignIndex, storageKey) {
    const seen = new Set();
    const targets = [];

    // Standard-Kampagne immer einschliessen (dieselbe Vorsichtsmassnahme wie
    // buildFullExport(), full-export.js:57-64) — sie kann zusaetzlich im Index stehen.
    targets.push({ key: storageKey, name: 'Standard-Kampagne' });
    seen.add(storageKey);

    const campaigns = (campaignIndex && Array.isArray(campaignIndex.campaigns))
        ? campaignIndex.campaigns : [];
    for (const c of campaigns) {
        if (!c || !c.key || seen.has(c.key)) continue;
        seen.add(c.key);
        targets.push({ key: c.key, name: c.name || c.key });
    }

    // Map<safeName, key[]> zur Kollisionserkennung
    const bySafeName = new Map();
    for (const t of targets) {
        const { safeName } = getBackupFilenames(t.key, t.name);
        t._safeName = safeName;
        if (!bySafeName.has(safeName)) bySafeName.set(safeName, []);
        bySafeName.get(safeName).push(t.key);
    }

    return targets.map(t => {
        const collides = bySafeName.get(t._safeName).length > 1 || t._safeName === '';
        const suffix = collides ? _sanitizeKeySuffix(t.key) : '';
        return {
            key: t.key,
            name: t.name,
            filenames: getBackupFilenames(t.key, t.name, suffix)
        };
    });
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
 * @param {{ current: string, snapshot: string, safeName: string }} [filenames]
 *   Vorberechnete Dateinamen (aus resolveBackupTargets()); ersetzt die interne
 *   getBackupFilenames()-Berechnung, wenn gesetzt. Notwendig, damit ein
 *   Kollisions-Suffix (D-04) konsistent in current/snapshot/safeName landet —
 *   sonst wuerde pruneOldSnapshots() mit dem falschen, unsuffixierten safeName
 *   die Snapshots der kollidierenden Nachbarkampagne mitzaehlen (D-03).
 * @returns {Promise<void>}
 */
async function writeBackupForCampaign(dirHandle, campaignKey, campaignName, data, filenames) {
    const { current, snapshot, safeName } = filenames || getBackupFilenames(campaignKey, campaignName);

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
/**
 * Ermittelt die zu sichernden Kampagnendaten (DEBT-17).
 *
 * localStorage ist der Normalfall und die schnelle Quelle. Ab >5MB wechselt
 * `saveImmediate()` aber in den IndexedDB-Modus und LOESCHT den localStorage-Key
 * nach bestaetigtem IDB-Write (`systems/spellslots/persistence.js:64-68`).
 * Wer dann weiter nur aus localStorage liest, sichert eine leere Kampagne —
 * und `pruneOldSnapshots()` raeumt darueber die letzten echten Snapshots weg.
 *
 * Reihenfolge: localStorage -> IndexedDB -> laufendes D-Objekt NUR fuer die
 * AKTIVE Kampagne (CR-02, Plan 12-10). Seit D-03 (Plan 12-03) ruft _doBackup()
 * diese Funktion fuer JEDE Kampagne des Index einzeln auf — ein Rueckfall, der
 * seinen eigenen campaignKey-Parameter ignoriert, wuerde die Daten der aktiven
 * Kampagne faelschlich in die Backup-Datei einer anderen, nie gespeicherten
 * Kampagne schreiben. Ein leeres Objekt gilt in keiner Stufe als gueltige
 * Kampagne.
 *
 * @param {string} campaignKey
 * @returns {Promise<Object|null>} Daten, oder null wenn keine Quelle etwas liefert
 */
async function readCampaignDataForBackup(campaignKey) {
    const istBefuellt = obj => obj && typeof obj === 'object' && Object.keys(obj).length > 0;

    // 1. localStorage (Normalfall <5MB)
    if (typeof StorageAPI !== 'undefined') {
        const ausLs = StorageAPI.getJSON(campaignKey, null);
        if (istBefuellt(ausLs)) return ausLs;
    }

    // 2. IndexedDB (IDB-Modus: der LS-Key wurde nach dem Write geloescht)
    const idbRead = typeof window !== 'undefined' ? window.loadFromIndexedDBFallbackRaw : null;
    if (typeof idbRead === 'function') {
        try {
            const record = await idbRead(campaignKey);
            if (record && record.data) {
                const geparst = JSON.parse(record.data);
                if (istBefuellt(geparst)) return geparst;
            }
        } catch (e) {
            if (window.APP_CONFIG?.DEBUG_MODE) {
                window.ErrorHandler?.log('readCampaignDataForBackup', e, 'IDB-Lesen fehlgeschlagen');
            }
        }
    }

    // 3. Letzter Ausweg: der laufende Zustand im Speicher — NUR fuer die
    // AKTIVE Kampagne (CR-02). Dieselbe Aufloesung wie in _doBackup() (:415-417);
    // kein ermittelbarer aktiver Key (kein window, kein APP_CONFIG) -> Stufe 3
    // greift nicht — lieber kein Backup als eines mit fremden Daten.
    const aktiverBackupKey = (typeof window !== 'undefined' && window.APP_CONFIG?.STORAGE_KEY)
        ? (window.STORAGE_KEY_OVERRIDE || window.APP_CONFIG.STORAGE_KEY)
        : null;
    if (aktiverBackupKey && campaignKey === aktiverBackupKey && istBefuellt(window.D)) {
        return window.D;
    }

    return null;
}

async function _doBackup(dirHandle) {
    // Speicher-Key der Standard-Kampagne (wie bisher: Override hat Vorrang)
    const storageKey = (typeof window !== 'undefined' && window.APP_CONFIG?.STORAGE_KEY)
        ? (window.STORAGE_KEY_OVERRIDE || window.APP_CONFIG.STORAGE_KEY)
        : 'dnd-tracker-data';

    // D-03: alle Kampagnen sichern, nicht nur die aktive. Dem Index darf hier
    // uneingeschraenkt vertraut werden — saveCampaignIndex() (campaign-manager.js:17-19)
    // ruft StorageAPI.setJSON() direkt auf und umgeht save()/saveImmediate() vollstaendig,
    // durchlaeuft also nie die 5-MB-Pruefung, die DEBT-17 verursacht hat.
    const campaignIndex = (typeof window !== 'undefined' && typeof window.getCampaignIndex === 'function')
        ? window.getCampaignIndex()
        : null;
    const targets = resolveBackupTargets(campaignIndex, storageKey);

    let anySucceeded = false;

    for (const target of targets) {
        try {
            // Kampagnendaten laden — DEBT-17-Schutz gilt jetzt JE KAMPAGNE
            // (frueher nur einmal fuer die aktive Kampagne).
            const data = await readCampaignDataForBackup(target.key);

            // DEBT-17: NIEMALS eine leere Kampagne schreiben. writeBackupForCampaign
            // wuerde -aktuell.json leeren und den Tages-Snapshot ueberschreiben,
            // woraufhin pruneOldSnapshots() die letzten echten Snapshots DIESER
            // Kampagne entfernt — bei weiterhin gruener Statusanzeige. Lieber diese
            // eine Kampagne ueberspringen als ein leeres Backup, das die guten verdraengt.
            if (!data) {
                if (typeof window !== 'undefined' && window.APP_CONFIG?.DEBUG_MODE) {
                    window.ErrorHandler?.log('file-backup', null,
                        `Keine Daten fuer Kampagne "${target.name}" (${target.key}) lesbar — uebersprungen (DEBT-17)`);
                }
                continue;
            }

            await writeBackupForCampaign(dirHandle, target.key, target.name, data, target.filenames);
            anySucceeded = true;
        } catch (e) {
            // T-12-10: ein Fehler bei EINER Kampagne darf die uebrigen nicht verhindern —
            // sonst waere das derselbe Fehler wie DEBT-17, nur eine Ebene hoeher. Kein
            // Toast pro Kampagne (Toast-Spam am Spieltisch); nur ins Event-Log.
            if (typeof window !== 'undefined' && window.APP_CONFIG?.DEBUG_MODE) {
                window.ErrorHandler?.log('file-backup', e,
                    `Backup fuer Kampagne "${target.name}" (${target.key}) fehlgeschlagen`);
            }
        }
    }

    if (anySucceeded) {
        _fileBackupLastTime = new Date();
        setBackupStatus('active');
        return;
    }

    // Keine einzige Kampagne konnte gesichert werden (oder der Ordner-Handle
    // selbst versagt hat) -> Gesamtstatus pausiert.
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
            window.ErrorHandler?.log('file-backup', null, 'Backup fehlgeschlagen (Fehler unterdrückt)');
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
    // KEIN window.save-Monkey-Patch (UAT 02): bare save()-Aufrufe binden im Bundle
    // an die globale const-Deklaration und umgehen jeden window.save-Wrapper.
    // Stattdessen: Registrierung am generischen Post-Save-Hook-Punkt der Persistenz —
    // feuert an jedem Persist-Erfolgspunkt NACH dem tatsächlichen Write.
    if (typeof window.registerPostSaveHook === 'function') {
        window.registerPostSaveHook(onAfterSave);
    }

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
window.writeBackupForCampaign = writeBackupForCampaign;
window.getBackupFilenames = getBackupFilenames;
window.resolveBackupTargets = resolveBackupTargets;
window.getActiveBackupFilenames = getActiveBackupFilenames;
window.getSnapshotRegex = getSnapshotRegex;
window.pruneOldSnapshots = pruneOldSnapshots;
window.readCampaignDataForBackup = readCampaignDataForBackup;
window.setBackupStatus = setBackupStatus;
window.getBackupStatus = getBackupStatus;
window.getLastBackupTime = getLastBackupTime;
window._doBackup = _doBackup;
