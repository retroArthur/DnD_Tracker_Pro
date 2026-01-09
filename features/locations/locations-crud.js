// [SECTION:LOCATIONS_CRUD]
// ============================================================
// LOCATIONS CRUD - @create @edit @delete @save
// ============================================================
/**
 * Saves or updates a location
 * Reads form data and creates/updates the location entry
 */
function saveLocation() {
    const D = window.D;
    const renderLocations = window.renderLocations;
    const populateSelects = window.populateSelects;
    const idInput = $('edit-loc-id');
    const id = idInput?.value || '';
    const loc = {
        name: $('loc-name').value.trim(),
        description: sanitizeHTML($('loc-desc').innerHTML),
        filterId: parseInt($('loc-filter').value) || null
    };
    if (!loc.name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }
    pushUndo(id ? 'Ort bearbeitet' : 'Ort erstellt');
    if (id) {
        const idx = D.locations.findIndex((l) => l.id === parseEntityId(id));
        if (idx > -1)
            D.locations[idx] = { ...D.locations[idx], ...loc };
    }
    else {
        loc.id = nextId('locations');
        D.locations.push(loc);
    }
    hideModal('location-modal');
    if (idInput)
        idInput.value = '';
    $('loc-name').value = '';
    $('loc-desc').innerHTML = '';
    renderLocations();
    save();
}
/**
 * Opens the edit modal for a location
 */
function editLocation(id) {
    const populateSelects = window.populateSelects;
    const loc = EntityLookup.location(id);
    if (!loc)
        return;
    const idInput = $('edit-loc-id');
    if (idInput)
        idInput.value = String(id);
    $('loc-name').value = loc.name;
    $('loc-desc').innerHTML = sanitizeHTML(loc.description) || '';
    populateSelects();
    if (loc.filterId) {
        $('loc-filter').value = String(loc.filterId);
    }
    showModal('location-modal');
}
/**
 * Deletes a location after confirmation
 */
function deleteLocation(id) {
    const renderLocations = window.renderLocations;
    deleteWithConfirm({
        entityType: 'locations',
        id: id,
        confirmMessage: null, // Use default message
        undoLabel: 'Ort gelöscht',
        onSuccess: () => {
            renderLocations();
            showToast('✅ Ort gelöscht', 'success');
        }
    });
}
// Filter CRUD
function addFilter() {
    const D = window.D;
    const renderFilterList = window.renderFilterList;
    const renderLocations = window.renderLocations;
    const nameInput = $('filter-name');
    const name = nameInput.value.trim();
    if (!name)
        return;
    pushUndo('Filter erstellt');
    D.filters.push({
        id: nextId('filters'),
        name,
        color: $('filter-color').value
    });
    nameInput.value = '';
    renderFilterList();
    renderLocations();
    save();
}
function deleteFilter(id) {
    const D = window.D;
    const renderFilterList = window.renderFilterList;
    const renderLocations = window.renderLocations;
    const numId = typeof id === 'string' ? parseInt(id) : id;
    pushUndo('Filter gelöscht');
    D.filters = D.filters.filter((f) => f.id !== numId);
    renderFilterList();
    renderLocations();
    save();
}
// Helper functions used by other modules
function filterAssignSpells() {
    const renderAssignSpellList = window.renderAssignSpellList;
    renderAssignSpellList();
}
function filterAssignItems() {
    const renderAssignItemList = window.renderAssignItemList;
    renderAssignItemList();
}
// Trigger field for NPC modal
// triggerCount is global in core/constants.js
function addTriggerField() {
    const c = $('npc-triggers-container');
    if (!c)
        return;
    if (c.children.length >= 10) {
        showToast('Maximal 10 Trigger');
        return;
    }
    const triggerCount = window.triggerCount || 0;
    window.triggerCount = triggerCount + 1;
    const div = document.createElement('div');
    div.id = `trigger-${triggerCount}`;
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
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.saveLocation = saveLocation;
window.editLocation = editLocation;
window.deleteLocation = deleteLocation;
window.addFilter = addFilter;
window.deleteFilter = deleteFilter;
window.filterAssignSpells = filterAssignSpells;
window.filterAssignItems = filterAssignItems;
window.addTriggerField = addTriggerField;
//# sourceMappingURL=locations-crud.js.map