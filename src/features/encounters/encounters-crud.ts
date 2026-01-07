// [SECTION:ENCOUNTERS_CRUD]
// ============================================================
// ENCOUNTERS CRUD - @create @edit @delete @save
// ============================================================

import { $, sanitizeHTML } from '@utils/basic';
import { showToast, nextId, parseEntityId } from '@utils/utilities';
import { save } from '@systems/spellslots/persistence';
import { EntityLookup } from '@render/helpers';
import { deleteWithConfirm } from '@utils/crud-helpers';

export function updateEncAttrMod(attr: string): void {
    const attrEl = $(`enc-${attr}`) as HTMLInputElement | null;
    const val = parseInt(attrEl?.value || '10') || 10;
    const mod = Math.floor((val - 10) / 2);
    const modEl = $(`enc-${attr}-mod`);
    if (modEl) {
        modEl.textContent = mod >= 0 ? `+${mod}` : `${mod}`;
        modEl.className = 'attr-mod' + (mod > 0 ? ' positive' : mod < 0 ? ' negative' : '');
    }
}

// Toggle encounter saving throw box active state
export function toggleEncSaveBox(attr: string): void {
    const box = $(`enc-save-box-${attr}`);
    const checkbox = $(`enc-save-${attr}`) as HTMLInputElement | null;
    if (box && checkbox) {
        box.classList.toggle('active', checkbox.checked);
    }
}

/**
 * Saves or updates an encounter/enemy
 * Reads form data and creates/updates the encounter entry
 */
export function saveEncounter(): void {
    const D = (window as any).D;
    const renderEncounters = (window as any).renderEncounters;
    const sortInit = (window as any).sortInit;

    const idInput = $('edit-enc-id') as HTMLInputElement | null;
    const id = idInput?.value || '';
    const selectedLanguages = typeof getEncSelectedLanguages === 'function' ? getEncSelectedLanguages() : [];

    // Collect saving throws (checkbox + custom value)
    const savingThrows: Record<string, string | boolean> = {};
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        const checkbox = $(`enc-save-${attr}`) as HTMLInputElement | null;
        const valueInput = $(`enc-save-val-${attr}`) as HTMLInputElement | null;
        if (checkbox && checkbox.checked) {
            const customVal = valueInput?.value?.trim() || '';
            savingThrows[attr] = customVal || true; // Store custom value or true for proficiency-only
        }
    });

    // Collect resistances & immunities
    const resistances = Array.from(document.querySelectorAll('#enc-resistances .char-resistance-chip.selected input') as NodeListOf<HTMLInputElement>).map(i => i.value);
    const immunities = Array.from(document.querySelectorAll('#enc-immunities .char-resistance-chip.selected input') as NodeListOf<HTMLInputElement>).map(i => i.value);
    const conditionImmunities = Array.from(document.querySelectorAll('#enc-condition-immunities .char-resistance-chip.selected input') as NodeListOf<HTMLInputElement>).map(i => i.value);

    const e: any = {
        name: ($('enc-name') as HTMLInputElement).value.trim(),
        creatureType: ($('enc-creature-type') as HTMLInputElement).value,
        cr: ($('enc-cr') as HTMLInputElement).value,
        ac: parseInt(($('enc-ac') as HTMLInputElement).value) || 0,
        init: parseInt(($('enc-init') as HTMLInputElement).value) || 0,
        hp: parseInt(($('enc-hp') as HTMLInputElement).value) || 0,
        speed: {
            walk: ($('enc-speed-walk') as HTMLInputElement).value.trim() || '',
            climb: ($('enc-speed-climb') as HTMLInputElement).value.trim() || '',
            swim: ($('enc-speed-swim') as HTMLInputElement).value.trim() || '',
            fly: ($('enc-speed-fly') as HTMLInputElement).value.trim() || '',
            burrow: ($('enc-speed-burrow') as HTMLInputElement).value.trim() || ''
        },
        perception: parseInt(($('enc-perception') as HTMLInputElement).value) || 0,
        languages: selectedLanguages,
        str: parseInt(($('enc-str') as HTMLInputElement).value) || 10,
        dex: parseInt(($('enc-dex') as HTMLInputElement).value) || 10,
        con: parseInt(($('enc-con') as HTMLInputElement).value) || 10,
        int: parseInt(($('enc-int') as HTMLInputElement).value) || 10,
        wis: parseInt(($('enc-wis') as HTMLInputElement).value) || 10,
        cha: parseInt(($('enc-cha') as HTMLInputElement).value) || 10,
        savingThrows: savingThrows,
        resistances: resistances,
        immunities: immunities,
        conditionImmunities: conditionImmunities,
        traits: sanitizeHTML(($('enc-traits') as HTMLElement).innerHTML),
        equipment: sanitizeHTML(($('enc-equipment') as HTMLElement).innerHTML),
        actions: sanitizeHTML(($('enc-actions') as HTMLElement).innerHTML),
        skills: sanitizeHTML(($('enc-skills') as HTMLElement).innerHTML)
    };
    if (!e.name) { showToast('⚠️ Name erforderlich', 'error'); return; }

    if (id) {
        const idx = D.encounters.findIndex((x: any) => x.id === parseEntityId(id));
        if (idx > -1) D.encounters[idx] = { ...D.encounters[idx], ...e };
    } else {
        e.id = nextId('encounters');
        D.encounters.push(e);
    }

    cancelEncEdit();
    // Collapse form
    const form = $('enc-form');
    const icon = $('enc-form-icon');
    if (form) form.classList.remove('open');
    if (icon) icon.textContent = '▼';
    renderEncounters();
    save();
}

