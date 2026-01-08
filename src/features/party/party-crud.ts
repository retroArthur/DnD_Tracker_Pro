// [SECTION:PARTY_CRUD]
// ============================================================
// PARTY CRUD - @create @edit @delete @character
// ============================================================

import { $, esc, sanitizeHTML } from '@utils/basic';
import { showToast, getProfBonus, nextId, parseEntityId } from '@utils/utilities';
import { pushUndo } from '@systems/undo';
import { save } from '@systems/spellslots/persistence';
import { EntityLookup } from '@render/helpers';
import { deleteWithConfirm } from '@utils/crud-helpers';

// ============================================================
// ATTRIBUTE & UI HELPERS
// ============================================================

/**
 * Update attribute modifier display in char form
 */
export function updateAttrMod(attr: string): void {
    const input = $(`char-${attr}`) as HTMLInputElement | null;
    const modEl = $(`char-${attr}-mod`);
    if (!input || !modEl) return;

    const val = parseInt(input.value) || 10;
    const mod = Math.floor((val - 10) / 2);
    modEl.textContent = mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * Update initiative from DEX modifier
 */
export function updateInitFromDex(): void {
    const dexInput = $('char-dex') as HTMLInputElement | null;
    const dexVal = parseInt(dexInput?.value || '10') || 10;
    const dexMod = Math.floor((dexVal - 10) / 2);
    const initInput = $('char-init') as HTMLInputElement | null;
    if (initInput && !initInput.value) {
        initInput.value = String(dexMod);
    }
}

/**
 * Update speed display (meters to feet conversion)
 */
export function updateSpeedDisplay(): void {
    const speedSelect = $('char-speed') as HTMLSelectElement | null;
    const ftDisplay = $('char-speed-ft');
    if (!speedSelect || !ftDisplay) return;

    const selected = speedSelect.options[speedSelect.selectedIndex];
    const ft = selected?.getAttribute('data-ft') || '30';
    ftDisplay.textContent = ft + 'ft';
}

/**
 * Avatar preview - sichere Implementierung
 */
export function updateAvatarPreview(url: string): void {
    const preview = $('cf-avatar-preview');
    if (!preview) return;

    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        // Sichere Erstellung ohne innerHTML mit User-Input
        preview.innerHTML = '';
        const img = document.createElement('img');
        img.src = esc(url);
        img.alt = 'Avatar Preview';
        img.onerror = function() {
            if (this.parentElement) {
                this.parentElement.innerHTML = '<span class="cf-avatar-placeholder">?</span>';
            }
        };
        preview.appendChild(img);
    } else {
        preview.innerHTML = '<span class="cf-avatar-placeholder">?</span>';
    }
}

// ============================================================
// LANGUAGE DROPDOWN FUNCTIONS
// ============================================================

/**
 * Toggle language dropdown
 */
export function toggleLangDropdown(): void {
    const wrapper = $('cf-languages-wrapper');
    if (wrapper) {
        wrapper.classList.toggle('open');
    }
}

/**
 * Update character languages from dropdown
 */
