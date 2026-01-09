interface ConditionInfo {
    name: string;
    desc: string;
    effect: {
        name: string;
        color: string;
    };
}
interface QuickRefEntry {
    id: number;
    title: string;
    content: string;
    expanded: boolean;
}
declare const QREF_CONDITIONS: Record<string, ConditionInfo>;
/**
 * Oeffnet oder schliesst das Quick Reference Panel
 * Fokussiert automatisch das Suchfeld beim Oeffnen
 */
declare function toggleQuickRef(): void;
/**
 * Klappt eine Section im Quick Reference Panel ein/aus
 * @param el - Element innerhalb der Section
 */
declare function toggleQrefSection(el: HTMLElement): void;
/**
 * Zeigt die Detailbeschreibung eines Zustands an
 * @param conditionKey - Schluessel des Zustands (z.B. 'blinded', 'charmed')
 */
declare function showConditionDetail(conditionKey: string): void;
/**
 * Wendet einen Zustand auf den aktuellen Combatant an
 * @param conditionKey - Schluessel des Zustands aus QREF_CONDITIONS
 */
declare function applyQrefCondition(conditionKey: string): void;
/**
 * Wuerfelt eine Formel aus der Quick Reference
 * @param diceFormula - Wuerfelformel (z.B. '3d6', '1d20')
 */
declare function rollQrefDice(diceFormula: string): void;
/**
 * Filtert Quick Reference Sections nach Suchbegriff
 * @param query - Suchbegriff
 */
declare function qrefSearch(query: string): void;
/**
 * Initialisiert die Suche im Quick Reference Panel
 * Registriert Event-Listener fuer Input und Escape-Taste
 */
declare function initQrefSearch(): void;
declare function toggleQuickRefSection(sectionEl: HTMLElement, evt?: Event): void;
declare const METRIC_TO_M: Record<string, number>;
declare const M_TO_IMPERIAL: Record<string, number>;
declare const IMPERIAL_TO_M: Record<string, number>;
/**
 * Rundet nach D&D-Stil: 1-4 ab, 5-9 auf
 */
declare function dndRound(value: number): number;
/**
 * Konvertiert von Metrisch zu Imperial
 */
declare function convertUnitsMetric(): void;
/**
 * Konvertiert von Imperial zu Metrisch
 */
declare function convertUnitsImperial(): void;
/**
 * Initialisiert die benutzerdefinierten Quick Reference Eintraege
 */
declare function initQuickRefCustom(): void;
/**
 * Rendert die benutzerdefinierten Quick Reference Eintraege
 */
declare function renderQuickRefCustom(): void;
/**
 * Oeffnet das Modal zum Hinzufuegen eines neuen Quick Reference Eintrags
 */
declare function addQuickRefEntry(): void;
/**
 * Oeffnet das Modal zum Bearbeiten eines Quick Reference Eintrags
 * @param id - Eintrag-ID
 */
declare function editQuickRefEntry(id: number): void;
/**
 * Speichert einen Quick Reference Eintrag (neu oder bearbeitet)
 */
declare function saveQuickRefEntry(): void;
/**
 * Loescht einen Quick Reference Eintrag nach Bestaetigung
 * @param id - Eintrag-ID
 */
declare function deleteQuickRefEntry(id: number): void;
/**
 * Klappt einen benutzerdefinierten Eintrag ein/aus
 * @param id - Eintrag-ID
 */
declare function toggleQuickRefCustomEntry(id: number): void;
//# sourceMappingURL=quick-reference.d.ts.map