/**
 * Opens the edit form for an encounter/enemy
 */
export function editEnc(id: number | string): void {
    const e = EntityLookup.encounter(id);
    if (!e) return;

    const idInput = $('edit-enc-id') as HTMLInputElement;
    if (idInput) idInput.value = String(id);

    ($('enc-name') as HTMLInputElement).value = e.name;
    ($('enc-creature-type') as HTMLInputElement).value = e.creatureType || '';
    ($('enc-cr') as HTMLInputElement).value = e.cr || '';
    ($('enc-ac') as HTMLInputElement).value = e.ac || '';
    ($('enc-init') as HTMLInputElement).value = e.init || '';
    ($('enc-hp') as HTMLInputElement).value = e.hp || '';

    // Load speed values (support both old string format and new object format)
    if (typeof e.speed === 'object' && e.speed !== null) {
        ($('enc-speed-walk') as HTMLInputElement).value = e.speed.walk || '';
        ($('enc-speed-climb') as HTMLInputElement).value = e.speed.climb || '';
        ($('enc-speed-swim') as HTMLInputElement).value = e.speed.swim || '';
        ($('enc-speed-fly') as HTMLInputElement).value = e.speed.fly || '';
        ($('enc-speed-burrow') as HTMLInputElement).value = e.speed.burrow || '';
    } else {
        // Old format: single string -> put in walk
        ($('enc-speed-walk') as HTMLInputElement).value = e.speed || '';
        ($('enc-speed-climb') as HTMLInputElement).value = '';
        ($('enc-speed-swim') as HTMLInputElement).value = '';
        ($('enc-speed-fly') as HTMLInputElement).value = '';
        ($('enc-speed-burrow') as HTMLInputElement).value = '';
    }

    ($('enc-perception') as HTMLInputElement).value = e.perception || '';

    // Handle languages (array or string for backwards compatibility)
    let langs: string[] = [];
    if (Array.isArray(e.languages)) {
        langs = e.languages;
    } else if (e.languages) {
        // Old format: comma-separated string
        langs = e.languages.split(',').map((l: string) => l.trim());
    }
    if (typeof setEncLanguages === 'function') {
        setEncLanguages(langs);
    }

    // Load attributes as numbers (or old format conversion)
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        const val = e[attr];
        const input = $(`enc-${attr}`) as HTMLInputElement;
        if (typeof val === 'string' && val.includes('/')) {
            // Old format: "10/+0/+0" -> extract value only
            input.value = String(parseInt(val.split('/')[0]) || 10);
        } else {
            input.value = String(val || 10);
        }
        updateEncAttrMod(attr);
    });

    const traitsEl = $('enc-traits') as HTMLElement;
    const equipEl = $('enc-equipment') as HTMLElement;
    const actionsEl = $('enc-actions') as HTMLElement;
    const skillsEl = $('enc-skills') as HTMLElement;

    if (traitsEl) traitsEl.innerHTML = sanitizeHTML(e.traits) || '';
    if (equipEl) equipEl.innerHTML = sanitizeHTML(e.equipment) || '';
    if (actionsEl) actionsEl.innerHTML = sanitizeHTML(e.actions) || '';
    if (skillsEl) skillsEl.innerHTML = sanitizeHTML(e.skills) || '';

    // Load saving throws (checkbox + custom value)
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        const checkbox = $(`enc-save-${attr}`) as HTMLInputElement | null;
        const valueInput = $(`enc-save-val-${attr}`) as HTMLInputElement | null;
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
            if (box) box.classList.toggle('active', isActive);
        }
    });

    // Load resistances
    document.querySelectorAll('#enc-resistances .char-resistance-chip').forEach(chip => {
        const input = chip.querySelector('input') as HTMLInputElement | null;
        if (input) {
            const isSelected = (e.resistances || []).includes(input.value);
            chip.classList.toggle('selected', isSelected);
            input.checked = isSelected;
        }
    });

    // Load immunities
    document.querySelectorAll('#enc-immunities .char-resistance-chip').forEach(chip => {
        const input = chip.querySelector('input') as HTMLInputElement | null;
        if (input) {
            const isSelected = (e.immunities || []).includes(input.value);
            chip.classList.toggle('selected', isSelected);
            input.checked = isSelected;
        }
    });

    // Load condition immunities
    document.querySelectorAll('#enc-condition-immunities .char-resistance-chip').forEach(chip => {
        const input = chip.querySelector('input') as HTMLInputElement | null;
        if (input) {
            const isSelected = (e.conditionImmunities || []).includes(input.value);
            chip.classList.toggle('selected', isSelected);
            input.checked = isSelected;
        }
    });

    const form = $('enc-form');
    const icon = $('enc-form-icon');
    if (form) form.classList.add('open');
    if (icon) icon.textContent = '▲';
}

