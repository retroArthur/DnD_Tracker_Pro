// [SECTION:SYSTEM_ACTIONS]
// ============================================================
// SYSTEM ACTIONS - @undo @redo @export @import @backup
// ============================================================

// ------------------------------------------------------------
// Editor-Werkzeugleiste: Aufklapp-Menues (Variante 2a)
// ------------------------------------------------------------
// Seit 2a koennen Marker- und Bausteine-Auswahl ein Menue-BUTTON sein
// (data-value) statt eines Selects (.value). Die schwebende Leiste nutzt
// weiterhin Selects, deshalb muessen beide Formen bedient werden.
function readEditorControlValue(target) {
    if (!target) return '';
    if (target.tagName === 'SELECT') return target.value || '';
    return target.dataset?.value || '';
}

// Ein Select wird nach Anwendung auf den Platzhalter zurueckgesetzt; ein
// Button hat keinen selectedIndex und darf davon nicht werfen.
function resetEditorControl(target) {
    if (target && target.tagName === 'SELECT') target.selectedIndex = 0;
}

function closeAllEditorMenus() {
    document.querySelectorAll('.editor-toolbar .tb-menu').forEach(menu => {
        menu.hidden = true;
    });
    document.querySelectorAll('.editor-toolbar [data-tb-menu]').forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
    });
}

window.closeAllEditorMenus = closeAllEditorMenus;

