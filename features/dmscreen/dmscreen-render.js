// [SECTION:DMSCREEN_RENDER]
// Converted from dmscreen-render.js to TypeScript
// DM Screen - Haupt-Render-Logik
// ============================================================
// CONSTANTS
// ============================================================
// var D = window.D;  // [REMOVED: conflicts with function declaration]
/**
 * Standard-Layout für den DM Screen
 */
var DEFAULT_DMSCREEN_LAYOUT = {
    widgets: [
        { id: 'party-stats', type: 'party', visible: true },
        { id: 'mini-initiative', type: 'initiative', visible: true },
        { id: 'quick-dice', type: 'dice', visible: true },
        { id: 'conditions-ref', type: 'conditions', visible: true },
        { id: 'dc-reference', type: 'dc', visible: true },
        { id: 'random-tables', type: 'tables', visible: true },
        { id: 'quick-rules', type: 'rules', visible: true },
        { id: 'session-notes', type: 'notes', visible: true }
    ]
};
/**
 * Vordefinierte Layout-Profile
 */
var DEFAULT_DMSCREEN_PROFILES = {
    standard: {
        name: 'Standard',
        icon: '📋',
        widgets: [
            { id: 'party-stats', type: 'party', visible: true },
            { id: 'mini-initiative', type: 'initiative', visible: true },
            { id: 'quick-dice', type: 'dice', visible: true },
            { id: 'conditions-ref', type: 'conditions', visible: true },
            { id: 'dc-reference', type: 'dc', visible: true },
            { id: 'random-tables', type: 'tables', visible: true },
            { id: 'quick-rules', type: 'rules', visible: true },
            { id: 'session-notes', type: 'notes', visible: true }
        ]
    },
    kampf: {
        name: 'Kampf',
        icon: '⚔️',
        widgets: [
            { id: 'mini-initiative', type: 'initiative', visible: true },
            { id: 'party-stats', type: 'party', visible: true },
            { id: 'quick-dice', type: 'dice', visible: true },
            { id: 'conditions-ref', type: 'conditions', visible: true },
            { id: 'actions-ref', type: 'actions', visible: true },
            { id: 'economy-ref', type: 'economy', visible: true },
            { id: 'damage-ref', type: 'damage', visible: true },
            { id: 'dc-reference', type: 'dc', visible: true },
            { id: 'quick-rules', type: 'rules', visible: false },
            { id: 'random-tables', type: 'tables', visible: false },
            { id: 'session-notes', type: 'notes', visible: false }
        ]
    },
    minimal: {
        name: 'Minimal',
        icon: '📌',
        widgets: [
            { id: 'party-stats', type: 'party', visible: true },
            { id: 'quick-dice', type: 'dice', visible: true },
            { id: 'conditions-ref', type: 'conditions', visible: true },
            { id: 'mini-initiative', type: 'initiative', visible: false },
            { id: 'dc-reference', type: 'dc', visible: false },
            { id: 'random-tables', type: 'tables', visible: false },
            { id: 'quick-rules', type: 'rules', visible: false },
            { id: 'session-notes', type: 'notes', visible: false }
        ]
    },
    referenz: {
        name: 'Referenz',
        icon: '📚',
        widgets: [
            { id: 'actions-ref', type: 'actions', visible: true },
            { id: 'economy-ref', type: 'economy', visible: true },
            { id: 'saves-ref', type: 'saves', visible: true },
            { id: 'damage-ref', type: 'damage', visible: true },
            { id: 'attributes-ref', type: 'attributes', visible: true },
            { id: 'skills-ref', type: 'skills', visible: true },
            { id: 'sizes-ref', type: 'sizes', visible: true },
            { id: 'knowledge-ref', type: 'knowledge', visible: true },
            { id: 'objects-ref', type: 'objects', visible: true },
            { id: 'improvised-ref', type: 'improvised', visible: true },
            { id: 'ritual-ref', type: 'ritual', visible: true },
            { id: 'terrain-ref', type: 'terrain', visible: true },
            { id: 'travel-ref', type: 'travel', visible: true }
        ]
    }
};
// ============================================================
// LIVE-SYNC SYSTEM
// ============================================================
/**
 * Debounce-Timer für Live-Sync
 */
let dmsLiveSyncTimer = null;
const DMS_LIVE_SYNC_DELAY = UI_TIMING.DM_SCREEN_SYNC_DELAY;
/**
 * Prüft ob DM Screen aktuell sichtbar ist
 */
function isDMScreenVisible() {
    const dmView = $('view-dmscreen');
    return dmView !== null && dmView.classList.contains('active');
}
/**
 * Aktualisiert den DM Screen wenn sichtbar (debounced)
 */
