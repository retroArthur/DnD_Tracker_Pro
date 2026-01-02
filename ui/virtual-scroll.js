// [SECTION:VIRTUAL_SCROLL]
// VIRTUAL SCROLLING HELPER (für große Listen) - @virtual @scroll @list
// Mit Memory Leak Fix: Event-Listener werden ordentlich verwaltet
// ============================================================
const VirtualScroll = {
    // WeakMap speichert Handler-Referenzen zur späteren Entfernung
    _listeners: new WeakMap(),

    // Konfiguration
    config: {
        threshold: 50,      // Aktiviere ab 50+ Items
        bufferSize: 5,      // Extra Items vor/nach sichtbarem Bereich
        defaultHeight: 60   // Standard Item-Höhe
    },

    /**
     * Erstellt virtuelles Scrolling für große Listen
     * @param {HTMLElement} container - Container-Element
     * @param {Array} items - Liste der Items
     * @param {Function} renderItem - Render-Funktion für einzelne Items
     * @param {number} itemHeight - Höhe eines Items in px
     */
    create(container, items, renderItem, itemHeight = this.config.defaultHeight) {
        if (!container || !items) return;

        // Entferne alten Listener falls vorhanden (Memory Leak Prevention)
        this.destroy(container);

        if (items.length < this.config.threshold) {
            // Für kleine Listen normales Rendering
            container.innerHTML = items.map(renderItem).join('');
            return;
        }

        const totalHeight = items.length * itemHeight;
        const viewportHeight = container.clientHeight || 400;
        const bufferSize = this.config.bufferSize;

        // Scroll-Container Setup
        container.style.height = viewportHeight + 'px';
        container.style.overflow = 'auto';
        container.style.position = 'relative';

        // Content-Wrapper
        const wrapper = document.createElement('div');
        wrapper.style.height = totalHeight + 'px';
        wrapper.style.position = 'relative';

        const visibleContainer = document.createElement('div');
        visibleContainer.style.position = 'absolute';
        visibleContainer.style.left = '0';
        visibleContainer.style.right = '0';

        wrapper.appendChild(visibleContainer);
        container.innerHTML = '';
        container.appendChild(wrapper);

        const render = () => {
            const scrollTop = container.scrollTop;
            const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
            const endIdx = Math.min(items.length, Math.ceil((scrollTop + viewportHeight) / itemHeight) + bufferSize);

            visibleContainer.style.top = (startIdx * itemHeight) + 'px';
            visibleContainer.innerHTML = items.slice(startIdx, endIdx).map(renderItem).join('');
        };

        render();

        // Speichere Handler-Referenz für späteren Cleanup
        const scrollHandler = throttle(render, 16);
        this._listeners.set(container, scrollHandler);
        container.addEventListener('scroll', scrollHandler, { passive: true });
    },

    /**
     * Entfernt Event-Listener und bereinigt Container
     * @param {HTMLElement} container - Container-Element
     */
    destroy(container) {
        if (!container) return;

        if (this._listeners.has(container)) {
            container.removeEventListener('scroll', this._listeners.get(container));
            this._listeners.delete(container);
        }
    },

    /**
     * Prüft ob Virtual Scroll für Item-Anzahl verwendet werden sollte
     * @param {number} itemCount - Anzahl der Items
     * @returns {boolean}
     */
    shouldUse(itemCount) {
        return itemCount >= this.config.threshold;
    }
};

// Initialize Event Delegation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        EventDelegation.init();
        initLazyObserver();
    });
} else {
    EventDelegation.init();
    initLazyObserver();
}

