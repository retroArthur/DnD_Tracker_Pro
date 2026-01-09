/**
 * Zauberslot-Tabelle für Vollzauberer (Wizard, Cleric, Druid, Bard, Sorcerer)
 * Index = Charakterstufe, Werte = [1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th, 9th]
 */
declare const SPELL_SLOT_TABLE: Readonly<Record<number, number[]>>;
/**
 * Zauberslot-Tabelle für Halbzauberer (Paladin, Ranger)
 * Slots beginnen bei Level 2
 */
declare const HALF_CASTER_TABLE: Readonly<Record<number, number[]>>;
/**
 * Zauberslot-Tabelle für Drittelzauberer (Eldritch Knight, Arcane Trickster)
 * Slots beginnen bei Level 3
 */
declare const THIRD_CASTER_TABLE: Readonly<Record<number, number[]>>;
/**
 * Zuordnung von Klassen zu Zauberwirker-Typen
 */
declare const CASTER_CLASSES: Readonly<Record<string, ReadonlyArray<string>>>;
/**
 * Ermittelt die verfügbaren Zauberslots für eine Klasse und Stufe
 * @param characterClass - Klasse des Charakters
 * @param level - Charakterstufe (1-20)
 * @returns Array mit Anzahl Slots pro Zauberstufe
 */
declare function getSpellSlotsForClass(characterClass: string, level: number): number[];
//# sourceMappingURL=spell-slots-core.d.ts.map