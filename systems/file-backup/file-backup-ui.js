// [SECTION:FILE_BACKUP_UI]
// Backup-Browser-Modal: Snapshot-Liste anzeigen und wiederherstellen
// Setup-Dialog, Status-Rendering, file://-Fallback
// Implementierung: Phase 2, Welle 2 (Plan 02-04)
//
// data-actions (selbst-registriert am Modulende):
//   setup-file-backup        — oeffnet Ordner-Auswahl (showFileBackupSetup)
//   open-file-backup-browser — oeffnet Backup-Browser-Modal
//   restore-file-backup      — stellt einen Snapshot wieder her (data-filename)
//   reconnect-file-backup    — verbindet Backup-Ordner neu (requestPermission)
//   download-file-backup     — laedt aktuelles Backup als JSON herunter (file://-Fallback)

// ============================================================
// Setup: Ordner-Auswahl (User-Geste erforderlich)
// ============================================================

/**
 * Oeffnet den nativen Ordner-Picker.
 * MUSS aus einem Klick-Handler aufgerufen werden (User-Geste fuer requestPermission).
 * Bei Erfolg: Handle in IDB speichern, Backup-Status aktualisieren.
 */
async function showFileBackupSetup() {
    if (typeof window.showDirectoryPicker !== 'function') {
        window.showToast('Datei-Backup nicht verfügbar — Browser unterstützt File System Access API nicht.', 'warning');
        return;
    }
    try {
        const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        if (!dirHandle) return;

        // In-Memory-Handle ZUERST setzen — das Backup muss in der laufenden
        // Sitzung auch dann funktionieren, wenn die IDB-Persistenz fehlschlägt (CR-03)
        window._fileBackupDirHandle = dirHandle;
        if (typeof window.setBackupStatus === 'function') {
            window.setBackupStatus('active');
        }
        renderBackupStatus();
        // WR-05: showToast escapet intern — esc() hier wäre Doppel-Escaping
        window.showToast('✅ Backup-Ordner eingerichtet: ' + dirHandle.name);

        // Handle in IDB persistieren (separat behandelt: Fehler hier pausiert
        // NICHT das Sitzungs-Backup, nur die Wiederherstellung nach Reload)
        if (typeof window.saveHandleToIDB === 'function') {
            try {
                await window.saveHandleToIDB(dirHandle);
            } catch (idbErr) {
                if (window.APP_CONFIG?.DEBUG_MODE) {
                    window.ErrorHandler?.log('showFileBackupSetup', idbErr, 'IDB-Persistenz fehlgeschlagen');
                }
                window.showToast('Backup aktiv — Ordner-Merken für den nächsten Start fehlgeschlagen.', 'warning');
            }
        }
    } catch (e) {
        // Nutzer hat Auswahl abgebrochen (AbortError) oder Fehler
        if (e?.name !== 'AbortError') {
            window.showToast('Backup-Ordner konnte nicht gewählt werden: ' + (e.message || ''), 'error');
        }
    }
}

// ============================================================
// Backup-Browser-Modal (D-14)
// ============================================================

/**
 * Zeigt das Backup-Browser-Modal mit allen datierten Snapshots
 * aus dem verbundenen Backup-Ordner.
 * Folgt showBackupsModal-Muster aus systems/backups.js.
 */
