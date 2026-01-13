// [SECTION:ENCOUNTERS_CRUD]
// ============================================================
// ENCOUNTERS CRUD - @create @edit @delete @save
// ============================================================
function updateEncAttrMod(attr) {
    const attrEl = $(`enc-${attr}`);
    const val = parseInt(attrEl?.value || '10') || 10;
    const mod = Math.floor((val - 10) / 2);
    const modEl = $(`enc-${attr}-mod`);
    if (modEl) {
        modEl.textContent = mod >= 0 ? `+${mod}` : `${mod}`;
        modEl.className = 'attr-mod' + (mod > 0 ? ' positive' : mod < 0 ? ' negative' : '');
    }
}
// Toggle encounter saving throw box active state
function toggleEncSaveBox(attr) {
    const box = $(`enc-save-box-${attr}`);
    const checkbox = $(`enc-save-${attr}`);
    if (box && checkbox) {
        box.classList.toggle('active', checkbox.checked);
    }
}
/**
 * Saves or updates an encounter/enemy
 * Reads form data and creates/updates the encounter entry
 */
function saveEncounter() {
    const D = window.D;
    const renderEncounters = window.renderEncounters;
    const sortInit = window.sortInit;
    const idInput = $('edit-enc-id');
    const id = idInput?.value || '';
    const selectedLanguages = typeof getEncSelectedLanguages === 'function' ? getEncSelectedLanguages() : [];
    // Collect saving throws (checkbox + custom value)
    const savingThrows = {};
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        const checkbox = $(`enc-save-${attr}`);
        const valueInput = $(`enc-save-val-${attr}`);
        if (checkbox && checkbox.checked) {
            const customVal = valueInput?.value?.trim() || '';
            savingThrows[attr] = customVal || true; // Store custom value or true for proficiency-only
        }
    });
    // Collect resistances & immunities
    const resistances = Array.from(document.querySelectorAll('#enc-resistances .char-resistance-chip.selected input')).map(i => i.value);
    const immunities = Array.from(document.querySelectorAll('#enc-immunities .char-resistance-chip.selected input')).map(i => i.value);
    const conditionImmunities = Array.from(document.querySelectorAll('#enc-condition-immunities .char-resistance-chip.selected input')).map(i => i.value);
    const e = {
        name: $('enc-name').value.trim(),
        creatureType: $('enc-creature-type').value,
        cr: $('enc-cr').value,
        ac: parseInt($('enc-ac').value) || 0,
        init: parseInt($('enc-init').value) || 0,
        hp: parseInt($('enc-hp').value) || 0,
        speed: {
            walk: $('enc-speed-walk').value.trim() || '',
            climb: $('enc-speed-climb').value.trim() || '',
            swim: $('enc-speed-swim').value.trim() || '',
            fly: $('enc-speed-fly').value.trim() || '',
            burrow: $('enc-speed-burrow').value.trim() || ''
        },
        perception: parseInt($('enc-perception').value) || 0,
        languages: selectedLanguages,
        str: parseInt($('enc-str').value) || 10,
        dex: parseInt($('enc-dex').value) || 10,
        con: parseInt($('enc-con').value) || 10,
        int: parseInt($('enc-int').value) || 10,
        wis: parseInt($('enc-wis').value) || 10,
        cha: parseInt($('enc-cha').value) || 10,
        savingThrows: savingThrows,
        resistances: resistances,
        immunities: immunities,
        conditionImmunities: conditionImmunities,
        traits: sanitizeHTML($('enc-traits').innerHTML),
        equipment: sanitizeHTML($('enc-equipment').innerHTML),
        actions: sanitizeHTML($('enc-actions').innerHTML),
        skills: sanitizeHTML($('enc-skills').innerHTML)
    };
    if (!e.name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }
    if (id) {
        const idx = D.encounters.findIndex((x) => x.id === parseEntityId(id));
        if (idx > -1)
            D.encounters[idx] = { ...D.encounters[idx], ...e };
    }
    else {
        e.id = nextId('encounters');
        D.encounters.push(e);
    }
    cancelEncEdit();
    // Collapse form
    const form = $('enc-form');
    const icon = $('enc-form-icon');
    if (form)
        form.classList.remove('open');
    if (icon)
        icon.textContent = '▼';
    renderEncounters();
    save();
}
/**
 * Opens the edit form for an encounter/enemy
 */
