// [SECTION:PERFORMANCE]
// ============================================================
// PERFORMANCE OPTIMIZATIONS & DEBUG CONFIG
// ============================================================

import { $ } from './basic';
import { debounce, throttle } from './utilities';

// Aliase für Rückwärtskompatibilität (referenzieren APP_CONFIG)
const DEBUG_MODE = (window as any).APP_CONFIG?.DEBUG_MODE;
const PERF_MODE = (window as any).APP_CONFIG?.PERF_MODE;

// Conditional logging - only logs in debug mode
const log = DEBUG_MODE ? console.log.bind(console, '[DnD]') : (): void => {};
const warn = console.warn.bind(console, '[DnD]');
const error = console.error.bind(console, '[DnD]');

// ============================================================
// PERFORMANCE MANAGER - Zentrale Performance-Steuerung
// ============================================================

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

export const PerformanceManager = {
    /** Konfiguration */
    config: {
        virtualScroll: {
            enabled: true,
            threshold: 50,      // Ab dieser Anzahl aktivieren
            itemHeight: 120,    // Durchschnittliche Item-Höhe
            bufferSize: 5,      // Extra Items vor/nach Viewport
            viewportHeight: 600 // Standard-Viewport-Höhe
        },
        debounce: {
            search: 150,        // Such-Input Debounce
            render: 100,        // Render-Debounce
            save: 300,          // Save-Debounce
            resize: 200         // Resize-Debounce
        },
        throttle: {
            scroll: 16,         // ~60fps
            mousemove: 32       // ~30fps
        },
        lazyLoad: {
            enabled: true,
            rootMargin: '100px'
        }
    } as PerformanceConfig,

    /** Performance-Metriken */
    _metrics: new Map<string, number>(),

    /** Gecachte Debounced-Funktionen */
    _debouncedFns: new Map<string, Function>(),

    /** Gecachte Throttled-Funktionen */
    _throttledFns: new Map<string, Function>(),

    /**
     * Startet eine Performance-Messung
     * @param label - Messungs-Label
     */
    startMeasure(label: string): void {
        if (!PERF_MODE) return;
        this._metrics.set(label, performance.now());
    },

    /**
     * Beendet eine Performance-Messung
     * @param label - Messungs-Label
     * @returns Dauer in ms
     */
    endMeasure(label: string): number {
        if (!PERF_MODE) return 0;
        const start = this._metrics.get(label);
        if (!start) return 0;
        const duration = performance.now() - start;
        this._metrics.delete(label);
        if (DEBUG_MODE && duration > 50) {
            console.warn(`[Perf] ${label}: ${duration.toFixed(2)}ms`);
        }
        return duration;
    },

    /**
     * Holt oder erstellt eine debounced Version einer Funktion
     * @param key - Eindeutiger Schlüssel
     * @param fn - Original-Funktion
     * @param delay - Verzögerung in ms
     * @returns Debounced function
     */
    getDebounced<T extends (...args: any[]) => any>(
        key: string,
        fn: T,
        delay?: number
    ): (...args: Parameters<T>) => void {
        const actualDelay = delay !== undefined ? delay : this.config.debounce.render;
        if (!this._debouncedFns.has(key)) {
            this._debouncedFns.set(key, debounce(fn, actualDelay));
        }
        return this._debouncedFns.get(key) as (...args: Parameters<T>) => void;
    },

    /**
     * Holt oder erstellt eine throttled Version einer Funktion
     * @param key - Eindeutiger Schlüssel
     * @param fn - Original-Funktion
     * @param limit - Limit in ms
     * @returns Throttled function
     */
    getThrottled<T extends (...args: any[]) => any>(
        key: string,
        fn: T,
        limit?: number
    ): (...args: Parameters<T>) => void {
        const actualLimit = limit !== undefined ? limit : this.config.throttle.scroll;
        if (!this._throttledFns.has(key)) {
            this._throttledFns.set(key, throttle(fn, actualLimit));
        }
        return this._throttledFns.get(key) as (...args: Parameters<T>) => void;
    },

    /**
     * Prüft ob Virtual Scroll verwendet werden sollte
     * @param itemCount - Anzahl der Items
     * @returns True wenn Virtual Scroll verwendet werden sollte
     */
    shouldUseVirtualScroll(itemCount: number): boolean {
        return this.config.virtualScroll.enabled &&
               itemCount >= this.config.virtualScroll.threshold;
    },

    /**
     * Rendert eine Liste mit Virtual Scroll wenn nötig
     * @param container - Container oder ID
     * @param items - Alle Items
     * @param renderItem - Item-Render-Funktion
     * @param options - Optionen
     * @returns True wenn Virtual Scroll verwendet wurde
     */
    renderList<T>(
        container: HTMLElement | string,
        items: T[],
        renderItem: (item: T) => string,
        options: RenderListOptions = {}
    ): boolean {
        const el = typeof container === 'string' ? $(container) : container;
        if (!el || !items) return false;

        const {
            itemHeight = this.config.virtualScroll.itemHeight,
            emptyState = null,
            gridMode = false
        } = options;

        // Leere Liste
        if (items.length === 0) {
            el.innerHTML = emptyState || '';
            return false;
        }

        // Kleine Listen: Normales Rendering
        if (!this.shouldUseVirtualScroll(items.length)) {
            el.innerHTML = items.map(renderItem).join('');
            return false;
        }

        // Virtual Scroll für große Listen
        this._renderVirtualList(el, items, renderItem, itemHeight, gridMode);
        return true;
    },

    /**
     * Interne Virtual-Scroll-Implementierung
     * @private
     */
    _renderVirtualList<T>(
        container: HTMLElement,
        items: T[],
        renderItem: (item: T) => string,
        itemHeight: number,
        gridMode: boolean
    ): void {
        const cfg = this.config.virtualScroll;
        const viewportHeight = container.clientHeight || cfg.viewportHeight;
        const totalHeight = items.length * itemHeight;

        // Berechne sichtbaren Bereich
        const scrollTop = container.scrollTop || 0;
        let startIdx = Math.floor(scrollTop / itemHeight);
        startIdx = Math.max(0, startIdx - cfg.bufferSize);

        const visibleCount = Math.ceil(viewportHeight / itemHeight);
        let endIdx = startIdx + visibleCount + (cfg.bufferSize * 2);
        endIdx = Math.min(items.length, endIdx);

        const visibleItems = items.slice(startIdx, endIdx);
        const offsetY = startIdx * itemHeight;

        // Render mit Spacer für korrektes Scrolling
        const gridClass = gridMode ? 'style="display:grid;gap:10px;"' : '';
        container.innerHTML = `
            <div class="virtual-scroll-wrapper" style="height:${totalHeight}px;position:relative;">
                <div class="virtual-scroll-content" style="transform:translateY(${offsetY}px);" ${gridClass}>
                    ${visibleItems.map(renderItem).join('')}
                </div>
            </div>
        `;

        // Scroll-Handler (throttled)
        const scrollHandler = this.getThrottled(
            `vs-${container.id}`,
            () => this._renderVirtualList(container, items, renderItem, itemHeight, gridMode),
            50
        );

        container.onscroll = scrollHandler as any;
    },

    /**
     * Gibt Performance-Statistiken zurück
     * @returns Performance stats
     */
    getStats(): PerformanceStats {
        return {
            debouncedFunctions: this._debouncedFns.size,
            throttledFunctions: this._throttledFns.size,
            config: this.config
        };
    }
};

