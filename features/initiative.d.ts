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
declare function getCombatant(id: number): Combatant | undefined;
declare function applyDamage(combatant: Combatant, damage: number): void;
/**
 * Get combatant entity details (AC, type, ID)
 * Uses centralized getEntityForCombat() from render/helpers.js
 * @param combatant - Initiative combatant
 * @returns { ac, entityType, entityId }
 */
declare function getInitCombatantDetails(combatant: Combatant): {
    ac: number;
    entityType: string | null;
    entityId: number | null;
};
/**
 * Calculate combatant HP status
 * @param combatant - Initiative combatant
 * @returns { hpPercent, hpClass }
 */
declare function getCombatantHpStatus(combatant: Combatant): {
    hpPercent: number;
    hpClass: string;
};
/**
 * Render combatant effects as HTML
 * @param combatant - Initiative combatant
 * @returns HTML string of effects
 */
declare function renderCombatantEffects(combatant: Combatant): string;
/**
 * Render combatant spell slots for player characters
 * @param combatant - Initiative combatant
 * @param character - Linked character entity (optional)
 * @returns HTML string of spell slots
 */
declare function renderCombatantSpellSlots(combatant: Combatant, character: Character | null): string;
declare function toggleInitSlot(charId: number, level: number, index: number): void;
declare function endCombat(): void;
declare function editInitValue(id: number): void;
declare function addCombatant(): void;
declare function addPartyToInit(): void;
declare function modHp(id: number, amt: number): void;
declare function updateInitiativeCombatantHP(id: number, amount: number): void;
declare function showAddEffect(id: number): void;
declare function renderEffectConditionsGrid(): void;
declare function addEffectFromGrid(conditionKey: string): void;
declare function saveCustomEffect(): void;
declare function removeEffect(cbId: number, effId: number): void;
declare function renderDeathSaves(cb: Combatant): string;
declare function toggleDeathSave(cbId: number, type: string, index: number): void;
declare function resetDeathSaves(cb: Combatant): void;
declare function renderConcentration(cb: Combatant): string;
declare function renderConcentrationCheck(cb: Combatant, damage: number): string;
declare function showConcentrationModal(cbId: number): void;
declare function setConcentration(cbId: number): void;
declare function breakConcentration(cbId: number): void;
declare function rollConcentrationCheck(cbId: number, dc: number): void;
declare let aoeCurrentDamage: number;
declare function showAoEDamageModal(): void;
declare function rollAoEDamage(): void;
declare function updateAoETargetDisplay(): void;
declare const debouncedUpdateAoE: any;
declare function aoeSelectAll(): void;
declare function aoeSelectNone(): void;
declare function aoeSelectEnemies(): void;
declare function applyAoEDamage(): void;
declare let selectedLootId: number | null;
declare let currentLootFilter: string;
declare function renderLootList(): void;
declare function renderLootItem(item: LootItem): string;
declare function selectLoot(id: number, scroll?: boolean): void;
declare function showLootDetail(id: number): void;
declare function clearLootDetail(): void;
declare function setLootFilter(f: string): void;
declare function showLootModal(id?: number | null): void;
declare function renderBattlefieldBanner(): void;
declare function clearBattlefield(): void;
//# sourceMappingURL=initiative.d.ts.map