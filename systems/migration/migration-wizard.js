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
 *
 * D-07 (Phase 12, Plan 04): konsultiert dieselbe Quellenkette wie
 * readCampaignDataForBackup() (file-backup-manager.js) — localStorage unter dem
 * TATSAECHLICH aktiven Key (STORAGE_KEY_OVERRIDE hat Vorrang), dann IndexedDB,
 * dann das laufende D-Objekt. Die alte Version pruefte NUR APP_CONFIG.STORAGE_KEY
 * und uebersah damit benannte Kampagnen (Override) sowie den IDB-only-Loeschpfad
 * (persistence.js:64-68) — denselben Codepfad, der DEBT-17 verursacht hat.
 *
 * NIEMALS `const readCampaignDataForBackup = window.readCampaignDataForBackup`
 * schreiben (CLAUDE.md, Dedup-Regel) — direkt ueber window.* aufrufen. Der Zugriff
 * ist bewusst laufzeitgebunden: file-backup-manager.js steht in loader.js hinter
 * migration-wizard.js, aber isFreshInstall() laeuft erst zur Init-Zeit, wenn alle
 * Module bereits geladen sind.
 *
 * Die Inhaltspruefung (characters+npcs+quests === 0) bleibt zwingend erhalten:
 * readCampaignDataForBackup() faellt als dritte Stufe auf das laufende window.D
 * zurueck, und ein frisch initialisiertes D hat bereits Schluessel — ohne diese
 * Pruefung waere jede Installation "nicht frisch" und der Wizard erschiene nie.
 *
 * @returns {Promise<boolean>}
 */
