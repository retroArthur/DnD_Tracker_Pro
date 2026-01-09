interface DataStore {
    _nextId?: Record<string, number>;
    [key: string]: any;
}
/**
 * Generiert eine neue ID für einen Entity-Typ
 * @param type - Entity-Typ
 * @param dataStore - Datenspeicher mit _nextId
 * @returns Neue ID
 */
declare function nextId(type: string, dataStore: DataStore): number;
interface DiceNotation {
    count: number;
    sides: number;
    modifier: number;
}
/**
 * Debounce - Verzögert Ausführung
 * @param fn - Funktion
 * @param delay - Verzögerung in ms
 * @returns Debounced Funktion
 */
declare function debounce<T extends (...args: any[]) => any>(fn: T, delay?: number): (...args: Parameters<T>) => void;
/**
 * Throttle - Begrenzt Ausführungsrate
 * @param fn - Funktion
 * @param limit - Limit in ms
 * @returns Throttled Funktion
 */
declare function throttle<T extends (...args: any[]) => any>(fn: T, limit?: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=testable-utils.d.ts.map