async function showFileBackupBrowser() {
    const dirHandle = typeof window !== 'undefined' ? window._fileBackupDirHandle : null;
    const showModal = window.showModal;

    let content = '';

    if (!dirHandle) {
        content = `<div class="backup-browser-empty">
            <div style="text-align:center; padding: 32px; color: var(--text-dim);">
                <div style="font-size: 2em; margin-bottom: 12px;">📁</div>
                <div>Kein Backup-Ordner verbunden.</div>
                <button class="btn btn-sm" style="margin-top: 12px;" data-action="setup-file-backup">Backup-Ordner wählen</button>
            </div>
        </div>`;
    } else {
        // WR-11: Nur Snapshots der AKTIVEN Kampagne listen — der Restore schreibt
        // bedingungslos in die aktive Kampagne; Snapshots fremder Kampagnen (oder
        // app-fremde JSON-Dateien) wuerden sie sonst still ueberschreiben.
        const activeNames = typeof window.getActiveBackupFilenames === 'function'
            ? window.getActiveBackupFilenames() : null;
        const snapshotRe = (activeNames && typeof window.getSnapshotRegex === 'function')
            ? window.getSnapshotRegex(activeNames.safeName)
            : null;

        const snapshots = [];
        try {
            for await (const [name, entry] of dirHandle.entries()) {
                // Zeige nur datierte Snapshots der aktiven Kampagne (nicht -aktuell.json)
                const matches = snapshotRe
                    ? snapshotRe.test(name)
                    : (name.endsWith('.json') && !name.endsWith('-aktuell.json'));
                if (matches) {
                    let size = '?';
                    try {
                        const file = await entry.getFile();
                        size = (file.size / 1024).toFixed(1) + ' KB';
                    } catch {
                        // Groesse nicht verfuegbar
                    }
                    snapshots.push({ name, size });
                }
            }
        } catch (e) {
            // Ordner nicht mehr zugaenglich
            if (typeof window.setBackupStatus === 'function') window.setBackupStatus('paused');
        }

        // Chronologisch sortieren (neueste zuerst)
        snapshots.sort((a, b) => b.name.localeCompare(a.name));

        if (snapshots.length === 0) {
            content = `<div class="backup-browser-empty" style="text-align:center; padding: 32px; color: var(--text-dim);">
                Keine Backup-Dateien der aktiven Kampagne im verbundenen Ordner gefunden.
            </div>`;
        } else {
            const tableHeader = `<div class="backup-entry backup-entry-header" style="font-weight:600; color: var(--text-dim); font-size: 0.85em;">
                <span>Kampagne / Datei</span>
                <span>Datum</span>
                <span>Größe</span>
                <span></span>
            </div>`;

            const rows = snapshots.map(({ name, size }) => {
                // Datum aus Dateiname extrahieren (YYYY-MM-DD Suffix)
                const dateMatch = name.match(/(\d{4}-\d{2}-\d{2})/);
                const dateStr = dateMatch ? dateMatch[1] : '';
                // Kampagnenname: Dateiname ohne Datum-Suffix
                const displayName = name.replace(/-\d{4}-\d{2}-\d{2}\.json$/, '').replace(/-/g, ' ');
                return `<div class="backup-entry">
                    <span class="backup-entry-name">${esc(displayName)}</span>
                    <span class="backup-entry-date" style="color: var(--text-dim);">${esc(dateStr)}</span>
                    <span class="backup-entry-size" style="color: var(--text-dim); font-size: 0.85em;">${esc(size)}</span>
                    <button class="btn btn-sm backup-entry-restore"
                        data-action="restore-file-backup"
                        data-filename="${esc(name)}"
                        style="color: var(--red); border-color: var(--red);">Wiederherstellen</button>
                </div>`;
            }).join('');
            content = tableHeader + rows;
        }
    }

    // Dynamisches Modal erstellen / aktualisieren (showBackupsModal-Muster)
    let modal = typeof document !== 'undefined' && document.getElementById('file-backup-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal-overlay backup-browser-modal';
        modal.id = 'file-backup-modal';
        modal.innerHTML = `
            <div class="modal" style="max-width: 600px;">
                <div class="modal-header">
                    <span class="modal-title">📁 Backup-Verlauf</span>
                    <button class="btn btn-sm" data-action="hide-modal" data-value="file-backup-modal">✕</button>
                </div>
                <div id="file-backup-list"></div>
                <div style="margin-top: 12px; font-size: 0.85em; color: var(--text-dim);">
                    Kampagne · Datum · Größe · Aktion
                </div>
            </div>
        `;
        modal.addEventListener('click', e => {
            if (e.target === modal && typeof window.hideModal === 'function') {
                window.hideModal('file-backup-modal');
            }
        });
        document.body.appendChild(modal);
    }

    const list = document.getElementById('file-backup-list');
    if (list) list.innerHTML = content;
    if (showModal) showModal('file-backup-modal');
}

// ============================================================
// Restore aus Datei-Backup (D-14)
// ============================================================

/**
 * Stellt einen Snapshot aus dem Backup-Ordner wieder her.
 * Sicherheitsmuster: confirm + saveUndoState DAVOR + JSON.parse + sanitize + Object.assign.
 * (Bestaetigung mit Strg+Z-Hinweis gemaess UI-SPEC Copywriting)
 *
 * @param {string} filename - Dateiname im Backup-Ordner
 */
