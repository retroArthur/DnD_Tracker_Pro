// [SECTION:LOCATIONS_CRUD]
// ============================================================
// LOCATIONS CRUD - @create @edit @delete @save
// ============================================================

import { $, sanitizeHTML } from '@utils/basic';
import { showToast, nextId, parseEntityId } from '@utils/utilities';
import { save } from '@systems/spellslots/persistence';
import { pushUndo } from '@systems/undo';
import { EntityLookup } from '@render/helpers';
import { deleteWithConfirm } from '@utils/crud-helpers';
import { showModal, hideModal } from '@systems/spellslots/navigation';

/**
 * Saves or updates a location
 * Reads form data and creates/updates the location entry
 */
export function saveLocation(): void {
    const D = (window as any).D;
    const renderLocations = (window as any).renderLocations;
    const populateSelects = (window as any).populateSelects;

    const idInput = $('edit-loc-id') as HTMLInputElement | null;
    const id = idInput?.value || '';

    const loc: any = {
        name: ($('loc-name') as HTMLInputElement).value.trim(),
        description: sanitizeHTML(($('loc-desc') as HTMLElement).innerHTML),
        filterId: parseInt(($('loc-filter') as HTMLSelectElement).value) || null
    };
    if (!loc.name) { showToast('⚠️ Name erforderlich', 'error'); return; }

    pushUndo(id ? 'Ort bearbeitet' : 'Ort erstellt');

    if (id) {
        const idx = D.locations.findIndex((l: any) => l.id === parseEntityId(id));
        if (idx > -1) D.locations[idx] = { ...D.locations[idx], ...loc };
    } else {
        loc.id = nextId('locations');
        D.locations.push(loc);
    }

    hideModal('location-modal');
    if (idInput) idInput.value = '';
    ($('loc-name') as HTMLInputElement).value = '';
    ($('loc-desc') as HTMLElement).innerHTML = '';
    renderLocations();
    save();
}

/**
 * Opens the edit modal for a location
 */
export function editLocation(id: number | string): void {
    const populateSelects = (window as any).populateSelects;

    const loc = EntityLookup.location(id);
    if (!loc) return;

    const idInput = $('edit-loc-id') as HTMLInputElement;
    if (idInput) idInput.value = String(id);

    ($('loc-name') as HTMLInputElement).value = loc.name;
    ($('loc-desc') as HTMLElement).innerHTML = sanitizeHTML(loc.description) || '';

    populateSelects();

    if (loc.filterId) {
        ($('loc-filter') as HTMLSelectElement).value = String(loc.filterId);
    }

    showModal('location-modal');
}

/**
 * Deletes a location after confirmation
 */
export function deleteLocation(id: number | string): void {
    const renderLocations = (window as any).renderLocations;

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
export function addFilter(): void {
    const D = (window as any).D;
    const renderFilterList = (window as any).renderFilterList;
    const renderLocations = (window as any).renderLocations;

    const nameInput = $('filter-name') as HTMLInputElement;
    const name = nameInput.value.trim();
    if (!name) return;

    pushUndo('Filter erstellt');
    D.filters.push({
        id: nextId('filters'),
        name,
        color: ($('filter-color') as HTMLInputElement).value
    });

    nameInput.value = '';
    renderFilterList();
    renderLocations();
    save();
}

export function deleteFilter(id: number | string): void {
    const D = (window as any).D;
    const renderFilterList = (window as any).renderFilterList;
    const renderLocations = (window as any).renderLocations;

    const numId = typeof id === 'string' ? parseInt(id) : id;

    pushUndo('Filter gelöscht');
    D.filters = D.filters.filter((f: any) => f.id !== numId);
    renderFilterList();
    renderLocations();
    save();
}

// Helper functions used by other modules
export function filterAssignSpells(): void {
    const renderAssignSpellList = (window as any).renderAssignSpellList;
    renderAssignSpellList();
}

export function filterAssignItems(): void {
    const renderAssignItemList = (window as any).renderAssignItemList;
    renderAssignItemList();
}

// Trigger field for NPC modal
// triggerCount is global in core/constants.js
export function addTriggerField(): void {
    const c = $('npc-triggers-container');
    if (!c) return;

    if (c.children.length >= 10) {
        showToast('Maximal 10 Trigger');
        return;
    }

    const triggerCount = (window as any).triggerCount || 0;
    (window as any).triggerCount = triggerCount + 1;

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

(window as any).saveLocation = saveLocation;
(window as any).editLocation = editLocation;
(window as any).deleteLocation = deleteLocation;
(window as any).addFilter = addFilter;
(window as any).deleteFilter = deleteFilter;
(window as any).filterAssignSpells = filterAssignSpells;
(window as any).filterAssignItems = filterAssignItems;
(window as any).addTriggerField = addTriggerField;
