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
/** Vertrag SENKEN R3: Link aus Daten -> derselbe Link oder '' (nur http:, https:, mailto:). */
declare function sichererLink(url: unknown): string;
/** Vertrag SENKEN R3: Bildquelle aus Daten -> dieselbe Quelle oder '' (http(s), data:image/, relativ). */
declare function sichereBildquelle(url: unknown): string;
/** Vertrag SENKEN R3, nur Linkliste: wie sichererLink, dazu lokale `file:///`-Pfade; Netzwerkpfade -> ''. */
declare function sichererListenLink(url: unknown): string;
/** Vertrag SENKEN R2: nur #rgb/#rrggbb, sonst der feste Ersatz aus dem Code. */
declare function sichereFarbe(wert: unknown, ersatz: string): string;
/** Vertrag SENKEN R2: nur ein Wert aus der Erlaubnisliste, sonst der feste Ersatz. */
declare function sichereKlasse(wert: unknown, erlaubteWerte: readonly string[], ersatz: string): string;
/** Vertrag SENKEN R4: verbotene Schluessel entfernen, Zahlen-/Verweisfelder auf Zahl zwingen. */
declare function bereinigeDatengrenze<T>(daten: T): T;
//# sourceMappingURL=testable-utils.d.ts.map