async function restoreFromFileBackup(filename) {
    if (!filename) return;

    const dirHandle = typeof window !== 'undefined' ? window._fileBackupDirHandle : null;
    if (!dirHandle) {
        window.showToast('Kein Backup-Ordner verbunden.', 'error');
        return;
    }

    // WR-11: Der Restore schreibt in die AKTIVE Kampagne — nur Snapshots der
    // aktiven Kampagne zulassen (Defense-in-Depth zur Browser-Filterung)
    if (typeof window.getActiveBackupFilenames === 'function' &&
            typeof window.getSnapshotRegex === 'function') {
        const activeNames = window.getActiveBackupFilenames();
        if (!window.getSnapshotRegex(activeNames.safeName).test(filename)) {
            window.showToast('Dieser Snapshot gehört nicht zur aktiven Kampagne — Wiederherstellung abgebrochen.', 'error');
            return;
        }
    }

    // Datum aus Dateiname fuer Bestaetigungstext
    const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
    const dateStr = dateMatch ? dateMatch[1] : filename;
    const campaignDisplay = filename.replace(/-\d{4}-\d{2}-\d{2}\.json$/, '').replace(/-/g, ' ');

    // Bestaetigungsdialog (UI-SPEC: Strg+Z-Hinweis, rote Ueberschrift)
    // WR-05: confirm() zeigt Klartext — esc() würde sichtbare Entities erzeugen
    const confirmText = `${campaignDisplay} wird auf den Stand vom ${dateStr} zurückgesetzt.\n\nDieser Vorgang kann mit Strg+Z rückgängig gemacht werden.`;
    if (!confirm(confirmText)) return;

    try {
        // saveUndoState VOR allen Datenveraenderungen (CLAUDE.md: ALWAYS first)
        if (typeof window.saveUndoState === 'function') {
            window.saveUndoState('Backup wiederhergestellt');
        }

        // Datei lesen
        const fileHandle = await dirHandle.getFileHandle(filename, { create: false });
        const file = await fileHandle.getFile();
        const text = await file.text();

        // JSON parsen
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('Ungültiges Backup-Format');
        }

        // Struktur-Validierung: mindestens erwartete Arrays pruefen
        const requiredArrays = ['characters', 'npcs', 'quests', 'locations', 'loot'];
        for (const key of requiredArrays) {
            if (parsed[key] !== undefined && !Array.isArray(parsed[key])) {
                throw new Error(`Ungültiger Datentyp für ${key}`);
            }
        }

        // Sanity-Check initiative
        if (parsed.initiative && typeof parsed.initiative !== 'object') {
            throw new Error('Ungültige Initiative-Daten');
        }

        // WR-11: Versions-Migration wie im Import-Pfad (importFullExport → migrateData) —
        // extern editierbares JSON kann von einer aelteren App-Version stammen
        let restored = parsed;
        if (typeof window.migrateData === 'function') {
            restored = window.migrateData(restored);
        }

        // WR-11: Fehlende Kernfelder mit Defaults auffuellen (initializeData =
        // kanonisches D-Schema aus core/data.js) — ein unvollstaendiges JSON darf
        // kein kaputtes D (z.B. ohne initiative/settings) hinterlassen
        if (typeof window.initializeData === 'function') {
            const defaults = window.initializeData();
            for (const key of Object.keys(defaults)) {
                if (restored[key] === undefined) restored[key] = defaults[key];
            }
        }

        // Daten uebernehmen (analog restoreBackup aus systems/backups.js)
        const D = window.D;
        if (D) {
            // Soundboard-Audio stoppen — Web Audio überlebt sonst den Daten-Reset
            if (typeof window.stopAllTracks === 'function') window.stopAllTracks();
            for (const key in D) delete D[key];
            Object.assign(D, restored);
        }

        if (typeof window.renderAll === 'function') window.renderAll();
        if (typeof window.saveImmediate === 'function') window.saveImmediate();
        window.showToast('✅ Backup wiederhergestellt');

        // Modal schliessen
        if (typeof window.hideModal === 'function') window.hideModal('file-backup-modal');
    } catch (e) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            window.ErrorHandler?.log('restoreFromFileBackup', e, 'Restore fehlgeschlagen');
        }
        window.showToast('❌ Restore fehlgeschlagen: ' + (e.message || 'Unbekannter Fehler'), 'error');
    }
}

// ============================================================
// Status-Rendering in Einstellungen (D-17)
// ============================================================

/**
 * Rendert den Backup-Status-Bereich in den Einstellungen.
 * Liest aktuellen Status aus getBackupStatus().
 * Schaltet Header-Warnindikator gemaess Zustand.
 * Exakte Texte gemaess UI-SPEC Copywriting-Abschnitt.
 */
