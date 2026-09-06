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
// toggleDMSConfigDropdown, initDMSWidgetDragDrop, addDMSWidgetType,
// selectAllDMSWidgets und deselectAllDMSWidgets als bare Bezeichner
// aufgerufen (EVENT HANDLERS bzw. renderDMScreen()) -- deshalb der
// EXPORTS-Block am Dateiende.
//
// Nutzer-Feature (nach Plan 13-12, außerhalb des MAINT-01-Vertrags dieser
// Phase): renderDMSConfigList() listet seit dieser Erweiterung alle 21
// registrierten Widget-Typen, nicht nur die im aktuellen Layout — Typen ohne
// Layout-Eintrag lassen sich per Checkbox neu hinzufuegen
// (addDMSWidgetType()); selectAllDMSWidgets()/deselectAllDMSWidgets()
// bedienen die "Alle auswählen"/"Alle abwählen"-Kurzwahl.
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
 * Rendert die Widget-Konfigurations-Liste.
 *
 * Zeigt zuerst alle Widgets, die bereits im aktuellen Layout stehen (in ihrer
 * bestehenden Reihenfolge, mit ihrem bestehenden Sichtbarkeits-Toggle),
 * danach alle registrierten Typen, die im aktuellen Layout noch fehlen — die
 * dortige Checkbox fuegt den Typ bei Aktivierung neu hinzu statt ihn nur zu
 * toggeln. Vor dieser Erweiterung waren die 13 nicht im Standard-Profil
 * enthaltenen Typen nur ueber einen Profilwechsel (z. B. "Referenz")
 * erreichbar — Nutzeranfrage aus der 13-12-Bedienprobe.
 */
function renderDMSConfigList() {
    const list = $('dms-config-list');
    if (!list) return;
    const widgetDefs = getDMScreenWidgets();
    const layoutWidgets = D.dmScreenLayout.widgets;
    const presentTypes = new Set(layoutWidgets.map(w => w.type));

    const presentHtml = layoutWidgets
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

    const absentHtml = Object.keys(widgetDefs)
        .filter(type => !presentTypes.has(type))
        .map(type => {
            const def = widgetDefs[type];
            return `
            <label class="dms-config-item dms-config-item-unadded" data-widget-type="${type}">
                <span class="dms-config-drag dms-config-drag-disabled" aria-hidden="true"></span>
                <input type="checkbox"
                       data-action="dms-add-widget-type" data-widget-type="${type}">
                <span class="dms-config-icon">${def.icon}</span>
                <span class="dms-config-name">${def.name}</span>
            </label>
        `;
        })
        .join('');

    list.innerHTML = presentHtml + absentHtml;
    // Initialize drag & drop for config list (nur bereits vorhandene Widgets
    // sind sortierbar — noch nicht hinzugefuegte Typen haben keinen Platz im
    // Layout-Array, an den reorderDMSWidgets() andocken koennte)
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
 * Generiert eine stabile, eindeutige Widget-Id fuer einen neu hinzugefuegten
 * Typ. Folgt der Konvention der 13 Referenz-Widgets in
 * DEFAULT_DMSCREEN_PROFILES.referenz (`${type}-ref`, siehe
 * dmscreen-render.js) — verliert ihre Bedeutung ohnehin beim naechsten
 * Profilwechsel, da switchDMSProfile() D.dmScreenLayout.widgets vollstaendig
 * ersetzt.
 */
function generateDMSWidgetId(type) {
    const base = `${type}-ref`;
    const existingIds = new Set(D.dmScreenLayout.widgets.map(w => w.id));
    if (!existingIds.has(base)) return base;
    let suffix = 2;
    while (existingIds.has(`${base}-${suffix}`)) suffix++;
    return `${base}-${suffix}`;
}
/**
 * Fuegt einen Widget-Typ, der im aktuellen Layout noch fehlt, neu hinzu
 * (bzw. blendet ihn wieder ein, falls er bereits vorhanden, aber ausgeblendet
 * ist). Nutzeranfrage aus der 13-12-Bedienprobe: alle 21 registrierten Typen
 * sollen ohne Profilwechsel erreichbar sein.
 */
function addDMSWidgetType(type) {
    const widgetDefs = getDMScreenWidgets();
    const def = widgetDefs[type];
    if (!def) return;
    pushUndo('DM Screen Widget hinzugefügt');
    const existing = D.dmScreenLayout.widgets.find(w => w.type === type);
    if (existing) {
        existing.visible = true;
    } else {
        D.dmScreenLayout.widgets.push({ id: generateDMSWidgetId(type), type, visible: true });
    }
    saveDMScreenLayout();
    renderDMScreen();
    showToast(`Widget "${def.name}" hinzugefügt`);
}
/**
 * Fuegt alle registrierten Widget-Typen hinzu, die im aktuellen Layout noch
 * fehlen, und blendet alle bereits vorhandenen wieder ein ("Alle auswählen"
 * in der Konfigurationsliste).
 */
function selectAllDMSWidgets() {
    const widgetDefs = getDMScreenWidgets();
    pushUndo('Alle DM-Screen-Widgets ausgewählt');
    Object.keys(widgetDefs).forEach(type => {
        const existing = D.dmScreenLayout.widgets.find(w => w.type === type);
        if (existing) {
            existing.visible = true;
        } else {
            D.dmScreenLayout.widgets.push({ id: generateDMSWidgetId(type), type, visible: true });
        }
    });
    saveDMScreenLayout();
    renderDMScreen();
    showToast('Alle Widgets ausgewählt');
}
/**
 * Blendet alle Widgets im aktuellen Layout aus (versteckt, loescht sie NICHT
 * aus dem Layout — Reihenfolge und eigene Ids bleiben erhalten). Gegenstueck
 * zu selectAllDMSWidgets(), "Alle abwählen" in der Konfigurationsliste.
 */
function deselectAllDMSWidgets() {
    pushUndo('Alle DM-Screen-Widgets abgewählt');
    D.dmScreenLayout.widgets.forEach(w => {
        w.visible = false;
    });
    saveDMScreenLayout();
    renderDMScreen();
    showToast('Alle Widgets abgewählt');
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
    // Nur bereits vorhandene Widgets sind sortierbar (haben ein data-widget-id
    // aus dem Layout-Array, an das reorderDMSWidgets() andocken kann). Noch
    // nicht hinzugefuegte Typen (dms-config-item-unadded) haben keinen Platz
    // im Layout und bleiben deshalb nicht draggable.
    const items = list.querySelectorAll('.dms-config-item[data-widget-id]');
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
window.addDMSWidgetType = addDMSWidgetType;
window.selectAllDMSWidgets = selectAllDMSWidgets;
window.deselectAllDMSWidgets = deselectAllDMSWidgets;
