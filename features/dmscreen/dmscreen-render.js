// [SECTION:DMSCREEN_RENDER]
// ============================================================
// DM SCREEN - Haupt-Render-Logik
// ============================================================

/**
 * Standard-Layout für den DM Screen
 */
const DEFAULT_DMSCREEN_LAYOUT = {
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
const DEFAULT_DMSCREEN_PROFILES = {
    'standard': {
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
    'kampf': {
        name: 'Kampf',
        icon: '⚔️',
        widgets: [
            { id: 'mini-initiative', type: 'initiative', visible: true },
            { id: 'party-stats', type: 'party', visible: true },
            { id: 'quick-dice', type: 'dice', visible: true },
            { id: 'conditions-ref', type: 'conditions', visible: true },
            { id: 'dc-reference', type: 'dc', visible: true },
            { id: 'quick-rules', type: 'rules', visible: true },
            { id: 'random-tables', type: 'tables', visible: false },
            { id: 'session-notes', type: 'notes', visible: false }
        ]
    },
    'minimal': {
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
    }
};

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
        save();
        renderDMScreen();
        showToast('Layout zurückgesetzt');
    }
}

// ============================================================
// LAYOUT PROFILES
// ============================================================

/**
 * Wechselt zu einem vordefinierten oder gespeicherten Profil
 */
function switchDMSProfile(profileId) {
    const preset = DEFAULT_DMSCREEN_PROFILES[profileId];
    const custom = D.dmScreenProfiles[profileId];

    const profile = preset || custom;
    if (!profile) {
        showToast('Profil nicht gefunden', 'error');
        return;
    }

    pushUndo('DM Screen Profil gewechselt');
    D.dmScreenLayout = {
        widgets: JSON.parse(JSON.stringify(profile.widgets))
    };
    D.dmScreenActiveProfile = profileId;
    save();
    renderDMScreen();
    showToast(`Profil: ${profile.name}`);
}

/**
 * Speichert aktuelles Layout als neues Profil
 */
function saveDMSProfileAs() {
    const name = prompt('Profilname eingeben:');
    if (!name || !name.trim()) return;

    const id = 'custom_' + Date.now();
    D.dmScreenProfiles[id] = {
        name: name.trim(),
        icon: '💾',
        widgets: JSON.parse(JSON.stringify(D.dmScreenLayout.widgets))
    };
    D.dmScreenActiveProfile = id;
    save();
    renderDMScreen();
    showToast(`Profil "${name}" gespeichert`);
}

/**
 * Löscht ein benutzerdefiniertes Profil
 */
function deleteDMSProfile(profileId) {
    if (DEFAULT_DMSCREEN_PROFILES[profileId]) {
        showToast('Standard-Profile können nicht gelöscht werden', 'error');
        return;
    }

    const profile = D.dmScreenProfiles[profileId];
    if (!profile) return;

    if (confirm(`Profil "${profile.name}" löschen?`)) {
        delete D.dmScreenProfiles[profileId];
        if (D.dmScreenActiveProfile === profileId) {
            D.dmScreenActiveProfile = 'standard';
            switchDMSProfile('standard');
        }
        save();
        renderDMScreen();
        showToast('Profil gelöscht');
    }
}

/**
 * Zeigt das Profil-Auswahl-Dropdown
 */
function toggleDMSProfileDropdown() {
    const dropdown = $('dms-profile-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
        if (dropdown.classList.contains('show')) {
            renderDMSProfileList();
        }
    }
}

/**
 * Rendert die Profil-Liste im Dropdown
 */