function refreshDMScreenIfVisible() {
    if (!isDMScreenVisible()) return;
    // Debounce: Verhindert zu häufige Updates
    if (dmsLiveSyncTimer) {
        clearTimeout(dmsLiveSyncTimer);
    }
    dmsLiveSyncTimer = window.setTimeout(() => {
        renderDMScreenWidgetsOnly();
        dmsLiveSyncTimer = null;
    }, DMS_LIVE_SYNC_DELAY);
}
/**
 * Rendert nur die Widget-Inhalte neu (ohne Layout-Neuaufbau)
 * Schneller als vollständiges renderDMScreen()
 */
function renderDMScreenWidgetsOnly() {
    if (!isDMScreenVisible()) return;
    const widgetDefs = getDMScreenWidgets();
    const allWidgets = D.dmScreenLayout?.widgets || [];
    // Update nur sichtbare Grid-Widgets
    allWidgets
        .filter(w => w.visible)
        .forEach(widget => {
            const def = widgetDefs[widget.type];
            if (!def || def.compact) return; // Skip compact widgets
            const widgetEl = document.querySelector(
                `[data-widget-id="${widget.id}"] .dmscreen-widget-body`
            );
            if (widgetEl) {
                try {
                    widgetEl.innerHTML = def.render();
                } catch (err) {
                    ErrorHandler.log('updateDMScreenWidget', err, `Error updating ${widget.type}`);
                }
            }
        });
}
/**
 * Hook: Wird nach jedem erfolgreichen Save aufgerufen.
 * Registriert sich am generischen Post-Save-Hook der Persistenz (registerPostSaveHook).
 * KEIN window.save-Monkey-Patch mehr: bare save()-Aufrufe (fast alle Entity-CRUDs)
 * binden an die globale const-Deklaration und umgehen jeden window.save-Wrapper —
 * der alte Wrapper feuerte daher nie bei normalem Arbeiten (UAT 02, Struktur-Bug).
 */
function setupDMScreenLiveSync() {
    if (typeof window.registerPostSaveHook === 'function') {
        window.registerPostSaveHook(refreshDMScreenIfVisible);
    }
}
// Live-Sync beim Laden aktivieren
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDMScreenLiveSync);
} else {
    // Verzögert ausführen um sicherzustellen dass window.save() definiert ist
    setTimeout(setupDMScreenLiveSync, 100);
}
/**
 * Initialisiert das DM Screen Layout falls nicht vorhanden
 */
function initDMScreenLayout() {
    if (!D.dmScreenLayout) {
        D.dmScreenLayout = JSON.parse(JSON.stringify(DEFAULT_DMSCREEN_LAYOUT));
    }
    if (!D.dmScreenProfiles) {
        D.dmScreenProfiles = {};
    }
    if (!D.dmScreenActiveProfile) {
        D.dmScreenActiveProfile = null; // null = custom
    }
}
/**
 * Setzt das DM Screen Layout auf Standard zurück
 */
function resetDMScreenLayout() {
    if (confirm('DM Screen Layout zurücksetzen?')) {
        pushUndo('DM Screen Layout zurückgesetzt');
        D.dmScreenLayout = JSON.parse(JSON.stringify(DEFAULT_DMSCREEN_LAYOUT));
        D.dmScreenActiveProfile = 'standard';
        window.save();
        renderDMScreen();
        showToast('Layout zurückgesetzt');
    }
}
/**
 * Rendert den gesamten DM Screen
 */
