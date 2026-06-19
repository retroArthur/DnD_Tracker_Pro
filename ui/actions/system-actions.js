// [SECTION:SYSTEM_ACTIONS]
// ============================================================
// SYSTEM ACTIONS - @undo @redo @export @import @backup
// ============================================================

const SystemActions = {
    // Undo/Redo
    undo: () => undo(),
    redo: () => redo(),

    // Export/Import
    'export-data': ctx => exportData(ctx.value),
    'export-json': ctx => exportData(ctx.value),
    'export-csv': ctx => exportDataCSV(ctx.value),
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
    'clear-formatting': ctx => clearEditorFormatting(ctx.value),
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
    'set-read-aloud-style': ctx => {
        const editorId = ctx.target.dataset.editor;
        const style = ctx.target.value || 'parchment';
        if (style) {
            setReadAloudFormat(editorId, style);
            // Reset dropdown nach Anwendung
            ctx.target.selectedIndex = 0;
        }
    },
    'insert-entity-link-btn': ctx => {
        const editorId = ctx.target.dataset.editor;
        showInsertEntityLinkModal(editorId);
    },
    'insert-link': ctx => {
        const editorId = ctx.target.dataset.editor;
        const editor = $(editorId);
        if (editor) {
            editor.focus();
            const url = prompt('Link URL eingeben:');
            if (url) {
                document.execCommand('createLink', false, url);
                showToast('🔗 Link eingefügt');
            }
        }
    },
    'insert-table': ctx => {
        const editorId = ctx.target.dataset.editor;
        floatingToolbarTarget = $(editorId);
        insertTable();
    },
    'set-highlight-color': ctx => {
        const editorId = ctx.target.dataset.editor;
        const color = ctx.target.value;
        const editor = $(editorId);
        if (!editor || !color) {
            ctx.target.selectedIndex = 0;
            return;
        }
        editor.focus();

        const selection = window.getSelection();
        if (!selection.rangeCount || !selection.toString()) {
            showToast('⚠️ Bitte erst Text markieren', 'warning');
            ctx.target.selectedIndex = 0;
            return;
        }

        const range = selection.getRangeAt(0);

        if (color === 'transparent') {
            // Remove highlight
            const marks = editor.querySelectorAll('mark');
            marks.forEach(mark => {
                if (selection.containsNode(mark, true)) {
                    const parent = mark.parentNode;
                    while (mark.firstChild) {
                        parent.insertBefore(mark.firstChild, mark);
                    }
                    parent.removeChild(mark);
                }
            });
            showToast('🧹 Hervorhebung entfernt');
        } else {
            const wrapper = document.createElement('mark');
            wrapper.style.backgroundColor = color + '66';
            wrapper.style.color = 'inherit';
            wrapper.style.borderRadius = '2px';
            wrapper.style.padding = '0 3px';
            try {
                range.surroundContents(wrapper);
            } catch (e) {
                const fragment = range.extractContents();
                wrapper.appendChild(fragment);
                range.insertNode(wrapper);
            }
            showToast('🖍️ Text hervorgehoben');
        }
        ctx.target.selectedIndex = 0;
    },
    'set-preset-emoji': ctx => setPresetEmoji(ctx.value),

    // System
    'show-about-modal': () => showModal('about-modal'),
    'reload-page': () => location.reload(),
    'clear-error-log': () => {
        ErrorHandler.clearLog();
        showErrorLogModal();
    },

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
        if (typeof window.importAudioFile === 'function') {
            window.importAudioFile(ctx.target);
        }
    },
    'remove-audio': ctx => {
        if (ctx.id && typeof window.removeAudioFile === 'function') {
            window.removeAudioFile(ctx.id);
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
        if (!ctx.id) return;
        if (!confirm('Szene wirklich loeschen?')) return;
        if (typeof window.deleteScene === 'function') {
            window.deleteScene(ctx.id);
            if (typeof window.renderSceneList === 'function') window.renderSceneList();
        }
    },
    'play-scene': ctx => {
        if (ctx.id && typeof window.playSceneById === 'function') {
            window.playSceneById(ctx.id);
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
        const blobId = ctx.target && ctx.target.dataset.blobId;
        if (!sceneId || !blobId) return;
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
    }
};

// Register all system actions
if (typeof EventDelegation !== 'undefined') {
    Object.entries(SystemActions).forEach(([name, handler]) => {
        EventDelegation.registerAction(name, handler);
    });
}
