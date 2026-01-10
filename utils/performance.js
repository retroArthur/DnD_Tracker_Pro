// [SECTION:PERFORMANCE]
// ============================================================
// PERFORMANCE OPTIMIZATIONS & DEBUG CONFIG
// ============================================================
// Aliase für Rückwärtskompatibilität (referenzieren APP_CONFIG)
const DEBUG_MODE = window.APP_CONFIG?.DEBUG_MODE;
const PERF_MODE = window.APP_CONFIG?.PERF_MODE;
// Conditional logging - only logs in debug mode
const log = DEBUG_MODE ? console.log.bind(console, '[DnD]') : () => { };
const warn = console.warn.bind(console, '[DnD]');
const error = console.error.bind(console, '[DnD]');
const PerformanceManager = {
    /** Konfiguration */
    config: {
        virtualScroll: {
            enabled: true,
            threshold: 50, // Ab dieser Anzahl aktivieren
            itemHeight: 120, // Durchschnittliche Item-Höhe
            bufferSize: 5, // Extra Items vor/nach Viewport
            viewportHeight: 600 // Standard-Viewport-Höhe
        },
        debounce: {
            search: 150, // Such-Input Debounce
            render: 100, // Render-Debounce
            save: 300, // Save-Debounce
            resize: 200 // Resize-Debounce
        },
        throttle: {
            scroll: 16, // ~60fps
            mousemove: 32 // ~30fps
        },
        lazyLoad: {
            enabled: true,
            rootMargin: '100px'
        }
    },
    /** Performance-Metriken */
    _metrics: new Map(),
    /** Gecachte Debounced-Funktionen */
    _debouncedFns: new Map(),
    /** Gecachte Throttled-Funktionen */
    _throttledFns: new Map(),
    /**
     * Startet eine Performance-Messung
     * @param label - Messungs-Label
     */
    startMeasure(label) {
        if (!PERF_MODE)
            return;
        this._metrics.set(label, performance.now());
    },
    /**
     * Beendet eine Performance-Messung
     * @param label - Messungs-Label
     * @returns Dauer in ms
     */
    endMeasure(label) {
        if (!PERF_MODE)
            return 0;
        const start = this._metrics.get(label);
        if (!start)
            return 0;
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
    getDebounced(key, fn, delay) {
        const actualDelay = delay !== undefined ? delay : this.config.debounce.render;
        if (!this._debouncedFns.has(key)) {
            this._debouncedFns.set(key, debounce(fn, actualDelay));
        }
        return this._debouncedFns.get(key);
    },
    /**
     * Holt oder erstellt eine throttled Version einer Funktion
     * @param key - Eindeutiger Schlüssel
     * @param fn - Original-Funktion
     * @param limit - Limit in ms
     * @returns Throttled function
     */
    getThrottled(key, fn, limit) {
        const actualLimit = limit !== undefined ? limit : this.config.throttle.scroll;
        if (!this._throttledFns.has(key)) {
            this._throttledFns.set(key, throttle(fn, actualLimit));
        }
        return this._throttledFns.get(key);
    },
    /**
     * Prüft ob Virtual Scroll verwendet werden sollte
     * @param itemCount - Anzahl der Items
     * @returns True wenn Virtual Scroll verwendet werden sollte
     */
    shouldUseVirtualScroll(itemCount) {
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
    renderList(container, items, renderItem, options = {}) {
        const el = typeof container === 'string' ? $(container) : container;
        if (!el || !items)
            return false;
        const { itemHeight = this.config.virtualScroll.itemHeight, emptyState = null, gridMode = false } = options;
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
    _renderVirtualList(container, items, renderItem, itemHeight, gridMode) {
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
        const scrollHandler = this.getThrottled(`vs-${container.id}`, () => this._renderVirtualList(container, items, renderItem, itemHeight, gridMode), 50);
        container.onscroll = scrollHandler;
    },
    /**
     * Gibt Performance-Statistiken zurück
     * @returns Performance stats
     */
    getStats() {
        return {
            debouncedFunctions: this._debouncedFns.size,
            throttledFunctions: this._throttledFns.size,
            config: this.config
        };
    }
};
// Performance: RequestIdleCallback polyfill
const requestIdleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
const cancelIdleCallback = window.cancelIdleCallback || clearTimeout;
// Performance: Intersection Observer for lazy rendering
let lazyObserver = null;
function initLazyObserver() {
    if (!('IntersectionObserver' in window))
        return;
    lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                if (el.dataset.lazyRender) {
                    const fn = window[el.dataset.lazyRender];
                    if (typeof fn === 'function')
                        fn(el);
                    lazyObserver.unobserve(el);
                }
            }
        });
    }, { rootMargin: '100px' });
}
// Performance: Efficient DOM batch updates
const DOMBatch = {
    _queue: [],
    _scheduled: false,
    add(fn) {
        this._queue.push(fn);
        if (!this._scheduled) {
            this._scheduled = true;
            requestAnimationFrame(() => this._flush());
        }
    },
    _flush() {
        const queue = this._queue;
        this._queue = [];
        this._scheduled = false;
        queue.forEach(fn => fn());
    }
};
// Performance: Object pool for frequently created objects
const ObjectPool = {
    _pools: new Map(),
    get(type, factory) {
        if (!this._pools.has(type)) {
            this._pools.set(type, []);
        }
        const pool = this._pools.get(type);
        return pool.length > 0 ? pool.pop() : factory();
    },
    release(type, obj) {
        if (!this._pools.has(type)) {
            this._pools.set(type, []);
        }
        this._pools.get(type).push(obj);
    }
};