function editEnc(id) {
    const e = EntityLookup.encounter(id);
    if (!e)
        return;
    const idInput = $('edit-enc-id');
    if (idInput)
        idInput.value = String(id);
    $('enc-name').value = e.name;
    $('enc-creature-type').value = e.creatureType || '';
    $('enc-cr').value = e.cr || '';
    $('enc-ac').value = e.ac || '';
    $('enc-init').value = e.init || '';
    $('enc-hp').value = e.hp || '';
    // Load speed values (support both old string format and new object format)
    if (typeof e.speed === 'object' && e.speed !== null) {
        $('enc-speed-walk').value = e.speed.walk || '';
        $('enc-speed-climb').value = e.speed.climb || '';
        $('enc-speed-swim').value = e.speed.swim || '';
        $('enc-speed-fly').value = e.speed.fly || '';
        $('enc-speed-burrow').value = e.speed.burrow || '';
    }
    else {
        // Old format: single string -> put in walk
        $('enc-speed-walk').value = e.speed || '';
        $('enc-speed-climb').value = '';
        $('enc-speed-swim').value = '';
        $('enc-speed-fly').value = '';
        $('enc-speed-burrow').value = '';
    }
    $('enc-perception').value = e.perception || '';
    // Handle languages (array or string for backwards compatibility)
    let langs = [];
    if (Array.isArray(e.languages)) {
        langs = e.languages;
    }
    else if (e.languages) {
        // Old format: comma-separated string
        langs = e.languages.split(',').map((l) => l.trim());
    }
    if (typeof setEncLanguages === 'function') {
        setEncLanguages(langs);
    }
    // Load attributes as numbers (or old format conversion)
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        const val = e[attr];
        const input = $(`enc-${attr}`);
        if (typeof val === 'string' && val.includes('/')) {
            // Old format: "10/+0/+0" -> extract value only
            input.value = String(parseInt(val.split('/')[0]) || 10);
        }
        else {
            input.value = String(val || 10);
        }
        updateEncAttrMod(attr);
    });
    const traitsEl = $('enc-traits');
    const equipEl = $('enc-equipment');
    const actionsEl = $('enc-actions');
    const skillsEl = $('enc-skills');
    if (traitsEl)
        traitsEl.innerHTML = sanitizeHTML(e.traits) || '';
    if (equipEl)
        equipEl.innerHTML = sanitizeHTML(e.equipment) || '';
    if (actionsEl)
        actionsEl.innerHTML = sanitizeHTML(e.actions) || '';
    if (skillsEl)
        skillsEl.innerHTML = sanitizeHTML(e.skills) || '';
    // Load saving throws (checkbox + custom value)
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        const checkbox = $(`enc-save-${attr}`);
        const valueInput = $(`enc-save-val-${attr}`);
        const box = $(`enc-save-box-${attr}`);
        if (checkbox) {
            const saveData = e.savingThrows && e.savingThrows[attr];
            const isActive = saveData === true || (typeof saveData === 'string' && saveData.length > 0);
            checkbox.checked = isActive;
            // Set custom value
            if (valueInput) {
                valueInput.value = (typeof saveData === 'string') ? saveData : '';
            }
            // Set CSS class for visual feedback
            if (box)
                box.classList.toggle('active', isActive);
        }
    });
    // Load resistances
    document.querySelectorAll('#enc-resistances .char-resistance-chip').forEach(chip => {
        const input = chip.querySelector('input');
        if (input) {
            const isSelected = (e.resistances || []).includes(input.value);
            chip.classList.toggle('selected', isSelected);
            input.checked = isSelected;
        }
    });
    // Load immunities
    document.querySelectorAll('#enc-immunities .char-resistance-chip').forEach(chip => {
        const input = chip.querySelector('input');
        if (input) {
            const isSelected = (e.immunities || []).includes(input.value);
            chip.classList.toggle('selected', isSelected);
            input.checked = isSelected;
        }
    });
    // Load condition immunities
    document.querySelectorAll('#enc-condition-immunities .char-resistance-chip').forEach(chip => {
        const input = chip.querySelector('input');
        if (input) {
            const isSelected = (e.conditionImmunities || []).includes(input.value);
            chip.classList.toggle('selected', isSelected);
            input.checked = isSelected;
        }
    });
    const form = $('enc-form');
    const icon = $('enc-form-icon');
    if (form)
        form.classList.add('open');
    if (icon)
        icon.textContent = '▲';
}
function cancelEncEdit() {
    clearFormFields({
        textFields: [
            'edit-enc-id', 'enc-name', 'enc-creature-type', 'enc-cr', 'enc-ac',
            'enc-init', 'enc-hp', 'enc-perception',
            'enc-speed-walk', 'enc-speed-climb', 'enc-speed-swim', 'enc-speed-fly', 'enc-speed-burrow',
            'enc-save-val-str', 'enc-save-val-dex', 'enc-save-val-con',
            'enc-save-val-int', 'enc-save-val-wis', 'enc-save-val-cha'
        ],
        checkboxFields: [
            'enc-save-str', 'enc-save-dex', 'enc-save-con',
            'enc-save-int', 'enc-save-wis', 'enc-save-cha'
        ],
        contentEditableFields: ['enc-traits', 'enc-equipment', 'enc-actions', 'enc-skills'],
        customHandlers: () => {
            // Reset attributes to 10 and update modifiers
            resetAttributes(['str', 'dex', 'con', 'int', 'wis', 'cha'], 'enc', 10, updateEncAttrMod);

            // Reset saving throw boxes CSS class
            ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
                const box = $(`enc-save-box-${attr}`);
                if (box) box.classList.remove('active');
            });

            // Reset languages
            if (typeof setEncLanguages === 'function') setEncLanguages([]);

            // Reset resistances, immunities, condition immunities chips
            document.querySelectorAll('#enc-resistances .char-resistance-chip, #enc-immunities .char-resistance-chip, #enc-condition-immunities .char-resistance-chip').forEach(chip => {
                chip.classList.remove('selected');
                const input = chip.querySelector('input');
                if (input) input.checked = false;
            });
        }
    });

    // Collapse form
    const form = $('enc-form');
    const icon = $('enc-form-icon');
    if (form) form.classList.remove('open');
    if (icon) icon.textContent = '▼';
}
/**
 * Deletes an encounter/enemy after confirmation
 */
