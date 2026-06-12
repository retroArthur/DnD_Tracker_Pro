// [SECTION:MIGRATION_WIZARD]
// ============================================================
// Migrations-Wizard (D-09): Gefuehrter PWA-Erststart-Wizard mit Drag&Drop-Import
// file://-Umzugs-Flow (D-10) + Divergenz-Banner (D-11)
// Implementierung: Phase 2, Plan 03
// Analogien: features/loot-distribution.js (Dynamic Modal), systems/backups.js (saveUndoState)
//            systems/spellslots/import-export.js (FileReader/Drag&Drop)
// ============================================================

// ============================================================
// CONSTANTS
// ============================================================

// GitHub Pages URL fuer den file://-Umzugs-Flow
// PLATZHALTER: URL nach erstem Deploy in Chrome DevTools -> Application -> Manifest pruefen.
// Erwartet: https://retroarthur.github.io/DnD_Tracker_Pro/dnd-tracker-optimized.html
// (Annahme A1 aus RESEARCH.md — manuell verifizieren nach Plan 02-02 Deploy)
const MIGRATION_PWA_URL = 'https://retroarthur.github.io/DnD_Tracker_Pro/dnd-tracker-optimized.html';

// Wizard-Schrittnummer (Modulglobal fuer showWizardStep)
let _wizardStep = 1;

// ============================================================
// HILFSFUNKTIONEN
// ============================================================

/**
 * Prueft ob der Speicher leer ist (Erststart-Erkennung).
 * Analog: PATTERNS.md isFreshInstall-Muster
 */
function isFreshInstall() {
    const data = StorageAPI.getJSON(APP_CONFIG.STORAGE_KEY, null);
    if (!data) return true;
    const hasContent = (data.characters?.length || 0) + (data.npcs?.length || 0) + (data.quests?.length || 0);
    return hasContent === 0;
}

/**
 * Schaltet zwischen Wizard-Schritten um (display none/'').
 * Aktualisiert Schritte-Indikator (active/done-Klassen).
 */
function showWizardStep(n) {
    _wizardStep = n;
    const modal = document.getElementById('migration-wizard-modal');
    if (!modal) return;

    // Schritt-Inhalte: nur aktuellen anzeigen
    modal.querySelectorAll('.migration-step').forEach(el => {
        el.style.display = el.dataset.step === String(n) ? '' : 'none';
    });

    // Schritte-Indikator aktualisieren
    modal.querySelectorAll('.wizard-step').forEach((dot, idx) => {
        const stepNum = idx + 1;
        dot.classList.remove('active', 'done');
        if (stepNum === n) dot.classList.add('active');
        else if (stepNum < n) dot.classList.add('done');
    });
}

// ============================================================
// PWA-MIGRATIONS-WIZARD (D-09)
// ============================================================

/**
 * Zeigt den Migrations-Wizard.
 * KEINEN isFreshInstall-/shown-Guard — der Guard liegt in initMigrationWizardIfNeeded.
 * showMigrationWizard() ist auch fuer den manuellen Wiederaufruf via data-action gedacht (D-09).
 */