async function isFreshInstall() {
    const key = window.STORAGE_KEY_OVERRIDE || APP_CONFIG.STORAGE_KEY;
    const data = (typeof window.readCampaignDataForBackup === 'function')
        ? await window.readCampaignDataForBackup(key)
        : StorageAPI.getJSON(key, null);
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

    // Plan 12-02, Task 2b: Audio-Bereich ab Schritt 3 sichtbar und bleibt es auch
    // in Schritt 4 — die Audio-Datei kann laut D-02 auch nach dem Hauptimport noch
    // nachgereicht werden.
    const audioSection = modal.querySelector('#migration-wizard-audio-section');
    if (audioSection) {
        audioSection.style.display = (n >= 3) ? '' : 'none';
    }

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
                    Klicke in der ge&#246;ffneten Tracker-Datei auf <strong>Zum App-Umzug</strong>.
                    Der Haupt-Export wird sofort heruntergeladen. Enth&#228;lt deine Bibliothek
                    Soundboard-Dateien oder W&#252;rfelstatistik, erscheint dort anschlie&#223;end
                    ein eigener Button f&#252;r die <strong>zweite, separate Audio-Datei</strong>
                    &#8212; klicke ihn zus&#228;tzlich an, sonst wird sie nicht mit umgezogen.
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

            <!-- Plan 12-02, Task 2: zweiter, ausdruecklich optionaler Bereich fuer die
                 Audio-Datei. Bewusst AUSSERHALB der .migration-step-Container (siehe
                 showWizardStep(): sichtbar ab Schritt 3 UND bleibt es in Schritt 4 —
                 die Audio-Datei kann laut D-02 auch nach dem bereits erfolgreichen
                 Hauptimport noch nachgereicht werden, ohne dass der Wizard zurueckspringt). -->
            <div class="migration-audio-section" id="migration-wizard-audio-section" style="display:none; margin-top:20px;">
                <h4 class="migration-step-heading">Optional: Audio-Datei (die zweite Datei aus dem Umzugs-Export)</h4>
                <p class="migration-step-body">
                    Enth&#228;lt deine Soundboard-Dateien und W&#252;rfelstatistik. Der
                    Hauptimport funktioniert auch ohne sie &#8212; fehlende Audiodateien
                    werden danach namentlich angezeigt.
                </p>
                <div class="wizard-dropzone" id="migration-wizard-audio-dropzone" role="button" tabindex="0"
                     aria-label="Optionale Audio-Datei hier ablegen oder klicken zum Ausw&#228;hlen">
                    <div class="wizard-dropzone-hint">
                        <span class="wizard-dropzone-icon">&#127925;</span>
                        <span class="wizard-dropzone-text">Audio-Datei hier ablegen oder klicken zum Ausw&#228;hlen</span>
                    </div>
                </div>
                <input type="file" id="migration-wizard-audio-input" accept=".json" style="display:none;" aria-label="Audio-Datei ausw&#228;hlen">
                <div class="migration-step-body" id="migration-wizard-audio-status" style="display:none;" aria-live="polite"></div>
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
    if (dropzone && fileInput) {
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

    // Plan 12-02, Task 2c: zweite Zone fuer die optionale Audio-Datei, analog zur
    // ersten (dragover/dragleave/drop/click/keydown, gleiche .dragover-Klasse).
    const audioDropzone = document.getElementById('migration-wizard-audio-dropzone');
    const audioFileInput = document.getElementById('migration-wizard-audio-input');
    if (audioDropzone && audioFileInput) {
        audioDropzone.addEventListener('click', () => audioFileInput.click());
        audioDropzone.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); audioFileInput.click(); }
        });

        audioDropzone.addEventListener('dragover', e => {
            e.preventDefault();
            e.stopPropagation();
            audioDropzone.classList.add('dragover');
        });
        audioDropzone.addEventListener('dragleave', e => {
            e.preventDefault();
            audioDropzone.classList.remove('dragover');
        });
        audioDropzone.addEventListener('drop', e => {
            e.preventDefault();
            e.stopPropagation();
            audioDropzone.classList.remove('dragover');
            const file = e.dataTransfer?.files?.[0];
            if (file) _processWizardAudioFile(file, audioDropzone);
        });

        audioFileInput.addEventListener('change', e => {
            const file = e.target?.files?.[0];
            if (file) _processWizardAudioFile(file, audioDropzone);
        });
    }
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
    // WR-05: showError setzt textContent — hier echte UTF-8-Literale, KEINE
    // HTML-Entities und KEIN esc() (würden wörtlich angezeigt)
    if (file.size > 20 * 1024 * 1024) {
        showError('Die Datei konnte nicht gelesen werden — bitte eine gültige Tracker-Exportdatei wählen.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async evt => {
        try {
            const parsedObj = JSON.parse(evt.target?.result);

            // Plan 12-02, Task 2e: Weiche auf Audio-Export-Verarbeitung — VOR der
            // full-v1-Pruefung. Wer die zweite Datei versehentlich in die erste
            // Zone zieht, soll nicht mit "kein full-v1-Export" abgelehnt werden.
            if (parsedObj && parsedObj._exportType === 'audio-export-v1') {
                clearError();
                _processWizardAudioFile(file, dropzone);
                return;
            }

            // Vorpruefung fuer den Bestaetigungsdialog (Vollvalidierung in importFullExport)
            if (!parsedObj || parsedObj._exportType !== 'full-v1') {
                throw new Error('Ungueltige Datei — kein full-v1-Export');
            }

            // CR-11: Bestand schuetzen — der Import ueberschreibt ALLE Kampagnen-Keys
            // plus Kampagnen-Index. saveUndoState deckt nur die AKTIVE Kampagne ab;
            // alle anderen Kampagnen waeren ohne Rueckfrage unwiederbringlich weg.
            const indexCampaigns = typeof window.getCampaignIndex === 'function'
                ? (window.getCampaignIndex()?.campaigns || [])
                : [];
            const hasExistingData = !(await isFreshInstall()) || indexCampaigns.length > 0;
            if (hasExistingData) {
                const importCount = parsedObj.campaigns && typeof parsedObj.campaigns === 'object'
                    ? Object.keys(parsedObj.campaigns).length
                    : 0;
                const confirmMsg = 'Achtung: Der Import ersetzt die vorhandenen Kampagnen dieser App durch '
                    + importCount + ' Kampagne(n) aus der Datei.\n\n'
                    + 'Nur die aktive Kampagne kann danach mit Strg+Z zurückgeholt werden — '
                    + 'alle anderen Kampagnen werden überschrieben.\n\nFortfahren?';
                if (!confirm(confirmMsg)) {
                    showError('Import abgebrochen — es wurden keine Daten geändert.');
                    return;
                }
            }

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

            // Dateiname in Dropzone anzeigen — textContent ist XSS-sicher,
            // esc() würde hier sichtbare Entities erzeugen (WR-05)
            dropzone.classList.add('file-ready');
            if (filenameEl) {
                filenameEl.textContent = file.name;
                filenameEl.style.display = '';
            }

            // Schritt 4: Erfolgsbestaetigung
            const resultEl = document.getElementById('migration-wizard-result');
            if (resultEl) {
                const sizeKB = (result.totalBytes / 1024).toFixed(1);
                let html = `
                    <div class="migration-success-line">Kampagnen importiert: <strong>${result.campaignCount}</strong></div>
                    <div class="migration-success-line">Gesamtgr&#246;&#223;e: <strong>${esc(sizeKB)} KB</strong></div>
                `;

                // D-02/D-08: fehlende Audio-Dateien NAMENTLICH benennen, statt still
                // zu uebergehen — der Hauptimport hat gerade schon erfolgreich
                // abgeschlossen und wird durch dieses Ergebnis in keinem Fall
                // beeinflusst. window.D ist an dieser Stelle noch die STALE
                // Vor-Import-Instanz (Reload passiert erst bei wizard-close/
                // wizard-setup-backup, CR-04) — deshalb gegen die frisch geparste
                // aktive Kampagne aus parsedObj pruefen, nicht gegen window.D.
                if (typeof window.findMissingSceneAudio === 'function') {
                    const activeKey = parsedObj._activeCampaignKey;
                    const activeCampaignData = activeKey && parsedObj.campaigns && parsedObj.campaigns[activeKey]
                        ? parsedObj.campaigns[activeKey].data
                        : null;
                    if (activeCampaignData) {
                        const existingIds = (typeof window.listSoundBlobs === 'function')
                            ? (await window.listSoundBlobs()).map(m => m.id)
                            : [];
                        const missing = window.findMissingSceneAudio(activeCampaignData, existingIds);
                        if (missing.length > 0) {
                            html += `
                                <div class="migration-success-line migration-audio-missing">
                                    F&#252;r diese Szenen fehlt Audio: <strong>${esc(missing.map(m => m.sceneName).join(', '))}</strong>
                                </div>
                            `;
                        }
                    }
                }

                resultEl.innerHTML = html;
            }
            showWizardStep(4);

        } catch (err) {
            const msg = err.message || 'Unbekannter Fehler';
            showError('Import fehlgeschlagen: ' + msg + '. Bitte erneut versuchen oder Überspringen wählen.');
        }
    };
    reader.onerror = () => {
        showError('Die Datei konnte nicht gelesen werden — bitte eine gültige Tracker-Exportdatei wählen.');
    };
    reader.readAsText(file);
}