const SystemActions = {
    // Undo/Redo
    undo: () => undo(),
    redo: () => redo(),

    // Export/Import
    'export-data': ctx => exportData(ctx.value),
    'export-json': ctx => exportData(ctx.value),
    'export-csv': ctx => exportToCSV(ctx.value),
    'execute-import': ctx => executeImport(ctx.value),

    // Backup
    'restore-backup': ctx => {
        restoreBackup(ctx.id);
        hideModal('backups-modal');
    },

    // Timer actions
    'toggle-timer': ctx => toggleTimer(ctx.id),
    'reset-timer': ctx => resetTimer(ctx.id),
    'delete-timer': ctx => deleteTimer(ctx.id),
    'focus-timer': ctx => focusTimer(ctx.id),
    'quick-timer': ctx => quickTimer(parseInt(ctx.value)),
    'edit-timer-preset': ctx => editTimerPreset(ctx.id),
    'delete-timer-preset': ctx => deleteTimerPreset(ctx.id),
    'add-preset-timer': ctx => {
        const duration = parseInt(ctx.target.dataset.duration) || 0;
        addPresetTimer(ctx.value, duration);
    },

    // Editor actions
    'format-text': ctx => {
        const cmd = ctx.target.dataset.cmd || ctx.value;
        const editorId = ctx.target.dataset.editor;
        formatText(cmd, editorId);
    },
    // W-17: wirkt auf die Auswahl, ohne Auswahl auf die ganze Flaeche.
    // Bausteine und Vorlesetext-Kaesten bleiben stehen.
    'clear-formatting': ctx => clearEditorFormattingInScope(ctx.value),
    // Harter Reset — nur noch Text. Braucht eine Rueckfrage, weil er auch
    // Tabellen und Bausteine mitnimmt.
    'clear-formatting-hard': ctx => {
        const editorId = ctx.target.dataset.editor;
        closeAllEditorMenus();
        if (!confirm('Wirklich ALLES entkleiden? Tabellen und Bausteine gehen dabei verloren.'))
            return;
        if (typeof saveUndoState === 'function') saveUndoState('Editor entkleidet');
        clearEditorFormatting(editorId);
    },
    'set-editor-font': ctx => {
        const editorId = ctx.target.dataset.editor;
        const font = ctx.target.value || ctx.target.dataset.value || ctx.value;
        setEditorFont(editorId, font);
    },
    'set-editor-font-size': ctx => {
        const editorId = ctx.target.dataset.editor;
        const size = ctx.target.value || ctx.target.dataset.value || ctx.value;
        setEditorFontSize(editorId, size);
    },
    'set-border-format': ctx => {
        const editorId = ctx.target.dataset.editor;
        const style = ctx.target.dataset.value || ctx.value;
        setBorderFormat(editorId, style);
    },
    'set-read-aloud': ctx => {
        const editorId = ctx.target.dataset.editor;
        setReadAloudFormat(editorId);
    },
    // Oeffnet/schliesst ein an seinem Button verankertes Menue. Die Selektion
    // im Editor wurde bereits beim mousedown gesichert (saveEditorSelection()
    // in rich-text-toolbars.js), weil der Klick den Fokus aus dem
    // contenteditable nimmt.
    'toggle-editor-menu': ctx => {
        const menuId = ctx.target.dataset.value;
        const menu = menuId ? $(menuId) : null;
        if (!menu) return;
        const wasHidden = menu.hidden;
        closeAllEditorMenus();
        if (wasHidden) {
            menu.hidden = false;
            ctx.target.setAttribute('aria-expanded', 'true');
        }
    },

    // Werkzeug-Blase an/aus. Vorgabe ist AN — der Schalter blendet sie aus.
    // Zustand ueberlebt den Neustart, faellt aber bei blockiertem Speicher
    // still auf "an" zurueck.
    'toggle-editor-bubble': () => {
        let enabled = true;
        try {
            enabled = localStorage.getItem('dnd-editor-bubble') !== '0';
        } catch {
            enabled = true;
        }
        const next = !enabled;
        try {
            localStorage.setItem('dnd-editor-bubble', next ? '1' : '0');
        } catch {
            // Speicher nicht verfuegbar: Zustand gilt nur fuer diese Sitzung.
        }
        window.editorBubbleEnabled = next;
        if (!next && typeof window.hideFloatingToolbar === 'function') {
            window.hideFloatingToolbar();
        }
        showToast(next ? '💬 Werkzeug-Blase an' : '💬 Werkzeug-Blase aus');
        closeAllEditorMenus();
    },

    // Baustein einfuegen (Statblock, Wuerfeltabelle, Trenner). Vorlesetext
    // laeuft weiterhin ueber set-read-aloud-style, weil er eine AUSWAHL
    // umschliesst statt einen leeren Block einzusetzen.
    'insert-block': ctx => {
        const editorId = ctx.target.dataset.editor;
        const kind = ctx.target.dataset.value;
        const editor = $(editorId);
        const builders = window.EDITOR_BLOCK_BUILDERS || {};
        if (!editor || !builders[kind]) {
            closeAllEditorMenus();
            return;
        }
        // Destruktiv genug fuer einen Undo-Punkt: der Block veraendert die
        // Struktur des Inhalts, nicht nur seine Auszeichnung.
        if (typeof saveUndoState === 'function') saveUndoState('Baustein eingefuegt');
        insertBlockNodeAtSelection(editor, builders[kind]());
        closeAllEditorMenus();
    },

    'set-read-aloud-style': ctx => {
        const editorId = ctx.target.dataset.editor;
        // Seit Variante 2a kann das Ziel ein Menue-Button (dataset.value) ODER
        // weiterhin ein Select (.value) sein — die schwebende Leiste nutzt
        // nach wie vor ein Select.
        const style = readEditorControlValue(ctx.target) || 'parchment';
        if (style) {
            setReadAloudFormat(editorId, style);
            resetEditorControl(ctx.target);
            closeAllEditorMenus();
        }
    },
    'insert-entity-link-btn': ctx => {
        const editorId = ctx.target.dataset.editor;
        showInsertEntityLinkModal(editorId);
    },
    'insert-link': ctx => {
        const editorId = ctx.target.dataset.editor;
        const editor = $(editorId);
        if (!editor) return;
        editor.focus();
        const url = prompt('Link URL eingeben:');
        if (!url) return;
        const selection = window.getSelection();
        // Leere Selektion: ohne markierten Text würde surroundContents() auf einer
        // kollabierten Range trivial "gelingen" und einen unsichtbaren, leeren <a>
        // einfügen (WR-01, 13-REVIEW.md) — spiegelt den Guard von applyFloatingFormat()
        // in ui/editors/rich-text-toolbars.js.
        if (!selection || !selection.rangeCount || !selection.toString()) {
            showToast('⚠️ Bitte erst Text markieren', 'warning');
            return;
        }
        const range = selection.getRangeAt(0);
        // Schutz gegen eine veraltete Selektion außerhalb des Ziel-Editors — ohne diesen
        // Check würde eine Selektion in einem unbeteiligten Element in einen Anchor
        // gewrappt statt im Ziel-Editor (WR-01, 13-REVIEW.md).
        const container = range.commonAncestorContainer;
        const containerEl =
            container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
        if (!containerEl?.closest?.('#' + editorId)) return;
        const anchor = document.createElement('a');
        anchor.href = url;
        if (typeof window.wrapRangeWithElement === 'function') {
            window.wrapRangeWithElement(range, anchor);
            showToast('🔗 Link eingefügt');
        }
    },
    'insert-table': ctx => {
        const editorId = ctx.target.dataset.editor;
        floatingToolbarTarget = $(editorId);
        insertTable();
    },
    'set-highlight-color': ctx => {
        const editorId = ctx.target.dataset.editor;
        const color = readEditorControlValue(ctx.target);
        const editor = $(editorId);
        if (!editor || !color) {
            resetEditorControl(ctx.target);
            closeAllEditorMenus();
            return;
        }
        editor.focus();

        const selection = window.getSelection();
        if (!selection.rangeCount || !selection.toString()) {
            showToast('⚠️ Bitte erst Text markieren', 'warning');
            resetEditorControl(ctx.target);
            closeAllEditorMenus();
            return;
        }

        // Gemeinsame Implementierung (ui/editors/rich-text.js). Frueher stand
        // hier eine eigene, im Markup abweichende Fassung.
        const applied = applyMarkerToSelection(editor, color, null);
        if (applied) {
            showToast(color === 'transparent' ? '🧹 Hervorhebung entfernt' : '🖍️ Text hervorgehoben');
        }

        // Gewaehlte Farbe im Menue-Trigger als kleiner Swatch spiegeln.
        const anchor = ctx.target.closest?.('.tb-anchor');
        const current = anchor?.querySelector('.tb-swatch-current');
        if (current && color !== 'transparent') current.style.background = color;
        resetEditorControl(ctx.target);
        closeAllEditorMenus();
    },
    'set-preset-emoji': ctx => setPresetEmoji(ctx.value),

    // System
    'show-about-modal': () => showModal('about-modal'),
    'reload-page': () => location.reload(),

    // Debug/Test
    'generate-test-wiki': ctx => generateTestWiki(parseInt(ctx.value) || 5),

    // Rest Manager
    'show-rest-modal': () => showRestModal(),
    'quick-short-rest': ctx => quickShortRest(ctx.id),

    // Quick Actions
    'apply-quick-action': ctx => applyQuickAction(parseInt(ctx.id), ctx.value),
    'show-condition-reference': () => showConditionReference(),

    // Random Tables / Generator
    'show-generator-modal': () => showGeneratorModal(),
    'show-table-modal': ctx => showTableModal(ctx.id ? parseInt(ctx.id) : null),
    'quick-random-roll': () => quickRandomRoll(),
    'roll-on-table': ctx => rollOnTable(parseInt(ctx.id)),
    'select-table': ctx => selectTable(parseInt(ctx.id)),
    'delete-table': ctx => deleteTable(parseInt(ctx.id)),
    'delete-table-refresh': ctx => deleteTableAndRefresh(parseInt(ctx.id)),
    'roll-on-table-show': ctx => rollOnTableAndShow(parseInt(ctx.id)),
    'add-table-entry': () => addTableEntry(),
    'save-table': () => saveTable(),
    'fill-remaining-ranges': () => fillRemainingRanges(),
    'select-dice-type': ctx => selectDiceType(parseInt(ctx.value)),
    'remove-table-entry': ctx => removeTableEntry(parseInt(ctx.value)),
    'quick-roll-table': ctx => {
        rollOnTable(parseInt(ctx.id));
        hideModal('quick-roll-modal');
    },

    // Loot Distribution
    'show-loot-distribution': () => showLootDistributionModal(),

    // Markdown Export/Import
    exportSpellAsMarkdown: () => {
        const editId = $('edit-spell-id');
        if (editId && editId.value) {
            exportEntityAsMarkdown('spells', editId.value);
        }
    },
    importSpellMarkdown: () => {
        const editId = $('edit-spell-id');
        if (editId && editId.value) {
            showMarkdownImportModal('spells', editId.value);
        }
    },
    exportNPCAsMarkdown: () => {
        const editId = $('edit-npc-id');
        if (editId && editId.value) {
            exportEntityAsMarkdown('npcs', editId.value);
        }
    },
    importNPCMarkdown: () => {
        const editId = $('edit-npc-id');
        if (editId && editId.value) {
            showMarkdownImportModal('npcs', editId.value);
        }
    },
    exportQuestAsMarkdown: () => {
        const editId = $('edit-quest-id');
        if (editId && editId.value) {
            exportEntityAsMarkdown('quests', editId.value);
        }
    },
    importQuestMarkdown: () => {
        const editId = $('edit-quest-id');
        if (editId && editId.value) {
            showMarkdownImportModal('quests', editId.value);
        }
    },

    // Migrated inline handlers
    'convert-units-metric': () => convertUnitsMetric(),
    'convert-units-imperial': () => convertUnitsImperial(),
    'search-notes': () => searchNotes(),
    'preview-avatar': () => previewAvatar(),
    'import-data-global': () => importDataGlobal(),

    // Dice Stats — Session / Gesamt Filter (D-05 / UX-02)
    'set-stats-scope': ctx => {
        if (typeof window._setStatsScope === 'function') {
            window._setStatsScope(ctx.value);
        }
    },

    // Dice Stats — manueller Refresh (User-Wunsch aus phase-13-UAT). statsIdbPut()
    // (dice-stats-idb.js) schreibt fire-and-forget direkt in IndexedDB, ohne ueber save()/D zu
    // gehen — registerPostSaveHook() feuert dafuer nie. Auto-Refresh aus dem Schreibpfad heraus
    // wurde vom Nutzer bewusst abgelehnt (Histogramm soll nicht "unter der Hand" umspringen,
    // waehrend er es liest); stattdessen dieser Knopf. Named action statt der generischen
    // 'call'-Aktion, damit CALL_ACTION_WHITELIST (SEC-03) unangetastet bleibt.
    'refresh-dice-stats': () => {
        if (typeof window.renderDiceStats === 'function') window.renderDiceStats();
        if (typeof window.showToast === 'function') window.showToast('Statistik aktualisiert');
    },

    // Dice Stats — Store vollstaendig leeren, mit beziffertem Rueckfrage-Dialog (PERF-02/D-11).
    // Eigene Aktion statt der generischen 'call'-Aktion — haengt bewusst NICHT an der
    // Ziel-Whitelist aus Plan 13-01 (13-07-PLAN.md). Verdraengte/geloeschte Wuerfe sind
    // unwiederbringlich (IndexedDB kennt keinen Undo), deshalb die Zahl in der Frage selbst.
    'clear-dice-stats': async () => {
        const count = (typeof window.getStatsCount === 'function') ? await window.getStatsCount() : 0;
        if (count <= 0) return;
        const confirmed = confirm(
            `${count} Würfelwurf-Datensätze unwiderruflich löschen? Dieser Vorgang kann NICHT rückgängig gemacht werden.`
        );
        if (!confirmed) return;
        const ok = (typeof window.clearAllStats === 'function') ? await window.clearAllStats() : false;
        if (ok) {
            if (typeof window.renderDiceStats === 'function') window.renderDiceStats();
            if (typeof window.showToast === 'function') {
                window.showToast(`Würfelstatistik gelöscht (${count} Datensätze)`);
            }
        } else if (typeof window.showToast === 'function') {
            window.showToast('Löschen fehlgeschlagen', 'error');
        }
    },

    // ============================================================
    // SOUNDBOARD ACTIONS (Phase 7 — UX-01, D-01a, D-02, D-03)
    // ============================================================

    // Audio-Bibliothek
    'import-audio': ctx => {
        // Delegiert an den versteckten <input type="file"> im Soundboard
        const input = document.getElementById('soundboard-file-input');
        if (input) input.click();
    },
    'soundboard-file-change': ctx => {
        // <input type="file"> feuert bei EINER Auswahl BEIDE Events: 'input' UND 'change'.
        // EventDelegation dispatcht die data-action auf beiden → ohne Guard doppelter Import
        // (zwei IDB-Records, gleicher Name/Größe). Nur auf 'change' reagieren.
        if (ctx.event && ctx.event.type !== 'change') return;
        if (typeof window.importAudioFile === 'function') {
            window.importAudioFile(ctx.target);
        }
        // Input zurücksetzen, damit dieselbe Datei später erneut importiert werden kann
        if (ctx.target) ctx.target.value = '';
    },
    'remove-audio': ctx => {
        // String-IDs (audio_…) niemals über parseEntityId/ctx.id — direkt dataset.id lesen (Phase-03-03-Präzedenz, CR-01)
        const audioId = ctx.target && ctx.target.dataset.id;
        if (audioId && typeof window.removeAudioFile === 'function') {
            window.removeAudioFile(audioId);
        }
    },

    // Scene CRUD
    'create-scene': ctx => {
        const name = prompt('Name der neuen Szene:');
        if (!name || !name.trim()) return;
        const slotStr = prompt('Quick-Slot (1–5, oder 0 fuer keinen Slot):', '0');
        const slot = parseInt(slotStr) || 0;
        if (typeof window.createScene === 'function') {
            window.createScene(name.trim(), slot);
            if (typeof window.renderSceneList === 'function') window.renderSceneList();
        }
    },
    'delete-scene': ctx => {
        // String-IDs (scene_…) direkt aus dataset.id, nicht über ctx.id (parseEntityId → null, CR-01)
        const sceneId = ctx.target && ctx.target.dataset.id;
        if (!sceneId) return;
        if (!confirm('Szene wirklich loeschen?')) return;
        if (typeof window.deleteScene === 'function') {
            window.deleteScene(sceneId);
            if (typeof window.renderSceneList === 'function') window.renderSceneList();
        }
    },
    'play-scene': ctx => {
        // String-IDs (scene_…) direkt aus dataset.id, nicht über ctx.id (parseEntityId → null, CR-01)
        const sceneId = ctx.target && ctx.target.dataset.id;
        if (sceneId && typeof window.playSceneById === 'function') {
            window.playSceneById(sceneId);
        }
    },
    'stop-all-audio': () => {
        if (typeof window.stopAllTracks === 'function') window.stopAllTracks();
    },
    'toggle-soundboard-mute': () => {
        if (typeof window.toggleSoundboardMute === 'function') window.toggleSoundboardMute();
    },

    // Track-Verwaltung
    'add-track': ctx => {
        const sceneId = ctx.target && ctx.target.dataset.sceneId;
        if (!sceneId) return;
        // Lese blobId aus dem zugehoerigen Select-Element (data-scene-id Selektor)
        const select = document.querySelector(`.sb-add-track-select[id="sb-add-select-${sceneId}"]`);
        const blobId = select ? select.value : '';
        if (!blobId) {
            showToast('Bitte Track aus Liste waehlen', 'warning');
            return;
        }
        if (typeof window.addTrackToScene === 'function') {
            window.addTrackToScene(sceneId, blobId);
            if (typeof window.renderSceneList === 'function') window.renderSceneList();
        }
    },
    'remove-track': ctx => {
        const sceneId = ctx.target && ctx.target.dataset.sceneId;
        const blobId = ctx.target && ctx.target.dataset.blobId;
        if (!sceneId || !blobId) return;
        if (typeof window.removeTrackFromScene === 'function') {
            window.removeTrackFromScene(sceneId, blobId);
            if (typeof window.renderSceneList === 'function') window.renderSceneList();
        }
    },
    'set-track-volume': ctx => {
        const sceneId = ctx.target && ctx.target.dataset.sceneId;
        const blobId = ctx.target && ctx.target.dataset.blobId;
        const volume = ctx.target && parseFloat(ctx.target.value);
        if (!sceneId || !blobId || isNaN(volume)) return;
        if (typeof window.setTrackVolume === 'function') {
            window.setTrackVolume(sceneId, blobId, volume);
        }
        // Live-Update der Prozent-Anzeige neben dem Slider
        const pctLabel = ctx.target && ctx.target.nextElementSibling;
        if (pctLabel && pctLabel.classList.contains('sb-volume-pct')) {
            pctLabel.textContent = Math.round(volume * 100) + '%';
        }
    },
    'toggle-track-loop': ctx => {
        // String-IDs (scene_/audio_) direkt aus dataset, nicht ctx.id (parseEntityId → null, CR-01)
        const sceneId = ctx.target && ctx.target.dataset.sceneId;
        const blobId = ctx.target && ctx.target.dataset.blobId;
        if (!sceneId || !blobId) return;
        if (typeof window.setTrackLoop === 'function') {
            window.setTrackLoop(sceneId, blobId);
            if (typeof window.renderSceneList === 'function') window.renderSceneList();
        }
    },
    'toggle-nav-group': ctx => {
        const group = ctx.target && ctx.target.closest('.nav-group');
        if (!group) return;
        const willOpen = !group.classList.contains('open');
        // Andere Gruppen schließen (nur eine offen)
        document.querySelectorAll('.nav-group.open').forEach(g => {
            if (g !== group) {
                g.classList.remove('open');
                const b = g.querySelector('.nav-group-btn');
                if (b) b.setAttribute('aria-expanded', 'false');
            }
        });
        group.classList.toggle('open', willOpen);
        const btn = group.querySelector('.nav-group-btn');
        if (btn) btn.setAttribute('aria-expanded', String(willOpen));
    }
};

// Register all system actions
if (typeof EventDelegation !== 'undefined') {
    Object.entries(SystemActions).forEach(([name, handler]) => {
        EventDelegation.registerAction(name, handler);
    });
}
