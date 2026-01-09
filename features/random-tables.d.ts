/**
 * Random Tables System
 * - Erstelle eigene Zufallstabellen
 * - Würfle auf Tabellen
 * - Speichere in D.randomTables
 */
interface RandomTableEntry {
    weight?: number;
    text: string;
    range?: string;
}
interface RandomTable {
    id: number;
    name: string;
    icon: string;
    entries: RandomTableEntry[];
    diceType?: number;
}
interface RollResult {
    entry: RandomTableEntry;
    roll: number;
    diceType: number;
}
declare const DEFAULT_DICE_TYPE: number;
declare const DICE_TYPES: readonly number[];
declare const MAX_RANGE_SIZE: number;
declare let selectedTableId: number | null;
declare function initRandomTables(): void;
declare function getDefaultRandomTables(): RandomTable[];
/**
 * Würfelt auf einer Tabelle und gibt das Ergebnis zurück
 * Unterstützt sowohl das neue Range-Format als auch das alte Weight-Format
 * @param table - Die Tabelle mit entries
 * @returns { entry, roll, diceType } oder null
 */
declare function rollWeightedEntry(table: RandomTable | null | undefined): RollResult | null;
/**
 * Parst einen Bereichs-String und gibt ein Array von Zahlen zurück
 * @param rangeStr - z.B. "1", "1-4", "5-8"
 * @param maxValue - Maximaler erlaubter Wert (DoS-Schutz)
 * @returns Array der abgedeckten Zahlen (nur positive, <= maxValue)
 */
declare function parseRange(rangeStr: string, maxValue?: number): number[];
declare function renderRandomTables(): void;
declare function selectTable(id: number): void;
declare function showTablePreview(id: number): void;
declare function rollOnTable(id: number): void;
declare function showTableModal(id?: number | null): void;
declare function selectDiceType(diceType: number): void;
declare function renderTableEntryRow(index: number, entry?: RandomTableEntry): string;
/**
 * Aktualisiert den Hinweis über abgedeckte/fehlende Bereiche
 */
declare function updateRangeHint(): void;
/**
 * Füllt leere Bereiche automatisch mit den nächsten verfügbaren Werten
 */
declare function fillRemainingRanges(): void;
declare function addTableEntry(): void;
declare function removeTableEntry(index: number): void;
declare function saveTable(): void;
declare function deleteTable(id: number): void;
declare function showGeneratorModal(): void;
declare function rollOnTableAndShow(id: number): void;
declare function deleteTableAndRefresh(id: number): void;
declare function quickRandomRoll(): void;
//# sourceMappingURL=random-tables.d.ts.map