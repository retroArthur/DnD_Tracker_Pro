// [SECTION:PARTY_CRUD]
// ============================================================
// PARTY CRUD - @create @edit @delete @character
// ============================================================

// Update attribute modifier display in char form
function updateAttrMod(attr) {
    const input = $(`char-${attr}`);
    const modEl = $(`char-${attr}-mod`);
    if (!input || !modEl) return;

    const val = parseInt(input.value) || 10;
    const mod = Math.floor((val - 10) / 2);
    modEl.textContent = mod >= 0 ? `+${mod}` : `${mod}`;
}

// Update initiative from DEX modifier
function updateInitFromDex() {
    const dexVal = parseInt($('char-dex')?.value) || 10;
    const dexMod = Math.floor((dexVal - 10) / 2);
    const initInput = $('char-init');
    if (initInput && !initInput.value) {
        initInput.value = dexMod;
    }
}

// Update speed display (meters to feet conversion)
function updateSpeedDisplay() {
    const speedSelect = $('char-speed');
    const ftDisplay = $('char-speed-ft');
    if (!speedSelect || !ftDisplay) return;

    const selected = speedSelect.options[speedSelect.selectedIndex];
    const ft = selected?.getAttribute('data-ft') || '30';
    ftDisplay.textContent = ft + 'ft';
}
// Avatar preview - sichere Implementierung
function updateAvatarPreview(url) {
    const preview = $('cf-avatar-preview');
    if (!preview) return;

    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        // Sichere Erstellung ohne innerHTML mit User-Input
        preview.innerHTML = '';
        const img = document.createElement('img');
        img.src = esc(url);
        img.alt = 'Avatar Preview';
        img.onerror = function() {
            this.parentElement.innerHTML = '<span class="cf-avatar-placeholder">?</span>';
        };
        preview.appendChild(img);
    } else {
        preview.innerHTML = '<span class="cf-avatar-placeholder">?</span>';
    }
}

// Language dropdown functions
function toggleLangDropdown() {
    const wrapper = $('cf-languages-wrapper');
    if (wrapper) {
        wrapper.classList.toggle('open');
    }
}

function updateCharLanguages() {
    // Collect checked languages from dropdown
    const checkboxes = document.querySelectorAll('#cf-lang-dropdown input[type="checkbox"]');
    const selected = [];
    checkboxes.forEach(cb => {
        cb.closest('.cf-lang-item').classList.toggle('selected', cb.checked);
        if (cb.checked) selected.push(cb.value);
    });

    // Update hidden select for form submission
    const hiddenSelect = $('char-languages');
    if (hiddenSelect) {
        // Clear existing options
        hiddenSelect.innerHTML = '';
        // Add selected options
        selected.forEach(lang => {
            const opt = document.createElement('option');
            opt.value = lang;
            opt.selected = true;
            hiddenSelect.appendChild(opt);
        });
    }

    // Update display text
    const display = $('cf-lang-display');
    if (display) {
        if (selected.length === 0) {
            display.textContent = 'Sprachen wählen...';
            display.classList.remove('has-selection');
        } else if (selected.length <= 3) {
            display.textContent = selected.join(', ');
            display.classList.add('has-selection');
        } else {
            display.textContent = `${selected.slice(0, 2).join(', ')} +${selected.length - 2}`;
            display.classList.add('has-selection');
        }
    }
}

function setCharLanguages(languages) {
    // Set languages in the dropdown checkboxes
    const checkboxes = document.querySelectorAll('#cf-lang-dropdown input[type="checkbox"]');
    const langArray = Array.isArray(languages) ? languages :
                      (languages ? languages.split(',').map(l => l.trim()) : []);

    checkboxes.forEach(cb => {
        cb.checked = langArray.includes(cb.value);
        cb.closest('.cf-lang-item').classList.toggle('selected', cb.checked);
    });

    updateCharLanguages();
}

function clearCharLanguages() {
    const checkboxes = document.querySelectorAll('#cf-lang-dropdown input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = false;
        cb.closest('.cf-lang-item').classList.remove('selected');
    });
    updateCharLanguages();

    // Close dropdown if open
    const wrapper = $('cf-languages-wrapper');
    if (wrapper) wrapper.classList.remove('open');
}

// Close language dropdown when clicking outside
document.addEventListener('click', function(e) {
    const wrapper = $('cf-languages-wrapper');
    if (!wrapper) return;

    // If click is inside the wrapper, don't close
    if (wrapper.contains(e.target)) return;

    // Close the dropdown
    wrapper.classList.remove('open');
});

/**
 * Speichert oder aktualisiert einen Charakter
 * Liest Formulardaten und erstellt/aktualisiert den Charakter-Eintrag
 */