function renderDMSProfileList() {
    const list = $('dms-profile-list');
    if (!list) return;

    const activeId = D.dmScreenActiveProfile || 'standard';

    // Preset profiles
    let html = '<div class="dms-profile-section">Standard</div>';
    for (const [id, profile] of Object.entries(DEFAULT_DMSCREEN_PROFILES)) {
        const isActive = id === activeId;
        html += `
            <div class="dms-profile-item ${isActive ? 'active' : ''}" data-action="dms-switch-profile" data-profile="${id}">
                <span class="dms-profile-icon">${profile.icon}</span>
                <span class="dms-profile-name">${profile.name}</span>
                ${isActive ? '<span class="dms-profile-check">✓</span>' : ''}
            </div>
        `;
    }

    // Custom profiles
    const customProfiles = Object.entries(D.dmScreenProfiles || {});
    if (customProfiles.length > 0) {
        html += '<div class="dms-profile-section">Eigene</div>';
        for (const [id, profile] of customProfiles) {
            const isActive = id === activeId;
            html += `
                <div class="dms-profile-item ${isActive ? 'active' : ''}" data-action="dms-switch-profile" data-profile="${id}">
                    <span class="dms-profile-icon">${profile.icon}</span>
                    <span class="dms-profile-name">${esc(profile.name)}</span>
                    ${isActive ? '<span class="dms-profile-check">✓</span>' : ''}
                    <button class="dms-profile-delete" data-action="dms-delete-profile" data-profile="${id}" title="Löschen">✕</button>
                </div>
            `;
        }
    }

    // Save as new button
    html += `
        <div class="dms-profile-section"></div>
        <div class="dms-profile-item dms-profile-save" data-action="dms-save-profile">
            <span class="dms-profile-icon">💾</span>
            <span class="dms-profile-name">Als Profil speichern...</span>
        </div>
    `;

    list.innerHTML = html;
}

/**
 * Rendert den gesamten DM Screen
 */
function renderDMScreen() {
    initDMScreenLayout();

    const grid = $('dmscreen-grid');
    const quickBar = $('dms-quick-bar');
    if (!grid) {
        console.warn('[DM Screen] Grid element not found');
        return;
    }

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
            quickBar.innerHTML = compactWidgets.map(widget => {
                const def = widgetDefs[widget.type];
                try {
                    return def.render();
                } catch (err) {
                    console.error(`[DM Screen] Error rendering compact widget ${widget.type}:`, err);
                    return '';
                }
            }).join('');
            quickBar.style.display = 'flex';
        } else {
            quickBar.innerHTML = '';
            quickBar.style.display = 'none';
        }
    }

    // Render Grid (regular widgets)
    if (gridWidgets.length === 0 && compactWidgets.length === 0) {
        grid.innerHTML = '<div class="dmscreen-empty">Keine Widgets aktiv. Klicke auf "⚙️ Widgets" um Widgets hinzuzufügen.</div>';
        return;
    }

    if (gridWidgets.length === 0) {
        grid.innerHTML = '';
        return;
    }

    try {
        grid.innerHTML = gridWidgets.map(widget => {
            const def = widgetDefs[widget.type];
            if (!def) {
                console.warn(`[DM Screen] Unknown widget type: ${widget.type}`);
                return '';
            }

            let content = '';
            try {
                content = def.render();
            } catch (err) {
                console.error(`[DM Screen] Error rendering widget ${widget.type}:`, err);
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
        }).join('');

        // Initialize drag & drop
        initDMSWidgetDragDrop();
    } catch (err) {
        console.error('[DM Screen] Error rendering:', err);
        grid.innerHTML = '<div class="dmscreen-empty">Fehler beim Rendern</div>';
    }

    // Update config dropdown
    renderDMSConfigList();
}

// ============================================================
// WIDGET CONFIGURATION
// ============================================================

/**
 * Rendert die Widget-Konfigurations-Liste
 */
function renderDMSConfigList() {
    const list = $('dms-config-list');
    if (!list) return;

    const widgetDefs = getDMScreenWidgets();
    const allWidgets = D.dmScreenLayout.widgets;

    list.innerHTML = allWidgets.map(widget => {
        const def = widgetDefs[widget.type];
        if (!def) return '';

        return `
            <label class="dms-config-item" data-widget-id="${widget.id}">
                <span class="dms-config-drag" title="Ziehen zum Sortieren">⋮⋮</span>
                <input type="checkbox" ${widget.visible ? 'checked' : ''}
                       data-action="dms-toggle-widget" data-widget="${widget.id}">
                <span class="dms-config-icon">${def.icon}</span>
                <span class="dms-config-name">${def.name}</span>
            </label>
        `;
    }).join('');

    // Initialize drag & drop for config list
    initDMSConfigDragDrop();
}

/**
 * Toggled die Sichtbarkeit eines Widgets
 */
function toggleDMSWidget(widgetId) {
    const widget = D.dmScreenLayout.widgets.find(w => w.id === widgetId);
    if (widget) {
        widget.visible = !widget.visible;
        saveDMScreenLayout();
        renderDMScreen();
    }
}

/**
 * Versteckt ein Widget (vom X-Button)
 */
