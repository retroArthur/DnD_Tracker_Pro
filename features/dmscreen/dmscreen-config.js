// [SECTION:DMSCREEN_CONFIG]
// ============================================================
// DM SCREEN - PROFILE, WIDGET-KONFIGURATION, DRAG & DROP
// ============================================================
// Teil der MAINT-01-Aufteilung von dmscreen-render.js (Plan 13-12, Task 2).
// Enthaelt die Layout-Profile (Standard/Kampf/Minimal/Referenz + eigene
// Profile), die Widget-Konfigurationsliste und beide Drag & Drop-Systeme
// (Widget-Grid, Konfigurationsliste). renderDMScreen() und die Registry
// bleiben in dmscreen-render.js; von dort werden switchDMSProfile,
// saveDMSProfileAs, deleteDMSProfile, toggleDMSProfileDropdown,
// renderDMSConfigList, toggleDMSWidget, hideDMSWidget,
// toggleDMSConfigDropdown und initDMSWidgetDragDrop als bare Bezeichner
// aufgerufen (EVENT HANDLERS bzw. renderDMScreen()) -- deshalb der
// EXPORTS-Block am Dateiende.
// ============================================================

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
    window.save();
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
    window.save();
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
        window.save();
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
    list.innerHTML = allWidgets
        .map(widget => {
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
        })
        .join('');
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
    if (typeof window.save === 'function') {
        window.save();
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
document.addEventListener('click', function (e) {
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
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.dataset.widgetId || '');
    }
}
function handleDMSWidgetDragEnd(_e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.dmscreen-widget').forEach(w => {
        w.classList.remove('drag-over');
    });
    dmsDraggedWidget = null;
}
function handleDMSWidgetDragOver(e) {
    e.preventDefault();
    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
    }
}
function handleDMSWidgetDragEnter(e) {
    e.preventDefault();
    if (this !== dmsDraggedWidget) {
        this.classList.add('drag-over');
    }
}
function handleDMSWidgetDragLeave(_e) {
    this.classList.remove('drag-over');
}
function handleDMSWidgetDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    if (dmsDraggedWidget && this !== dmsDraggedWidget) {
        const draggedId = dmsDraggedWidget.dataset.widgetId;
        const targetId = this.dataset.widgetId;
        if (draggedId && targetId) {
            // Reorder in data
            reorderDMSWidgets(draggedId, targetId);
        }
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
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.dataset.widgetId || '');
    }
}
function handleDMSConfigDragEnd(_e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.dms-config-item').forEach(i => {
        i.classList.remove('drag-over');
    });
    dmsConfigDraggedItem = null;
}
function handleDMSConfigDragOver(e) {
    e.preventDefault();
    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
    }
}
function handleDMSConfigDragEnter(e) {
    e.preventDefault();
    if (this !== dmsConfigDraggedItem) {
        this.classList.add('drag-over');
    }
}
function handleDMSConfigDragLeave(_e) {
    this.classList.remove('drag-over');
}
function handleDMSConfigDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    if (dmsConfigDraggedItem && this !== dmsConfigDraggedItem) {
        const draggedId = dmsConfigDraggedItem.dataset.widgetId;
        const targetId = this.dataset.widgetId;
        if (draggedId && targetId) {
            // Reorder in data
            reorderDMSWidgets(draggedId, targetId);
        }
    }
}

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.switchDMSProfile = switchDMSProfile;
window.saveDMSProfileAs = saveDMSProfileAs;
window.deleteDMSProfile = deleteDMSProfile;
window.toggleDMSProfileDropdown = toggleDMSProfileDropdown;
window.renderDMSConfigList = renderDMSConfigList;
window.toggleDMSWidget = toggleDMSWidget;
window.hideDMSWidget = hideDMSWidget;
window.toggleDMSConfigDropdown = toggleDMSConfigDropdown;
window.initDMSWidgetDragDrop = initDMSWidgetDragDrop;