function renderBackupStatus() {
    if (typeof document === 'undefined' || !document.querySelector) return;

    const status = typeof window.getBackupStatus === 'function'
        ? window.getBackupStatus() : 'none';
    const lastTime = typeof window.getLastBackupTime === 'function'
        ? window.getLastBackupTime() : null;
    const dirHandle = window._fileBackupDirHandle;
    const folderName = dirHandle?.name || '';

    const isFileProtocol = typeof window !== 'undefined' &&
        window.location?.protocol === 'file:';

    // Header-Warnindikator IMMER aktualisieren — auch wenn der Einstellungs-
    // Bereich gerade nicht im DOM ist (CR-07: Befuellung darf nicht hinter
    // dem Section-Guard liegen, sonst bleibt die Pausiert-Warnung leer/unsichtbar)
    const indicator = document.querySelector('.backup-warning-indicator');
    if (indicator) {
        if (status === 'paused') {
            // Inhalt befuellen (plan: aktiviert via JS, nicht html-edit)
            if (!indicator.dataset.initialized) {
                indicator.dataset.initialized = '1';
                indicator.innerHTML = '⚠️ <span style="font-size:12px;color:var(--yellow);margin-left:2px;">Backup</span>';
                indicator.style.cursor = 'pointer';
                indicator.style.alignItems = 'center';
                indicator.style.gap = '2px';
                indicator.setAttribute('data-action', 'open-settings-backup');
            }
            indicator.style.display = 'flex';
            indicator.setAttribute('aria-hidden', 'false');
            indicator.title = 'Datei-Backup pausiert. Klicken zum Einstellungen öffnen.';
        } else {
            indicator.style.display = 'none';
            indicator.setAttribute('aria-hidden', 'true');
        }
    }

    // Einstellungs-Bereich (Daten-Tab): nur rendern wenn der Anker im DOM ist
    const section = document.querySelector('.backup-status-section');
    if (!section) return;

    // file://-Modus: Fallback anzeigen (D-18)
    if (isFileProtocol) {
        section.innerHTML = `
            <div class="file-backup-fallback">
                <div class="backup-status-label" style="color: var(--text-dim); font-size: 0.85em; margin-bottom: 8px;">
                    file://-Modus: Kein automatisches Backup möglich.
                </div>
                <button class="btn btn-sm" data-action="download-file-backup">
                    Backup jetzt herunterladen
                </button>
            </div>
        `;
        return;
    }

    let html = '';
    if (status === 'active' && lastTime) {
        const timeStr = lastTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        html = `
            <div class="backup-status-active">
                <span class="backup-status-dot backup-dot-active" style="background:var(--green)"></span>
                <span class="backup-status-text">Letztes Backup: ${esc(timeStr)} · Ordner: ${esc(folderName)}</span>
            </div>
            <div style="margin-top: 8px;">
                <button class="btn btn-sm" data-action="open-file-backup-browser">Backup-Verlauf anzeigen</button>
            </div>
        `;
    } else if (status === 'active') {
        html = `
            <div class="backup-status-active">
                <span class="backup-status-dot backup-dot-active" style="background:var(--green)"></span>
                <span class="backup-status-text">Backup-Ordner verbunden: ${esc(folderName)}</span>
            </div>
            <div style="margin-top: 8px;">
                <button class="btn btn-sm" data-action="open-file-backup-browser">Backup-Verlauf anzeigen</button>
            </div>
        `;
    } else if (status === 'paused') {
        html = `
            <div class="backup-status-paused">
                <span class="backup-status-dot backup-dot-paused" style="background:var(--yellow)"></span>
                <span class="backup-status-text">Datei-Backup pausiert — Ordner nicht mehr erreichbar</span>
            </div>
            <div style="margin-top: 8px;">
                <button class="btn btn-sm" data-action="reconnect-file-backup">Ordner wieder verbinden</button>
                <button class="btn btn-sm" style="margin-left:8px;" data-action="setup-file-backup">Anderen Ordner wählen</button>
            </div>
        `;
    } else {
        // Status 'none': noch nicht eingerichtet
        html = `
            <div class="backup-status-none">
                <span class="backup-status-text" style="color: var(--text-dim);">Kein automatisches Datei-Backup eingerichtet</span>
            </div>
            <div style="margin-top: 8px;">
                <button class="btn btn-sm" data-action="setup-file-backup">Backup-Ordner wählen</button>
            </div>
        `;
    }

    section.innerHTML = html;
}