function hideDMSWidget(widgetId) {
    const widget = D.dmScreenLayout.widgets.find(w => w.id === widgetId);
    if (widget) {
        widget.visible = false;
        saveDMScreenLayout();
        renderDMScreen();
        showToast(`Widget ausgeblendet`);
    }
}

/**
 * Speichert das DM Screen Layout
 */
function saveDMScreenLayout() {
    if (typeof save === 'function') {
        save();
    }
}

/**
 * Toggle Config Dropdown
 */
function toggleDMSConfigDropdown() {
    const dropdown = $('dms-config-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = $('dms-config-dropdown');
    const btn = $('dms-config-btn');
    if (dropdown && dropdown.classList.contains('show')) {
        if (!dropdown.contains(e.target) && e.target !== btn) {
            dropdown.classList.remove('show');
        }
    }
});

// ============================================================
// DRAG & DROP - WIDGET GRID
// ============================================================

let dmsDraggedWidget = null;

function initDMSWidgetDragDrop() {
    const grid = $('dmscreen-grid');
    if (!grid) return;

    const widgets = grid.querySelectorAll('.dmscreen-widget');

    widgets.forEach(widget => {
        widget.addEventListener('dragstart', handleDMSWidgetDragStart);
        widget.addEventListener('dragend', handleDMSWidgetDragEnd);
        widget.addEventListener('dragover', handleDMSWidgetDragOver);
        widget.addEventListener('drop', handleDMSWidgetDrop);
        widget.addEventListener('dragenter', handleDMSWidgetDragEnter);
        widget.addEventListener('dragleave', handleDMSWidgetDragLeave);
    });
}

function handleDMSWidgetDragStart(e) {
    dmsDraggedWidget = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.widgetId);
}

function handleDMSWidgetDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.dmscreen-widget').forEach(w => {
        w.classList.remove('drag-over');
    });
    dmsDraggedWidget = null;
}

function handleDMSWidgetDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDMSWidgetDragEnter(e) {
    e.preventDefault();
    if (this !== dmsDraggedWidget) {
        this.classList.add('drag-over');
    }
}

function handleDMSWidgetDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDMSWidgetDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    if (dmsDraggedWidget && this !== dmsDraggedWidget) {
        const draggedId = dmsDraggedWidget.dataset.widgetId;
        const targetId = this.dataset.widgetId;

        // Reorder in data
        reorderDMSWidgets(draggedId, targetId);
    }
}

function reorderDMSWidgets(draggedId, targetId) {
    const widgets = D.dmScreenLayout.widgets;
    const draggedIdx = widgets.findIndex(w => w.id === draggedId);
    const targetIdx = widgets.findIndex(w => w.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    // Remove dragged widget
    const [draggedWidget] = widgets.splice(draggedIdx, 1);

    // Insert at new position
    widgets.splice(targetIdx, 0, draggedWidget);

    saveDMScreenLayout();
    renderDMScreen();
    showToast('Layout gespeichert');
}

// ============================================================
// DRAG & DROP - CONFIG LIST
// ============================================================

let dmsConfigDraggedItem = null;

function initDMSConfigDragDrop() {
    const list = $('dms-config-list');
    if (!list) return;

    const items = list.querySelectorAll('.dms-config-item');

    items.forEach(item => {
        item.draggable = true;
        item.addEventListener('dragstart', handleDMSConfigDragStart);
        item.addEventListener('dragend', handleDMSConfigDragEnd);
        item.addEventListener('dragover', handleDMSConfigDragOver);
        item.addEventListener('drop', handleDMSConfigDrop);
        item.addEventListener('dragenter', handleDMSConfigDragEnter);
        item.addEventListener('dragleave', handleDMSConfigDragLeave);
    });
}

function handleDMSConfigDragStart(e) {
    dmsConfigDraggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.widgetId);
}

function handleDMSConfigDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.dms-config-item').forEach(i => {
        i.classList.remove('drag-over');
    });
    dmsConfigDraggedItem = null;
}

function handleDMSConfigDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDMSConfigDragEnter(e) {
    e.preventDefault();
    if (this !== dmsConfigDraggedItem) {
        this.classList.add('drag-over');
    }
}

function handleDMSConfigDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDMSConfigDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    if (dmsConfigDraggedItem && this !== dmsConfigDraggedItem) {
        const draggedId = dmsConfigDraggedItem.dataset.widgetId;
        const targetId = this.dataset.widgetId;

        // Reorder in data
        reorderDMSWidgets(draggedId, targetId);
    }
}