function saveCharacter() {
    const id = $('edit-char-id').value;
    const languageSelect = $('char-languages');
    const selectedLanguages = Array.from(languageSelect.selectedOptions).map(o => o.value);

    // Collect spell slots (including slot 0 for cantrips)
    const spellSlots = {};
    for (let i = 0; i <= 9; i++) {
        const max = parseInt($(`char-slot-${i}`).value) || 0;
        spellSlots[i] = { max: max, current: max };
    }

    // Collect attributes
    const attributes = {
        str: parseInt($('char-str').value) || 10,
        dex: parseInt($('char-dex').value) || 10,
        con: parseInt($('char-con').value) || 10,
        int: parseInt($('char-int').value) || 10,
        wis: parseInt($('char-wis').value) || 10,
        cha: parseInt($('char-cha').value) || 10
    };

    // Collect saving throw proficiencies
    const saveProficiencies = {
        str: $('char-save-str').checked,
        dex: $('char-save-dex').checked,
        con: $('char-save-con').checked,
        int: $('char-save-int').checked,
        wis: $('char-save-wis').checked,
        cha: $('char-save-cha').checked
    };

    // Collect resistances and immunities
    const resistances = Array.from(document.querySelectorAll('#char-resistances .cf-chip input:checked')).map(i => i.value);
    const immunities = Array.from(document.querySelectorAll('#char-immunities .cf-chip input:checked')).map(i => i.value);

    const ch = {
        name: $('char-name').value.trim(),
        playerName: $('char-player').value.trim(),
        characterClass: $('char-class').value,
        subclass: $('char-subclass').value.trim(),
        race: $('char-race').value,
        level: parseInt($('char-level').value) || 1,
        background: $('char-background').value.trim(),
        alignment: $('char-alignment').value,
        weight: parseInt($('char-weight').value) || 0,
        attributes: attributes,
        saveProficiencies: saveProficiencies,
        hpCurrent: parseInt($('char-hp-cur').value) || 0,
        hpMax: parseInt($('char-hp-max').value) || 0,
        tempHp: parseInt($('char-hp-temp').value) || 0,
        armorClass: parseInt($('char-ac').value) || 10,
        initiative: parseInt($('char-init').value) || 0,
        speed: $('char-speed').value.trim() || '9m',
        proficiencyBonus: getProficiencyBonus(parseInt($('char-level').value) || 1),
        hitDice: $('char-hitdice').value.trim(),
        passivePerception: parseInt($('char-perception').value) || 10,
        inspiration: $('char-inspiration').checked,
        resistances: resistances,
        immunities: immunities,
        languages: selectedLanguages,
        spellSlots: spellSlots,
        currency: {
            pm: parseInt($('char-pm').value) || 0,
            gm: parseInt($('char-gm').value) || 0,
            em: parseInt($('char-em').value) || 0,
            sm: parseInt($('char-sm').value) || 0,
            km: parseInt($('char-km').value) || 0
        },
        notes: sanitizeHTML($('char-notes').innerHTML),
        avatar: $('char-avatar') ? $('char-avatar').value.trim() : '',
        height: parseInt($('char-height').value) || 0
    };
    if (!ch.name) { showToast('⚠️ Name erforderlich', 'error'); return; }

    pushUndo(id ? 'Charakter bearbeitet' : 'Charakter erstellt');

    if (id) {
        const idx = D.characters.findIndex(c => c.id === parseEntityId(id));
        if (idx > -1) {
            // Preserve current slot values when editing
            const existing = D.characters[idx];
            if (existing.spellSlots) {
                for (let i = 0; i <= 9; i++) {
                    if (existing.spellSlots[i] && ch.spellSlots[i].max === existing.spellSlots[i].max) {
                        ch.spellSlots[i].current = existing.spellSlots[i].current;
                    }
                }
            }
            D.characters[idx] = { ...D.characters[idx], ...ch };
        }
    }
    else { ch.id = nextId('characters'); ch.spells = []; ch.items = []; D.characters.push(ch); }

    cancelCharEdit(); renderParty(); save();
    showToast(id ? 'Charakter aktualisiert' : 'Charakter hinzugefügt');
}

/**
 * Oeffnet das Bearbeitungsformular fuer einen Charakter
 * @param {number|string} id - Charakter ID
 */
