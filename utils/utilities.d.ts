/**
 * DOM-Element-Cache für häufig verwendete Elemente
 * Reduziert DOM-Abfragen bei wiederholtem Zugriff
 */
declare const domCache: Map<string, HTMLElement | null>;
/**
 * Gecachte DOM-Element-Abfrage
 * @param id - Element-ID
 * @returns Gecachtes Element oder null
 */
declare function $c(id: string): HTMLElement | null;
/**
 * Leert den DOM-Cache
 * Nützlich nach dynamischen DOM-Änderungen
 * @param id - Spezifische ID zum Entfernen, oder alle wenn nicht angegeben
 */
declare function clearDomCache(id?: string): void;
/**
 * Debounce - Verzögert Ausführung bis keine weiteren Aufrufe mehr kommen
 * @param fn - Zu verzögernde Funktion
 * @param delay - Verzögerung in Millisekunden
 * @returns Debounced Funktion
 * @example
 * const debouncedSearch = debounce(search, 300);
 * input.addEventListener('input', debouncedSearch);
 */
declare function debounce<T extends (...args: any[]) => any>(fn: T, delay?: number): (...args: Parameters<T>) => void;
/**
 * Throttle - Begrenzt Ausführung auf einmal pro Zeitintervall
 * Verbesserte Version: Speichert den letzten Aufruf und führt ihn nach dem Intervall aus
 * @param fn - Zu drosselnde Funktion
 * @param limit - Mindestabstand zwischen Aufrufen in ms
 * @returns Throttled Funktion
 * @example
 * const throttledScroll = throttle(onScroll, 100);
 * window.addEventListener('scroll', throttledScroll);
 */
declare function throttle<T extends (...args: any[]) => any>(fn: T, limit?: number): (...args: Parameters<T>) => void;
/**
 * Memoization für teure Berechnungen mit Cache-Limit
 * @param fn - Zu cachende Funktion
 * @param maxSize - Maximale Anzahl gecachter Ergebnisse
 * @returns Memoized Funktion
 * @example
 * const expensiveCalc = memoize((n) => fibonacci(n), 50);
 */
declare function memoize<T extends (...args: any[]) => any>(fn: T, maxSize?: number): (...args: Parameters<T>) => ReturnType<T>;
/**
 * Teilt ein Array in Chunks auf
 * @param array - Zu teilendes Array
 * @param size - Größe jedes Chunks
 * @returns Array von Chunks
 * @example
 * chunkArray([1,2,3,4,5], 2) // [[1,2], [3,4], [5]]
 */
declare function chunkArray<T>(array: T[], size: number): T[][];
/**
 * Parst eine Entity-ID sicher zu einer Nummer
 * Zentrale Utility-Funktion für konsistente ID-Behandlung in allen Modulen
 * @param id - ID als Nummer oder String
 * @returns Numerische ID oder null wenn ungültig
 * @example
 * parseEntityId(42)      // 42
 * parseEntityId('42')    // 42
 * parseEntityId('abc')   // null
 * parseEntityId(null)    // null
 */
declare function parseEntityId(id: number | string | null | undefined): number | null;
/**
 * Error Boundary Wrapper für kritische Funktionen
 * Fängt Fehler ab und zeigt eine Toast-Benachrichtigung
 * Unterstützt sowohl synchrone als auch asynchrone Funktionen
 * @param fn - Zu wrappende Funktion
 * @param context - Kontext für Fehlermeldung
 * @returns Gewrappte Funktion mit Error-Handling
 * @example
 * const safeDelete = withErrorBoundary(deleteItem, 'Löschen');
 */
declare function withErrorBoundary<T extends (...args: any[]) => any>(fn: T, context?: string): (...args: Parameters<T>) => ReturnType<T> | Promise<ReturnType<T> | null> | null;
/**
 * Generiert eine eindeutige ID für einen Entity-Typ
 * @param type - Entity-Typ (characters, npcs, quests, etc.)
 * @returns Neue eindeutige ID
 */
declare function nextId(type: string): number;
interface NextIdValidationResult {
    valid: boolean;
    repairs: string[];
}
/**
 * Validates and repairs D._nextId for all entity types
 * Ensures _nextId[type] is always greater than max ID in D[type]
 * @returns Object with validation status and repairs performed
 */
declare function validateAndRepairNextId(): NextIdValidationResult;
type ToastType = 'success' | 'error' | 'warning' | 'info';
/**
 * Toggle Event-Log persistent mode
 */
declare function toggleEventLog(): void;
/**
 * Clear all event log entries
 */
declare function clearEventLog(): void;
/**
 * Berechnet den D&D-Modifikator für einen Attributwert
 * @param score - Attributwert (1-30)
 * @returns Modifikator (z.B. 10 → 0, 14 → 2, 8 → -1)
 */
declare function getAttrMod(score: number): number;
/**
 * Berechnet den Übungsbonus für eine Charakterstufe (D&D 5E)
 * @param level - Charakterstufe (1-20)
 * @returns Übungsbonus (2-6)
 */
declare function getProfBonus(level: number): number;
/**
 * Generiert eine einfache UUID v4
 * @returns UUID v4
 */
declare function generateId(): string;
/**
 * Wartet eine bestimmte Zeit (für async/await)
 * @param ms - Wartezeit in Millisekunden
 * @returns Promise that resolves after the delay
 */
declare function sleep(ms: number): Promise<void>;
//# sourceMappingURL=utilities.d.ts.map