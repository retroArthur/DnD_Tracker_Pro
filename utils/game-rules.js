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
    const dieValue =
        {
            d6: 6,
            d8: 8,
            d10: 10,
            d12: 12
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
        Barbar: 'd12',
        Kämpfer: 'd10',
        Paladin: 'd10',
        Waldläufer: 'd10',
        Kleriker: 'd8',
        Druide: 'd8',
        Mönch: 'd8',
        Schurke: 'd8',
        Barde: 'd8',
        Hexenmeister: 'd8',
        Zauberer: 'd6',
        Magier: 'd6',
        // English class names
        Barbarian: 'd12',
        Fighter: 'd10',
        Ranger: 'd10',
        Cleric: 'd8',
        Druid: 'd8',
        Monk: 'd8',
        Rogue: 'd8',
        Bard: 'd8',
        Warlock: 'd8',
        Sorcerer: 'd6',
        Wizard: 'd6'
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

// ============================================================
// PHASE 6: SPIELER-VERWALTUNG — Pure Rules Helpers
// ============================================================
// keep in sync with utils/testable-utils.js (CommonJS mirror)

/**
 * Berechnet den Fertigkeitsmodifikator eines Charakters für eine Fertigkeit.
 * Liest das Attribut aus SKILL_INFO, wendet Übungsbonus × Faktor an.
 *
 * Faktor: 0 = ungeübt, 1 = geübt, 2 = Expertise
 *
 * @param {Object} ch - Charakter-Objekt mit level, attributes, skillProficiencies, skillExpertise
 * @param {string} skillKey - Skill-Key aus SKILL_INFO (z.B. 'stealth', 'acrobatics')
 * @returns {number} - Fertigkeit-Modifikator (gesamt)
 */
function calcSkillModifier(ch, skillKey) {
    // SKILL_INFO liegt im globalen lexikalischen Scope (core/constants.js)
    const skillInfo = SKILL_INFO[skillKey];
    if (!skillInfo) return 0;
    const attrVal = ch.attributes?.[skillInfo.attr] || 10;
    const attrMod = getAbilityModifier(attrVal);
    // ch.proficiencyBonus kann explizit gesetzt sein (aus saveCharacter); Fallback: Formel
    const profBonus = ch.proficiencyBonus || getProficiencyBonus(ch.level || 1);
    const hasExpertise = !!ch.skillExpertise?.[skillKey];
    const isProficient = !!ch.skillProficiencies?.[skillKey];
    const profFactor = hasExpertise ? 2 : (isProficient ? 1 : 0);
    return attrMod + profBonus * profFactor;
}

/**
 * Prüft ob ein Charakter die XP-Schwelle für den nächsten Level erreicht hat.
 * Gibt false zurück wenn bereits Level 20 (Maximum).
 *
 * @param {Object} ch - Charakter mit level (1-20) und xp (kumulativ)
 * @returns {boolean}
 */
function canLevelUp(ch) {
    const nextLevel = (ch.level || 1) + 1;
    if (nextLevel > 20) return false;
    // XP_LEVEL_THRESHOLDS ist 0-basiert: Index [nextLevel-1] = Schwelle für nextLevel
    // ACHTUNG: XP_LEVEL_THRESHOLDS ≠ XP_THRESHOLDS (encounter-calculator.js)
    return (ch.xp || 0) >= XP_LEVEL_THRESHOLDS[nextLevel - 1];
}

/**
 * Gibt die XP-Belohnung für einen Herausforderungsgrad (CR) zurück.
 * Behandelt gemischte Schlüsseltypen in CR_TO_XP (Number-Keys für ganze CRs,
 * String-Keys für Brüche wie '1/8', '1/4', '1/2').
 *
 * @param {number|string} cr - Herausforderungsgrad (z.B. 1, '1/4', '1/2')
 * @returns {number} - XP-Wert oder 0 wenn unbekannt
 */
function getXPForCR(cr) {
    // CR_TO_XP liegt im globalen lexikalischen Scope (encounter-calculator.js)
    return CR_TO_XP[cr] ?? CR_TO_XP[String(cr)] ?? 0;
}

/**
 * Verteilt XP gleichmäßig auf aktive Charaktere (Math.floor).
 * Gibt {share, remainder} zurück — der Aufrufer ist verantwortlich für
 * saveUndoState()/save() und die Filterung lebender Party-Mitglieder.
 *
 * T-06-02: Sicher bei leerem Array (keine Division durch 0).
 *
 * @param {number} totalXP - Gesamt-XP aus dem Encounter
 * @param {Array} activeChars - Aktive Charaktere (bereits gefiltert)
 * @returns {{ share: number, remainder: number }}
 */
function distributeXP(totalXP, activeChars) {
    if (!activeChars || activeChars.length === 0) {
        return { share: 0, remainder: totalXP };
    }
    const share = Math.floor(totalXP / activeChars.length);
    const remainder = totalXP - share * activeChars.length;
    activeChars.forEach(ch => {
        ch.xp = (ch.xp || 0) + share;
    });
    return { share, remainder };
}

// Export to global scope (non-ESM architecture)
window.getProficiencyBonus = getProficiencyBonus;
window.calcSkillModifier = calcSkillModifier;
window.canLevelUp = canLevelUp;
window.getXPForCR = getXPForCR;
window.distributeXP = distributeXP;
