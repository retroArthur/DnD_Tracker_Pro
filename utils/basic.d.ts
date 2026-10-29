declare function $$(sel: string): NodeListOf<Element>;
declare function stripHtml(s: string | null | undefined): string;
declare function updateSearchClear(input: HTMLInputElement): void;
/** Vertrag SENKEN R3: Link aus Daten -> derselbe Link oder '' (nur http:, https:, mailto:). */
declare function sichererLink(url: unknown): string;
/**
 * Vertrag SENKEN R3, nur Linkliste (Nutzerentscheidung 29.10.): wie sichererLink, dazu
 * lokale Datei-Links `file:///<Laufwerk oder absoluter Pfad>`; Netzwerkpfade (UNC) -> ''.
 */
declare function sichererListenLink(url: unknown): string;
/** Vertrag SENKEN R2: nur #rgb/#rrggbb, sonst der feste Ersatz aus dem Code. */
declare function sichereFarbe(wert: unknown, ersatz: string): string;
/** Vertrag SENKEN R2: nur ein Wert aus der Erlaubnisliste, sonst der feste Ersatz. */
declare function sichereKlasse(wert: unknown, erlaubteWerte: readonly string[], ersatz: string): string;
/** Vertrag SENKEN R4: verbotene Schluessel entfernen, Zahlen-/Verweisfelder auf Zahl zwingen. */
declare function bereinigeDatengrenze<T>(daten: T): T;
/**
 * Vertrag SENKEN R3: Bildquelle aus Daten -> dieselbe Quelle oder '' (http(s), data:image/,
 * relativ und lokale `file:///`-Pfade, beide nach demselben Pruefkern wie sichererListenLink;
 * Netzwerkpfade, protokoll-relative Quellen und relative Pfade mit doppeltem, auch kodiertem
 * Trenner (`/%5C%5Chost`) -> '').
 */
declare function sichereBildquelle(url: unknown): string;
/** Vertrag SENKEN R1: bereinigtes Markup inert parsen, Knoten bearbeiten, Markup zurueck. */
declare function bearbeiteMarkup(
    html: string,
    bearbeiten: (koerper: HTMLElement, doc: Document) => void
): string;
/** Vertrag SENKEN R1: Treffer nur in Textknoten ersetzen, Ersatz als Knoten. */
declare function ersetzeImText(
    html: string,
    muster: RegExp,
    bauen: (doc: Document, ...treffer: string[]) => Node | null
): string;
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