// ============================================================
// file://-Download-Fallback (D-18)
// ============================================================

/**
 * Laedt das aktuelle Kampagnen-Backup als JSON-Datei herunter.
 * Fallback fuer den file://-Modus, in dem File System Access API nicht verfuegbar ist.
 */
function downloadFileBackup() {
    try {
        const D = window.D || {};
        const APP_CONFIG = window.APP_CONFIG || {};
        const campaignKey = window.STORAGE_KEY_OVERRIDE || APP_CONFIG.STORAGE_KEY || 'dnd-tracker-data';
        const data = typeof StorageAPI !== 'undefined'
            ? StorageAPI.getJSON(campaignKey, D)
            : D;

        const date = new Date().toISOString().slice(0, 10);
        const filename = `dnd-backup-${date}.json`;
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        window.showToast('✅ Backup heruntergeladen: ' + filename);
    } catch (e) {
        window.showToast('Backup konnte nicht heruntergeladen werden: ' + (e.message || ''), 'error');
    }
}

// ============================================================
// Ordner-Wiederverbindung (D-16)
// ============================================================

/**
 * Verbindet den Backup-Ordner wieder, wenn Permission verloren gegangen ist.
 * Laedt Handle aus IDB und ruft requestBackupFolderPermission in User-Geste auf.
 */
async function reconnectFileBackup() {
    if (typeof window.loadHandleFromIDB !== 'function') return;
    const handle = await window.loadHandleFromIDB();
    if (!handle) {
        window.showToast('Kein gespeicherter Backup-Ordner gefunden. Bitte neu einrichten.', 'warning');
        return;
    }
    if (typeof window.requestBackupFolderPermission !== 'function') return;
    const granted = await window.requestBackupFolderPermission(handle);
    if (granted) {
        window._fileBackupDirHandle = handle;
        if (typeof window.setBackupStatus === 'function') window.setBackupStatus('active');
        renderBackupStatus();
        window.showToast('✅ Backup-Ordner wieder verbunden: ' + handle.name);
    } else {
        window.showToast('Backup-Ordner — Zugriff verweigert. Bitte neu einrichten.', 'warning');
        if (typeof window.setBackupStatus === 'function') window.setBackupStatus('paused');
        renderBackupStatus();
    }
}

// ============================================================
// Registrierung der data-actions via EventDelegation
// ============================================================

/**
 * Registriert alle Datei-Backup-data-actions.
 * MUSS zur init()-Laufzeit aufgerufen werden (core/init.js), NICHT auf Modul-Ebene:
 * Im Bundle liegt `const EventDelegation` im selben Script-Scope weiter hinten —
 * ein Modul-Level-typeof wirft dort ReferenceError (TDZ) und killt die ganze App.
 * Im Loader-Modus wäre die Registrierung still übersprungen (Muster: initCommandPalette).
 */
function initFileBackupActions() {
    if (typeof EventDelegation === 'undefined') return;
    EventDelegation.registerActions({
        'setup-file-backup': () => window.showFileBackupSetup(),
        'open-file-backup-browser': () => window.showFileBackupBrowser(),
        'restore-file-backup': (ctx) => {
            // ctx ist das Delegation-Kontextobjekt { id, type, value, target, event }
            const filename = ctx?.target?.dataset?.filename;
            if (filename) window.restoreFromFileBackup(filename);
        },
        'reconnect-file-backup': () => window.reconnectFileBackup(),
        'download-file-backup': () => window.downloadFileBackup(),
        'open-settings-backup': () => {
            // Daten-Tab oeffnen (enthaelt den Einstellungen-/Backup-Bereich,
            // einen eigenen settings-Tab gibt es nicht — CR-07) und hinscrollen
            if (typeof window.switchView === 'function') window.switchView('data');
            setTimeout(() => {
                const section = document.querySelector('.backup-status-section');
                if (section) section.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    });
}

// ============================================================
// Exports
// ============================================================
window.showFileBackupSetup = showFileBackupSetup;
window.showFileBackupBrowser = showFileBackupBrowser;
window.restoreFromFileBackup = restoreFromFileBackup;
window.renderBackupStatus = renderBackupStatus;
window.downloadFileBackup = downloadFileBackup;
window.reconnectFileBackup = reconnectFileBackup;
window.initFileBackupActions = initFileBackupActions;
