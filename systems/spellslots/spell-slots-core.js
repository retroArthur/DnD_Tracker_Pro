// [SECTION:SPELL_SLOTS_CORE]
// Extrahiert aus spellslots.js
// Zauberslot-Kernfunktionen
// Zeilen: 95
// [SECTION:SPELLSLOTS]
// CHARAKTER ZAUBERSLOTS SYSTEM - @spells @slots @caster
// ============================================================
/**
 * Zauberslot-Tabelle für Vollzauberer (Wizard, Cleric, Druid, Bard, Sorcerer)
 * Index = Charakterstufe, Werte = [1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th, 9th]
 */
const SPELL_SLOT_TABLE = Object.freeze({
    // [Level]: [1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th, 9th]
    1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
    2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
    3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
    4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
    5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
    6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
    7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
    8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
    9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
    10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
    11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
    12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
    13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
    14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
    15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
    16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
    17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
    18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
    19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
    20: [4, 3, 3, 3, 3, 2, 2, 1, 1]
});
/**
 * Zauberslot-Tabelle für Halbzauberer (Paladin, Ranger)
 * Slots beginnen bei Level 2
 */
const HALF_CASTER_TABLE = Object.freeze({
    2: [2, 0, 0, 0, 0],
    3: [3, 0, 0, 0, 0],
    4: [3, 0, 0, 0, 0],
    5: [4, 2, 0, 0, 0],
    6: [4, 2, 0, 0, 0],
    7: [4, 3, 0, 0, 0],
    8: [4, 3, 0, 0, 0],
    9: [4, 3, 2, 0, 0],
    10: [4, 3, 2, 0, 0],
    11: [4, 3, 3, 0, 0],
    12: [4, 3, 3, 0, 0],
    13: [4, 3, 3, 1, 0],
    14: [4, 3, 3, 1, 0],
    15: [4, 3, 3, 2, 0],
    16: [4, 3, 3, 2, 0],
    17: [4, 3, 3, 3, 1],
    18: [4, 3, 3, 3, 1],
    19: [4, 3, 3, 3, 2],
    20: [4, 3, 3, 3, 2]
});
/**
 * Zauberslot-Tabelle für Drittelzauberer (Eldritch Knight, Arcane Trickster)
 * Slots beginnen bei Level 3
 */
const THIRD_CASTER_TABLE = Object.freeze({
    3: [2, 0, 0, 0],
    4: [3, 0, 0, 0],
    7: [4, 2, 0, 0],
    10: [4, 3, 0, 0],
    13: [4, 3, 2, 0],
    16: [4, 3, 3, 0],
    19: [4, 3, 3, 1]
});
/**
 * Zuordnung von Klassen zu Zauberwirker-Typen
 */
const CASTER_CLASSES = Object.freeze({
    full: [
        'Magier',
        'Kleriker',
        'Druide',
        'Barde',
        'Zauberer',
        'Hexenmeister',
        'Wizard',
        'Cleric',
        'Druid',
        'Sorcerer',
        'Warlock'
    ],
    half: ['Paladin', 'Waldläufer', 'Ranger'],
    third: ['Kämpfer', 'Schurke', 'Fighter', 'Rogue'] // Subklassen-abhängig
});
/**
 * Ermittelt die verfügbaren Zauberslots für eine Klasse und Stufe
 * @param characterClass - Klasse des Charakters
 * @param level - Charakterstufe (1-20)
 * @returns Array mit Anzahl Slots pro Zauberstufe
 */
function getSpellSlotsForClass(characterClass, level) {
    const cls = (characterClass || '').toLowerCase();
    // Volle Zauberwirker
    if (CASTER_CLASSES.full.some(c => cls.includes(c.toLowerCase()))) {
        return SPELL_SLOT_TABLE[level] || [0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    // Halbe Zauberwirker
    if (CASTER_CLASSES.half.some(c => cls.includes(c.toLowerCase()))) {
        return HALF_CASTER_TABLE[level] || [0, 0, 0, 0, 0];
    }
    // Für Kämpfer/Schurke - könnte Subklasse sein
    if (CASTER_CLASSES.third.some(c => cls.includes(c.toLowerCase()))) {
        return THIRD_CASTER_TABLE[level] || [0, 0, 0, 0];
    }
    // Nicht-Zauberwirker oder unbekannt - leere Slots
    return [0, 0, 0, 0, 0, 0, 0, 0, 0];
}
// ============================================================