// ============================================================
// WIDGET DEFINITIONS (lazy-loaded to avoid reference issues)
// ============================================================

function getDMScreenWidgets() {
    return {
        'party': {
            name: 'Party Stats',
            icon: '👥',
            render: renderDMSPartyWidget,
            compact: false
        },
        'initiative': {
            name: 'Initiative',
            icon: '⚔️',
            render: renderDMSInitiativeWidget,
            compact: false
        },
        'dice': {
            name: 'Würfel',
            icon: '🎲',
            render: renderDMSDiceWidget,
            compact: false
        },
        'conditions': {
            name: 'Zustände',
            icon: '📋',
            render: renderDMSConditionsCompact,
            compact: true
        },
        'dc': {
            name: 'DC Referenz',
            icon: '🎯',
            render: renderDMSDCWidget,
            compact: false
        },
        'tables': {
            name: 'Tabellen',
            icon: '🎰',
            render: renderDMSTablesWidget,
            compact: false
        },
        'rules': {
            name: 'Regeln',
            icon: '📏',
            render: renderDMSRulesWidget,
            compact: false
        },
        'notes': {
            name: 'Notizen',
            icon: '📝',
            render: renderDMSNotesWidget,
            compact: false
        }
    };
}

/**
 * Compact Conditions Button für Quick Bar
 */
function renderDMSConditionsCompact() {
    return `
        <button class="dms-quick-btn" data-action="dms-show-condition" title="Zustände-Übersicht">
            <span class="dms-quick-icon">📋</span>
            <span class="dms-quick-label">Zustände</span>
        </button>
    `;
}


// ============================================================
// PARTY WIDGET
// ============================================================

function renderDMSPartyWidget() {
    const chars = D.characters || [];
    if (chars.length === 0) {
        return '<div class="dms-widget-empty">Keine Charaktere</div>';
    }

    // Calculate party HP % (using correct property names: hpCurrent, hpMax)
    const totalHp = chars.reduce((sum, c) => sum + (c.hpCurrent || 0), 0);
    const totalMaxHp = chars.reduce((sum, c) => sum + (c.hpMax || 1), 0);
    const hpPercent = totalMaxHp > 0 ? Math.round((totalHp / totalMaxHp) * 100) : 100;

    // Find character with HIGHEST passive perception
    let highestPP = 0;
    let highestPPChar = '';
    chars.forEach(c => {
        const pp = c.passivePerception || 10;
        if (pp > highestPP) {
            highestPP = pp;
            highestPPChar = c.name || 'Unbekannt';
        }
    });

    // HP bar color
    let hpClass = 'healthy';
    if (hpPercent <= 50) hpClass = 'bloodied';
    if (hpPercent <= 25) hpClass = 'critical';

    return `
        <div class="dms-party-stats">
            <div class="dms-stat-row">
                <span class="dms-stat-label">Party HP</span>
                <div class="dms-hp-bar-container">
                    <div class="dms-hp-bar ${hpClass}" style="width: ${hpPercent}%"></div>
                    <span class="dms-hp-text">${hpPercent}%</span>
                </div>
            </div>
            <div class="dms-stat-row">
                <span class="dms-stat-label">Höchste Pass. Wahrn.</span>
                <span class="dms-stat-value">${highestPP} <span class="dms-stat-char">(${esc(highestPPChar)})</span></span>
            </div>
            <div class="dms-stat-row">
                <span class="dms-stat-label">Spieler</span>
                <span class="dms-stat-value">${chars.length}</span>
            </div>
        </div>
    `;
}

// ============================================================
// INITIATIVE WIDGET
// ============================================================