// Performance: RequestIdleCallback polyfill
export const requestIdleCallback = (window as any).requestIdleCallback || ((cb: IdleRequestCallback) => setTimeout(cb, 1));
export const cancelIdleCallback = (window as any).cancelIdleCallback || clearTimeout;

// Performance: Intersection Observer for lazy rendering
let lazyObserver: IntersectionObserver | null = null;

export function initLazyObserver(): void {
    if (!('IntersectionObserver' in window)) return;
    lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target as HTMLElement;
                if (el.dataset.lazyRender) {
                    const fn = (window as any)[el.dataset.lazyRender];
                    if (typeof fn === 'function') fn(el);
                    lazyObserver!.unobserve(el);
                }
            }
        });
    }, { rootMargin: '100px' });
}

// Performance: Efficient DOM batch updates
export const DOMBatch = {
    _queue: [] as Array<() => void>,
    _scheduled: false,

    add(fn: () => void): void {
        this._queue.push(fn);
        if (!this._scheduled) {
            this._scheduled = true;
            requestAnimationFrame(() => this._flush());
        }
    },

    _flush(): void {
        const queue = this._queue;
        this._queue = [];
        this._scheduled = false;
        queue.forEach(fn => fn());
    }
};

// Performance: Object pool for frequently created objects
export const ObjectPool = {
    _pools: new Map<string, any[]>(),

    get<T>(type: string, factory: () => T): T {
        if (!this._pools.has(type)) {
            this._pools.set(type, []);
        }
        const pool = this._pools.get(type)!;
        return pool.length > 0 ? pool.pop() : factory();
    },

    release<T>(type: string, obj: T): void {
        if (!this._pools.has(type)) {
            this._pools.set(type, []);
        }
        this._pools.get(type)!.push(obj);
    }
};