export function cancelEncEdit(): void {
    const idInput = $('edit-enc-id') as HTMLInputElement;
    if (idInput) idInput.value = '';

    ['enc-name', 'enc-creature-type', 'enc-cr', 'enc-ac', 'enc-init', 'enc-hp', 'enc-perception'].forEach(id => {
        const el = $(id) as HTMLInputElement | null;
        if (el) el.value = '';
    });

    // Clear all speed fields
    ['enc-speed-walk', 'enc-speed-climb', 'enc-speed-swim', 'enc-speed-fly', 'enc-speed-burrow'].forEach(id => {
        const el = $(id) as HTMLInputElement | null;
        if (el) el.value = '';
    });

    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        const input = $(`enc-${attr}`) as HTMLInputElement | null;
        if (input) input.value = '10';
        updateEncAttrMod(attr);

        // Reset saving throw checkboxes, values and CSS class
        const checkbox = $(`enc-save-${attr}`) as HTMLInputElement | null;
        const valueInput = $(`enc-save-val-${attr}`) as HTMLInputElement | null;
        const box = $(`enc-save-box-${attr}`);
        if (checkbox) checkbox.checked = false;
        if (valueInput) valueInput.value = '';
        if (box) box.classList.remove('active');
    });

    if (typeof setEncLanguages === 'function') setEncLanguages([]);

    // Reset resistances & immunities
    document.querySelectorAll('#enc-resistances .char-resistance-chip, #enc-immunities .char-resistance-chip, #enc-condition-immunities .char-resistance-chip').forEach(chip => {
        chip.classList.remove('selected');
        const input = chip.querySelector('input') as HTMLInputElement | null;
        if (input) input.checked = false;
    });

    const traitsEl = $('enc-traits') as HTMLElement | null;
    const equipEl = $('enc-equipment') as HTMLElement | null;
    const actionsEl = $('enc-actions') as HTMLElement | null;
    const skillsEl = $('enc-skills') as HTMLElement | null;

    if (traitsEl) traitsEl.innerHTML = '';
    if (equipEl) equipEl.innerHTML = '';
    if (actionsEl) actionsEl.innerHTML = '';
    if (skillsEl) skillsEl.innerHTML = '';

    // Collapse form
    const form = $('enc-form');
    const icon = $('enc-form-icon');
    if (form) form.classList.remove('open');
    if (icon) icon.textContent = '▼';
}

/**
 * Deletes an encounter/enemy after confirmation
 */
export function deleteEnc(id: number | string): void {
    const renderEncounters = (window as any).renderEncounters;

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

export function addEncToInit(id: number | string): void {
    const D = (window as any).D;
    const sortInit = (window as any).sortInit;

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
export function toggleEncLangDropdown(): void {
    const wrapper = $('enc-languages-wrapper');
    if (wrapper) {
        wrapper.classList.toggle('open');
    }
}

export function updateEncLanguages(): void {
    const checkboxes = document.querySelectorAll('#enc-lang-dropdown input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;
    const selected = Array.from(checkboxes).map(cb => cb.value);
    const display = $('enc-lang-display') as HTMLElement | null;

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

export function getEncSelectedLanguages(): string[] {
    const checkboxes = document.querySelectorAll('#enc-lang-dropdown input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;
    return Array.from(checkboxes).map(cb => cb.value);
}

export function setEncLanguages(languages: string[]): void {
    // Reset all checkboxes
    document.querySelectorAll('#enc-lang-dropdown input[type="checkbox"]').forEach(cb => {
        (cb as HTMLInputElement).checked = false;
    });

    // Set selected languages
    if (Array.isArray(languages)) {
        languages.forEach(lang => {
            const cb = document.querySelector('#enc-lang-dropdown input[value="' + lang + '"]') as HTMLInputElement | null;
            if (cb) cb.checked = true;
        });
    }

    updateEncLanguages();
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e: MouseEvent) {
    const wrapper = $('enc-languages-wrapper');
    if (wrapper && !wrapper.contains(e.target as Node)) {
        wrapper.classList.remove('open');
    }
});

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================

(window as any).updateEncAttrMod = updateEncAttrMod;
(window as any).toggleEncSaveBox = toggleEncSaveBox;
(window as any).saveEncounter = saveEncounter;
(window as any).editEnc = editEnc;
(window as any).cancelEncEdit = cancelEncEdit;
(window as any).deleteEnc = deleteEnc;
(window as any).addEncToInit = addEncToInit;
(window as any).toggleEncLangDropdown = toggleEncLangDropdown;
(window as any).updateEncLanguages = updateEncLanguages;
(window as any).getEncSelectedLanguages = getEncSelectedLanguages;
(window as any).setEncLanguages = setEncLanguages;
