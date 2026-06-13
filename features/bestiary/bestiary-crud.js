// [SECTION:BESTIARY_CRUD]
// ============================================================
// BESTIARY CRUD — Eigene Kreaturen (D.bestiary[])
// Analog: features/encounters/encounters-crud.js + utils/crud-helpers.js
// ============================================================

// ============================================================
// SAVE BESTIARY (create or update)
// Reads all bst-* fields into the full D-04 schema.
// Validates name; calls saveUndoState() BEFORE mutating D.bestiary.
// ============================================================
function saveBestiary() {
    var D = window.D;
    var idInput = window.$('bst-edit-id');
    var id = idInput ? idInput.value.trim() : '';

    // ---- Name validation (trust nothing, not just maxlength) ----
    var nameEl = window.$('bst-name');
    var name = nameEl ? nameEl.value.trim() : '';
    if (!name) {
        var frozenError = '⚠️ Name erforderlich — bitte einen Namen eingeben';
        showToast(frozenError, 'error');
        if (typeof window.showBstValidationError === 'function') {
            window.showBstValidationError(frozenError);
        }
        return; // keep modal open
    }

    // ---- Enforce field length caps (server-side-equivalent validation) ----
    if (name.length > 200) name = name.slice(0, 200);

    // ---- Collect saving throws ----
    var savingThrows = {};
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(function(attr) {
        var checkbox = window.$('bst-save-' + attr);
        var valueInput = window.$('bst-save-val-' + attr);
        if (checkbox && checkbox.checked) {
            var customVal = valueInput ? valueInput.value.trim() : '';
            // Cap length on custom value
            if (customVal.length > 6) customVal = customVal.slice(0, 6);
            savingThrows[attr] = customVal || true;
        }
    });

    // ---- Parse senses / languages (comma-separated → array) ----
    function parseCommaList(fieldId) {
        var el = window.$(fieldId);
        var raw = el ? el.value.trim() : '';
        if (!raw) return [];
        return raw.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
    }

    // ---- Collect the full D-04 schema ----
    var creature = {
        name: name,
        source: 'custom',
        size:          (window.$('bst-size')    ? window.$('bst-size').value    : '') || 'Mittelgroß',
        creatureType:  (window.$('bst-type')    ? window.$('bst-type').value.trim().slice(0, 100)    : '') || 'Humanoid',
        alignment:     (window.$('bst-alignment') ? window.$('bst-alignment').value.trim().slice(0, 100) : ''),
        cr:            (window.$('bst-cr')      ? window.$('bst-cr').value.trim().slice(0, 10)      : '') || '1',
        xp:            parseInt(window.$('bst-xp') ? window.$('bst-xp').value : '0') || 0,
        ac:            parseInt(window.$('bst-ac') ? window.$('bst-ac').value : '10') || 10,
        acInfo:        (window.$('bst-ac-info') ? window.$('bst-ac-info').value.trim().slice(0, 100) : ''),
        hp:            parseInt(window.$('bst-hp') ? window.$('bst-hp').value : '0') || 0,
        hpFormula:     (window.$('bst-hp-formula') ? window.$('bst-hp-formula').value.trim().slice(0, 50) : ''),
        speed: {
            walk:   (window.$('bst-speed-walk')   ? window.$('bst-speed-walk').value.trim().slice(0, 20)   : ''),
            fly:    (window.$('bst-speed-fly')    ? window.$('bst-speed-fly').value.trim().slice(0, 20)    : ''),
            swim:   (window.$('bst-speed-swim')   ? window.$('bst-speed-swim').value.trim().slice(0, 20)   : ''),
            climb:  (window.$('bst-speed-climb')  ? window.$('bst-speed-climb').value.trim().slice(0, 20)  : ''),
            burrow: (window.$('bst-speed-burrow') ? window.$('bst-speed-burrow').value.trim().slice(0, 20) : '')
        },
        str: parseInt(window.$('bst-str') ? window.$('bst-str').value : '10') || 10,
        dex: parseInt(window.$('bst-dex') ? window.$('bst-dex').value : '10') || 10,
        con: parseInt(window.$('bst-con') ? window.$('bst-con').value : '10') || 10,
        int: parseInt(window.$('bst-int') ? window.$('bst-int').value : '10') || 10,
        wis: parseInt(window.$('bst-wis') ? window.$('bst-wis').value : '10') || 10,
        cha: parseInt(window.$('bst-cha') ? window.$('bst-cha').value : '10') || 10,
        savingThrows: savingThrows,
        skills: {},
        damageResistances: [],
        damageImmunities: [],
        conditionImmunities: [],
        senses:    parseCommaList('bst-senses'),
        languages: parseCommaList('bst-languages'),
        // Rich-text fields: sanitizeHTML applied at save time (T-03-06 mitigation)
        traits:              sanitizeHTML(window.$('bst-traits')    ? window.$('bst-traits').innerHTML    : ''),
        actions:             sanitizeHTML(window.$('bst-actions')   ? window.$('bst-actions').innerHTML   : ''),
        reactions:           sanitizeHTML(window.$('bst-reactions') ? window.$('bst-reactions').innerHTML : ''),
        legendaryActions:    sanitizeHTML(window.$('bst-legendary') ? window.$('bst-legendary').innerHTML : ''),
        legendaryActionsPerRound: parseInt(window.$('bst-legendary-count') ? window.$('bst-legendary-count').value : '3') || 0,
        // Avatar: retrieved from editor module's internal URL tracker
        avatar: (typeof window._getBstEditorAvatarUrl === 'function') ? window._getBstEditorAvatarUrl() : ''
    };

    // ---- Clamp numeric values to safe ranges ----
    creature.xp  = Math.max(0, Math.min(9999999, creature.xp));
    creature.ac  = Math.max(0, Math.min(99, creature.ac));
    creature.hp  = Math.max(0, Math.min(99999, creature.hp));
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(function(attr) {
        creature[attr] = Math.max(1, Math.min(30, creature[attr]));
    });
    creature.legendaryActionsPerRound = Math.max(0, Math.min(10, creature.legendaryActionsPerRound));

    // ---- saveUndoState() BEFORE any mutation (CLAUDE.md requirement) ----
    var undoLabel = id ? 'Kreatur bearbeitet' : 'Kreatur angelegt';
    saveUndoState(undoLabel);

    if (id) {
        // ---- UPDATE existing creature ----
        var numId = parseEntityId(id);
        var idx = D.bestiary.findIndex(function(x) { return x.id === numId; });
        if (idx > -1) {
            // Preserve existing id
            creature.id = numId;
            D.bestiary[idx] = creature;
        } else {
            // id provided but not found — treat as new (safety fallback)
            creature.id = nextId('bestiary');
            D.bestiary.push(creature);
        }
    } else {
        // ---- CREATE new creature ----
        creature.id = nextId('bestiary');
        D.bestiary.push(creature);
    }

    // ---- Hide modal ----
    if (typeof window.hideModal === 'function') {
        window.hideModal('bestiary-editor-modal');
    }

    // ---- Refresh list + persist ----
    afterCrudOperation(renderBestiaryList, 'Kreatur gespeichert');
}

// ============================================================
// DELETE BESTIARY ENTRY
// Uses deleteWithConfirm for consistent Undo + confirmation UX.
// saveUndoState is called inside deleteWithConfirm (crud-helpers.js line 42).
// ============================================================
function deleteBestiaryEntry(id) {
    deleteWithConfirm({
        entityType: 'bestiary',
        id: id,
        onSuccess: function() {
            afterCrudOperation(renderBestiaryList, 'Kreatur gelöscht');
        }
    });
}

// ============================================================
// WINDOW EXPORTS
// ============================================================
window.saveBestiary = saveBestiary;
window.deleteBestiaryEntry = deleteBestiaryEntry;