function editChar(id) {
    const ch = EntityLookup.character(id); if (!ch) return;
    $('edit-char-id').value = id;

    // Basic info
    $('char-name').value = ch.name || '';
    $('char-player').value = ch.playerName || '';
    $('char-class').value = ch.characterClass || '';
    $('char-subclass').value = ch.subclass || '';
    $('char-race').value = ch.race || '';
    $('char-level').value = ch.level || 1;
    $('char-background').value = ch.background || '';
    $('char-alignment').value = ch.alignment || '';
    $('char-weight').value = ch.weight || '';

    // Attributes
    const attrs = ch.attributes || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        $(`char-${attr}`).value = attrs[attr] || 10;
        updateAttrMod(attr);
    });

    // Saving throw proficiencies
    const saves = ch.saveProficiencies || {};
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        const checkbox = $(`char-save-${attr}`);
        checkbox.checked = saves[attr] || false;
    });

    // Combat stats
    $('char-hp-cur').value = ch.hpCurrent || '';
    $('char-hp-max').value = ch.hpMax || '';
    $('char-hp-temp').value = ch.tempHp || '';
    $('char-ac').value = ch.armorClass || '';
    $('char-init').value = ch.initiative || '';

    // Speed - handle both old format (just "9m") and new format ("9m|30ft.")
    const speedVal = ch.speed || '9m|30ft.';
    const speedSelect = $('char-speed');
    if (speedSelect) {
        // Try to find matching option
        let found = false;
        for (let opt of speedSelect.options) {
            if (opt.value === speedVal || opt.value.startsWith(speedVal.split('|')[0])) {
                opt.selected = true;
                found = true;
                break;
            }
        }
        if (!found) speedSelect.value = '9m|30ft.';
        updateSpeedDisplay();
    }

    $('char-hitdice').value = ch.hitDice || '';
    $('char-perception').value = ch.passivePerception || '';
    updateProficiencyBonus();

    // Inspiration
    $('char-inspiration').checked = ch.inspiration || false;

    // Resistances and immunities
    document.querySelectorAll('#char-resistances .cf-chip').forEach(chip => {
        const input = chip.querySelector('input');
        const val = input.value;
        input.checked = (ch.resistances || []).includes(val);
        chip.classList.toggle('selected', input.checked);
    });
    document.querySelectorAll('#char-immunities .cf-chip').forEach(chip => {
        const input = chip.querySelector('input');
        const val = input.value;
        input.checked = (ch.immunities || []).includes(val);
        chip.classList.toggle('selected', input.checked);
    });

    // Languages - use new dropdown with checkboxes
    setCharLanguages(ch.languages);

    // Spell slots
    for (let i = 0; i <= 9; i++) {
        const slot = ch.spellSlots && ch.spellSlots[i];
        $(`char-slot-${i}`).value = slot ? slot.max : 0;
    }

    // Currency and notes
    $('char-notes').innerHTML = sanitizeHTML(ch.notes) || '';
    const cur = ch.currency || {};
    $('char-pm').value = cur.pm || 0;
    $('char-gm').value = cur.gm || 0;
    $('char-em').value = cur.em || 0;
    $('char-sm').value = cur.sm || 0;
    $('char-km').value = cur.km || 0;

    // Avatar and height
    if ($('char-avatar')) $('char-avatar').value = ch.avatar || '';
    if ($('char-height')) $('char-height').value = ch.height || '';

    $('char-form').classList.add('open');
    $('char-form-icon').textContent = '▲';
}

function cancelCharEdit() {
    $('edit-char-id').value = '';

    // Basic fields
    ['char-name', 'char-player', 'char-subclass', 'char-level', 'char-background', 'char-weight', 'char-height', 'char-hp-cur', 'char-hp-max', 'char-hp-temp', 'char-ac', 'char-init', 'char-hitdice', 'char-perception', 'char-avatar'].forEach(id => {
        if ($(id)) $(id).value = '';
    });
    $('char-class').value = '';
    $('char-race').value = '';
    $('char-alignment').value = '';
    $('char-level').value = '1';
    $('char-proficiency').value = '+2';

    // Speed reset to default
    const speedSelect = $('char-speed');
    if (speedSelect) {
        speedSelect.value = '9m|30ft.';
        updateSpeedDisplay();
    }

    // Attributes
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        $(`char-${attr}`).value = '10';
        updateAttrMod(attr);
    });

    // Saving throws
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        $(`char-save-${attr}`).checked = false;
    });

    // Inspiration
    $('char-inspiration').checked = false;

    // Resistances and immunities
    document.querySelectorAll('.cf-chip').forEach(chip => {
        chip.classList.remove('selected');
        const input = chip.querySelector('input');
        if (input) input.checked = false;
    });

    // Languages - clear dropdown checkboxes
    clearCharLanguages();

    // Spell slots
    for (let i = 0; i <= 9; i++) { $(`char-slot-${i}`).value = 0; }

    // Notes and currency
    $('char-notes').innerHTML = '';
    ['char-pm', 'char-gm', 'char-em', 'char-sm', 'char-km'].forEach(id => $(id).value = '0');

    // Formular schließen
    $('char-form').classList.remove('open');
    $('char-form-icon').textContent = '▼';
}

// Attribute helper - nutzt globale getAttrMod() und getProfBonus() Funktionen
// getProficiencyBonus entfernt - verwende getProfBonus() aus utilities.js

function updateProficiencyBonus() {
    const level = parseInt($('char-level').value) || 1;
    const bonus = getProfBonus(level);
    $('char-proficiency').value = `+${bonus}`;
}

/**
 * Loescht einen Charakter nach Bestaetigung
 * @param {number|string} id - Charakter ID
 */
function deleteChar(id) {
    deleteWithConfirm({
        entityType: 'characters',
        id: id,
        confirmMessage: null, // Use default message
        undoLabel: 'Charakter gelöscht',
        onSuccess: () => {
            renderParty();
            showToast('✅ Charakter gelöscht', 'success');
        }
    });
}