function showMigrationWizard() {
    _wizardStep = 1;

    const stepsIndicator = `
        <div class="wizard-steps" aria-label="Fortschritt">
            <div class="wizard-step active" aria-label="Schritt 1"></div>
            <div class="wizard-step" aria-label="Schritt 2"></div>
            <div class="wizard-step" aria-label="Schritt 3"></div>
            <div class="wizard-step" aria-label="Schritt 4"></div>
        </div>
    `;

    const content = `
        <div class="migration-wizard">
            <div class="migration-wizard-header">
                <h2 class="migration-wizard-title">Willkommen in der D&amp;D Tracker App</h2>
                ${stepsIndicator}
            </div>

            <div class="migration-step migration-step--active" data-step="1">
                <h3 class="migration-step-heading">Schritt 1: Bisherige Tracker-Datei &#246;ffnen</h3>
                <p class="migration-step-body">
                    Falls du bereits mit der bisherigen file://-Version des Trackers gespielt hast,
                    kannst du deine Daten verlustfrei hierherbringen.<br>
                    &#214;ffne dazu zuerst die alte Tracker-Datei in deinem Browser.
                </p>
                <div class="migration-step-actions">
                    <button class="btn btn-primary migration-btn-next" data-action="wizard-next-step">Datei ausw&#228;hlen</button>
                </div>
            </div>

            <div class="migration-step" data-step="2" style="display:none;">
                <h3 class="migration-step-heading">Schritt 2: Umzugs-Export erstellen</h3>
                <p class="migration-step-body">
                    Klicke in der ge&#246;ffneten Tracker-Datei auf
                    <strong>Einstellungen &rarr; Zur installierbaren App umziehen</strong>,
                    um einen Umzugs-Export zu erstellen und herunterzuladen.
                </p>
                <div class="migration-step-actions">
                    <button class="btn btn-primary migration-btn-next" data-action="wizard-next-step">Umzugs-Export erstellen</button>
                </div>
            </div>

            <div class="migration-step" data-step="3" style="display:none;">
                <h3 class="migration-step-heading">Schritt 3: Export-Datei hierher ziehen</h3>
                <p class="migration-step-body">Ziehe die heruntergeladene Export-Datei in den Bereich unten:</p>
                <div class="wizard-dropzone" id="migration-wizard-dropzone" role="button" tabindex="0"
                     aria-label="Datei hier ablegen oder klicken zum Ausw&#228;hlen">
                    <div class="wizard-dropzone-hint">
                        <span class="wizard-dropzone-icon">&#128230;</span>
                        <span class="wizard-dropzone-text">Datei hier ablegen oder klicken zum Ausw&#228;hlen</span>
                    </div>
                    <div class="wizard-dropzone-filename" id="migration-wizard-filename" style="display:none;"></div>
                </div>
                <input type="file" id="migration-wizard-file-input" accept=".json" style="display:none;" aria-label="Datei ausw&#228;hlen">
                <div class="migration-step-error" id="migration-wizard-error" style="display:none;" aria-live="polite"></div>
            </div>

            <div class="migration-step" data-step="4" style="display:none;">
                <div class="migration-success">
                    <div class="migration-success-icon" aria-hidden="true">&#10003;</div>
                    <h3 class="migration-step-heading">Umzug erfolgreich!</h3>
                    <div id="migration-wizard-result" class="migration-success-meta"></div>
                    <div class="migration-step-actions">
                        <button class="btn btn-primary" id="migration-wizard-done-btn" data-action="wizard-close">App jetzt nutzen</button>
                        <button class="btn" data-action="wizard-setup-backup">Automatische Backups einrichten</button>
                    </div>
                </div>
            </div>

            <div class="migration-wizard-footer">
                <button class="btn btn-text migration-skip-btn" data-action="wizard-skip">
                    &#220;berspringen &#8212; ich starte neu
                </button>
            </div>
        </div>
    `;

    // create-or-update Muster (Analog: loot-distribution.js)
    let modal = document.getElementById('migration-wizard-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'migration-wizard-modal';
        modal.className = 'migration-wizard-overlay';
        modal.innerHTML = content;
        document.body.appendChild(modal);
    } else {
        modal.innerHTML = content;
    }

    // Drag&Drop und FileReader einrichten
    _setupWizardDragDrop(modal);

    // Wizard-Aktionen registrieren
    _setupWizardActions(modal);

    // Wizard anzeigen
    modal.style.display = 'flex';
    showWizardStep(1);
}

/**
 * Drag&Drop-Zone und Datei-Input einrichten.
 * Analog: systems/spellslots/import-export.js FileReader/Drag&Drop (L257-336)
 */
function _setupWizardDragDrop(modal) {
    const dropzone = document.getElementById('migration-wizard-dropzone');
    const fileInput = document.getElementById('migration-wizard-file-input');
    if (!dropzone || !fileInput) return;

    // Klick auf Dropzone: file input triggern
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
    });

    // Drag&Drop Events
    dropzone.addEventListener('dragover', e => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', e => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
    });
    dropzone.addEventListener('drop', e => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
        const file = e.dataTransfer?.files?.[0];
        if (file) _processWizardFile(file, dropzone);
    });

    // Datei-Input change (Alternativ-Button)
    fileInput.addEventListener('change', e => {
        const file = e.target?.files?.[0];
        if (file) _processWizardFile(file, dropzone);
    });
}

/**
 * Datei lesen, validieren und importieren.
 * T-02-08: JSON.parse in try/catch + _exportType-Pruefung
 */
