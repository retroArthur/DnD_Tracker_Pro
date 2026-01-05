// [SECTION:ENCOUNTERS_CRUD]
// ============================================================
// ENCOUNTERS CRUD - @create @edit @delete @save
// ============================================================

function updateEncAttrMod(attr) {
    const val = parseInt($(`enc-${attr}`).value) || 10;
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
 * Speichert oder aktualisiert einen Encounter/Gegner
 * Liest Formulardaten und erstellt/aktualisiert den Encounter-Eintrag
 */
function saveEncounter() {
    const id = $('edit-enc-id').value;
    const selectedLanguages = typeof getEncSelectedLanguages === 'function' ? getEncSelectedLanguages() : [];

    // Saving throws sammeln (checkbox + custom value)
    const savingThrows = {};
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        const checkbox = $(`enc-save-${attr}`);
        const valueInput = $(`enc-save-val-${attr}`);
        if (checkbox && checkbox.checked) {
            const customVal = valueInput ? valueInput.value.trim() : '';
            savingThrows[attr] = customVal || true; // Store custom value or true for proficiency-only
        }
    });

    // Resistenzen & Immunitäten sammeln
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
    if (!e.name) { showToast('⚠️ Name erforderlich', 'error'); return; }

    if (id) {
        const idx = D.encounters.findIndex(x => x.id === parseEntityId(id));
        if (idx > -1) D.encounters[idx] = { ...D.encounters[idx], ...e };
    } else {
        e.id = nextId('encounters');
        D.encounters.push(e);
    }

    cancelEncEdit();
    // Formular einklappen
    $('enc-form').classList.remove('open');
    $('enc-form-icon').textContent = '▼';
    renderEncounters();
    save();
}

/**
 * Oeffnet das Bearbeitungsformular fuer einen Encounter/Gegner
 * @param {number|string} id - Encounter ID
 */
function editEnc(id) {
    const e = EntityLookup.encounter(id);
    if (!e) return;

    $('edit-enc-id').value = id;
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
    } else {
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
    } else if (e.languages) {
        // Old format: comma-separated string
        langs = e.languages.split(',').map(l => l.trim());
    }
    if (typeof setEncLanguages === 'function') {
        setEncLanguages(langs);
    }

    // Attribute als Zahlen laden (oder alte Format-Konversion)
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        const val = e[attr];
        if (typeof val === 'string' && val.includes('/')) {
            // Altes Format: "10/+0/+0" -> nur Wert extrahieren
            $(`enc-${attr}`).value = parseInt(val.split('/')[0]) || 10;
        } else {
            $(`enc-${attr}`).value = val || 10;
        }
        updateEncAttrMod(attr);
    });

    $('enc-traits').innerHTML = sanitizeHTML(e.traits) || '';
    $('enc-equipment').innerHTML = sanitizeHTML(e.equipment) || '';
    $('enc-actions').innerHTML = sanitizeHTML(e.actions) || '';
    $('enc-skills').innerHTML = sanitizeHTML(e.skills) || '';

    // Rettungswürfe laden (checkbox + custom value)
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        const checkbox = $(`enc-save-${attr}`);
        const valueInput = $(`enc-save-val-${attr}`);
        const box = $(`enc-save-box-${attr}`);

        if (checkbox) {
            const saveData = e.savingThrows && e.savingThrows[attr];
            const isActive = saveData === true || (typeof saveData === 'string' && saveData.length > 0);
            checkbox.checked = isActive;

            // Custom value setzen
            if (valueInput) {
                valueInput.value = (typeof saveData === 'string') ? saveData : '';
            }

            // CSS-Klasse für visuelles Feedback setzen
            if (box) box.classList.toggle('active', isActive);
        }
    });

    // Resistenzen laden
    document.querySelectorAll('#enc-resistances .char-resistance-chip').forEach(chip => {
        const input = chip.querySelector('input');
        const isSelected = (e.resistances || []).includes(input.value);
        chip.classList.toggle('selected', isSelected);
        input.checked = isSelected;
    });

    // Immunitäten laden
    document.querySelectorAll('#enc-immunities .char-resistance-chip').forEach(chip => {
        const input = chip.querySelector('input');
        const isSelected = (e.immunities || []).includes(input.value);
        chip.classList.toggle('selected', isSelected);
        input.checked = isSelected;
    });

    // Zustandsimmunitäten laden
    document.querySelectorAll('#enc-condition-immunities .char-resistance-chip').forEach(chip => {
        const input = chip.querySelector('input');
        const isSelected = (e.conditionImmunities || []).includes(input.value);
        chip.classList.toggle('selected', isSelected);
        input.checked = isSelected;
    });

    $('enc-form').classList.add('open');
    $('enc-form-icon').textContent = '▲';
}

function cancelEncEdit() {
    $('edit-enc-id').value = '';
    ['enc-name', 'enc-creature-type', 'enc-cr', 'enc-ac', 'enc-init', 'enc-hp', 'enc-perception'].forEach(id => $(id).value = '');
    // Clear all speed fields
    ['enc-speed-walk', 'enc-speed-climb', 'enc-speed-swim', 'enc-speed-fly', 'enc-speed-burrow'].forEach(id => $(id).value = '');
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        $(`enc-${attr}`).value = 10;
        updateEncAttrMod(attr);
        // Reset saving throw checkboxes, values und CSS-Klasse
        const checkbox = $(`enc-save-${attr}`);
        const valueInput = $(`enc-save-val-${attr}`);
        const box = $(`enc-save-box-${attr}`);
        if (checkbox) checkbox.checked = false;
        if (valueInput) valueInput.value = '';
        if (box) box.classList.remove('active');
    });
    if (typeof setEncLanguages === 'function') setEncLanguages([]);
    // Resistenzen & Immunitäten zurücksetzen
    document.querySelectorAll('#enc-resistances .char-resistance-chip, #enc-immunities .char-resistance-chip, #enc-condition-immunities .char-resistance-chip').forEach(chip => {
        chip.classList.remove('selected');
        const input = chip.querySelector('input');
        if (input) input.checked = false;
    });
    $('enc-traits').innerHTML = '';
    $('enc-equipment').innerHTML = '';
    $('enc-actions').innerHTML = '';
    $('enc-skills').innerHTML = '';
    // Formular einklappen
    $('enc-form').classList.remove('open');
    $('enc-form-icon').textContent = '▼';
}

/**
 * Loescht einen Encounter/Gegner nach Bestaetigung
 * @param {number|string} id - Encounter ID
 */
function deleteEnc(id) {
    const enc = EntityLookup.encounter(id);
    if (confirm(`Gegner "${enc?.name || 'Unbekannt'}" löschen?`)) {
        pushUndo('Gegner gelöscht');
        D.encounters = D.encounters.filter(e => e.id !== id);
        renderEncounters();
        save();
    }
}

function addEncToInit(id) {
    const e = EntityLookup.encounter(id);
    if (!e) return;
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
        } else if (selected.length <= 3) {
            display.textContent = selected.join(', ');
            display.style.color = 'var(--text)';
        } else {
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
            if (cb) cb.checked = true;
        });
    }
    
    updateEncLanguages();
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const wrapper = $('enc-languages-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
        wrapper.classList.remove('open');
    }
});