function deleteEnc(id) {
    const renderEncounters = window.renderEncounters;
    deleteWithConfirm({
        entityType: 'encounters',
        id: id,
        confirmMessage: null, // Use default message
        undoLabel: 'Gegner gelöscht',
        onSuccess: () => {
            renderEncounters();
            showToast('✅ Gegner gelöscht', 'success');
        }
    });
}
function addEncToInit(id) {
    const D = window.D;
    const sortInit = window.sortInit;
    const e = EntityLookup.encounter(id);
    if (!e)
        return;
    D.initiative.combatants.push({
        id: nextId('combatants'),
        name: e.name,
        initiative: e.init || 0,
        maxHp: e.hp || 10,
        currentHp: e.hp || 10,
        ac: e.ac || e.armorClass || 10,
        type: 'enemy',
        effects: []
    });
    sortInit();
    showToast('Zu Initiative hinzugefügt');
}
// Encounter Language Dropdown Functions
function toggleEncLangDropdown() {
    const wrapper = $('enc-languages-wrapper');
    if (wrapper) {
        wrapper.classList.toggle('open');
    }
}
function updateEncLanguages() {
    const checkboxes = document.querySelectorAll('#enc-lang-dropdown input[type="checkbox"]:checked');
    const selected = Array.from(checkboxes).map(cb => cb.value);
    const display = $('enc-lang-display');
    if (display) {
        if (selected.length === 0) {
            display.textContent = 'Sprachen wählen...';
            display.style.color = 'var(--text-dim)';
        }
        else if (selected.length <= 3) {
            display.textContent = selected.join(', ');
            display.style.color = 'var(--text)';
        }
        else {
            display.textContent = selected.slice(0, 2).join(', ') + ' +' + (selected.length - 2);
            display.style.color = 'var(--text)';
        }
    }
}
function getEncSelectedLanguages() {
    const checkboxes = document.querySelectorAll('#enc-lang-dropdown input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}
function setEncLanguages(languages) {
    // Reset all checkboxes
    document.querySelectorAll('#enc-lang-dropdown input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    // Set selected languages
    if (Array.isArray(languages)) {
        languages.forEach(lang => {
            const cb = document.querySelector('#enc-lang-dropdown input[value="' + lang + '"]');
            if (cb)
                cb.checked = true;
        });
    }
    updateEncLanguages();
}
// Close dropdown when clicking outside
document.addEventListener('click', function (e) {
    const wrapper = $('enc-languages-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
        wrapper.classList.remove('open');
    }
});
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.updateEncAttrMod = updateEncAttrMod;
window.toggleEncSaveBox = toggleEncSaveBox;
window.saveEncounter = saveEncounter;
window.editEnc = editEnc;
window.cancelEncEdit = cancelEncEdit;
window.deleteEnc = deleteEnc;
window.addEncToInit = addEncToInit;
window.toggleEncLangDropdown = toggleEncLangDropdown;
window.updateEncLanguages = updateEncLanguages;
window.getEncSelectedLanguages = getEncSelectedLanguages;
window.setEncLanguages = setEncLanguages;