function _processWizardFile(file, dropzone) {
    const errorEl = document.getElementById('migration-wizard-error');
    const filenameEl = document.getElementById('migration-wizard-filename');

    function showError(msg) {
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.style.display = '';
        }
        dropzone.classList.remove('file-ready');
    }
    function clearError() {
        if (errorEl) errorEl.style.display = 'none';
    }

    clearError();

    // Groessenlimit: 20MB
    if (file.size > 20 * 1024 * 1024) {
        showError('Die Datei konnte nicht gelesen werden — bitte eine g&#252;ltige Tracker-Exportdatei w&#228;hlen.');
        return;
    }

    const reader = new FileReader();
    reader.onload = evt => {
        try {
            const parsedObj = JSON.parse(evt.target?.result);

            // T-02-11: saveUndoState vor dem Import (kein stiller Datenverlust)
            if (typeof saveUndoState === 'function') {
                saveUndoState('Migration importiert');
            } else if (typeof window.saveUndoState === 'function') {
                window.saveUndoState('Migration importiert');
            }

            // importFullExport aufrufen (full-export.js, T-02-08)
            const importFn = typeof importFullExport === 'function'
                ? importFullExport
                : window.importFullExport;
            if (typeof importFn !== 'function') {
                throw new Error('Import-Funktion nicht verfuegbar');
            }

            const result = importFn(parsedObj);

            // Dateiname in Dropzone anzeigen (T-02-10: esc() fuer XSS)
            dropzone.classList.add('file-ready');
            if (filenameEl) {
                filenameEl.textContent = esc(file.name);
                filenameEl.style.display = '';
            }

            // Schritt 4: Erfolgsbestaetigung
            const resultEl = document.getElementById('migration-wizard-result');
            if (resultEl) {
                const sizeKB = (result.totalBytes / 1024).toFixed(1);
                resultEl.innerHTML = `
                    <div class="migration-success-line">Kampagnen importiert: <strong>${result.campaignCount}</strong></div>
                    <div class="migration-success-line">Gesamtgr&#246;&#223;e: <strong>${esc(sizeKB)} KB</strong></div>
                `;
            }
            showWizardStep(4);

        } catch (err) {
            const msg = err.message || 'Unbekannter Fehler';
            showError('Import fehlgeschlagen: ' + esc(msg) + '. Bitte erneut versuchen oder &#220;berspringen w&#228;hlen.');
        }
    };
    reader.onerror = () => {
        showError('Die Datei konnte nicht gelesen werden — bitte eine g&#252;ltige Tracker-Exportdatei w&#228;hlen.');
    };
    reader.readAsText(file);
}

/**
 * Wizard-Aktionen (next/skip/close/setup-backup) einrichten.
 * Verwendet data-action delegation; Direktregistrierung fuer interne Logik.
 */
function _setupWizardActions(modal) {
    // inline-click-Handler fuer Aktionen die nur im Wizard-Kontext relevant sind
    modal.addEventListener('click', e => {
        const action = e.target?.dataset?.action || e.target?.closest('[data-action]')?.dataset?.action;
        if (!action) return;

        if (action === 'wizard-next-step') {
            showWizardStep(_wizardStep + 1);
        } else if (action === 'wizard-skip') {
            // shown-Flag setzen, Wizard schliessen
            StorageAPI.setJSON('migration-wizard-shown', { shown: true, skipped: true });
            _closeWizard();
        } else if (action === 'wizard-close') {
            // shown-Flag setzen (erfolgreich abgeschlossen)
            StorageAPI.setJSON('migration-wizard-shown', { shown: true, completed: true });
            // App neu laden, damit die importierten Daten geladen werden.
            // KEIN renderAll()/save() auf dem stale In-Memory-D — save() würde
            // die frisch importierte Aktiv-Kampagne mit dem leeren D überschreiben (CR-04).
            window.location.reload();
        } else if (action === 'wizard-setup-backup') {
            StorageAPI.setJSON('migration-wizard-shown', { shown: true, completed: true });
            // Backup-Setup-Absicht für nach dem Reload merken (Ordner-Picker braucht
            // ohnehin eine frische User-Geste — nach Reload wird der Daten-Tab mit
            // dem Backup-Bereich geöffnet, siehe initMigrationWizardIfNeeded)
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('migration-backup-setup-pending', '1');
            }
            // Reload aus demselben Grund wie wizard-close: stale D darf den Import
            // nicht per Autosave überschreiben (CR-04)
            window.location.reload();
        }
    });
}

function _closeWizard() {
    const modal = document.getElementById('migration-wizard-modal');
    if (modal) modal.style.display = 'none';
}

