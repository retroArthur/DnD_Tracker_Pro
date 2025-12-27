/**
 * Performance Utilities (TypeScript)
 * Performance-Optimierungen und Monitoring
 * @module utils/performance
 * @version 2.7.0
 */

// ============================================================
// TYPES
// ============================================================

export interface VirtualScrollConfig {
    enabled: boolean;
    threshold: number;
    itemHeight: number;
    bufferSize: number;
    viewportHeight: number;
}

export interface DebounceConfig {
    search: number;
    render: number;
    save: number;
    resize: number;
}

export interface ThrottleConfig {
    scroll: number;
    mousemove: number;
}

export interface LazyLoadConfig {
    enabled: boolean;
    rootMargin: string;
}

export interface PerformanceConfig {
    virtualScroll: VirtualScrollConfig;
    debounce: DebounceConfig;
    throttle: ThrottleConfig;
    lazyLoad: LazyLoadConfig;
}

export interface RenderListOptions {
    itemHeight?: number;
    emptyState?: string | null;
    gridMode?: boolean;
}

export interface PerformanceStats {
    debouncedFunctions: number;
    throttledFunctions: number;
    config: PerformanceConfig;
}

type AnyFunction = (...args: unknown[]) => unknown;

// ============================================================
// LOGGING
// ============================================================

/**
 * Debug-Modus Logger (nur in Debug-Modus aktiv)
 */
export function createLogger(debugMode: boolean, prefix: string = '[DnD]') {
    return {
        log: debugMode ? (...args: unknown[]) => console.log(prefix, ...args) : () => {},
        warn: (...args: unknown[]) => console.warn(prefix, ...args),
        error: (...args: unknown[]) => console.error(prefix, ...args)
    };
}

// ============================================================
// DEBOUNCE & THROTTLE
// ============================================================

/**
 * Debounce - Verzögert Ausführung bis keine weiteren Aufrufe mehr kommen
 */
export function debounce<T extends AnyFunction>(fn: T, delay: number = 300): T {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return function debounced(this: unknown, ...args: Parameters<T>) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    } as T;
}

/**
 * Throttle - Begrenzt Ausführung auf einmal pro Zeitintervall
 */
export function throttle<T extends AnyFunction>(fn: T, limit: number = 100): T {
    let inThrottle = false;
    let lastArgs: Parameters<T> | null = null;
    let lastThis: unknown = null;

    return function throttled(this: unknown, ...args: Parameters<T>) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
                if (lastArgs) {
                    fn.apply(lastThis, lastArgs);
                    lastArgs = null;
                    lastThis = null;
                }
            }, limit);
        } else {
            lastArgs = args;
            lastThis = this;
        }
    } as T;
}

// ============================================================
// PERFORMANCE MANAGER
// ============================================================

/**
 * Zentrale Performance-Steuerung
 */
export class PerformanceManager {
    private _metrics: Map<string, number> = new Map();
    private _debouncedFns: Map<string, AnyFunction> = new Map();
    private _throttledFns: Map<string, AnyFunction> = new Map();
    private _perfMode: boolean;
    private _debugMode: boolean;

    public config: PerformanceConfig = {
        virtualScroll: {
            enabled: true,
            threshold: 50,
            itemHeight: 120,
            bufferSize: 5,
            viewportHeight: 600
        },
        debounce: {
            search: 150,
            render: 100,
            save: 300,
            resize: 200
        },
        throttle: {
            scroll: 16,
            mousemove: 32
        },
        lazyLoad: {
            enabled: true,
            rootMargin: '100px'
        }
    };

    constructor(debugMode: boolean = false, perfMode: boolean = false) {
        this._debugMode = debugMode;
        this._perfMode = perfMode;
    }

    /**
     * Startet eine Performance-Messung
     */
    startMeasure(label: string): void {
        if (!this._perfMode) return;
        this._metrics.set(label, performance.now());
    }

    /**
     * Beendet eine Performance-Messung
     */
    endMeasure(label: string): number {
        if (!this._perfMode) return 0;
        const start = this._metrics.get(label);
        if (!start) return 0;
        const duration = performance.now() - start;
        this._metrics.delete(label);
        if (this._debugMode && duration > 50) {
            console.warn(`[Perf] ${label}: ${duration.toFixed(2)}ms`);
        }
        return duration;
    }

    /**
     * Holt oder erstellt eine debounced Version einer Funktion
     */
    getDebounced<T extends AnyFunction>(
        key: string,
        fn: T,
        delay: number = this.config.debounce.render
    ): T {
        if (!this._debouncedFns.has(key)) {
            this._debouncedFns.set(key, debounce(fn, delay));
        }
        return this._debouncedFns.get(key) as T;
    }