export function updateCharLanguages(): void {
    // Collect checked languages from dropdown
    const checkboxes = document.querySelectorAll('#cf-lang-dropdown input[type="checkbox"]');
    const selected: string[] = [];
    checkboxes.forEach(cb => {
        const checkbox = cb as HTMLInputElement;
        const item = checkbox.closest('.cf-lang-item');
        if (item) {
            item.classList.toggle('selected', checkbox.checked);
        }
        if (checkbox.checked) selected.push(checkbox.value);
    });

    // Update hidden select for form submission
    const hiddenSelect = $('char-languages') as HTMLSelectElement | null;
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

/**
 * Set character languages in the dropdown
 */
export function setCharLanguages(languages: string[] | string | null): void {
    // Set languages in the dropdown checkboxes
    const checkboxes = document.querySelectorAll('#cf-lang-dropdown input[type="checkbox"]');
    const langArray = Array.isArray(languages) ? languages :
                      (languages ? languages.split(',').map(l => l.trim()) : []);

    checkboxes.forEach(cb => {
        const checkbox = cb as HTMLInputElement;
        checkbox.checked = langArray.includes(checkbox.value);
        const item = checkbox.closest('.cf-lang-item');
        if (item) {
            item.classList.toggle('selected', checkbox.checked);
        }
    });

    updateCharLanguages();
}

/**
 * Clear character languages
 */
export function clearCharLanguages(): void {
    const checkboxes = document.querySelectorAll('#cf-lang-dropdown input[type="checkbox"]');
    checkboxes.forEach(cb => {
        const checkbox = cb as HTMLInputElement;
        checkbox.checked = false;
        const item = checkbox.closest('.cf-lang-item');
        if (item) {
            item.classList.remove('selected');
        }
    });
    updateCharLanguages();

    // Close dropdown if open
    const wrapper = $('cf-languages-wrapper');
    if (wrapper) wrapper.classList.remove('open');
}

// Close language dropdown when clicking outside
document.addEventListener('click', function(e: MouseEvent) {
    const wrapper = $('cf-languages-wrapper');
    if (!wrapper) return;

    // If click is inside the wrapper, don't close
    if (wrapper.contains(e.target as Node)) return;

    // Close the dropdown
    wrapper.classList.remove('open');
});

// ============================================================
// CHARACTER CRUD OPERATIONS
// ============================================================

/**
 * Speichert oder aktualisiert einen Charakter
 * Liest Formulardaten und erstellt/aktualisiert den Charakter-Eintrag
 */
export function saveCharacter(): void {
    const D = (window as any).D;
    const renderParty = (window as any).renderParty;

    const idInput = $('edit-char-id') as HTMLInputElement;
    const id = idInput.value;
    const languageSelect = $('char-languages') as HTMLSelectElement;
    const selectedLanguages = Array.from(languageSelect.selectedOptions).map(o => o.value);

    // Collect spell slots (including slot 0 for cantrips)
    const spellSlots: Record<number, { max: number; current: number }> = {};
    for (let i = 0; i <= 9; i++) {
        const slotInput = $(`char-slot-${i}`) as HTMLInputElement;
        const max = parseInt(slotInput.value) || 0;
        spellSlots[i] = { max: max, current: max };
    }

    // Collect attributes
    const attributes = {
        str: parseInt(($('char-str') as HTMLInputElement).value) || 10,
        dex: parseInt(($('char-dex') as HTMLInputElement).value) || 10,
        con: parseInt(($('char-con') as HTMLInputElement).value) || 10,
        int: parseInt(($('char-int') as HTMLInputElement).value) || 10,
        wis: parseInt(($('char-wis') as HTMLInputElement).value) || 10,
        cha: parseInt(($('char-cha') as HTMLInputElement).value) || 10
    };

    // Collect saving throw proficiencies
    const saveProficiencies = {
        str: ($('char-save-str') as HTMLInputElement).checked,
        dex: ($('char-save-dex') as HTMLInputElement).checked,
        con: ($('char-save-con') as HTMLInputElement).checked,
        int: ($('char-save-int') as HTMLInputElement).checked,
        wis: ($('char-save-wis') as HTMLInputElement).checked,
        cha: ($('char-save-cha') as HTMLInputElement).checked
    };

    // Collect resistances and immunities
    const resistances = Array.from(document.querySelectorAll('#char-resistances .cf-chip input:checked'))
        .map(i => (i as HTMLInputElement).value);
    const immunities = Array.from(document.querySelectorAll('#char-immunities .cf-chip input:checked'))
        .map(i => (i as HTMLInputElement).value);

    const notesEl = $('char-notes') as HTMLElement;

    const ch: any = {
        name: ($('char-name') as HTMLInputElement).value.trim(),
        playerName: ($('char-player') as HTMLInputElement).value.trim(),
        characterClass: ($('char-class') as HTMLSelectElement).value,
        subclass: ($('char-subclass') as HTMLInputElement).value.trim(),
        race: ($('char-race') as HTMLSelectElement).value,
        level: parseInt(($('char-level') as HTMLInputElement).value) || 1,
        background: ($('char-background') as HTMLInputElement).value.trim(),
        alignment: ($('char-alignment') as HTMLSelectElement).value,
        weight: parseInt(($('char-weight') as HTMLInputElement).value) || 0,
        attributes: attributes,
        saveProficiencies: saveProficiencies,
        hpCurrent: parseInt(($('char-hp-cur') as HTMLInputElement).value) || 0,
        hpMax: parseInt(($('char-hp-max') as HTMLInputElement).value) || 0,
        tempHp: parseInt(($('char-hp-temp') as HTMLInputElement).value) || 0,
        armorClass: parseInt(($('char-ac') as HTMLInputElement).value) || 10,
        initiative: parseInt(($('char-init') as HTMLInputElement).value) || 0,
        speed: ($('char-speed') as HTMLSelectElement).value.trim() || '9m',
        proficiencyBonus: getProfBonus(parseInt(($('char-level') as HTMLInputElement).value) || 1),
        hitDice: ($('char-hitdice') as HTMLInputElement).value.trim(),
        passivePerception: parseInt(($('char-perception') as HTMLInputElement).value) || 10,
        inspiration: ($('char-inspiration') as HTMLInputElement).checked,
        resistances: resistances,
        immunities: immunities,
        languages: selectedLanguages,
        spellSlots: spellSlots,
        currency: {
            pm: parseInt(($('char-pm') as HTMLInputElement).value) || 0,
            gm: parseInt(($('char-gm') as HTMLInputElement).value) || 0,
            em: parseInt(($('char-em') as HTMLInputElement).value) || 0,
            sm: parseInt(($('char-sm') as HTMLInputElement).value) || 0,
            km: parseInt(($('char-km') as HTMLInputElement).value) || 0
        },
        notes: sanitizeHTML(notesEl.innerHTML),
        avatar: ($('char-avatar') as HTMLInputElement | null)?.value.trim() || '',
        height: parseInt(($('char-height') as HTMLInputElement | null)?.value || '0') || 0
    };

    if (!ch.name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }

    pushUndo(id ? 'Charakter bearbeitet' : 'Charakter erstellt');

    if (id) {
        const idx = D.characters.findIndex((c: any) => c.id === parseEntityId(id));
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
    } else {
        ch.id = nextId('characters');
        ch.spells = [];
        ch.items = [];
        D.characters.push(ch);
    }

    cancelCharEdit();
    renderParty();
    save();
    showToast(id ? 'Charakter aktualisiert' : 'Charakter hinzugefügt');
}

/**
 * Oeffnet das Bearbeitungsformular fuer einen Charakter
 */
export function editChar(id: number | string): void {
    const ch = EntityLookup.character(id);
    if (!ch) return;

    ($('edit-char-id') as HTMLInputElement).value = String(id);

    // Basic info
    ($('char-name') as HTMLInputElement).value = ch.name || '';
    ($('char-player') as HTMLInputElement).value = ch.playerName || '';
    ($('char-class') as HTMLSelectElement).value = ch.characterClass || '';
    ($('char-subclass') as HTMLInputElement).value = ch.subclass || '';
    ($('char-race') as HTMLSelectElement).value = ch.race || '';
    ($('char-level') as HTMLInputElement).value = String(ch.level || 1);
    ($('char-background') as HTMLInputElement).value = ch.background || '';
    ($('char-alignment') as HTMLSelectElement).value = ch.alignment || '';
    ($('char-weight') as HTMLInputElement).value = String(ch.weight || '');

    // Attributes
    const attrs = ch.attributes || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        ($(`char-${attr}`) as HTMLInputElement).value = String(attrs[attr] || 10);
        updateAttrMod(attr);
    });

    // Saving throw proficiencies
    const saves = ch.saveProficiencies || {};
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        const checkbox = $(`char-save-${attr}`) as HTMLInputElement;
        checkbox.checked = saves[attr] || false;
    });

    // Combat stats
    ($('char-hp-cur') as HTMLInputElement).value = String(ch.hpCurrent || '');
    ($('char-hp-max') as HTMLInputElement).value = String(ch.hpMax || '');
    ($('char-hp-temp') as HTMLInputElement).value = String(ch.tempHp || '');
    ($('char-ac') as HTMLInputElement).value = String(ch.armorClass || '');
    ($('char-init') as HTMLInputElement).value = String(ch.initiative || '');

    // Speed - handle both old format (just "9m") and new format ("9m|30ft.")
    const speedVal = ch.speed || '9m|30ft.';
    const speedSelect = $('char-speed') as HTMLSelectElement | null;
    if (speedSelect) {
        // Try to find matching option
        let found = false;
        for (const opt of speedSelect.options) {
            if (opt.value === speedVal || opt.value.startsWith(speedVal.split('|')[0])) {
                opt.selected = true;
                found = true;
                break;
            }
        }
        if (!found) speedSelect.value = '9m|30ft.';
        updateSpeedDisplay();
    }

    ($('char-hitdice') as HTMLInputElement).value = ch.hitDice || '';
    ($('char-perception') as HTMLInputElement).value = String(ch.passivePerception || '');
    updateProficiencyBonus();

    // Inspiration
    ($('char-inspiration') as HTMLInputElement).checked = ch.inspiration || false;

    // Resistances and immunities
    document.querySelectorAll('#char-resistances .cf-chip').forEach(chip => {
        const input = chip.querySelector('input') as HTMLInputElement;
        const val = input.value;
        input.checked = (ch.resistances || []).includes(val);
        chip.classList.toggle('selected', input.checked);
    });
    document.querySelectorAll('#char-immunities .cf-chip').forEach(chip => {
        const input = chip.querySelector('input') as HTMLInputElement;
        const val = input.value;
        input.checked = (ch.immunities || []).includes(val);
        chip.classList.toggle('selected', input.checked);
    });

    // Languages - use new dropdown with checkboxes
    setCharLanguages(ch.languages);

    // Spell slots
    for (let i = 0; i <= 9; i++) {
        const slot = ch.spellSlots && ch.spellSlots[i];
        ($(`char-slot-${i}`) as HTMLInputElement).value = String(slot ? slot.max : 0);
    }

    // Currency and notes
    ($('char-notes') as HTMLElement).innerHTML = sanitizeHTML(ch.notes) || '';
    const cur = ch.currency || {};
    ($('char-pm') as HTMLInputElement).value = String(cur.pm || 0);
    ($('char-gm') as HTMLInputElement).value = String(cur.gm || 0);
    ($('char-em') as HTMLInputElement).value = String(cur.em || 0);
    ($('char-sm') as HTMLInputElement).value = String(cur.sm || 0);
    ($('char-km') as HTMLInputElement).value = String(cur.km || 0);

    // Avatar and height
    const avatarInput = $('char-avatar') as HTMLInputElement | null;
    if (avatarInput) avatarInput.value = ch.avatar || '';
    const heightInput = $('char-height') as HTMLInputElement | null;
    if (heightInput) heightInput.value = String(ch.height || '');

    ($('char-form') as HTMLElement).classList.add('open');
    ($('char-form-icon') as HTMLElement).textContent = '▲';
}

