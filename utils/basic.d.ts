declare function $$(sel: string): NodeListOf<Element>;
declare function stripHtml(s: string | null | undefined): string;
declare function updateSearchClear(input: HTMLInputElement): void;
/** Vertrag SENKEN R3: Link aus Daten -> derselbe Link oder '' (nur http:, https:, mailto:). */
declare function sichererLink(url: unknown): string;
/** Vertrag SENKEN R2: nur #rgb/#rrggbb, sonst der feste Ersatz aus dem Code. */
declare function sichereFarbe(wert: unknown, ersatz: string): string;
/** Vertrag SENKEN R2: nur ein Wert aus der Erlaubnisliste, sonst der feste Ersatz. */
declare function sichereKlasse(wert: unknown, erlaubteWerte: readonly string[], ersatz: string): string;
/** Vertrag SENKEN R4: verbotene Schluessel entfernen, Zahlen-/Verweisfelder auf Zahl zwingen. */
declare function bereinigeDatengrenze<T>(daten: T): T;
interface StorageResult {
    success: boolean;
    error?: string;
    original?: Error;
}
interface StorageInfo {
    usedBytes: number;
    usedMB: string;
    estimatedLimitMB: string;
    percentUsed: string;
}
declare const StorageAPI: {
    get(key: string, fallback?: any): any;
    set(key: string, value: string): StorageResult;
    setQuiet(key: string, value: string): StorageResult;
    remove(key: string): StorageResult;
    isAvailable(): boolean;
    getStorageInfo(): StorageInfo | null;
    getJSON<T = any>(key: string, fallback?: T | null): T | null;
    setJSON(key: string, obj: any): StorageResult;
    has(key: string): boolean;
    clear(): StorageResult;
};
//# sourceMappingURL=basic.d.ts.map