function renderDMScreen() {
    initDMScreenLayout();
    const grid = $('dmscreen-grid');
    const quickBar = $('dms-quick-bar');
    if (!grid) {
        if (APP_CONFIG.DEBUG_MODE) {
            ErrorHandler.log(
                'renderDMScreen',
                new Error('Grid element not found'),
                'DOM element missing'
            );
        }
        return;
    }
    // Enable EntityLookup cache for performance during widget rendering
    EntityLookup.enableCache();
    const allWidgets = D.dmScreenLayout.widgets.filter(w => w.visible);
    const widgetDefs = getDMScreenWidgets();
    // Separate compact (Quick Bar) and regular (Grid) widgets
    const compactWidgets = allWidgets.filter(w => {
        const def = widgetDefs[w.type];
        return def && def.compact === true;
    });
    const gridWidgets = allWidgets.filter(w => {
        const def = widgetDefs[w.type];
        return def && def.compact !== true;
    });
    // Render Quick Bar (compact widgets)
    if (quickBar) {
        if (compactWidgets.length > 0) {
            quickBar.innerHTML = compactWidgets
                .map(widget => {
                    const def = widgetDefs[widget.type];
                    try {
                        return def.render();
                    } catch (err) {
                        ErrorHandler.log(
                            'renderDMScreen',
                            err,
                            `Error rendering compact widget ${widget.type}`
                        );
                        return '';
                    }
                })
                .join('');
            quickBar.style.display = 'flex';
        } else {
            quickBar.innerHTML = '';
            quickBar.style.display = 'none';
        }
    }
    // Render Grid (regular widgets)
    if (gridWidgets.length === 0 && compactWidgets.length === 0) {
        grid.innerHTML =
            '<div class="dmscreen-empty">Keine Widgets aktiv. Klicke auf "⚙️ Widgets" um Widgets hinzuzufügen.</div>';
        return;
    }
    if (gridWidgets.length === 0) {
        grid.innerHTML = '';
        return;
    }
    try {
        grid.innerHTML = gridWidgets
            .map(widget => {
                const def = widgetDefs[widget.type];
                if (!def) {
                    if (APP_CONFIG.DEBUG_MODE) {
                        ErrorHandler.log(
                            'renderDMScreen',
                            new Error('Unknown widget type'),
                            widget.type
                        );
                    }
                    return '';
                }
                let content = '';
                try {
                    content = def.render();
                } catch (err) {
                    ErrorHandler.log(
                        'renderDMScreen',
                        err,
                        `Error rendering widget ${widget.type}`
                    );
                    content = '<div class="dms-widget-empty">Fehler beim Laden</div>';
                }
                return `
                <div class="dmscreen-widget" data-widget-id="${widget.id}" data-widget-type="${widget.type}" draggable="true">
                    <div class="dmscreen-widget-header">
                        <span class="dmscreen-widget-drag" title="Ziehen zum Sortieren">⋮⋮</span>
                        <span class="dmscreen-widget-icon">${def.icon}</span>
                        <span class="dmscreen-widget-title">${def.name}</span>
                        <button class="dmscreen-widget-hide" data-action="dms-hide-widget" data-widget="${widget.id}" title="Widget ausblenden">✕</button>
                    </div>
                    <div class="dmscreen-widget-body">
                        ${content}
                    </div>
                </div>
            `;
            })
            .join('');
        // Initialize drag & drop
        initDMSWidgetDragDrop();
    } catch (err) {
        ErrorHandler.log('renderDMScreen', err, 'Error during grid render');
        grid.innerHTML = '<div class="dmscreen-empty">Fehler beim Rendern</div>';
    }
    // Update config dropdown
    renderDMSConfigList();
    // Clear EntityLookup cache after render to prevent stale data
    EntityLookup.clearCache();
}
// ============================================================
// WIDGET DEFINITIONS (lazy-loaded to avoid reference issues)
// ============================================================
function getDMScreenWidgets() {
    return {
        party: {
            name: 'Party Stats',
            icon: '👥',
            render: renderDMSPartyWidget,
            compact: false
        },
        initiative: {
            name: 'Initiative',
            icon: '⚔️',
            render: renderDMSInitiativeWidget,
            compact: false
        },
        dice: {
            name: 'Würfel',
            icon: '🎲',
            render: renderDMSDiceWidget,
            compact: false
        },
        conditions: {
            name: 'Zustände',
            icon: '📋',
            render: renderDMSConditionsCompact,
            compact: true
        },
        dc: {
            name: 'DC Referenz',
            icon: '🎯',
            render: renderDMSDCWidget,
            compact: false
        },
        tables: {
            name: 'Tabellen',
            icon: '🎰',
            render: renderDMSTablesWidget,
            compact: false
        },
        rules: {
            name: 'Regeln',
            icon: '📏',
            render: renderDMSRulesWidget,
            compact: false
        },
        notes: {
            name: 'Notizen',
            icon: '📝',
            render: renderDMSNotesWidget,
            compact: false
        },
        // === NEUE REFERENZ-WIDGETS ===
        actions: {
            name: 'Aktionen',
            icon: '⚡',
            render: renderDMSActionsWidget,
            compact: false
        },
        attributes: {
            name: 'Attribute',
            icon: '💪',
            render: renderDMSAttributesWidget,
            compact: false
        },
        saves: {
            name: 'Rettungswürfe',
            icon: '🛡️',
            render: renderDMSSavesWidget,
            compact: false
        },
        skills: {
            name: 'Fertigkeiten',
            icon: '📚',
            render: renderDMSSkillsWidget,
            compact: false
        },
        economy: {
            name: 'Kampfökonomie',
            icon: '⏱️',
            render: renderDMSEconomyWidget,
            compact: false
        },
        sizes: {
            name: 'Größen',
            icon: '📏',
            render: renderDMSSizesWidget,
            compact: false
        },
        objects: {
            name: 'Objekte',
            icon: '🪑',
            render: renderDMSObjectsWidget,
            compact: false
        },
        improvised: {
            name: 'Improv. Waffen',
            icon: '🍺',
            render: renderDMSImprovisedWidget,
            compact: false
        },
        ritual: {
            name: 'Ritual & Konz.',
            icon: '🔮',
            render: renderDMSRitualWidget,
            compact: false
        },
        damage: {
            name: 'Schadensarten',
            icon: '💥',
            render: renderDMSDamageWidget,
            compact: false
        },
        terrain: {
            name: 'Gelände',
            icon: '🏔️',
            render: renderDMSTerrainWidget,
            compact: false
        },
        knowledge: {
            name: 'Wissensgebiete',
            icon: '🎓',
            render: renderDMSKnowledgeWidget,
            compact: false
        },
        travel: {
            name: 'Reisen & Traglast',
            icon: '🎒',
            render: renderDMSTravelWidget,
            compact: false
        }
    };
}
// ============================================================
// EVENT HANDLERS
// ============================================================
document.addEventListener('click', function (e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    switch (action) {
        case 'dms-roll':
            if (target.dataset.dice) dmsRollDice(target.dataset.dice);
            break;
        case 'dms-roll-custom': {
            const formulaEl = $('dms-dice-formula');
            const formula = formulaEl?.value;
            if (formula) dmsRollDice(formula);
            break;
        }
        case 'dms-roll-table': {
            const tableId = parseInt(target.dataset.table || '0');
            dmsRollOnTable(tableId);
            break;
        }
        case 'dms-show-condition':
            dmsShowConditionDetail(target.dataset.condition);
            break;
        case 'dms-toggle-config':
            toggleDMSConfigDropdown();
            break;
        case 'dms-toggle-widget':
            if (target.dataset.widget) toggleDMSWidget(target.dataset.widget);
            break;
        case 'dms-hide-widget':
            e.stopPropagation();
            if (target.dataset.widget) hideDMSWidget(target.dataset.widget);
            break;
        // Profile actions
        case 'dms-toggle-profiles':
            toggleDMSProfileDropdown();
            break;
        case 'dms-switch-profile': {
            if (target.dataset.profile) switchDMSProfile(target.dataset.profile);
            const dropdown = $('dms-profile-dropdown');
            if (dropdown) dropdown.classList.remove('show');
            break;
        }
        case 'dms-save-profile': {
            saveDMSProfileAs();
            const dd = $('dms-profile-dropdown');
            if (dd) dd.classList.remove('show');
            break;
        }
        case 'dms-delete-profile':
            e.stopPropagation();
            if (target.dataset.profile) deleteDMSProfile(target.dataset.profile);
            break;
    }
});
// Handle checkbox changes (needs change event, not click)
document.addEventListener('change', function (e) {
    const target = e.target.closest('[data-action="dms-toggle-widget"]');
    if (target && target.dataset.widget) {
        toggleDMSWidget(target.dataset.widget);
    }
});
function dmsRollOnTable(tableId) {
    const table = (D.randomTables || []).find(t => t.id === tableId);
    if (!table || !table.entries || table.entries.length === 0) return;
    // Calculate total weight
    const totalWeight = table.entries.reduce((sum, e) => sum + (e.weight || 1), 0);
    let roll = Math.random() * totalWeight;
    let result = table.entries[0];
    for (const entry of table.entries) {
        roll -= entry.weight || 1;
        if (roll <= 0) {
            result = entry;
            break;
        }
    }
    const resultEl = $('dms-table-result');
    if (resultEl) {
        resultEl.innerHTML = `<strong>${esc(table.name)}:</strong> ${esc(result.text)}`;
        resultEl.classList.add('show');
    }
    showToast(`🎲 ${table.name}: ${result.text}`);
}
function dmsShowConditionDetail(_conditionId) {
    // Use existing showConditionReference if available
    if (typeof window.showConditionReference === 'function') {
        window.showConditionReference();
        return;
    }
    // Fallback: show toast
    showToast('Zustände-Referenz nicht verfügbar');
}
// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
/**
 * DM Screen Keyboard Shortcuts
 * - D: Zu DM Screen wechseln
 * - 1-3: Profile schnell wechseln (wenn DM Screen aktiv)
 */
document.addEventListener('keydown', function (e) {
    // Ignore if typing in input/textarea
    if (e.target.matches('input, textarea, [contenteditable]')) return;
    // Only process shortcuts if on DM Screen
    const dmView = $('view-dmscreen');
    if (!dmView || !dmView.classList.contains('active')) return;
    // Number keys 1-3: Quick profile switch
    if (e.key >= '1' && e.key <= '3' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const profiles = ['standard', 'kampf', 'minimal'];
        const idx = parseInt(e.key) - 1;
        if (profiles[idx]) {
            e.preventDefault();
            switchDMSProfile(profiles[idx]);
        }
    }
});
// ============================================================
// BACKWARD COMPATIBILITY - Export to window
// ============================================================
window.renderDMScreen = renderDMScreen;
window.resetDMScreenLayout = resetDMScreenLayout;
