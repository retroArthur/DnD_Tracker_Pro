// ============================================================
// SYSTEM ACTIONS - Undo/Redo, Export, Import, Backup, Timer
// ============================================================

const SystemActions = {
    // Undo/Redo
    'undo': () => undo(),
    'redo': () => redo(),

    // Export/Import
    'export-data': (ctx) => exportData(ctx.value),
    'export-json': (ctx) => exportData(ctx.value),
    'export-csv': (ctx) => exportDataCSV(ctx.value),
    'execute-import': (ctx) => executeImport(ctx.value),

    // Backup
    'restore-backup': (ctx) => { restoreBackup(ctx.id); hideModal('backups-modal'); },

    // Timer actions
    'toggle-timer': (ctx) => toggleTimer(ctx.id),
    'reset-timer': (ctx) => resetTimer(ctx.id),
    'delete-timer': (ctx) => deleteTimer(ctx.id),
    'focus-timer': (ctx) => focusTimer(ctx.id),
    'quick-timer': (ctx) => quickTimer(parseInt(ctx.value)),
    'edit-timer-preset': (ctx) => editTimerPreset(ctx.id),
    'delete-timer-preset': (ctx) => deleteTimerPreset(ctx.id),
    'add-preset-timer': (ctx) => {
        const duration = parseInt(ctx.target.dataset.duration) || 0;
        addPresetTimer(ctx.value, duration);
    },

    // Editor actions
    'format-text': (ctx) => {
        const cmd = ctx.target.dataset.cmd || ctx.value;
        const editorId = ctx.target.dataset.editor;
        formatText(cmd, editorId);
    },
    'clear-formatting': (ctx) => clearEditorFormatting(ctx.value),
    'set-editor-font': (ctx) => {
        const editorId = ctx.target.dataset.editor;
        const font = ctx.target.value || ctx.target.dataset.value || ctx.value;
        setEditorFont(editorId, font);
    },
    'set-editor-font-size': (ctx) => {
        const editorId = ctx.target.dataset.editor;
        const size = ctx.target.value || ctx.target.dataset.value || ctx.value;
        setEditorFontSize(editorId, size);
    },
    'set-border-format': (ctx) => {
        const editorId = ctx.target.dataset.editor;
        const style = ctx.target.dataset.value || ctx.value;
        setBorderFormat(editorId, style);
    },
    'insert-entity-link-btn': (ctx) => {
        const editorId = ctx.target.dataset.editor;
        showInsertEntityLinkModal(editorId);
    },
    'set-preset-emoji': (ctx) => setPresetEmoji(ctx.value),

    // System
    'reload-page': () => location.reload(),
    'clear-error-log': () => { ErrorHandler.clearLog(); showErrorLogModal(); },

    // Debug/Test
    'generate-test-wiki': (ctx) => generateTestWiki(parseInt(ctx.value) || 5),

    // Rest Manager
    'show-rest-modal': () => showRestModal(),
    'quick-short-rest': (ctx) => quickShortRest(ctx.id),

    // Quick Actions
    'apply-quick-action': (ctx) => applyQuickAction(parseInt(ctx.id), ctx.value),
    'show-condition-reference': () => showConditionReference(),

    // Random Tables / Generator
    'show-generator-modal': () => showGeneratorModal(),
    'show-table-modal': (ctx) => showTableModal(ctx.id ? parseInt(ctx.id) : null),
    'quick-random-roll': () => quickRandomRoll(),
    'roll-on-table': (ctx) => rollOnTable(parseInt(ctx.id)),

    // Loot Distribution
    'show-loot-distribution': () => showLootDistributionModal()
};

// Register all system actions
if (typeof EventDelegation !== 'undefined') {
    Object.entries(SystemActions).forEach(([name, handler]) => {
        EventDelegation.registerAction(name, handler);
    });
}