/**
 * Plan 12-02, Task 2d: Audio-Export-Datei lesen, validieren und importieren.
 * D-02: rein optional, blockiert den Hauptimport zu KEINEM Zeitpunkt — Fehler
 * werden benannt, nie geworfen. Eigenes Groessenlimit (T-12-05), unabhaengig vom
 * 20-MB-Limit der Haupt-Datei.
 */
function _processWizardAudioFile(file, dropzone) {
    const statusEl = document.getElementById('migration-wizard-audio-status');

    function showStatus(msg, isError) {
        if (statusEl) {
            statusEl.textContent = msg;
            statusEl.style.display = '';
            statusEl.classList.toggle('migration-step-error', !!isError);
        }
        if (isError) dropzone.classList.remove('file-ready');
    }

    // T-12-05: Groessenpruefung VOR FileReader.readAsText() — oberhalb der V8-
    // Zeichengrenze scheitert bereits das Einlesen, ein abgebrochener Lesevorgang
    // liefert keine brauchbare Fehlermeldung mehr. Das 20-MB-Limit der Haupt-Datei
    // bleibt unveraendert und gilt weiterhin nur fuer sie.
    const AUDIO_IMPORT_MAX_BYTES = 350 * 1024 * 1024;
    if (file.size > AUDIO_IMPORT_MAX_BYTES) {
        showStatus('Die Audio-Datei ist zu groß und konnte nicht gelesen werden.', true);
        return;
    }

    const reader = new FileReader();
    reader.onload = async evt => {
        let parsedObj;
        try {
            parsedObj = JSON.parse(evt.target?.result);
        } catch (err) {
            showStatus('Audio-Datei konnte nicht gelesen werden: ungültiges Format.', true);
            return;
        }

        try {
            const importFn = typeof importAudioExport === 'function'
                ? importAudioExport
                : window.importAudioExport;
            if (typeof importFn !== 'function') {
                throw new Error('Audio-Import-Funktion nicht verfügbar');
            }

            const result = await importFn(parsedObj);
            dropzone.classList.add('file-ready');

            // WR-05: textContent statt innerHTML/esc() — hier echte UTF-8-Literale
            let msg = 'Audio importiert: ' + result.imported + ' Datei(en).';
            if (result.skipped && result.skipped.length > 0) {
                msg += ' Übersprungen: ' + result.skipped.length + ' (' +
                    result.skipped.map(s => (s.name || s.id) + ': ' + s.grund).join('; ') + ').';
            }

            // D-02/D-08: verbleibende Luecken NACH diesem Import namentlich anzeigen.
            if (typeof window.findMissingSceneAudio === 'function' &&
                    typeof window.listSoundBlobs === 'function') {
                const metas = await window.listSoundBlobs();
                const existingIds = metas.map(m => m.id);
                const missing = window.findMissingSceneAudio(window.D, existingIds);
                if (missing.length > 0) {
                    msg += ' Für diese Szenen fehlt weiterhin Audio: ' +
                        missing.map(m => m.sceneName).join(', ') + '.';
                }
            }

            showStatus(msg, false);
        } catch (err) {
            showStatus('Audio-Import fehlgeschlagen: ' + (err.message || 'Unbekannter Fehler'), true);
        }
    };
    reader.onerror = () => {
        showStatus('Die Audio-Datei konnte nicht gelesen werden.', true);
    };
    reader.readAsText(file);
}

