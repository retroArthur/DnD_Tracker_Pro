/**
 * D&D Tracker - Character Service (TypeScript)
 * @module features/character-service
 * @version 2.7.0
 */

import type {
    Character,
    EntityId,
    Attributes,
    SpellSlots,
    Currency,
    Condition
} from '../../types/entities';

import { getModifier, getProficiencyBonus, clamp, deepClone } from '../utils/utilities';

// ============================================================
// CHARACTER SERVICE
// ============================================================

/**
 * Character Service - Manages character operations
 */
export class CharacterService {
    /**
     * Get all characters
     */
    static getAll(): Character[] {
        return D.characters || [];
    }

    /**
     * Get character by ID
     */
    static getById(id: EntityId): Character | undefined {
        return D.characters.find(c => c.id === id);
    }

    /**
     * Get character by name
     */
    static getByName(name: string): Character | undefined {
        const lowerName = name.toLowerCase();
        return D.characters.find(c => c.name.toLowerCase() === lowerName);
    }

    /**
     * Get player characters only
     */
    static getPlayerCharacters(): Character[] {
        return D.characters.filter(c => c.playerName && c.playerName.trim() !== '');
    }

    /**
     * Create new character
     */
    static create(data: Partial<Character>): Character {
        const character: Character = {
            id: nextId('characters'),
            name: data.name || 'Neuer Charakter',
            playerName: data.playerName || '',
            characterClass: data.characterClass || 'Kämpfer',
            subclass: data.subclass || '',
            race: data.race || 'Mensch',
            level: clamp(data.level || 1, 1, 20),
            background: data.background || '',
            alignment: data.alignment || 'N',
            weight: data.weight || 0,
            height: data.height || 0,
            attributes: data.attributes || this.getDefaultAttributes(),
            saveProficiencies: data.saveProficiencies || this.getDefaultSaveProficiencies(),
            hpCurrent: data.hpCurrent ?? data.hpMax ?? 10,
            hpMax: data.hpMax || 10,
            tempHp: data.tempHp || 0,
            armorClass: data.armorClass || 10,
            initiative: data.initiative || 0,
            speed: data.speed || '9m',
            proficiencyBonus: getProficiencyBonus(data.level || 1),
            hitDice: data.hitDice || '1d10',
            passivePerception: data.passivePerception || 10,
            inspiration: data.inspiration || false,
            resistances: data.resistances || [],
            immunities: data.immunities || [],
            languages: data.languages || ['Gemein'],
            spellSlots: data.spellSlots || this.getDefaultSpellSlots(),
            currency: data.currency || this.getDefaultCurrency(),
            notes: data.notes || '',
            avatar: data.avatar || '',
            assignedSpells: data.assignedSpells || [],
            assignedItems: data.assignedItems || [],
            conditions: data.conditions || [],
            tags: data.tags || []
        };

        D.characters.push(character);
        return character;
    }

    /**
     * Update character
     */
    static update(id: EntityId, data: Partial<Character>): Character | null {
        const index = D.characters.findIndex(c => c.id === id);
        if (index === -1) return null;

        const character = D.characters[index];

        // Update fields
        Object.assign(character, data);

        // Recalculate proficiency bonus if level changed
        if (data.level !== undefined) {
            character.proficiencyBonus = getProficiencyBonus(character.level);
        }

        return character;
    }

    /**
     * Delete character
     */
    static delete(id: EntityId): boolean {
        const index = D.characters.findIndex(c => c.id === id);
        if (index === -1) return false;

        D.characters.splice(index, 1);
        return true;
    }

    /**
     * Clone character
     */
    static clone(id: EntityId): Character | null {
        const original = this.getById(id);
        if (!original) return null;

        const cloned = deepClone(original);
        cloned.id = nextId('characters');
        cloned.name = `${original.name} (Kopie)`;

        D.characters.push(cloned);
        return cloned;
    }

    // ============================================================
    // HP MANAGEMENT
    // ============================================================

    /**
     * Modify HP (heal or damage)
     */
    static modifyHp(
        id: EntityId,
        delta: number
    ): {
        newHp: number;
        overflow: number;
        isDead: boolean;
    } | null {
        const character = this.getById(id);
        if (!character) return null;

        let overflow = 0;

        if (delta > 0) {
            // Healing
            const newHp = character.hpCurrent + delta;
            overflow = Math.max(0, newHp - character.hpMax);
            character.hpCurrent = Math.min(newHp, character.hpMax);
        } else {
            // Damage - temp HP absorbs first
            let damage = Math.abs(delta);

            if (character.tempHp > 0) {
                const tempDamage = Math.min(character.tempHp, damage);
                character.tempHp -= tempDamage;
                damage -= tempDamage;
            }

            character.hpCurrent = Math.max(0, character.hpCurrent - damage);
            overflow = damage - (character.hpCurrent === 0 ? damage : 0);
        }

        return {
            newHp: character.hpCurrent,
            overflow,
            isDead: character.hpCurrent === 0
        };
    }