/**
 * Cancel character edit
 */
export function cancelCharEdit(): void {
    ($('edit-char-id') as HTMLInputElement).value = '';

    // Basic fields
    ['char-name', 'char-player', 'char-subclass', 'char-level', 'char-background', 'char-weight',
     'char-height', 'char-hp-cur', 'char-hp-max', 'char-hp-temp', 'char-ac', 'char-init',
     'char-hitdice', 'char-perception', 'char-avatar'].forEach(id => {
        const el = $(id) as HTMLInputElement | null;
        if (el) el.value = '';
    });

    ($('char-class') as HTMLSelectElement).value = '';
    ($('char-race') as HTMLSelectElement).value = '';
    ($('char-alignment') as HTMLSelectElement).value = '';
    ($('char-level') as HTMLInputElement).value = '1';
    ($('char-proficiency') as HTMLInputElement).value = '+2';

    // Speed reset to default
    const speedSelect = $('char-speed') as HTMLSelectElement | null;
    if (speedSelect) {
        speedSelect.value = '9m|30ft.';
        updateSpeedDisplay();
    }

    // Attributes
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        ($(`char-${attr}`) as HTMLInputElement).value = '10';
        updateAttrMod(attr);
    });

    // Saving throws
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        ($(`char-save-${attr}`) as HTMLInputElement).checked = false;
    });

    // Inspiration
    ($('char-inspiration') as HTMLInputElement).checked = false;

    // Resistances and immunities
    document.querySelectorAll('.cf-chip').forEach(chip => {
        chip.classList.remove('selected');
        const input = chip.querySelector('input') as HTMLInputElement | null;
        if (input) input.checked = false;
    });

    // Languages - clear dropdown checkboxes
    clearCharLanguages();

    // Spell slots
    for (let i = 0; i <= 9; i++) {
        ($(`char-slot-${i}`) as HTMLInputElement).value = '0';
    }

    // Notes and currency
    ($('char-notes') as HTMLElement).innerHTML = '';
    ['char-pm', 'char-gm', 'char-em', 'char-sm', 'char-km'].forEach(id => {
        ($(id) as HTMLInputElement).value = '0';
    });

    // Formular schließen
    ($('char-form') as HTMLElement).classList.remove('open');
    ($('char-form-icon') as HTMLElement).textContent = '▼';
}

/**
 * Update proficiency bonus display
 */
export function updateProficiencyBonus(): void {
    const level = parseInt(($('char-level') as HTMLInputElement).value) || 1;
    const bonus = getProfBonus(level);
    ($('char-proficiency') as HTMLInputElement).value = `+${bonus}`;
}

/**
 * Loescht einen Charakter nach Bestaetigung
 */
export function deleteChar(id: number | string): void {
    const renderParty = (window as any).renderParty;

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

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================

(window as any).updateAttrMod = updateAttrMod;
(window as any).updateInitFromDex = updateInitFromDex;
(window as any).updateSpeedDisplay = updateSpeedDisplay;
(window as any).updateAvatarPreview = updateAvatarPreview;
(window as any).toggleLangDropdown = toggleLangDropdown;
(window as any).updateCharLanguages = updateCharLanguages;
(window as any).setCharLanguages = setCharLanguages;
(window as any).clearCharLanguages = clearCharLanguages;
(window as any).saveCharacter = saveCharacter;
(window as any).editChar = editChar;
(window as any).cancelCharEdit = cancelCharEdit;
(window as any).updateProficiencyBonus = updateProficiencyBonus;
(window as any).deleteChar = deleteChar;
