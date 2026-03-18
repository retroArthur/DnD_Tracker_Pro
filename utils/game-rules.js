// [SECTION:GAME_RULES]
// D&D 5e game rules calculations
// Centralizes ability modifier, proficiency bonus, and other D&D rules

/**
 * Calculate ability modifier from ability score
 * D&D 5e formula: Math.floor((score - 10) / 2)
 *
 * @param {number} abilityScore - Ability score (1-30)
 * @returns {number} - Modifier (-5 to +10)
 *
 * @example
 * getAbilityModifier(18) // Returns: 4
 * getAbilityModifier(8)  // Returns: -1
 */
function getAbilityModifier(abilityScore) {
    const score = parseInt(abilityScore) || 10;
    return Math.floor((score - 10) / 2);
}

/**
 * Calculate proficiency bonus by character level
 * D&D 5e formula: Math.ceil(level / 4) + 1
 *
 * @param {number} level - Character level (1-20)
 * @returns {number} - Proficiency bonus (+2 to +6)
 *
 * @example
 * getProficiencyBonus(5)  // Returns: 3
 * getProficiencyBonus(17) // Returns: 6
 */
function getProficiencyBonus(level) {
    const lvl = Math.max(1, Math.min(20, parseInt(level) || 1));
    return Math.ceil(lvl / 4) + 1;
}

/**
 * Format modifier with sign (+4, -1, +0)
 *
 * @param {number} modifier - Numeric modifier
 * @returns {string} - Formatted string with sign
 */
function formatModifier(modifier) {
    const mod = parseInt(modifier) || 0;
    return mod >= 0 ? `+${mod}` : String(mod);
}

/**
 * Calculate hit points for a level-up
 * Uses average value (rounded up): Math.floor(hitDie / 2) + 1 + CON modifier
 *
 * @param {string} hitDie - Hit die size ('d6', 'd8', 'd10', 'd12')
 * @param {number} conModifier - Constitution modifier
 * @returns {number} - HP to add
 */
function calculateLevelUpHP(hitDie, conModifier) {
    const dieValue = {
        'd6': 6, 'd8': 8, 'd10': 10, 'd12': 12
    }[hitDie] || 8;

    const average = Math.floor(dieValue / 2) + 1;
    const conMod = parseInt(conModifier) || 0;
    return Math.max(1, average + conMod); // Minimum 1 HP per level
}

/**
 * Get hit die by class name
 *
 * @param {string} className - D&D class name (German or English)
 * @returns {string} - Hit die ('d6' to 'd12')
 */
function getClassHitDie(className) {
    const hitDice = {
        // German class names
        'Barbar': 'd12', 'Kämpfer': 'd10', 'Paladin': 'd10', 'Waldläufer': 'd10',
        'Kleriker': 'd8', 'Druide': 'd8', 'Mönch': 'd8', 'Schurke': 'd8',
        'Barde': 'd8', 'Hexenmeister': 'd8',
        'Zauberer': 'd6', 'Magier': 'd6',
        // English class names
        'Barbarian': 'd12', 'Fighter': 'd10', 'Paladin': 'd10', 'Ranger': 'd10',
        'Cleric': 'd8', 'Druid': 'd8', 'Monk': 'd8', 'Rogue': 'd8',
        'Bard': 'd8', 'Warlock': 'd8',
        'Sorcerer': 'd6', 'Wizard': 'd6'
    };

    return hitDice[className] || 'd8'; // Default d8
}

/**
 * Calculate spell save DC
 * Formula: 8 + proficiency bonus + spellcasting ability modifier
 *
 * @param {number} profBonus - Proficiency bonus
 * @param {number} abilityModifier - Spellcasting ability modifier
 * @returns {number} - Spell save DC
 */
function calculateSpellSaveDC(profBonus, abilityModifier) {
    return 8 + (parseInt(profBonus) || 0) + (parseInt(abilityModifier) || 0);
}

/**
 * Calculate spell attack bonus
 * Formula: proficiency bonus + spellcasting ability modifier
 *
 * @param {number} profBonus - Proficiency bonus
 * @param {number} abilityModifier - Spellcasting ability modifier
 * @returns {string} - Formatted attack bonus (e.g., '+7')
 */
function calculateSpellAttackBonus(profBonus, abilityModifier) {
    const bonus = (parseInt(profBonus) || 0) + (parseInt(abilityModifier) || 0);
    return formatModifier(bonus);
}

// Export to global scope (non-ESM architecture)
window.getProficiencyBonus = getProficiencyBonus;