    /**
     * Set temporary HP
     */
    static setTempHp(id: EntityId, tempHp: number): boolean {
        const character = this.getById(id);
        if (!character) return false;

        // Temp HP doesn't stack - only take if higher
        character.tempHp = Math.max(character.tempHp, tempHp);
        return true;
    }

    /**
     * Full heal
     */
    static fullHeal(id: EntityId): boolean {
        const character = this.getById(id);
        if (!character) return false;

        character.hpCurrent = character.hpMax;
        return true;
    }

    // ============================================================
    // SPELL SLOTS
    // ============================================================

    /**
     * Use spell slot
     */
    static useSpellSlot(id: EntityId, level: number): boolean {
        const character = this.getById(id);
        if (!character || !character.spellSlots[level]) return false;

        const slot = character.spellSlots[level];
        if (slot.current <= 0) return false;

        slot.current--;
        return true;
    }

    /**
     * Restore spell slot
     */
    static restoreSpellSlot(id: EntityId, level: number): boolean {
        const character = this.getById(id);
        if (!character || !character.spellSlots[level]) return false;

        const slot = character.spellSlots[level];
        if (slot.current >= slot.max) return false;

        slot.current++;
        return true;
    }

    /**
     * Restore all spell slots (long rest)
     */
    static restoreAllSpellSlots(id: EntityId): boolean {
        const character = this.getById(id);
        if (!character) return false;

        for (const level in character.spellSlots) {
            character.spellSlots[level].current = character.spellSlots[level].max;
        }

        return true;
    }

    // ============================================================
    // CONDITIONS
    // ============================================================

    /**
     * Add condition to character
     */
    static addCondition(id: EntityId, condition: Condition): boolean {
        const character = this.getById(id);
        if (!character) return false;

        if (!character.conditions) {
            character.conditions = [];
        }

        // Check if already has condition
        const existing = character.conditions.find(c => c.name === condition.name);
        if (existing) {
            // Update duration if longer
            if (
                condition.duration &&
                (!existing.duration || condition.duration > existing.duration)
            ) {
                existing.duration = condition.duration;
            }
            return true;
        }

        character.conditions.push(condition);
        return true;
    }

    /**
     * Remove condition from character
     */
    static removeCondition(id: EntityId, conditionIndex: number): boolean {
        const character = this.getById(id);
        if (!character || !character.conditions) return false;

        if (conditionIndex < 0 || conditionIndex >= character.conditions.length) {
            return false;
        }

        character.conditions.splice(conditionIndex, 1);
        return true;
    }

    /**
     * Clear all conditions
     */
    static clearConditions(id: EntityId): boolean {
        const character = this.getById(id);
        if (!character) return false;

        character.conditions = [];
        return true;
    }

    // ============================================================
    // CALCULATIONS
    // ============================================================

    /**
     * Calculate passive perception
     */
    static calculatePassivePerception(character: Character): number {
        const wisModifier = getModifier(character.attributes.wis);
        const profBonus = character.proficiencyBonus;

        // Assume proficiency in Perception (could be extended)
        return 10 + wisModifier + profBonus;
    }

    /**
     * Calculate initiative bonus
     */
    static calculateInitiative(character: Character): number {
        return getModifier(character.attributes.dex);
    }

    /**
     * Get saving throw bonus
     */
    static getSavingThrow(character: Character, ability: keyof Attributes): number {
        const modifier = getModifier(character.attributes[ability]);
        const isProficient = character.saveProficiencies[ability];

        return modifier + (isProficient ? character.proficiencyBonus : 0);
    }

    /**
     * Get all saving throws
     */
    static getAllSavingThrows(character: Character): Record<keyof Attributes, number> {
        const abilities: (keyof Attributes)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

        return abilities.reduce(
            (acc, ability) => {
                acc[ability] = this.getSavingThrow(character, ability);
                return acc;
            },
            {} as Record<keyof Attributes, number>
        );
    }

    // ============================================================
    // DEFAULTS
    // ============================================================

    static getDefaultAttributes(): Attributes {
        return {
            str: 10,
            dex: 10,
            con: 10,
            int: 10,
            wis: 10,
            cha: 10
        };
    }

    static getDefaultSaveProficiencies(): Record<keyof Attributes, boolean> {
        return {
            str: false,
            dex: false,
            con: false,
            int: false,
            wis: false,
            cha: false
        };
    }

    static getDefaultSpellSlots(): SpellSlots {
        const slots: SpellSlots = {};
        for (let i = 0; i <= 9; i++) {
            slots[i] = { max: 0, current: 0 };
        }
        return slots;
    }

    static getDefaultCurrency(): Currency {
        return {
            pm: 0,
            gm: 0,
            em: 0,
            sm: 0,
            km: 0
        };
    }
}

// ============================================================
// EXPORT
// ============================================================

export default CharacterService;
