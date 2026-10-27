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
    let id = idInput?.value || '';
    // Zeigt die ID auf einen Ort, den es nicht mehr gibt (geloescht, oder per
    // Strg+Z zurueckgenommen, waehrend das Formular offen war), wird als NEUER
    // Ort gespeichert — die Eingaben bleiben erhalten. Vorher fand der
    // Bearbeiten-Zweig nichts (kein Else-Zweig), schloss, leerte und
    // speicherte trotzdem: gemessen war die Eingabe still weg, ohne jede
    // Meldung, mit einem leeren Undo-Eintrag "Ort bearbeitet". Geprueft VOR
    // pushUndo, wie in saveNPC().
    const idx = id ? D.locations.findIndex(l => l.id === parseEntityId(id)) : -1;
    const verwaist = Boolean(id) && idx === -1;
    if (verwaist) id = '';
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
        D.locations[idx] = { ...D.locations[idx], ...loc };
    } else {
        loc.id = nextId('locations');
        D.locations.push(loc);
    }
    hideModal('location-modal');
    clearLocationForm();
    renderLocations();
    save();
    // Nur die Warnung: eine Erfolgsmeldung hatte saveLocation() nie, und eine
    // neue gehoert nicht in diese Behebung.
    if (verwaist) {
        showToast(
            'Der bearbeitete Ort existiert nicht mehr — als neuer Ort gespeichert',
            'warning'
        );
    }
}
/**
 * Clears the location form
 */
function clearLocationForm() {
    clearFormFields({
        textFields: ['edit-loc-id', 'loc-name'],
        selectFields: [{ id: 'loc-filter', defaultValue: '' }],
        contentEditableFields: ['loc-desc']
    });
}
/**
 * Opens the edit modal for a location
 */
function editLocation(id) {
    const populateSelects = window.populateSelects;
    const loc = EntityLookup.location(id);
    if (!loc) return;
    const idInput = $('edit-loc-id');
    if (idInput) idInput.value = String(id);
    $('loc-name').value = loc.name;
    $('loc-desc').innerHTML = sanitizeHTML(loc.description) || '';
    populateSelects();
    // Auch '' setzen: populateSelects() haelt seit MARKDOWN die Auswahl — und
    // genau deshalb ueberlebt der Filter jetzt showModal(), das ihn frueher
    // wegwischte (Speichern machte null daraus).
    $('loc-filter').value = loc.filterId ? String(loc.filterId) : '';
    showModal('location-modal');
}
/**
 * Oeffnet das Orte-Formular zum Anlegen — der Weg aller drei Anlegen-Knoepfe
 * ("+ Neuer Ort", "+ Ort erstellen" der leeren Liste, Befehlspalette "Neuer
 * Ort"). Vorher oeffneten sie per showModal('location-modal') das Formular
 * mit dem, was ein abgebrochenes Bearbeiten (✕ oder Escape) darin liess, samt
 * #edit-loc-id: gemessen UEBERSCHRIEB das naechste "Anlegen" den zuletzt
 * bearbeiteten Ort (Filter, Beschreibung, Tags blieben haengen) — in D, im
 * Speicher und nach dem Neuladen, ohne Meldung. Geleert wird NUR bei einem
 * solchen Rest; ein echter Anlegen-Entwurf ueberlebt ein versehentliches
 * Escape weiter.
 *
 * Ist das Formular OFFEN, ist #edit-loc-id kein Rest, sondern die laufende
 * Bearbeitung — dann tut der Weg nichts (wie showNewNPCModal()). Gemessen
 * oeffnet die Befehlspalette auch mit dem Fokus im Namensfeld eines offenen ✏️.
 */
function showNewLocationModal() {
    if ($('location-modal')?.classList.contains('show')) return;
    if ($('edit-loc-id')?.value) clearLocationForm();
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
    if (!name) return;
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
    D.filters = D.filters.filter(f => f.id !== numId);
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
    if (!c) return;
    if (c.children.length >= 10) {
        showToast('Maximal 10 Trigger');
        return;
    }
    const triggerCount = window.triggerCount || 0;
    window.triggerCount = triggerCount + 1;
    const div = document.createElement('div');
    div.id = `trigger-${triggerCount}`;
    div.className = 'npc-trigger-field';
    div.style.cssText =
        'background: var(--bg-dark); padding: 10px; border-radius: 6px; margin-bottom: 8px; border: 1px solid var(--border);';
    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="color: var(--yellow); font-weight: 600; font-size: var(--text-sm);">🔔 Trigger</span>
            <button type="button" class="btn btn-sm btn-danger" data-action="remove-field-stop" data-value=".npc-trigger-field">✕</button>
        </div>
        <div class="form-grid" style="margin: 0;">
            <div class="form-group" style="margin: 0;"><label style="font-size: var(--text-sm);">Bedingung</label><input type="text" class="trigger-cond" placeholder="z.B. Wenn vertraut, Nach Quest X"></div>
            <div class="form-group" style="margin: 0;"><label style="font-size: var(--text-sm);">Enthüllung</label><input type="text" class="trigger-reveal" placeholder="Was wird enthüllt?"></div>
        </div>`;
    c.appendChild(div);
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.saveLocation = saveLocation;
window.editLocation = editLocation;
window.deleteLocation = deleteLocation;
// Verbraucher: features/command-palette/action-registry.js ("Neuer Ort").
window.showNewLocationModal = showNewLocationModal;
window.addFilter = addFilter;
window.deleteFilter = deleteFilter;
window.filterAssignSpells = filterAssignSpells;
window.filterAssignItems = filterAssignItems;
window.addTriggerField = addTriggerField;
