declare const DEBUG_MODE: any;
declare const PERF_MODE: any;
declare const log: (...args: any[]) => void;
declare const warn: (...args: any[]) => void;
declare const error: (...args: any[]) => void;
interface PerformanceConfig {
    virtualScroll: {
        enabled: boolean;
        threshold: number;
        itemHeight: number;
        bufferSize: number;
        viewportHeight: number;
    };
    debounce: {
        search: number;
        render: number;
        save: number;
        resize: number;
    };
    throttle: {
        scroll: number;
        mousemove: number;
    };
    lazyLoad: {
        enabled: boolean;
        rootMargin: string;
    };
}
interface RenderListOptions {
    itemHeight?: number;
    emptyState?: string | null;
    gridMode?: boolean;
}
interface PerformanceStats {
    debouncedFunctions: number;
    throttledFunctions: number;
    config: PerformanceConfig;
}
declare const PerformanceManager: {
    /** Konfiguration */
    config: PerformanceConfig;
    /** Performance-Metriken */
    _metrics: Map<string, number>;
    /** Gecachte Debounced-Funktionen */
    _debouncedFns: Map<string, Function>;
    /** Gecachte Throttled-Funktionen */
    _throttledFns: Map<string, Function>;
    /**
     * Startet eine Performance-Messung
     * @param label - Messungs-Label
     */
    startMeasure(label: string): void;
    /**
     * Beendet eine Performance-Messung
     * @param label - Messungs-Label
     * @returns Dauer in ms
     */
    endMeasure(label: string): number;
    /**
     * Holt oder erstellt eine debounced Version einer Funktion
     * @param key - Eindeutiger Schlüssel
     * @param fn - Original-Funktion
     * @param delay - Verzögerung in ms
     * @returns Debounced function
     */
    getDebounced<T extends (...args: any[]) => any>(key: string, fn: T, delay?: number): (...args: Parameters<T>) => void;
    /**
     * Holt oder erstellt eine throttled Version einer Funktion
     * @param key - Eindeutiger Schlüssel
     * @param fn - Original-Funktion
     * @param limit - Limit in ms
     * @returns Throttled function
     */
    getThrottled<T extends (...args: any[]) => any>(key: string, fn: T, limit?: number): (...args: Parameters<T>) => void;
    /**
     * Prüft ob Virtual Scroll verwendet werden sollte
     * @param itemCount - Anzahl der Items
     * @returns True wenn Virtual Scroll verwendet werden sollte
     */
    shouldUseVirtualScroll(itemCount: number): boolean;
    /**
     * Rendert eine Liste mit Virtual Scroll wenn nötig
     * @param container - Container oder ID
     * @param items - Alle Items
     * @param renderItem - Item-Render-Funktion
     * @param options - Optionen
     * @returns True wenn Virtual Scroll verwendet wurde
     */
    renderList<T>(container: HTMLElement | string, items: T[], renderItem: (item: T) => string, options?: RenderListOptions): boolean;
    /**
     * Interne Virtual-Scroll-Implementierung
     * @private
     */
    _renderVirtualList<T>(container: HTMLElement, items: T[], renderItem: (item: T) => string, itemHeight: number, gridMode: boolean): void;
    /**
     * Gibt Performance-Statistiken zurück
     * @returns Performance stats
     */
    getStats(): PerformanceStats;
};
declare const requestIdleCallback: any;
declare const cancelIdleCallback: any;
declare let lazyObserver: IntersectionObserver | null;
declare function initLazyObserver(): void;
declare const DOMBatch: {
    _queue: Array<() => void>;
    _scheduled: boolean;
    add(fn: () => void): void;
    _flush(): void;
};
declare const ObjectPool: {
    _pools: Map<string, any[]>;
    get<T>(type: string, factory: () => T): T;
    release<T>(type: string, obj: T): void;
};
//# sourceMappingURL=performance.d.ts.map