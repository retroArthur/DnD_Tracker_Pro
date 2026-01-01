// ============================================================
// LOCATIONS CRUD - Create, Read, Update, Delete Operationen
// ============================================================
// Extrahiert aus features/render-locations.js

/**
 * Speichert oder aktualisiert einen Ort
 * Liest Formulardaten und erstellt/aktualisiert den Ort-Eintrag
 */
function saveLocation() {
    const id = $('edit-loc-id').value;
    const loc = {
        name: $('loc-name').value.trim(),
        description: sanitizeHTML($('loc-desc').innerHTML),
        filterId: parseInt($('loc-filter').value) || null
    };
    if (!loc.name) { showToast('⚠️ Name erforderlich', 'error'); return; }

    pushUndo(id ? 'Ort bearbeitet' : 'Ort erstellt');

    if (id) {
        const idx = D.locations.findIndex(l => l.id === parseEntityId(id));
        if (idx > -1) D.locations[idx] = { ...D.locations[idx], ...loc };
    } else {
        loc.id = nextId('locations');
        D.locations.push(loc);
    }

    hideModal('location-modal');
    $('edit-loc-id').value = '';
    $('loc-name').value = '';
    $('loc-desc').innerHTML = '';
    renderLocations();
    save();
}

/**
 * Oeffnet das Bearbeitungsmodal fuer einen Ort
 * @param {number|string} id - Location ID
 */
function editLocation(id) {
    const loc = EntityLookup.location(id);
    if (!loc) return;

    $('edit-loc-id').value = id;
    $('loc-name').value = loc.name;
    $('loc-desc').innerHTML = sanitizeHTML(loc.description) || '';
    populateSelects();
    if (loc.filterId) $('loc-filter').value = loc.filterId;
    showModal('location-modal');
}

/**
 * Loescht einen Ort nach Bestaetigung
 * @param {number|string} id - Location ID
 */
function deleteLocation(id) {
    const numId = parseEntityId(id);
    if (numId === null) return;

    const loc = EntityLookup.location(id);
    if (confirm(`Ort "${loc?.name || 'Unbekannt'}" löschen?`)) {
        pushUndo('Ort gelöscht');
        D.locations = D.locations.filter(l => l.id !== numId);
        renderLocations();
        save();
    }
}

// Filter CRUD
function addFilter() {
    const name = $('filter-name').value.trim();
    if (!name) return;

    pushUndo('Filter erstellt');
    D.filters.push({ id: nextId('filters'), name, color: $('filter-color').value });
    $('filter-name').value = '';
    renderFilterList();
    renderLocations();
    save();
}

function deleteFilter(id) {
    pushUndo('Filter gelöscht');
    D.filters = D.filters.filter(f => f.id !== id);
    renderFilterList();
    renderLocations();
    save();
}

// Helper functions used by other modules
function filterAssignSpells() {
    renderAssignSpellList();
}

function filterAssignItems() {
    renderAssignItemList();
}

// Trigger field for NPC modal
// triggerCount ist global in core/constants.js definiert

function addTriggerField() {
    const c = $('npc-triggers-container');
    if (c.children.length >= 10) {
        showToast('Maximal 10 Trigger');
        return;
    }
    const div = document.createElement('div');
    div.id = `trigger-${triggerCount++}`;
    div.className = 'npc-trigger-field';
    div.style.cssText = 'background: var(--bg-dark); padding: 10px; border-radius: 6px; margin-bottom: 8px; border: 1px solid var(--border);';
    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="color: var(--yellow); font-weight: 600; font-size: 0.85em;">🔔 Trigger</span>
            <button type="button" class="btn btn-sm btn-danger" data-action="remove-field-stop" data-value=".npc-trigger-field">✕</button>
        </div>
        <div class="form-grid" style="margin: 0;">
            <div class="form-group" style="margin: 0;"><label style="font-size: 0.85em;">Bedingung</label><input type="text" class="trigger-cond" placeholder="z.B. Wenn vertraut, Nach Quest X"></div>
            <div class="form-group" style="margin: 0;"><label style="font-size: 0.85em;">Enthüllung</label><input type="text" class="trigger-reveal" placeholder="Was wird enthüllt?"></div>
        </div>`;
    c.appendChild(div);
}