function renderDMSInitiativeWidget() {
    const combatants = D.initiative?.combatants || [];
    const currentTurn = D.initiative?.currentTurn || 0;
    const round = D.initiative?.round || 1;

    if (combatants.length === 0) {
        return '<div class="dms-widget-empty">Kein aktiver Kampf</div>';
    }

    return `
        <div class="dms-initiative">
            <div class="dms-init-header">Runde ${round} <span class="dms-init-count">(${combatants.length})</span></div>
            <div class="dms-init-list">
                ${combatants.map((c, i) => {
                    const isCurrent = i === currentTurn;
                    const hpPercent = c.maxHp > 0 ? Math.round((c.currentHp / c.maxHp) * 100) : 100;
                    let hpClass = 'healthy';
                    if (hpPercent < 50) hpClass = 'bloodied';
                    if (hpPercent < 25) hpClass = 'critical';
                    if (c.currentHp <= 0) hpClass = 'down';

                    return `
                        <div class="dms-init-entry ${isCurrent ? 'active' : ''} ${hpClass}">
                            <span class="dms-init-marker">${isCurrent ? '▶' : ''}</span>
                            <span class="dms-init-name">${esc(c.name)}</span>
                            <span class="dms-init-value">${c.initiative || 0}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// ============================================================
// DICE WIDGET
// ============================================================

function renderDMSDiceWidget() {
    return `
        <div class="dms-dice">
            <div class="dms-dice-buttons">
                <button class="dms-dice-btn" data-action="dms-roll" data-dice="1d4">d4</button>
                <button class="dms-dice-btn" data-action="dms-roll" data-dice="1d6">d6</button>
                <button class="dms-dice-btn" data-action="dms-roll" data-dice="1d8">d8</button>
                <button class="dms-dice-btn" data-action="dms-roll" data-dice="1d10">d10</button>
                <button class="dms-dice-btn" data-action="dms-roll" data-dice="1d12">d12</button>
                <button class="dms-dice-btn dms-dice-d20" data-action="dms-roll" data-dice="1d20">d20</button>
                <button class="dms-dice-btn" data-action="dms-roll" data-dice="1d100">d100</button>
            </div>
            <div class="dms-dice-result" id="dms-dice-result">—</div>
            <div class="dms-dice-custom">
                <input type="text" id="dms-dice-formula" placeholder="z.B. 2d6+3" class="dms-dice-input">
                <button class="btn btn-sm" data-action="dms-roll-custom">🎲</button>
            </div>
        </div>
    `;
}

/**
 * DM Screen Würfelwurf
 */
function dmsRollDice(formula) {
    let result = 0;
    let rolls = [];

    // Use parseDiceNotation if available (returns object with total, rolls)
    if (typeof parseDiceNotation === 'function') {
        const parsed = parseDiceNotation(formula);
        if (parsed) {
            result = parsed.total;
            rolls = parsed.rolls;
        }
    } else {
        // Fallback: simple dice roll
        const match = formula.match(/(\d+)?d(\d+)/i);
        if (match) {
            const count = parseInt(match[1]) || 1;
            const sides = parseInt(match[2]);
            for (let i = 0; i < count; i++) {
                rolls.push(Math.floor(Math.random() * sides) + 1);
            }
            result = rolls.reduce((a, b) => a + b, 0);
        }
    }

    const resultEl = $('dms-dice-result');
    if (resultEl) {
        const rollsStr = rolls.length > 1 ? ` [${rolls.join(', ')}]` : '';
        resultEl.textContent = `${formula} = ${result}${rollsStr}`;
        resultEl.classList.add('rolled');
        setTimeout(() => resultEl.classList.remove('rolled'), 300);
    }

    // Add to dice history if available
    if (typeof addToDiceHistory === 'function') {
        addToDiceHistory(formula, result, rolls);
    }

    return result;
}

// ============================================================
// DC REFERENCE WIDGET
// ============================================================

function renderDMSDCWidget() {
    const dcs = [
        { dc: 5, desc: 'Trivial', color: 'var(--green)' },
        { dc: 10, desc: 'Leicht', color: 'var(--cyan)' },
        { dc: 15, desc: 'Mittel', color: 'var(--gold)' },
        { dc: 20, desc: 'Schwer', color: 'var(--orange)' },
        { dc: 25, desc: 'Sehr schwer', color: 'var(--red)' },
        { dc: 30, desc: 'Fast unmöglich', color: 'var(--purple)' }
    ];

    return `
        <div class="dms-dc-list">
            ${dcs.map(d => `
                <div class="dms-dc-entry" style="border-left: 3px solid ${d.color}">
                    <span class="dms-dc-value">${d.dc}</span>
                    <span class="dms-dc-desc">${d.desc}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================================
// RANDOM TABLES WIDGET
// ============================================================

function renderDMSTablesWidget() {
    const tables = D.randomTables || [];

    if (tables.length === 0) {
        return '<div class="dms-widget-empty">Keine Tabellen</div>';
    }

    return `
        <div class="dms-tables">
            ${tables.slice(0, 5).map(t => `
                <div class="dms-table-entry">
                    <span class="dms-table-icon">${t.icon || '🎲'}</span>
                    <span class="dms-table-name">${esc(t.name)}</span>
                    <button class="btn btn-sm" data-action="dms-roll-table" data-table="${t.id}">Roll</button>
                </div>
            `).join('')}
            <div class="dms-table-result" id="dms-table-result"></div>
        </div>
    `;
}

// ============================================================
// QUICK RULES WIDGET
// ============================================================

function renderDMSRulesWidget() {
    return `
        <div class="dms-rules">
            <div class="dms-rule-section">
                <div class="dms-rule-title">🛡️ Deckung</div>
                <div class="dms-rule-items">
                    <div class="dms-rule-item"><span>Halbe</span><span>+2 AC, +2 DEX-Rettung</span></div>
                    <div class="dms-rule-item"><span>3/4</span><span>+5 AC, +5 DEX-Rettung</span></div>
                    <div class="dms-rule-item"><span>Volle</span><span>Nicht anvisierbar</span></div>
                </div>
            </div>
            <div class="dms-rule-section">
                <div class="dms-rule-title">💡 Licht & Sicht</div>
                <div class="dms-rule-items">
                    <div class="dms-rule-item"><span>Hell</span><span>Normal sehen</span></div>
                    <div class="dms-rule-item"><span>Dämmrig</span><span>Nachteil Wahrn.</span></div>
                    <div class="dms-rule-item"><span>Dunkel</span><span>Effektiv blind</span></div>
                </div>
            </div>
            <div class="dms-rule-section">
                <div class="dms-rule-title">🏃 Bewegung</div>
                <div class="dms-rule-items">
                    <div class="dms-rule-item"><span>Schwierig</span><span>2× Bewegung</span></div>
                    <div class="dms-rule-item"><span>Springen</span><span>STR (weit) / 3+STR (hoch)</span></div>
                </div>
            </div>
        </div>
    `;
}

// ============================================================
// NOTES WIDGET
// ============================================================

function renderDMSNotesWidget() {
    const notes = D.dmScreenNotes || '';
    return `
        <div class="dms-notes">
            <textarea class="dms-notes-input" id="dms-notes-input"
                placeholder="Session-Notizen hier eingeben..."
                oninput="saveDMSNotes()">${esc(notes)}</textarea>
        </div>
    `;
}

function saveDMSNotes() {
    const input = $('dms-notes-input');
    if (input) {
        D.dmScreenNotes = input.value;
        save();
    }
}

// ============================================================
// EVENT HANDLERS
// ============================================================

document.addEventListener('click', function(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;

    switch(action) {
        case 'dms-roll':
            dmsRollDice(target.dataset.dice);
            break;
        case 'dms-roll-custom':
            const formula = $('dms-dice-formula')?.value;
            if (formula) dmsRollDice(formula);
            break;
        case 'dms-roll-table':
            const tableId = parseInt(target.dataset.table);
            dmsRollOnTable(tableId);
            break;
        case 'dms-show-condition':
            dmsShowConditionDetail(target.dataset.condition);
            break;
        case 'dms-toggle-config':
            toggleDMSConfigDropdown();
            break;
        case 'dms-toggle-widget':
            toggleDMSWidget(target.dataset.widget);
            break;
        case 'dms-hide-widget':
            e.stopPropagation();
            hideDMSWidget(target.dataset.widget);
            break;
        // Profile actions
        case 'dms-toggle-profiles':
            toggleDMSProfileDropdown();
            break;
        case 'dms-switch-profile':
            switchDMSProfile(target.dataset.profile);
            const dropdown = $('dms-profile-dropdown');
            if (dropdown) dropdown.classList.remove('show');
            break;
        case 'dms-save-profile':
            saveDMSProfileAs();
            const dd = $('dms-profile-dropdown');
            if (dd) dd.classList.remove('show');
            break;
        case 'dms-delete-profile':
            e.stopPropagation();
            deleteDMSProfile(target.dataset.profile);
            break;
    }
});

// Handle checkbox changes (needs change event, not click)
document.addEventListener('change', function(e) {
    const target = e.target.closest('[data-action="dms-toggle-widget"]');
    if (target) {
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
        roll -= (entry.weight || 1);
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

function dmsShowConditionDetail(conditionId) {
    // Use existing showConditionReference if available
    if (typeof showConditionReference === 'function') {
        showConditionReference();
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
document.addEventListener('keydown', function(e) {
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