/**
 * Wizard-Aktionen (next/skip/close/setup-backup) einrichten.
 * Verwendet data-action delegation; Direktregistrierung fuer interne Logik.
 */
function _setupWizardActions(modal) {
    // WR-02: Listener-Guard — das Modal-Element wird beim Wiederoeffnen
    // wiederverwendet (innerHTML-Austausch). Ohne Guard haengt jedes
    // showMigrationWizard() einen WEITEREN Click-Listener an dasselbe Element
    // und jede Aktion feuert N-fach (wizard-next-step springt mehrere Schritte).
    if (modal.dataset.actionsBound) return;
    modal.dataset.actionsBound = '1';
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
    // Tatsaechliche Hoehe messen (kann durch Zeilenumbruch bei schmalen Viewports
    // groesser als das CSS min-height:48px sein) statt einen festen Wert anzunehmen.
    document.documentElement.style.setProperty(
        '--migration-hint-height',
        banner.offsetHeight + 'px'
    );
    document.body.classList.add('has-migration-hint');

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
        <span class="divergence-banner-audio-slot" id="migration-divergence-audio-slot"></span>
        <button class="btn btn-text divergence-banner-dismiss" data-action="dismiss-divergence-banner">Nicht mehr anzeigen</button>
    `;

    document.body.insertBefore(banner, document.body.firstChild);

    // Checkpoint-Fix (Weg B): startMigrationFlow() loest den Audio-Download NICHT
    // mehr automatisch aus (Chrome gated den zweiten automatischen Download einer
    // Nutzergeste hinter der "Automatische Downloads"-Berechtigung, besonders
    // restriktiv unter file://) — stattdessen wird hier asynchron ein Button mit
    // einer Vorschau nachgeladen, dessen Klick seine EIGENE Nutzergeste liefert.
    _renderAudioDownloadButton();
}

/**
 * Laedt asynchron die Audio-Bibliotheks-Vorschau (getAudioExportSummary()) und
 * fuellt damit den leeren Slot im Divergenz-Banner mit einem Download-Button.
 * Leere Bibliothek (kein Audio, keine Wuerfelstatistik) -> kein Button (D-01/
 * Task-1-Verhalten aus 12-01: eine leere zweite Datei wuerde nur verwirren).
 * Ein Fehler beim Ermitteln der Vorschau darf den Banner nicht kaputt machen
 * (D-02-Prinzip) — der Slot bleibt dann einfach leer.
 */
async function _renderAudioDownloadButton() {
    const slot = document.getElementById('migration-divergence-audio-slot');
    if (!slot) return;

    try {
        const summary = (typeof window.getAudioExportSummary === 'function')
            ? await window.getAudioExportSummary()
            : { hasContent: false };
        if (!summary.hasContent) return;

        const teile = [];
        if (summary.fileCount > 0) {
            const mb = (summary.totalBytes / (1024 * 1024)).toFixed(1);
            teile.push(summary.fileCount + (summary.fileCount === 1 ? ' Audiodatei' : ' Audiodateien') + ' (' + mb + ' MB)');
        }
        if (summary.diceStatsCount > 0) {
            teile.push(summary.diceStatsCount + (summary.diceStatsCount === 1 ? ' Würfelwurf' : ' Würfelwürfe'));
        }
        const beschreibung = teile.join(', ');

        slot.innerHTML = `
            <button class="btn btn-text divergence-banner-audio" data-action="download-audio-export">
                Audio-Datei herunterladen (${esc(beschreibung)})
            </button>
        `;
    } catch (err) {
        if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.DEBUG_MODE && window.ErrorHandler) {
            window.ErrorHandler.log('_renderAudioDownloadButton', err, 'Audio-Vorschau fehlgeschlagen');
        }
    }
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

        // Checkpoint-Fix (Weg B, ersetzt den urspruenglichen Plan 12-02-Task-1-
        // Ansatz): KEIN automatischer zweiter Download mehr. Manuell gemessen
        // (Chrome, file://): der erste Download aus einer Nutzergeste geht durch,
        // jeder weitere aus DERSELBEN Geste wird von Chromes "Automatische
        // Downloads"-Berechtigung stillschweigend verworfen — a.click() wirft
        // dabei NICHT, der Erfolgs-Toast wuerde also luegen. Das ist Browser-
        // Richtlinie, kein Code-Defekt, und laesst sich nicht per setTimeout o.ae.
        // umgehen. Die Audio-Datei bekommt stattdessen einen eigenen Button im
        // Divergenz-Banner (showDivergenceBanner() -> _renderAudioDownloadButton()),
        // dessen Klick seine EIGENE Nutzergeste liefert.
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
        // KEIN esc() am Aufrufer — showDivergenceBanner escapet intern (IN-05: Doppel-Escaping)
        showDivergenceBanner(dateStr);
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
 *
 * D-07 (Phase 12, Plan 04): async wegen await isFreshInstall(). core/init.js:149 ruft
 * diese Funktion per typeof-Guard OHNE Ergebnisauswertung auf ("fire and forget") —
 * das bleibt unveraendert korrekt, da hier kein Rueckgabewert erwartet wird.
 */
async function initMigrationWizardIfNeeded() {
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
    if (!(await isFreshInstall())) return; // Daten vorhanden: kein Wizard noetig
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
        document.body.classList.remove('has-migration-hint');
    });
    EventDelegation.registerAction('dismiss-divergence-banner', function() {
        StorageAPI.setJSON('migration-divergence-dismissed', { dismissed: true });
        const banner = document.getElementById('migration-divergence-banner');
        if (banner) banner.remove();
    });
    // Checkpoint-Fix (Weg B): expliziter Button im Divergenz-Banner statt
    // automatischem zweitem Download — ein echter Klick liefert die eigene
    // Nutzergeste, die Chrome fuer jeden Download nach dem ersten verlangt.
    EventDelegation.registerAction('download-audio-export', function() {
        if (typeof window.downloadAudioExport === 'function') {
            window.downloadAudioExport();
        }
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
