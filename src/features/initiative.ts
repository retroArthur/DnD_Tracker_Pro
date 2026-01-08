// [SECTION:INITIATIVE]
// ============================================================
// INITIATIVE - @combat @turn @round @encounter
// Konstanten: INIT_CONSTANTS, COMBATANT_TYPES (in core/constants.js)
// ============================================================

import { $, esc, sanitizeHTML } from '@utils/basic';
import { showToast, nextId, parseEntityId, debounce } from '@utils/utilities';
import { showModal, hideModal } from '@systems/spellslots/navigation';

// Import from systems/entity-links for getEntityForCombat
declare const EntityLookup: any;
declare const getEntityForCombat: any;
declare const COMBAT_CONSTANTS: any;
declare const CONDITIONS: any;
declare const CONDITION_COLORS: any;
declare const INIT_CONSTANTS: any;
declare const UI_TIMING: any;
declare const CATS: any;
declare const RARITY_COLORS: any;
declare const RARITY_LABELS: any;
declare const ORIGIN_LABELS: any;
declare const LOOT_TAG_LABELS: any;

// ============================================================
// TYPES & INTERFACES
// ============================================================

interface Combatant {
    id: number;
    name: string;
    initiative: number;
    initBonus: number;
    maxHp: number;
    currentHp: number;
    tempHp?: number;
    ac: number;
    type: string;
    cr?: string;
    xp?: number;
    effects: Effect[];
    deathSaves?: DeathSaves;
    concentration?: Concentration;
    lastRoll?: string;
}

interface Effect {
    id: number;
    name: string;
    duration: number;
    permanent: boolean;
    color: string;
    description?: string;
}

interface DeathSaves {
    successes: number;
    failures: number;
}

interface Concentration {
    active: boolean;
    spell: string;
    lastDC: number;
    pendingCheck?: number;
}

interface Initiative {
    combatants: Combatant[];
    currentTurn: number;
    round: number;
    battlefield?: BattlefieldConditions;
}

interface BattlefieldConditions {
    terrain: string;
    terrainLabel: string;
    terrainIcon: string;
    terrainMod: number;
    hasLair: boolean;
    finalXP: number;
    difficulty: string;
}

interface Character {
    id: number;
    name: string;
    hpCurrent?: number;
    hpMax?: number;
    hp?: number;
    ac?: number;
    armorClass?: number;
    level?: number;
    attributes?: {
        [key: string]: number;
    };
    spellSlots?: {
        [level: number]: {
            max: number;
            current: number;
        };
    };
    spells?: number[];
}

interface Spell {
    name: string;
    concentration?: boolean;
}