    /**
     * Holt oder erstellt eine throttled Version einer Funktion
     */
    getThrottled<T extends AnyFunction>(
        key: string,
        fn: T,
        limit: number = this.config.throttle.scroll
    ): T {
        if (!this._throttledFns.has(key)) {
            this._throttledFns.set(key, throttle(fn, limit));
        }
        return this._throttledFns.get(key) as T;
    }

    /**
     * Prüft ob Virtual Scroll verwendet werden sollte
     */
    shouldUseVirtualScroll(itemCount: number): boolean {
        return (
            this.config.virtualScroll.enabled && itemCount >= this.config.virtualScroll.threshold
        );
    }

    /**
     * Gibt Performance-Statistiken zurück
     */
    getStats(): PerformanceStats {
        return {
            debouncedFunctions: this._debouncedFns.size,
            throttledFunctions: this._throttledFns.size,
            config: this.config
        };
    }

    /**
     * Leert alle gecachten Funktionen
     */
    clearCache(): void {
        this._debouncedFns.clear();
        this._throttledFns.clear();
        this._metrics.clear();
    }
}

// ============================================================
// DOM BATCH UPDATES
// ============================================================

/**
 * Effiziente DOM-Batch-Updates mit requestAnimationFrame
 */
export class DOMBatch {
    private _queue: Array<() => void> = [];
    private _scheduled: boolean = false;

    /**
     * Fügt eine DOM-Operation zur Queue hinzu
     */
    add(fn: () => void): void {
        this._queue.push(fn);
        if (!this._scheduled) {
            this._scheduled = true;
            requestAnimationFrame(() => this._flush());
        }
    }

    private _flush(): void {
        const queue = this._queue;
        this._queue = [];
        this._scheduled = false;
        queue.forEach(fn => fn());
    }
}

// ============================================================
// OBJECT POOL
// ============================================================

/**
 * Object Pool für häufig erstellte Objekte
 */
export class ObjectPool<T> {
    private _pool: T[] = [];
    private _factory: () => T;

    constructor(factory: () => T) {
        this._factory = factory;
    }

    /**
     * Holt ein Objekt aus dem Pool oder erstellt ein neues
     */
    get(): T {
        return this._pool.length > 0 ? this._pool.pop()! : this._factory();
    }

    /**
     * Gibt ein Objekt zurück in den Pool
     */
    release(obj: T): void {
        this._pool.push(obj);
    }

    /**
     * Leert den Pool
     */
    clear(): void {
        this._pool = [];
    }

    /**
     * Gibt die aktuelle Pool-Größe zurück
     */
    get size(): number {
        return this._pool.length;
    }
}

// ============================================================
// LAZY OBSERVER
// ============================================================

/**
 * Intersection Observer für Lazy Loading
 */
export class LazyObserver {
    private _observer: IntersectionObserver | null = null;

    constructor(rootMargin: string = '100px') {
        if ('IntersectionObserver' in window) {
            this._observer = new IntersectionObserver(
                entries => this._handleIntersection(entries),
                { rootMargin }
            );
        }
    }

    private _handleIntersection(entries: IntersectionObserverEntry[]): void {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target as HTMLElement;
                const renderFn = el.dataset.lazyRender;
                const win = window as unknown as Record<string, unknown>;
                if (renderFn && typeof win[renderFn] === 'function') {
                    (win[renderFn] as (el: HTMLElement) => void)(el);
                    this._observer?.unobserve(el);
                }
            }
        });
    }

    /**
     * Beobachtet ein Element
     */
    observe(element: Element): void {
        this._observer?.observe(element);
    }

    /**
     * Beendet die Beobachtung eines Elements
     */
    unobserve(element: Element): void {
        this._observer?.unobserve(element);
    }

    /**
     * Beendet alle Beobachtungen
     */
    disconnect(): void {
        this._observer?.disconnect();
    }
}

// ============================================================
// REQUEST IDLE CALLBACK POLYFILL
// ============================================================

export const requestIdleCallback: (cb: IdleRequestCallback) => number =
    (window as unknown as { requestIdleCallback?: typeof globalThis.requestIdleCallback })
        .requestIdleCallback ||
    ((cb: IdleRequestCallback) =>
        setTimeout(
            () =>
                cb({
                    didTimeout: false,
                    timeRemaining: () => 50
                }),
            1
        ));

export const cancelIdleCallback: (id: number) => void =
    (window as unknown as { cancelIdleCallback?: typeof globalThis.cancelIdleCallback })
        .cancelIdleCallback || clearTimeout;

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
    createLogger,
    debounce,
    throttle,
    PerformanceManager,
    DOMBatch,
    ObjectPool,
    LazyObserver,
    requestIdleCallback,
    cancelIdleCallback
};