// ============================================================
// FILE://-UMZUGS-FLOW (D-10) + DIVERGENZ-BANNER (D-11)
// ============================================================

/**
 * Einmaliger Umzugs-Hinweis (D-10) als feste Leiste (Komponente 4).
 * Einmal-pro-Sitzung via sessionStorage-Guard (Spieltisch-Regel).
 */
function showMigrationHintBanner() {
    // Guard: nur einmal pro Sitzung anzeigen (D-10)
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('migration-hint-shown')) {
        return;
    }

    // Bestehende Banner entfernen
    const existing = document.getElementById('migration-hint-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'migration-hint-banner';
    banner.className = 'migration-hint-banner';
    banner.setAttribute('role', 'banner');
    banner.innerHTML = `
        <span class="migration-hint-text">
            Die D&amp;D Tracker App ist jetzt als installierbare Web-App verf&#252;gbar &#8212;
            Daten k&#246;nnen verlustfrei umgezogen werden.
        </span>
        <button class="btn btn-text migration-hint-link" data-action="start-migration-flow">Zum App-Umzug</button>
        <button class="btn btn-icon migration-hint-close" aria-label="Hinweis schlie&#223;en" data-action="close-migration-hint">&#x2715;</button>
    `;

    document.body.insertBefore(banner, document.body.firstChild);

    // Sitzungs-Flag setzen
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('migration-hint-shown', '1');
    }
}

/**
 * Divergenz-Banner (D-11): dauerhaft sichtbar nach Umzug, bis explizit abgeschaltet.
 * @param {string} dateStr - Umzugs-Datum als lesbarer String
 */