interface LootItem {
    id: number;
    name: string;
    category: string;
    rarity: string;
    quantity: number;
    weight?: number;
    value?: number;
    description?: string;
    origin?: string;
    special?: string;
    property?: string;
    tags?: string[];
    attunement?: boolean;
    assignedTo?: string;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function getCombatant(id: number): Combatant | undefined {
    const D = (window as any).D;
    return D.initiative.combatants.find((c: Combatant) => c.id === id);
}

function applyDamage(combatant: Combatant, damage: number): void {
    let remaining = Math.abs(damage);
    if (combatant.tempHp && combatant.tempHp > 0) {
        const absorbed = Math.min(combatant.tempHp, remaining);
        combatant.tempHp -= absorbed;
        remaining -= absorbed;
    }
    combatant.currentHp = Math.max(0, combatant.currentHp - remaining);
}

// ============================================================
// RENDER HELPER FUNCTIONS (Refactored from renderInit)
// ============================================================

/**
 * Get combatant entity details (AC, type, ID)
 * Uses centralized getEntityForCombat() from render/helpers.js
 * @param combatant - Initiative combatant
 * @returns { ac, entityType, entityId }
 */
function getInitCombatantDetails(combatant: Combatant): { ac: number; entityType: string | null; entityId: number | null } {
    // Use centralized lookup function
    const result = getEntityForCombat(combatant.type, combatant.name);

    // Fallback to combatant.ac if no entity found
    const ac = result.ac !== '?' ? result.ac : (combatant.ac || 10);

    return {
        ac,
        entityType: result.type,
        entityId: result.id
    };
}

/**
 * Calculate combatant HP status
 * @param combatant - Initiative combatant
 * @returns { hpPercent, hpClass }
 */
function getCombatantHpStatus(combatant: Combatant): { hpPercent: number; hpClass: string } {
    const hpPct = combatant.maxHp > 0 ? (combatant.currentHp / combatant.maxHp) * 100 : 100;
    const hpClass = hpPct <= COMBAT_CONSTANTS.HP_CRITICAL_THRESHOLD ? 'critical'
                  : hpPct <= COMBAT_CONSTANTS.HP_BLOODIED_THRESHOLD ? 'bloodied'
                  : 'healthy';
    return { hpPercent: hpPct, hpClass };
}

/**
 * Render combatant effects as HTML
 * @param combatant - Initiative combatant
 * @returns HTML string of effects
 */
function renderCombatantEffects(combatant: Combatant): string {
    if (!combatant.effects || combatant.effects.length === 0) return '';

    return combatant.effects.map(e =>
        `<span class="init-effect color-${e.color}" data-action="remove-effect" data-id="${combatant.id}" data-value="${e.id}" title="${esc(e.description || '')}&#10;Klicken zum Entfernen">${esc(e.name)} ${e.permanent ? '<span class="duration">∞</span>' : '<span class="duration">' + e.duration + 'R</span>'}</span>`
    ).join('');
}

/**
 * Render combatant spell slots for player characters
 * @param combatant - Initiative combatant
 * @param character - Linked character entity (optional)
 * @returns HTML string of spell slots
 */
function renderCombatantSpellSlots(combatant: Combatant, character: Character | null): string {
    // Default placeholder
    let spellSlotsHtml = '<div class="init-spell-slots-placeholder"></div>';

    if (combatant.type === 'player' && character && character.spellSlots) {
        const slots: string[] = [];
        for (let lvl = 1; lvl <= 9; lvl++) {
            const slot = character.spellSlots[lvl];
            if (slot && slot.max > 0) {
                const used = slot.max - (slot.current || 0);
                slots.push(`<div class="init-slot-level" title="Grad ${lvl}">
                    <span class="init-slot-label">${lvl}</span>
                    <div class="init-slot-boxes">${Array(slot.max).fill(0).map((_, idx) =>
                        `<span class="init-slot-box ${idx < slot.current ? 'available' : ''}" data-action="toggle-init-slot-stop" data-id="${character.id}" data-value="${lvl},${idx}"></span>`
                    ).join('')}</div>
                </div>`);
            }
        }
        if (slots.length > 0) {
            spellSlotsHtml = `<div class="init-spell-slots">${slots.join('')}</div>`;
        }
    }

    return spellSlotsHtml;
}

export function renderInit(): void {
    const c = $('init-list');
    const rn = $('round-num');
    if (!c) {
        if ((window as any).APP_CONFIG?.DEBUG_MODE) {
            console.warn('[renderInit] Container missing - likely not on initiative tab');
        }
        return;
    }

    // Enable EntityLookup cache for performance during render cycle
    EntityLookup.enableCache();

    const D = (window as any).D;
    const init: Initiative = D.initiative;
    if (rn) rn.textContent = String(init.round);

    // Encounter-Rundenzahl aktualisieren
    const ern = $('encounter-round-num');
    if (ern) ern.textContent = String(init.round);

    // Schlachtfeld-Bedingungen Banner rendern
    renderBattlefieldBanner();

    if (!init.combatants.length) { c.innerHTML = '<div style="text-align:center; color:var(--text-dim); padding:30px;">Keine Kämpfer</div>'; return; }

    c.innerHTML = init.combatants.map((cb, i) => {
        const active = i === init.currentTurn;
        const dead = cb.currentHp <= 0;

        // Use extracted helper functions
        const { hpPercent: hpPct, hpClass } = getCombatantHpStatus(cb);
        const { ac, entityType, entityId } = getInitCombatantDetails(cb);
        const effects = renderCombatantEffects(cb);
        const rollInfo = cb.lastRoll ? `<span style="font-size: 10px; color: var(--text-dim);" title="Letzter Wurf: ${cb.lastRoll}">(${cb.lastRoll})</span>` : '';

        // Name clickable if entity found
        const nameClickHandler = entityType && entityId
            ? `data-action="navigate-entity-stop" data-type="${entityType}" data-id="${entityId}" title="Klicken für Details"`
            : '';

        // Spell slots for players - get character reference
        const character = cb.type === 'player' ? EntityLookup.findByName('characters', cb.name) : null;
        const spellSlotsHtml = renderCombatantSpellSlots(cb, character);

        // Special handling for lair action entry
        if (cb.type === 'lair') {
            return `<div class="init-entry init-row lair ${active ? 'active' : ''}" draggable="true" data-id="${cb.id}">
                <span class="drag-handle" title="Ziehen zum Umsortieren">⠿</span>
                <div class="init-value" title="Initiative 20 (fest)">20</div>
                <div class="init-ac" style="visibility: hidden;">-</div>
                <div class="init-info" style="flex: 1;">
                    <div class="init-name">${esc(cb.name)}</div>
                    <div class="init-type" style="color: var(--red);">Lair Action</div>
                </div>
                <div class="init-right">
                    <span style="color: var(--text-dim); font-size: 0.8rem; margin-right: 8px;">Am Rundenende</span>
                    <button class="btn btn-sm btn-danger" data-action="remove-combatant" data-id="${cb.id}">❌</button>
                </div>
            </div>`;
        }

        // Typ-Label ermitteln
        const typeLabels: { [key: string]: string } = { enemy: 'Gegner', player: 'Spieler', ally: 'Verbündeter', monster: 'Monster' };
        const typeLabel = typeLabels[cb.type] || cb.type;

        return `<div class="init-entry init-row ${cb.type} ${active ? 'active' : ''} ${dead ? 'dead' : ''}" draggable="true" data-id="${cb.id}">
            <span class="drag-handle" title="Ziehen zum Umsortieren">⠿</span>
            <div class="init-value" data-action="edit-init-value" data-id="${cb.id}" title="Klicken zum Bearbeiten">${cb.initiative} ${rollInfo}</div>
            <div class="init-ac" title="Rüstungsklasse"><span class="init-ac-icon">🛡️</span>${ac}</div>
            <div class="init-info">
                <div class="init-name" ${nameClickHandler}>${esc(cb.name)}</div>
                <div class="init-type">${typeLabel}${cb.cr ? ` • CR ${cb.cr}` : ''}</div>
                ${effects ? `<div class="init-effects">${effects}</div>` : ''}
                ${dead && cb.type === 'player' ? renderDeathSaves(cb) : ''}
                ${!dead ? renderConcentration(cb) : ''}
                ${cb.concentration?.pendingCheck ? renderConcentrationCheck(cb, cb.concentration.pendingCheck) : ''}
            </div>
            ${spellSlotsHtml}
            <div class="init-right">
                <div class="init-hp">
                    <span class="init-hp-value ${hpClass}">${cb.currentHp}/${cb.maxHp}${cb.tempHp ? ` <span style="color:var(--cyan);">(+${cb.tempHp})</span>` : ''}</span>
                    <div class="init-hp-btns">
                        <button class="btn btn-sm btn-success" data-action="mod-hp" data-id="${cb.id}" data-value="1">➕</button>
                        <button class="btn btn-sm btn-danger" data-action="mod-hp" data-id="${cb.id}" data-value="-1">➖</button>
                        <button class="btn btn-sm" data-action="show-hp-calculator" data-type="combatant" data-id="${cb.id}" title="HP ändern">➗</button>
                    </div>
                </div>
                <button class="btn btn-sm" data-action="show-add-effect" data-id="${cb.id}">🔮</button>
                <button class="btn btn-sm btn-danger" data-action="remove-combatant" data-id="${cb.id}">❌</button>
            </div>
        </div>`;
    }).join('');

    // Schnellaktionen-Leiste rendern
    if (typeof (window as any).renderQuickActionsBar === 'function') {
        (window as any).renderQuickActionsBar();
    }

    // Clear EntityLookup cache after render to prevent stale data
    EntityLookup.clearCache();
}

export function toggleInitSlot(charId: number, level: number, index: number): void {
    const char = EntityLookup.character(charId);
    if (!char || !char.spellSlots || !char.spellSlots[level]) return;

    const slot = char.spellSlots[level];
    // Toggle: wenn angeklickte Box verfügbar ist, verbrauchen; sonst wiederherstellen
    if (index < slot.current) {
        // Box ist verfügbar -> verbrauchen (current verringern)
        slot.current = index;
    } else {
        // Box ist verbraucht -> wiederherstellen (current erhöhen)
        slot.current = index + 1;
    }

    renderInit();
    (window as any).save();
}

export function endCombat(): void {
    const D = (window as any).D;
    if (!D.initiative.combatants.length) {
        showToast('Kein aktiver Kampf');
        return;
    }
    if (confirm('Kampf beenden und alle Teilnehmer entfernen?')) {
        // Sync HP from combatants back to party characters
        D.initiative.combatants.forEach((cb: Combatant) => {
            if (cb.type === 'player') {
                const char = D.characters.find((c: Character) => c.name === cb.name);
                if (char) {
                    char.hpCurrent = cb.currentHp;
                }
            }
        });

        D.initiative = { combatants: [], currentTurn: 0, round: 1 };
        renderInit();
        (window as any).renderParty();
        (window as any).save();
        showToast('⏹️ Kampf beendet - HP synchronisiert');
    }
}

export function editInitValue(id: number): void {
    const cb = getCombatant(id);
    if (!cb) return;
    const val = prompt('Initiative-Wert:', String(cb.initiative));
    if (val !== null && !isNaN(parseInt(val))) {
        cb.initiative = parseInt(val);
        renderInit();
        (window as any).save();
    }
}

export function addCombatant(): void {
    const nameInput = $('init-name') as HTMLInputElement;
    const initInput = $('init-value') as HTMLInputElement;
    const hpInput = $('init-hp') as HTMLInputElement;
    const acInput = $('init-ac') as HTMLInputElement;
    const typeInput = $('init-type') as HTMLSelectElement;

    const name = nameInput.value.trim();
    if (!name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }

    const initBonus = parseInt(initInput.value) || 0;
    const ac = parseInt(acInput.value) || 10;
    const hp = parseInt(hpInput.value) || 1;

    const D = (window as any).D;
    D.initiative.combatants.push({
        id: nextId('combatants'),
        name,
        initiative: initBonus,
        initBonus: initBonus,
        maxHp: hp,
        currentHp: hp,
        ac: ac,
        type: typeInput.value,
        effects: []
    });

    nameInput.value = '';
    initInput.value = '';
    hpInput.value = '';
    acInput.value = '';
    sortInit();
}

export function addPartyToInit(): void {
    const D = (window as any).D;
    D.characters.forEach((ch: Character) => {
        if (D.initiative.combatants.some((c: Combatant) => c.name === ch.name)) return;
        // Initiative-Bonus aus GES-Modifikator berechnen falls verfügbar
        const initBonus = 0; // Party characters might not have DEX stored separately
        D.initiative.combatants.push({
            id: nextId('combatants'),
            name: ch.name,
            initiative: 0,
            initBonus: initBonus,
            maxHp: ch.hpMax || 10,
            currentHp: ch.hpCurrent || ch.hpMax || 10,
            ac: ch.ac || ch.armorClass || 10,
            type: 'player',
            effects: []
        });
    });
    showToast('Party zur Initiative hinzugefügt - klicke "🎲 Alle würfeln"');
    renderInit();
    (window as any).save();
}

export function removeCombatant(id: number): void {
    const D = (window as any).D;
    const idx = D.initiative.combatants.findIndex((c: Combatant) => c.id === id);
    if (idx > -1) {
        D.initiative.combatants.splice(idx, 1);
        if (D.initiative.currentTurn >= D.initiative.combatants.length) D.initiative.currentTurn = 0;
        renderInit();
        (window as any).save();
    }
}

export function modHp(id: number, amt: number): void {
    const c = getCombatant(id);
    if (!c) return;

    const wasAtZero = c.currentHp <= 0;

    if (amt < 0) {
        // Schaden: zuerst temp HP abziehen
        let remaining = Math.abs(amt);
        const actualDamage = remaining; // Save for concentration check
        if (c.tempHp && c.tempHp > 0) {
            const absorbed = Math.min(c.tempHp, remaining);
            c.tempHp -= absorbed;
            remaining -= absorbed;
        }
        c.currentHp = Math.max(0, c.currentHp - remaining);

        // Konzentrationsprüfung auslösen wenn konzentriert und Schaden erlitten
        if (c.concentration?.active && actualDamage > 0) {
            c.concentration.pendingCheck = actualDamage;
        }
    } else {
        // Heilung
        c.currentHp = Math.min(c.maxHp, c.currentHp + amt);

        // Todeswürfe zurücksetzen wenn über 0 HP geheilt
        if (wasAtZero && c.currentHp > 0) {
            resetDeathSaves(c);
        }
    }
    renderInit();
    (window as any).save();
}

// Wrapper-Funktion für EventDelegation: Character HP updaten
export function updateCharacterHP(id: number, amount: number): void {
    const ch = EntityLookup.character(id);
    if (!ch) return;

    if (amount < 0) {
        ch.currentHp = Math.max(0, (ch.currentHp || ch.hp) + amount);
    } else {
        ch.currentHp = Math.min(ch.hp, (ch.currentHp || ch.hp) + amount);
    }
    (window as any).renderParty();
    (window as any).save();
}

// Wrapper-Funktion für EventDelegation: Initiative Combatant HP updaten
export function updateInitiativeCombatantHP(id: number, amount: number): void {
    modHp(id, amount);
}

export function sortInit(): void {
    const D = (window as any).D;
    if (!D.initiative?.combatants?.length) return;
    D.initiative.combatants.sort((a: Combatant, b: Combatant) => b.initiative - a.initiative);
    D.initiative.currentTurn = 0;
    renderInit();
    (window as any).save();
    showToast('⬇️ Initiative sortiert');
}

export function nextTurn(): void {
    const D = (window as any).D;
    const init: Initiative = D.initiative;
    if (!init.combatants.length) return;

    // Decrease effect durations (not for permanent effects)
    const current = init.combatants[init.currentTurn];
    if (current?.effects) {
        current.effects = current.effects
            .map(e => e.permanent ? e : { ...e, duration: e.duration - 1 })
            .filter(e => e.permanent || e.duration > 0);
    }

    init.currentTurn++;
    if (init.currentTurn >= init.combatants.length) {
        init.currentTurn = 0;
        init.round++;
    }
    renderInit();
    (window as any).save();
}

// ============================================================
// EFFECTS
// ============================================================

export function showAddEffect(id: number): void {
    const effectIdInput = $('effect-combatant-id') as HTMLInputElement;
    const effectNameInput = $('effect-name') as HTMLInputElement;
    const effectDurationInput = $('effect-duration') as HTMLInputElement;
    const effectColorInput = $('effect-color') as HTMLSelectElement;

    if (effectIdInput) effectIdInput.value = String(id);
    if (effectNameInput) effectNameInput.value = '';
    if (effectDurationInput) effectDurationInput.value = '1';
    if (effectColorInput) effectColorInput.value = 'red';

    renderEffectConditionsGrid();
    showModal('effect-modal');
}

function renderEffectConditionsGrid(): void {
    const container = $('effect-conditions-grid');
    if (!container) return;

    const effectIdInput = $('effect-combatant-id') as HTMLInputElement;
    const cbId = parseEntityId(effectIdInput.value);
    if (cbId === null) return;
    const cb = getCombatant(cbId);
    const currentEffects = cb?.effects || [];

    container.innerHTML = Object.entries(CONDITIONS).map(([key, cond]: [string, any]) => {
        const hasEffect = currentEffects.some((e: Effect) => e.name.toLowerCase() === cond.name.toLowerCase());
        return `<button class="btn ${hasEffect ? 'btn-success' : ''}" data-action="add-effect-from-grid" data-value="${key}" style="justify-content: flex-start; gap: 8px; padding: 8px 10px; font-size: 0.9em;">
            <span>${cond.icon}</span>
            <span style="flex: 1; text-align: left;">${cond.name}</span>
            ${hasEffect ? '✓' : ''}
        </button>`;
    }).join('');
}

export function addEffectFromGrid(conditionKey: string): void {
    const effectIdInput = $('effect-combatant-id') as HTMLInputElement;
    const cbId = parseEntityId(effectIdInput.value);
    if (cbId === null) return;
    const cb = getCombatant(cbId);
    if (!cb) return;
    if (!cb.effects) cb.effects = [];

    const cond = CONDITIONS[conditionKey];
    if (!cond) return;

    // Toggle: Wenn bereits vorhanden, entfernen
    const existingIdx = cb.effects.findIndex((e: Effect) => e.name.toLowerCase() === cond.name.toLowerCase());
    if (existingIdx > -1) {
        cb.effects.splice(existingIdx, 1);
    } else {
        cb.effects.push({
            id: Date.now(),
            name: cond.name,
            duration: INIT_CONSTANTS.PERMANENT_DURATION,
            permanent: true,
            color: CONDITION_COLORS[conditionKey] || 'yellow',
            description: cond.desc
        });
    }

    renderEffectConditionsGrid();
    renderInit();
    (window as any).save();
}

export function saveCustomEffect(): void {
    const effectIdInput = $('effect-combatant-id') as HTMLInputElement;
    const effectNameInput = $('effect-name') as HTMLInputElement;
    const effectColorInput = $('effect-color') as HTMLSelectElement;
    const effectDurationInput = $('effect-duration') as HTMLInputElement;

    const cbId = parseEntityId(effectIdInput.value);
    if (cbId === null) return;
    const cb = getCombatant(cbId);
    if (!cb) return;
    if (!cb.effects) cb.effects = [];

    const name = effectNameInput.value.trim();
    if (!name) {
        showToast('Bitte einen Namen eingeben');
        return;
    }

    const color = effectColorInput.value;
    const duration = parseInt(effectDurationInput.value) || 0;

    cb.effects.push({
        id: Date.now(),
        name,
        duration: duration || INIT_CONSTANTS.PERMANENT_DURATION,
        permanent: duration === 0,
        color,
        description: ''
    });

    hideModal('effect-modal');
    renderInit();
    (window as any).save();
    showToast(`Effekt "${name}" hinzugefügt`);
}

export function removeEffect(cbId: number, effId: number): void {
    const cb = getCombatant(cbId);
    if (!cb) return;
    cb.effects = (cb.effects || []).filter((e: Effect) => e.id !== effId);
    renderInit();
    (window as any).save();
}

// ============================================================
// DEATH SAVES TRACKER
// ============================================================

function renderDeathSaves(cb: Combatant): string {
    if (!cb.deathSaves) {
        cb.deathSaves = { successes: 0, failures: 0 };
    }

    const ds = cb.deathSaves;

    // Auf Endzustände prüfen
    let statusHtml = '';
    if (ds.failures >= INIT_CONSTANTS.DEATH_SAVE_THRESHOLD) {
        statusHtml = '<span class="death-saves-status dead">💀 Tot</span>';
    } else if (ds.successes >= INIT_CONSTANTS.DEATH_SAVE_THRESHOLD) {
        statusHtml = '<span class="death-saves-status stable">✓ Stabil</span>';
    }

    return `
        <div class="death-saves">
            <span class="death-saves-label">☠️ Todeswürfe</span>
            <div class="death-saves-group">
                <span class="death-saves-group-label">✓</span>
                <div class="death-saves-dots">
                    ${[0, 1, 2].map(i => `
                        <span class="death-save-dot success ${i < ds.successes ? 'active' : ''}"
                            data-action="toggle-death-save-stop"
                            data-id="${cb.id}"
                            data-type="success"
                            data-index="${i}"
                            title="Erfolg ${i + 1}"></span>
                    `).join('')}
                </div>
            </div>
            <div class="death-saves-group">
                <span class="death-saves-group-label">✗</span>
                <div class="death-saves-dots">
                    ${[0, 1, 2].map(i => `
                        <span class="death-save-dot failure ${i < ds.failures ? 'active' : ''}"
                            data-action="toggle-death-save-stop"
                            data-id="${cb.id}"
                            data-type="failure"
                            data-index="${i}"
                            title="Fehlschlag ${i + 1}"></span>
                    `).join('')}
                </div>
            </div>
            ${statusHtml}
        </div>
    `;
}

export function toggleDeathSave(cbId: number, type: string, index: number): void {
    const cb = getCombatant(cbId);
    if (!cb) return;

    if (!cb.deathSaves) {
        cb.deathSaves = { successes: 0, failures: 0 };
    }

    const ds = cb.deathSaves;
    const field = type === 'success' ? 'successes' : 'failures';

    // Toggle-Logik: Bei Klick auf aktiven Punkt auf oder nach aktuellem Zähler, verringern
    // If clicking on inactive dot, set to that level
    if (index < ds[field as keyof DeathSaves]) {
        // Clicked on active dot - reduce to this level
        ds[field as keyof DeathSaves] = index;
    } else {
        // Clicked on inactive dot - increase to include this dot
        ds[field as keyof DeathSaves] = index + 1;
    }

    // Auf Tod prüfen (3 Fehlschläge)
    if (ds.failures >= INIT_CONSTANTS.DEATH_SAVE_THRESHOLD) {
        showToast('💀 Charakter ist gestorben!', 'error');
    }

    // Auf Stabilisierung prüfen (3 Erfolge)
    if (ds.successes >= INIT_CONSTANTS.DEATH_SAVE_THRESHOLD && cb.currentHp <= 0) {
        cb.currentHp = 1;
        ds.successes = 0;
        ds.failures = 0;
        showToast('✓ Charakter ist stabilisiert!', 'success');
    }

    renderInit();
    (window as any).save();
}

function resetDeathSaves(cb: Combatant): void {
    if (cb.deathSaves) {
        cb.deathSaves = { successes: 0, failures: 0 };
    }
}

// ============================================================
// CONCENTRATION TRACKER
// ============================================================

function renderConcentration(cb: Combatant): string {
    const conc = cb.concentration;

    // Aktive Konzentration anzeigen
    if (conc?.active && conc.spell) {
        return `
            <div class="concentration-badge" title="Konzentration: ${esc(conc.spell)}">
                <span class="conc-icon">🔮</span>
                <span class="conc-spell">${esc(conc.spell)}</span>
                <span class="conc-break" data-action="break-concentration-stop" data-id="${cb.id}" title="Konzentration brechen">✕</span>
            </div>
        `;
    }

    // Hinzufügen-Button für Spieler/Verbündete anzeigen (nur wenn keine Konzentration aktiv)
    if (cb.type === 'player' || cb.type === 'ally') {
        return `
            <button class="concentration-add-btn" data-action="show-concentration-modal-stop" data-id="${cb.id}">
                🔮 Konzentration
            </button>
        `;
    }

    return '';
}

function renderConcentrationCheck(cb: Combatant, damage: number): string {
    if (!cb.concentration?.active) return '';

    const dc = Math.max(10, Math.floor(damage / 2));
    cb.concentration.lastDC = dc;

    return `
        <div class="concentration-check-banner">
            <span>⚠️ Konzentrations-Check für <strong>${esc(cb.concentration.spell)}</strong></span>
            <span class="conc-dc">DC ${dc}</span>
            <button class="conc-roll-btn" data-action="roll-concentration-check-stop" data-id="${cb.id}" data-dc="${dc}">
                🎲 CON-Save
            </button>
        </div>
    `;
}

export function showConcentrationModal(cbId: number): void {
    const cb = getCombatant(cbId);
    if (!cb) return;

    // Zauber vom verknüpften Charakter holen falls verfügbar
    let spellOptions = '';
    if (cb.type === 'player') {
        const char = EntityLookup.findByName('characters', cb.name);
        if (char && char.spells?.length) {
            const concentrationSpells = char.spells
                .map((sid: number) => EntityLookup.spell(sid))
                .filter((s: Spell) => s && s.concentration);
            if (concentrationSpells.length) {
                spellOptions = concentrationSpells.map((s: Spell) =>
                    `<option value="${esc(s.name)}">${esc(s.name)}</option>`
                ).join('');
            }
        }
    }

    const content = `
        <div style="padding: 20px;">
            <h3 style="margin: 0 0 16px 0; color: var(--purple);">🔮 Konzentration setzen</h3>
            <p style="margin: 0 0 12px 0; color: var(--text-dim);">Für: <strong>${esc(cb.name)}</strong></p>
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 6px; font-size: 0.9em; color: var(--text-dim);">Zauber:</label>
                ${spellOptions ? `
                    <select id="conc-spell-select" style="width: 100%; padding: 10px; background: var(--bg-dark); border: 1px solid var(--border); color: var(--text); border-radius: 6px; margin-bottom: 8px;">
                        <option value="">— Wählen oder eingeben —</option>
                        ${spellOptions}
                    </select>
                ` : ''}
                <input type="text" id="conc-spell-input" placeholder="Zauber-Name eingeben..."
                    style="width: 100%; padding: 10px; background: var(--bg-dark); border: 1px solid var(--border); color: var(--text); border-radius: 6px; box-sizing: border-box;">
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn" onclick="hideModal('concentration-modal')">Abbrechen</button>
                <button class="btn btn-primary" onclick="setConcentration(${cbId})">✓ Setzen</button>
            </div>
        </div>
    `;

    // Modal erstellen oder wiederverwenden
    let modal = $('concentration-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'concentration-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal" style="max-width: 400px;">${content}</div>`;
        (modal as HTMLElement).onclick = (e: MouseEvent) => {
            if (e.target === modal) hideModal('concentration-modal');
        };
        document.body.appendChild(modal);
    } else {
        const modalContent = modal.querySelector('.modal');
        if (modalContent) modalContent.innerHTML = content;
    }

    showModal('concentration-modal');

    // Sync select to input
    const select = $('conc-spell-select') as HTMLSelectElement;
    const input = $('conc-spell-input') as HTMLInputElement;
    if (select && input) {
        select.onchange = () => { input.value = select.value; };
    }
    if (input) input.focus();
}

export function setConcentration(cbId: number): void {
    const cb = getCombatant(cbId);
    if (!cb) return;

    const input = $('conc-spell-input') as HTMLInputElement;
    const spell = input?.value?.trim();

    if (!spell) {
        showToast('Bitte Zauber-Name eingeben', 'error');
        return;
    }

    cb.concentration = {
        active: true,
        spell: spell,
        lastDC: 10
    };

    hideModal('concentration-modal');
    renderInit();
    (window as any).save();
    showToast(`🔮 Konzentration: ${spell}`);
}

export function breakConcentration(cbId: number): void {
    const cb = getCombatant(cbId);
    if (!cb || !cb.concentration?.active) return;

    const spell = cb.concentration.spell;
    cb.concentration = { active: false, spell: '', lastDC: 10 };

    renderInit();
    (window as any).save();
    showToast(`❌ Konzentration gebrochen: ${spell}`, 'warning');
}

export function rollConcentrationCheck(cbId: number, dc: number): void {
    const cb = getCombatant(cbId);
    if (!cb || !cb.concentration?.active) return;

    // KON-Modifikator vom verknüpften Charakter holen
    let conMod = 0;
    if (cb.type === 'player') {
        const char = EntityLookup.findByName('characters', cb.name);
        if (char?.attributes?.con) {
            conMod = Math.floor((char.attributes.con - 10) / 2);
        }
    }

    // Roll d20 + CON
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + conMod;
    const success = total >= dc;

    // Format result
    const modStr = conMod >= 0 ? `+${conMod}` : String(conMod);
    const resultText = success ?
        `✓ Konzentration gehalten! (${roll}${modStr} = ${total} vs DC ${dc})` :
        `✕ Konzentration verloren! (${roll}${modStr} = ${total} vs DC ${dc})`;

    if (success) {
        showToast(resultText, 'success');
    } else {
        breakConcentration(cbId);
        showToast(resultText, 'error');
    }

    // Ausstehende Prüfung löschen
    if (cb.concentration) {
        delete cb.concentration.pendingCheck;
    }

    renderInit();
    (window as any).save();
}

// ============================================================
// AOE DAMAGE CALCULATOR
// ============================================================

let aoeCurrentDamage = 0;

export function showAoEDamageModal(): void {
    const D = (window as any).D;
    const combatants = D.initiative.combatants.filter((c: Combatant) => c.type !== 'lair' && c.currentHp > 0);

    if (!combatants.length) {
        showToast('Keine Kämpfer in der Initiative', 'error');
        return;
    }

    aoeCurrentDamage = 0;

    const content = `
        <div class="aoe-modal-content">
            <div class="aoe-modal-header">
                <h3>💥 AoE Schaden</h3>
                <button class="btn btn-sm" onclick="hideModal('aoe-damage-modal')">✕</button>
            </div>

            <div class="aoe-damage-input">
                <input type="text" id="aoe-damage-formula" placeholder="z.B. 8d6 oder 28" value="8d6">
                <button class="aoe-roll-btn" onclick="rollAoEDamage()">
                    🎲 Würfeln
                </button>
                <div class="aoe-damage-result" id="aoe-damage-result">—</div>
            </div>

            <div class="aoe-targets-header">
                <span>Ziele auswählen:</span>
                <div class="aoe-quick-select">
                    <button class="aoe-quick-btn" onclick="aoeSelectAll()">Alle</button>
                    <button class="aoe-quick-btn" onclick="aoeSelectNone()">Keine</button>
                    <button class="aoe-quick-btn" onclick="aoeSelectEnemies()">Gegner</button>
                </div>
            </div>

            <div class="aoe-targets-list" id="aoe-targets-list">
                ${combatants.map((cb: Combatant) => {
                    const typeIcon = cb.type === 'player' ? '👤' : cb.type === 'ally' ? '🤝' : '👹';
                    return `
                        <label class="aoe-target" data-id="${cb.id}">
                            <input type="checkbox" class="aoe-target-checkbox" id="aoe-cb-${cb.id}" data-id="${cb.id}" onchange="updateAoETargetDisplay()">
                            <span class="aoe-target-hp">${cb.currentHp}/${cb.maxHp} HP</span>
                            <span class="aoe-target-name">${typeIcon} ${esc(cb.name)}</span>
                            <span class="aoe-target-save">
                                <input type="checkbox" id="aoe-save-${cb.id}" data-id="${cb.id}" onchange="updateAoETargetDisplay()">
                                Save ½
                            </span>
                            <span class="aoe-target-damage" id="aoe-dmg-${cb.id}">—</span>
                        </label>
                    `;
                }).join('')}
            </div>

            <div class="aoe-modal-footer">
                <button class="btn" onclick="hideModal('aoe-damage-modal')">Abbrechen</button>
                <button class="aoe-apply-btn" id="aoe-apply-btn" onclick="applyAoEDamage()" disabled>
                    💥 Schaden anwenden
                </button>
            </div>
        </div>
    `;

    // Modal erstellen oder wiederverwenden
    let modal = $('aoe-damage-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'aoe-damage-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal aoe-modal">${content}</div>`;
        (modal as HTMLElement).onclick = (e: MouseEvent) => {
            if (e.target === modal) hideModal('aoe-damage-modal');
        };
        document.body.appendChild(modal);
    } else {
        const modalContent = modal.querySelector('.modal');
        if (modalContent) modalContent.innerHTML = content;
    }

    showModal('aoe-damage-modal');
    ($('aoe-damage-formula') as HTMLInputElement)?.focus();
}

export function rollAoEDamage(): void {
    const formulaInput = $('aoe-damage-formula') as HTMLInputElement;
    const formula = formulaInput?.value?.trim();
    if (!formula) {
        showToast('Bitte Schadenswürfel eingeben', 'error');
        return;
    }

    // Parse and roll dice formula
    let total = 0;
    const diceMatch = formula.match(/(\d+)d(\d+)/i);

    if (diceMatch) {
        const count = parseInt(diceMatch[1]);
        const sides = parseInt(diceMatch[2]);
        for (let i = 0; i < count; i++) {
            total += Math.floor(Math.random() * sides) + 1;
        }
        // Add any flat modifier
        const rest = formula.replace(diceMatch[0], '').trim();
        const modMatch = rest.match(/([+-])\s*(\d+)/);
        if (modMatch) {
            const mod = parseInt(modMatch[2]);
            total += modMatch[1] === '+' ? mod : -mod;
        }
    } else {
        // Try parsing as a number
        total = parseInt(formula);
        if (isNaN(total)) {
            showToast('Ungültige Formel', 'error');
            return;
        }
    }

    aoeCurrentDamage = Math.max(0, total);

    const resultEl = $('aoe-damage-result');
    if (resultEl) {
        resultEl.textContent = String(aoeCurrentDamage);
        resultEl.style.animation = 'none';
        resultEl.offsetHeight; // Trigger reflow
        resultEl.style.animation = 'pulse 0.3s ease-out';
    }

    updateAoETargetDisplay();
    const applyBtn = $('aoe-apply-btn') as HTMLButtonElement;
    if (applyBtn) applyBtn.disabled = false;
}

export function updateAoETargetDisplay(): void {
    document.querySelectorAll('.aoe-target').forEach(el => {
        const id = (el as HTMLElement).dataset.id;
        const isSelected = (document.getElementById(`aoe-cb-${id}`) as HTMLInputElement)?.checked;
        const hasSave = (document.getElementById(`aoe-save-${id}`) as HTMLInputElement)?.checked;
        const dmgEl = document.getElementById(`aoe-dmg-${id}`);

        el.classList.toggle('selected', !!isSelected);

        if (dmgEl) {
            if (!isSelected || aoeCurrentDamage <= 0) {
                dmgEl.textContent = '—';
                dmgEl.className = 'aoe-target-damage';
            } else {
                const damage = hasSave ? Math.floor(aoeCurrentDamage / 2) : aoeCurrentDamage;
                dmgEl.textContent = `-${damage}`;
                dmgEl.className = `aoe-target-damage ${hasSave ? 'half' : 'full'}`;
            }
        }
    });
}

// Create debounced version for better performance with rapid selection changes
const debouncedUpdateAoE = debounce(updateAoETargetDisplay, UI_TIMING.AOE_UPDATE_DEBOUNCE);

export function aoeSelectAll(): void {
    document.querySelectorAll('.aoe-target-checkbox').forEach(cb => (cb as HTMLInputElement).checked = true);
    debouncedUpdateAoE();
}

export function aoeSelectNone(): void {
    document.querySelectorAll('.aoe-target-checkbox').forEach(cb => (cb as HTMLInputElement).checked = false);
    debouncedUpdateAoE();
}

export function aoeSelectEnemies(): void {
    const D = (window as any).D;
    const enemies = D.initiative.combatants.filter((c: Combatant) => c.type === 'enemy' || c.type === 'monster');
    const enemyIds = enemies.map((e: Combatant) => e.id);

    document.querySelectorAll('.aoe-target-checkbox').forEach(cb => {
        const cbId = parseInt((cb as HTMLElement).dataset.id || '0');
        (cb as HTMLInputElement).checked = enemyIds.includes(cbId);
    });
    debouncedUpdateAoE();
}

export function applyAoEDamage(): void {
    if (aoeCurrentDamage <= 0) {
        showToast('Erst Schaden würfeln', 'error');
        return;
    }

    const selectedTargets: Array<{ id: number; hasSave: boolean }> = [];
    document.querySelectorAll('.aoe-target-checkbox:checked').forEach(cb => {
        const id = parseInt((cb as HTMLElement).dataset.id || '0');
        const hasSave = (document.getElementById(`aoe-save-${id}`) as HTMLInputElement)?.checked || false;
        selectedTargets.push({ id, hasSave });
    });

    if (!selectedTargets.length) {
        showToast('Keine Ziele ausgewählt', 'error');
        return;
    }

    // Apply damage to each target
    let hitCount = 0;
    selectedTargets.forEach(({ id, hasSave }) => {
        const cb = getCombatant(id);
        if (!cb) return;

        const damage = hasSave ? Math.floor(aoeCurrentDamage / 2) : aoeCurrentDamage;
        const wasAtZero = cb.currentHp <= 0;

        // Apply damage (temp HP first)
        applyDamage(cb, damage);

        // Trigger concentration check if applicable
        if (cb.concentration?.active && damage > 0) {
            cb.concentration.pendingCheck = damage;
        }

        hitCount++;
    });

    hideModal('aoe-damage-modal');
    renderInit();
    (window as any).save();

    showToast(`💥 AoE: ${aoeCurrentDamage} Schaden auf ${hitCount} Ziele`);
}

// ============================================================
// LOOT SYSTEM (Master-Detail Layout)
// ============================================================

let selectedLootId: number | null = null;
let currentLootFilter: string = 'all';

// Alias für Kompatibilität
export function renderLoot(): void {
    renderLootList();
}

export function renderLootList(): void {
    const listContainer = $('loot-list');
    const filterContainer = $('loot-filters');
    if (!listContainer) return;

    const D = (window as any).D;

    // Update counter
    (window as any).updateCounters({ 'loot-io-count': D.loot?.length || 0 });

    // Render filter chips (by category)
    if (filterContainer) {
        filterContainer.innerHTML = `
            <div class="loot-filter-chip ${currentLootFilter === 'all' ? 'active' : ''}" data-action="set-loot-filter" data-value="all">Alle</div>
            ${Object.entries(CATS).map(([k, v]) => `
                <div class="loot-filter-chip ${currentLootFilter === k ? 'active' : ''}"
                     data-action="set-loot-filter" data-value="${k}">
                    ${v}
                </div>
            `).join('')}
        `;
    }

    // Get search and filter
    const searchInput = $('loot-search') as HTMLInputElement;
    const search = (searchInput?.value || '').toLowerCase();
    let items: LootItem[] = [...(D.loot || [])];

    // Apply category filter
    if (currentLootFilter !== 'all') {
        items = items.filter(i => i.category === currentLootFilter);
    }

    // Apply search
    if (search) {
        items = items.filter(i =>
            (i.name || '').toLowerCase().includes(search) ||
            (i.description || '').toLowerCase().includes(search) ||
            (i.special || '').toLowerCase().includes(search) ||
            (i.property || '').toLowerCase().includes(search) ||
            (i.tags || []).some(t => t.toLowerCase().includes(search))
        );
    }

    // Sort by name
    items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    // Empty state
    if (!items.length) {
        listContainer.innerHTML = `
            <div class="loot-detail-empty" style="padding: 40px;">
                <div class="loot-detail-empty-icon">📦</div>
                <div class="loot-detail-empty-text">${search || currentLootFilter !== 'all' ? 'Keine Treffer' : 'Truhe ist leer'}</div>
                ${!search && currentLootFilter === 'all' ? `
                    <button class="loot-add-btn" data-action="show-modal" data-value="loot-modal" style="margin-top: 12px;">
                        + Item hinzufügen
                    </button>
                ` : ''}
            </div>
        `;
        clearLootDetail();
        return;
    }

    // Render list items
    listContainer.innerHTML = items.map(item => renderLootItem(item)).join('');

    // Auto-select first if none selected
    if (!selectedLootId || !items.find(i => i.id === selectedLootId)) {
        selectLoot(items[0].id, false);
    } else {
        showLootDetail(selectedLootId);
    }
}

function renderLootItem(item: LootItem): string {
    const catIcon = CATS[item.category]?.split(' ')[0] || '📦';
    const isSelected = item.id === selectedLootId;
    const rarity = item.rarity || 'normal';
    const rarityColor = RARITY_COLORS[rarity] || RARITY_COLORS.normal;
    const depleted = item.quantity <= 0;

    return `
        <div class="loot-item ${isSelected ? 'selected' : ''} ${depleted ? 'depleted' : ''}" data-action="select-loot" data-id="${item.id}">
            <div class="loot-item-icon">${catIcon}</div>
            <div class="loot-item-info">
                <div class="loot-item-name" style="color: ${rarityColor};">
                    ${esc(item.name)}
                    ${rarity !== 'normal' ? `<span class="loot-item-tag" style="background: ${rarityColor}; color: var(--bg-dark);">${RARITY_LABELS[rarity]}</span>` : ''}
                </div>
                <div class="loot-item-meta">
                    ×${item.quantity} • ${((item.value || 0) * item.quantity).toFixed(0)} GM
                </div>
            </div>
            <div class="loot-item-badges">
                ${(item.tags || []).includes('attunement') ? '<span class="loot-badge" title="Einstimmung">🔮</span>' : ''}
            </div>
        </div>
    `;
}

export function selectLoot(id: number, scroll: boolean = true): void {
    selectedLootId = id;

    // Update selection in list
    document.querySelectorAll('.loot-item').forEach(el => {
        el.classList.toggle('selected', (el as HTMLElement).dataset.id === String(id));
    });

    // Show detail
    showLootDetail(id);

    // Scroll into view if needed
    if (scroll) {
        const el = document.querySelector(`.loot-item[data-id="${id}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function showLootDetail(id: number): void {
    const panel = $('loot-detail-panel');
    if (!panel) return;

    const item = EntityLookup.lootItem(id);
    if (!item) {
        clearLootDetail();
        return;
    }

    const catIcon = CATS[item.category]?.split(' ')[0] || '📦';
    const rarity = item.rarity || 'normal';
    const rarityColor = RARITY_COLORS[rarity] || RARITY_COLORS.normal;
    const totalValue = (item.value || 0) * Math.max(0, item.quantity);

    panel.innerHTML = `
        <div class="loot-detail-content">
            <div class="loot-detail-header">
                <div class="loot-detail-icon">${catIcon}</div>
                <div class="loot-detail-title">
                    <div class="loot-detail-name" style="color: ${rarityColor};">${esc(item.name)}</div>
                    <div class="loot-detail-subtitle">${CATS[item.category] || 'Sonstiges'} • ${RARITY_LABELS[rarity]}</div>
                </div>
                <div class="loot-detail-actions">
                    <button class="loot-detail-btn" data-action="edit-loot" data-id="${id}" title="Bearbeiten">✏️</button>
                    <button class="loot-detail-btn danger" data-action="delete-loot" data-id="${id}" title="Löschen">🗑️</button>
                </div>
            </div>

            ${(item.tags || []).length > 0 ? `
                <div class="loot-tags-section">
                    <div class="loot-tags">
                        ${(item.tags || []).map((t: string) => `<span class="loot-tag">${LOOT_TAG_LABELS[t] || t}</span>`).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="loot-section">
                <div class="loot-stats">
                    <div class="loot-stat">
                        <div class="loot-stat-label">Menge</div>
                        <div class="loot-stat-value">${item.quantity}</div>
                    </div>
                    <div class="loot-stat">
                        <div class="loot-stat-label">Wert</div>
                        <div class="loot-stat-value" style="color: var(--gold);">${totalValue.toFixed(0)} GM</div>
                    </div>
                    <div class="loot-stat">
                        <div class="loot-stat-label">Gewicht</div>
                        <div class="loot-stat-value">${item.weight ? item.weight + ' kg' : '—'}</div>
                    </div>
                </div>
            </div>

            ${item.origin ? `
                <div class="loot-section">
                    <div class="loot-section-title">Herkunft</div>
                    <div>${ORIGIN_LABELS[item.origin] || item.origin}</div>
                </div>
            ` : ''}

            ${item.special ? `
                <div class="loot-section">
                    <div class="loot-section-title">Besonderheit</div>
                    <div>${esc(item.special)}</div>
                </div>
            ` : ''}

            ${item.property ? `
                <div class="loot-section">
                    <div class="loot-section-title">Eigenschaft</div>
                    <div>${esc(item.property)}</div>
                </div>
            ` : ''}

            ${item.description ? `
                <div class="loot-section">
                    <div class="loot-section-title">Beschreibung</div>
                    <div class="loot-desc">${sanitizeHTML(item.description)}</div>
                </div>
            ` : ''}
        </div>
    `;
}

function clearLootDetail(): void {
    const panel = $('loot-detail-panel');
    if (panel) {
        panel.innerHTML = `
            <div class="loot-detail-empty">
                <div class="loot-detail-empty-icon">📦</div>
                <div class="loot-detail-empty-text">Wähle ein Item aus der Liste</div>
            </div>
        `;
    }
}

export function setLootFilter(f: string): void {
    currentLootFilter = f;
    renderLootList();
}

export function showLootModal(id: number | null = null): void {
    (window as any).clearLootForm();
    const modal = $('loot-modal');
    const title = modal?.querySelector('.modal-title');

    if (id) {
        const item = EntityLookup.lootItem(id);
        if (!item) return;

        if (title) title.textContent = 'Item bearbeiten';
        const editIdInput = $('edit-loot-id') as HTMLInputElement;
        if (editIdInput) editIdInput.value = String(id);

        const nameInput = $('loot-name') as HTMLInputElement;
        const catInput = $('loot-cat') as HTMLSelectElement;
        const rarityInput = $('loot-rarity') as HTMLSelectElement;
        const qtyInput = $('loot-qty') as HTMLInputElement;
        const wtInput = $('loot-wt') as HTMLInputElement;
        const valInput = $('loot-val') as HTMLInputElement;
        const descDiv = $('loot-desc');

        if (nameInput) nameInput.value = item.name || '';
        if (catInput) catInput.value = item.category || 'misc';
        if (rarityInput) rarityInput.value = item.rarity || 'normal';
        if (qtyInput) qtyInput.value = String(item.quantity || 1);
        if (wtInput) wtInput.value = String(item.weight || '');
        if (valInput) valInput.value = String(item.value || '');
        if (descDiv) descDiv.innerHTML = sanitizeHTML(item.description || '');

        const originInput = $('loot-origin') as HTMLSelectElement;
        const specialInput = $('loot-special') as HTMLInputElement;
        const propertyInput = $('loot-property') as HTMLInputElement;

        if (originInput) originInput.value = item.origin || '';
        if (specialInput) specialInput.value = item.special || '';
        if (propertyInput) propertyInput.value = item.property || '';

        // Tags laden
        document.querySelectorAll('#loot-tag-grid .loot-tag-chip input').forEach(cb => {
            (cb as HTMLInputElement).checked = (item.tags || []).includes((cb as HTMLInputElement).value);
        });
        (window as any).updateLootSelectedTags();

        const saveBtn = $('loot-save-btn');
        if (saveBtn) saveBtn.textContent = '💾 Speichern';
    } else {
        if (title) title.textContent = 'Item hinzufügen';
        const saveBtn = $('loot-save-btn');
        if (saveBtn) saveBtn.textContent = '+ Hinzufügen';
    }

    showModal('loot-modal');
    ($('loot-name') as HTMLInputElement)?.focus();
}

export function saveLoot(): void {
    const nameInput = $('loot-name') as HTMLInputElement;
    const name = nameInput.value.trim();
    if (!name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }

    const editIdInput = $('edit-loot-id') as HTMLInputElement;
    const editId = editIdInput.value;

    // Tags aus den Checkboxen sammeln
    const tags: string[] = [];
    document.querySelectorAll('#loot-tag-grid .loot-tag-chip input:checked').forEach(cb => {
        tags.push((cb as HTMLInputElement).value);
    });

    const catInput = $('loot-cat') as HTMLSelectElement;
    const rarityInput = $('loot-rarity') as HTMLSelectElement;
    const qtyInput = $('loot-qty') as HTMLInputElement;
    const wtInput = $('loot-wt') as HTMLInputElement;
    const valInput = $('loot-val') as HTMLInputElement;
    const descDiv = $('loot-desc');
    const originInput = $('loot-origin') as HTMLSelectElement;
    const specialInput = $('loot-special') as HTMLInputElement;
    const propertyInput = $('loot-property') as HTMLInputElement;

    const item: Partial<LootItem> = {
        name,
        category: catInput.value,
        rarity: rarityInput.value,
        quantity: parseInt(qtyInput.value) || 1,
        weight: parseFloat(wtInput.value) || 0,
        value: parseFloat(valInput.value) || 0,
        description: sanitizeHTML(descDiv?.innerHTML || ''),
        origin: originInput?.value || '',
        special: specialInput?.value?.trim() || '',
        property: propertyInput?.value?.trim() || '',
        tags: tags,
        attunement: tags.includes('attunement')
    };

    const D = (window as any).D;

    if (editId) {
        // Update existing item
        const idx = D.loot.findIndex((i: LootItem) => i.id === parseInt(editId));
        if (idx > -1) {
            D.loot[idx] = { ...D.loot[idx], ...item };
            showToast('Item aktualisiert');
            // Detail-Panel aktualisieren falls selbes Item
            if (selectedLootId === parseInt(editId)) {
                showLootDetail(parseInt(editId));
            }
        }
    } else {
        // Add new item (or merge with existing)
        const newItem = { ...item, id: nextId('loot') } as LootItem;
        const existing = D.loot.find((i: LootItem) => i.name.toLowerCase() === name.toLowerCase() && i.category === newItem.category && i.rarity === newItem.rarity);
        if (existing) {
            existing.quantity += newItem.quantity;
            showToast('Menge erhöht');
        } else {
            D.loot.push(newItem);
            showToast('Item hinzugefügt');
            // Neues Item selektieren
            selectedLootId = newItem.id;
        }
    }

    hideModal('loot-modal');
    (window as any).clearLootForm();
    renderLootList();
    if (selectedLootId) showLootDetail(selectedLootId);
    (window as any).save();
}

export function editLoot(id: number): void {
    showLootModal(id);
}

export function removeLoot(id: number): void {
    if (confirm('Item entfernen?')) {
        (window as any).pushUndo('Beute entfernt');
        const D = (window as any).D;
        D.loot = D.loot.filter((i: LootItem) => i.id !== id);
        // Selektion zurücksetzen falls gelöschtes Item selektiert war
        if (selectedLootId === id) {
            selectedLootId = null;
            clearLootDetail();
        }
        renderLootList();
        (window as any).save();
        showToast('Item entfernt');
    }
}

// ============================================================
// BATTLEFIELD CONDITIONS
// ============================================================

function renderBattlefieldBanner(): void {
    const banner = $('battlefield-banner');
    if (!banner) return;

    const D = (window as any).D;
    const bf = D.initiative?.battlefield;

    // Hide banner if no battlefield conditions
    if (!bf || (bf.terrain === 'normal' && !bf.hasLair)) {
        (banner as HTMLElement).style.display = 'none';
        return;
    }

    (banner as HTMLElement).style.display = 'flex';

    const tags: string[] = [];

    // Terrain tag
    if (bf.terrain && bf.terrain !== 'normal') {
        tags.push(`<span class="bf-tag terrain">${bf.terrainIcon} ${bf.terrainLabel} (×${bf.terrainMod})</span>`);
    }

    // Lair tag
    if (bf.hasLair) {
        tags.push(`<span class="bf-tag lair">🏰 Lair Actions</span>`);
    }

    banner.innerHTML = `
        <span class="bf-label">⚔️ Battlefield:</span>
        <div class="bf-conditions">${tags.join('')}</div>
        <span class="bf-xp">${bf.difficulty} • ${bf.finalXP?.toLocaleString() || '?'} XP</span>
        <button class="bf-clear" data-action="clear-battlefield" title="Battlefield zurücksetzen">✕</button>
    `;
}

export function clearBattlefield(): void {
    const D = (window as any).D;
    if (D.initiative) {
        delete D.initiative.battlefield;
        (window as any).save();
        renderInit();
        showToast('Battlefield-Bedingungen entfernt');
    }
}

// ============================================================
// GLOBAL EXPORTS (for backward compatibility)
// ============================================================

// Export functions to window for onclick handlers
(window as any).renderInit = renderInit;
(window as any).toggleInitSlot = toggleInitSlot;
(window as any).endCombat = endCombat;
(window as any).editInitValue = editInitValue;
(window as any).addCombatant = addCombatant;
(window as any).addPartyToInit = addPartyToInit;
(window as any).removeCombatant = removeCombatant;
(window as any).modHp = modHp;
(window as any).updateCharacterHP = updateCharacterHP;
(window as any).updateInitiativeCombatantHP = updateInitiativeCombatantHP;
(window as any).sortInit = sortInit;
(window as any).nextTurn = nextTurn;
(window as any).showAddEffect = showAddEffect;
(window as any).addEffectFromGrid = addEffectFromGrid;
(window as any).saveCustomEffect = saveCustomEffect;
(window as any).removeEffect = removeEffect;
(window as any).toggleDeathSave = toggleDeathSave;
(window as any).showConcentrationModal = showConcentrationModal;
(window as any).setConcentration = setConcentration;
(window as any).breakConcentration = breakConcentration;
(window as any).rollConcentrationCheck = rollConcentrationCheck;
(window as any).showAoEDamageModal = showAoEDamageModal;
(window as any).rollAoEDamage = rollAoEDamage;
(window as any).updateAoETargetDisplay = updateAoETargetDisplay;
(window as any).aoeSelectAll = aoeSelectAll;
(window as any).aoeSelectNone = aoeSelectNone;
(window as any).aoeSelectEnemies = aoeSelectEnemies;
(window as any).applyAoEDamage = applyAoEDamage;
(window as any).renderLoot = renderLoot;
(window as any).renderLootList = renderLootList;
(window as any).selectLoot = selectLoot;
(window as any).setLootFilter = setLootFilter;
(window as any).showLootModal = showLootModal;
(window as any).saveLoot = saveLoot;
(window as any).editLoot = editLoot;
(window as any).removeLoot = removeLoot;
(window as any).clearBattlefield = clearBattlefield;