function showDivergenceBanner(dateStr) {
    // Bestehende Banner entfernen
    const existing = document.getElementById('migration-divergence-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'migration-divergence-banner';
    banner.className = 'divergence-banner';
    banner.setAttribute('role', 'status');
    // T-02-10: esc() fuer {Datum}-Platzhalter (XSS)
    banner.innerHTML = `
        <span class="divergence-banner-text">
            Diese Daten wurden am <strong>${esc(dateStr)}</strong> in die App umgezogen
            &#8212; &#196;nderungen hier kommen dort nicht an.
        </span>
        <button class="btn btn-text divergence-banner-dismiss" data-action="dismiss-divergence-banner">Nicht mehr anzeigen</button>
    `;

    document.body.insertBefore(banner, document.body.firstChild);
}

/**
 * Umzugs-Flow starten (D-10): Voll-Export erstellen, PWA-URL oeffnen, Divergenz merken.
 */
function startMigrationFlow() {
    try {
        // Voll-Export herunterladen (full-export.js)
        const downloadFn = typeof downloadFullExport === 'function'
            ? downloadFullExport
            : window.downloadFullExport;
        if (typeof downloadFn === 'function') {
            downloadFn();
        }
    } catch (err) {
        if (APP_CONFIG.DEBUG_MODE) {
            ErrorHandler.log('startMigrationFlow', err, 'Export fehlgeschlagen');
        }
        showToast('Export fehlgeschlagen: ' + (err.message || 'Fehler'), 'error');
        return;
    }

    // Umzugs-Zeitpunkt persistieren (fuer D-11)
    const isoDate = new Date().toISOString();
    StorageAPI.setJSON('migration-divergence-since', { date: isoDate });

    // PWA-URL oeffnen (PLATZHALTER — A1 RESEARCH.md)
    try {
        window.open(MIGRATION_PWA_URL, '_blank', 'noopener,noreferrer');
    } catch (err) {
        // Fallback: Link anzeigen statt oeffnen
        showToast('Bitte oeffne: ' + MIGRATION_PWA_URL, 'info');
    }

    // Divergenz-Banner einblenden
    const dateStr = new Date().toLocaleDateString('de-DE');
    showDivergenceBanner(dateStr);

    // Hinweis-Banner ausblenden (Umzug wurde gestartet)
    const hintBanner = document.getElementById('migration-hint-banner');
    if (hintBanner) hintBanner.remove();
}

/**
 * file://-Seite des Migrations-Flows (D-10 + D-11).
 * Wird von initMigrationWizardIfNeeded bei protocol==='file:' aufgerufen.
 */
function startMigrationFileSide() {
    // D-11 zuerst: Falls bereits umgezogen und Banner noch nicht abgeschaltet
    const divergenceSince = StorageAPI.getJSON('migration-divergence-since', null);
    const divergenceDismissed = StorageAPI.has('migration-divergence-dismissed');

    if (divergenceSince && !divergenceDismissed) {
        const dateStr = divergenceSince.date
            ? new Date(divergenceSince.date).toLocaleDateString('de-DE')
            : divergenceSince.date || '';
        showDivergenceBanner(esc(dateStr));
    }

    // D-10: Einmaliger Umzugs-Hinweis (nur wenn noch nicht umgezogen)
    if (!divergenceSince) {
        showMigrationHintBanner();
    }
}

// ============================================================
// INIT — Protokoll-Verzweigung (PATTERNS.md verbatim)
// ============================================================

/**
 * Einstiegspunkt aus core/init.js (defensiver Aufruf).
 * Verzweigt: file:// -> startMigrationFileSide(); http/https -> PWA-Erststart-Wizard.
 */
function initMigrationWizardIfNeeded() {
    if (window.location.protocol === 'file:') {
        // file://-Modus: KEIN Erststart-Wizard, aber aktiver Umzugs-Flow (D-10) + Divergenz-Banner (D-11)
        startMigrationFileSide();
        return;
    }
    // Nach Wizard-Abschluss mit "Automatische Backups einrichten" (CR-04):
    // Reload hat die importierten Daten geladen — jetzt Backup-Setup anbieten.
    if (typeof sessionStorage !== 'undefined' &&
            sessionStorage.getItem('migration-backup-setup-pending')) {
        sessionStorage.removeItem('migration-backup-setup-pending');
        setTimeout(() => {
            if (typeof window.switchView === 'function') window.switchView('data');
            if (typeof window.showToast === 'function') {
                window.showToast('Umzug abgeschlossen — Backup-Ordner jetzt unter Einstellungen wählen.', 'info', 6000);
            }
            const section = document.querySelector('.backup-status-section');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        }, 500);
        return;
    }
    // PWA (http/https): gefuehrter Erststart-Wizard
    if (StorageAPI.has('migration-wizard-shown')) return; // bereits gesehen
    if (!isFreshInstall()) return; // Daten vorhanden: kein Wizard noetig
    // Kleiner Delay: App muss erst fertig laden
    setTimeout(showMigrationWizard, 500);
}

// ============================================================
// BANNER-ACTIONS via EventDelegation
// ============================================================

/**
 * Registriert die Migrations-data-actions.
 * MUSS zur init()-Laufzeit aufgerufen werden (core/init.js), NICHT auf Modul-Ebene:
 * Im Bundle liegt `const EventDelegation` im selben Script-Scope weiter hinten —
 * ein Modul-Level-typeof wirft dort ReferenceError (TDZ) und killt die ganze App.
 * Im Loader-Modus wäre die Registrierung still übersprungen (Muster: initCommandPalette).
 *
 * D-09: reopen-migration-wizard ruft showMigrationWizard DIREKT auf (ohne Guards)
 * Damit ist der Wizard auch bei vorhandenen Daten erneut aufrufbar.
 */
function initMigrationActions() {
    if (typeof EventDelegation === 'undefined') return;
    EventDelegation.registerAction('reopen-migration-wizard', function() {
        if (typeof window.showMigrationWizard === 'function') {
            window.showMigrationWizard();
        }
    });
    EventDelegation.registerAction('start-migration-flow', function() {
        if (typeof window.startMigrationFlow === 'function') {
            window.startMigrationFlow();
        }
    });
    EventDelegation.registerAction('close-migration-hint', function() {
        const banner = document.getElementById('migration-hint-banner');
        if (banner) banner.remove();
    });
    EventDelegation.registerAction('dismiss-divergence-banner', function() {
        StorageAPI.setJSON('migration-divergence-dismissed', { dismissed: true });
        const banner = document.getElementById('migration-divergence-banner');
        if (banner) banner.remove();
    });
}

// ============================================================
// EXPORTS
// ============================================================
window.isFreshInstall = isFreshInstall;
window.initMigrationActions = initMigrationActions;
window.showMigrationWizard = showMigrationWizard;
window.showWizardStep = showWizardStep;
window.initMigrationWizardIfNeeded = initMigrationWizardIfNeeded;
window.startMigrationFileSide = startMigrationFileSide;
window.startMigrationFlow = startMigrationFlow;
window.showDivergenceBanner = showDivergenceBanner;
window.showMigrationHintBanner = showMigrationHintBanner;
