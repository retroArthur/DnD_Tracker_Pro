/**
 * D&D Tracker - Safe Render Utility
 * Optimiertes DOM-Rendering mit automatischer Strategie-Wahl
 * @module ui/safe-render
 * @version 2.7.0
 */

// ============================================================
// RENDER STRATEGIES
// ============================================================

/**
 * Rendering-Strategie basierend auf Content-Größe und -Art
 */
const RenderStrategy = {
    INNER_HTML: 'innerHTML',      // Schnell für kleine HTML-Strings
    DOCUMENT_FRAGMENT: 'fragment', // Effizient für viele Elemente
    TEMPLATE: 'template',          // Für wiederholte Strukturen
    VIRTUAL: 'virtual'             // Für sehr große Listen
};

/**
 * Schwellwerte für Strategie-Auswahl
 */
const THRESHOLDS = {
    FRAGMENT_ITEMS: 20,     // Ab dieser Anzahl Items → Fragment
    VIRTUAL_ITEMS: 100,     // Ab dieser Anzahl → Virtual Rendering
    LARGE_HTML: 50000       // Zeichen für großen HTML-String
};

// ============================================================
// SAFE RENDER CLASS
// ============================================================

/**
 * SafeRender - Intelligentes DOM-Rendering
 */
class SafeRender {
    
    /**
     * Rendert HTML-String in Container
     * Optimiert automatisch basierend auf Content
     * @param {HTMLElement} container - Ziel-Container
     * @param {string} html - HTML-String
     * @param {Object} options - Optionen
     */
    static html(container, html, options = {}) {
        if (!container) return;
        
        const { 
            append = false,      // Anhängen statt ersetzen
            sanitize = false,    // HTML sanitieren
            batch = true         // Batch-Update verwenden
        } = options;
        
        // Sanitize wenn gewünscht
        let safeHtml = html;
        if (sanitize && typeof sanitizeHTML === 'function') {
            safeHtml = sanitizeHTML(html);
        }
        
        // Rendering durchführen
        const doRender = () => {
            if (append) {
                container.insertAdjacentHTML('beforeend', safeHtml);
            } else {
                container.innerHTML = safeHtml;
            }
        };
        
        if (batch) {
            requestAnimationFrame(doRender);
        } else {
            doRender();
        }
    }
    
    /**
     * Rendert Array von Items in Container
     * Wählt automatisch beste Strategie
     * @param {HTMLElement} container - Ziel-Container
     * @param {Array} items - Daten-Array
     * @param {Function} renderFn - Funktion zum Rendern eines Items (item) => HTMLString | Node
     * @param {Object} options - Optionen
     */
    static list(container, items, renderFn, options = {}) {
        if (!container) return;
        
        const {
            keyAttr = 'data-id',
            emptyHtml = '',
            containerClass = '',
            useVirtual = true
        } = options;
        
        // Leere Liste
        if (!items || items.length === 0) {
            container.innerHTML = emptyHtml;
            return;
        }
        
        // Container-Klasse setzen
        if (containerClass) {
            container.className = containerClass;
        }
        
        // Strategie wählen
        const strategy = this._chooseStrategy(items.length, useVirtual);
        
        switch (strategy) {
            case RenderStrategy.INNER_HTML:
                this._renderWithInnerHTML(container, items, renderFn);
                break;
                
            case RenderStrategy.DOCUMENT_FRAGMENT:
                this._renderWithFragment(container, items, renderFn, keyAttr);
                break;
                
            case RenderStrategy.VIRTUAL:
                this._renderVirtual(container, items, renderFn, options);
                break;
                
            default:
                this._renderWithInnerHTML(container, items, renderFn);
        }
    }
    
    /**
     * Wählt beste Rendering-Strategie
     */
    static _chooseStrategy(itemCount, allowVirtual) {
        if (allowVirtual && itemCount > THRESHOLDS.VIRTUAL_ITEMS) {
            return RenderStrategy.VIRTUAL;
        }
        if (itemCount > THRESHOLDS.FRAGMENT_ITEMS) {
            return RenderStrategy.DOCUMENT_FRAGMENT;
        }
        return RenderStrategy.INNER_HTML;
    }
    
    /**
     * Rendert mit innerHTML (schnell für kleine Listen)
     */
    static _renderWithInnerHTML(container, items, renderFn) {
        const htmlParts = items.map(item => {
            const result = renderFn(item);
            if (typeof result === 'string') return result;
            if (result instanceof HTMLElement) return result.outerHTML;
            return '';
        });
        
        requestAnimationFrame(() => {
            container.innerHTML = htmlParts.join('');
        });
    }
    
    /**
     * Rendert mit DocumentFragment (effizient für mittlere Listen)
     */
    static _renderWithFragment(container, items, renderFn, keyAttr) {
        const fragment = document.createDocumentFragment();
        
        items.forEach(item => {
            const result = renderFn(item);
            
            if (result instanceof Node) {
                if (item.id) result.setAttribute(keyAttr, item.id);
                fragment.appendChild(result);
            } else if (typeof result === 'string') {
                // HTML-String zu Node konvertieren
                const temp = document.createElement('div');
                temp.innerHTML = result;
                while (temp.firstChild) {
                    const child = temp.firstChild;
                    if (child instanceof Element && item.id) {
                        child.setAttribute(keyAttr, item.id);
                    }
                    fragment.appendChild(child);
                }
            }
        });
        
        requestAnimationFrame(() => {
            container.innerHTML = '';
            container.appendChild(fragment);
        });
    }
    
    /**
     * Virtuelles Rendering für sehr große Listen
     */
    static _renderVirtual(container, items, renderFn, options) {
        const itemHeight = options.itemHeight || 100;
        const bufferSize = options.bufferSize || 5;
        
        // Wrapper erstellen
        container.innerHTML = '';
        container.style.position = 'relative';
        container.style.overflow = 'auto';
        
        // Spacer für Scroll-Höhe
        const spacer = document.createElement('div');
        spacer.style.height = `${items.length * itemHeight}px`;
        container.appendChild(spacer);
        
        // Content-Container
        const content = document.createElement('div');
        content.style.position = 'absolute';
        content.style.top = '0';
        content.style.left = '0';
        content.style.right = '0';
        container.appendChild(content);
        
        // State
        let lastStart = -1;
        
        // Render-Funktion
        const renderVisible = () => {
            const scrollTop = container.scrollTop;
            const containerHeight = container.clientHeight;
            
            const start = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
            const end = Math.min(items.length, 
                Math.ceil((scrollTop + containerHeight) / itemHeight) + bufferSize);
            
            // Nur neu rendern wenn nötig
            if (start === lastStart) return;
            lastStart = start;
            
            // Position anpassen
            content.style.transform = `translateY(${start * itemHeight}px)`;
            
            // Sichtbare Items rendern
            const visibleItems = items.slice(start, end);
            const fragment = document.createDocumentFragment();
            
            visibleItems.forEach(item => {
                const result = renderFn(item);
                if (result instanceof Node) {
                    fragment.appendChild(result);
                } else if (typeof result === 'string') {
                    const temp = document.createElement('div');
                    temp.innerHTML = result;
                    while (temp.firstChild) {
                        fragment.appendChild(temp.firstChild);
                    }
                }
            });
            
            content.innerHTML = '';
            content.appendChild(fragment);
        };
        
        // Initial rendern
        renderVisible();
        
        // Scroll-Handler mit Throttling
        let scrollTimeout;
        container.addEventListener('scroll', () => {
            if (scrollTimeout) return;
            scrollTimeout = setTimeout(() => {
                scrollTimeout = null;
                renderVisible();
            }, 16); // ~60fps
        });
    }
    
    /**
     * Aktualisiert einzelnes Element in Liste
     * @param {HTMLElement} container - Container
     * @param {string} keyAttr - Key-Attribut
     * @param {*} id - Element-ID
     * @param {string|Node} newContent - Neuer Inhalt
     */
    static updateItem(container, keyAttr, id, newContent) {
        const existing = container.querySelector(`[${keyAttr}="${id}"]`);
        if (!existing) return false;
        
        if (newContent instanceof Node) {
            existing.replaceWith(newContent);
        } else if (typeof newContent === 'string') {
            existing.outerHTML = newContent;
        }
        
        return true;
    }
    
    /**
     * Entfernt Element aus Liste
     */
    static removeItem(container, keyAttr, id) {
        const existing = container.querySelector(`[${keyAttr}="${id}"]`);
        if (existing) {
            existing.remove();
            return true;
        }
        return false;
    }
    
    /**
     * Fügt Element zu Liste hinzu
     */
    static addItem(container, content, position = 'end') {
        if (!container) return;
        
        const insertHTML = (html) => {
            if (position === 'start') {
                container.insertAdjacentHTML('afterbegin', html);
            } else {
                container.insertAdjacentHTML('beforeend', html);
            }
        };
        
        if (content instanceof Node) {
            if (position === 'start') {
                container.insertBefore(content, container.firstChild);
            } else {
                container.appendChild(content);
            }
        } else if (typeof content === 'string') {
            insertHTML(content);
        }
    }
}

// ============================================================
// OPTIMIZED RENDER FUNCTIONS
// ============================================================

/**
 * Optimiertes Rendering für NPC-Liste
 */
function renderNPCListFast(container, npcs, options = {}) {
    SafeRender.list(container, npcs, (npc) => {
        // Inline-Template für maximale Performance
        const locationName = typeof EntityLookup !== 'undefined' 
            ? EntityLookup.getName('locations', npc.locationId) 
            : '—';
        const avatar = npc.avatar 
            ? `<img src="${esc(npc.avatar)}" alt="">` 
            : (npc.name ? npc.name.charAt(0).toUpperCase() : '?');
        
        return `
            <div class="npc-card" data-action="toggle-npc-card" data-id="${npc.id}">
                <div class="npc-avatar">${avatar}</div>
                <div class="npc-content">
                    <div class="npc-name">${esc(npc.name)}</div>
                    <div class="npc-role">${esc(npc.role || '')}</div>
                    ${locationName !== '—' ? `<div class="npc-location">📍 ${locationName}</div>` : ''}
                </div>
                <div class="npc-actions" data-stop-propagation="true">
                    <button class="btn-icon" data-action="edit-npc" data-id="${npc.id}">✏️</button>
                    <button class="btn-icon btn-danger" data-action="delete-npc" data-id="${npc.id}">🗑️</button>
                </div>
            </div>
        `;
    }, {
        containerClass: options.viewMode === 'list' ? 'list-view-container' : 'npc-grid',
        emptyHtml: typeof renderEmptyState === 'function' 
            ? renderEmptyState({
                icon: '🎭',
                titleEmpty: 'Keine NPCs',
                descEmpty: 'Erstelle Nicht-Spieler-Charaktere.',
                buttonText: '➕ NPC erstellen',
                buttonAction: 'show-modal',
                buttonValue: 'npc-modal'
            })
            : '<p>Keine NPCs</p>'
    });
}

/**
 * Optimiertes Rendering für Encounter-Liste
 */
function renderEncounterListFast(container, encounters, options = {}) {
    SafeRender.list(container, encounters, (enc) => {
        return `
            <div class="enc-card" data-id="${enc.id}">
                <div class="enc-header">
                    <span class="enc-name">${esc(enc.name)}</span>
                    <span class="enc-cr">CR ${esc(enc.cr)}</span>
                </div>
                <div class="enc-stats">
                    <span>HP: ${enc.hp}</span>
                    <span>AC: ${enc.ac}</span>
                    <span>Init: ${enc.init >= 0 ? '+' : ''}${enc.init}</span>
                </div>
                <div class="enc-actions" data-stop-propagation="true">
                    <button class="btn-icon" data-action="add-enc-to-init" data-id="${enc.id}" title="Zur Initiative">⚔️</button>
                    <button class="btn-icon" data-action="edit-enc" data-id="${enc.id}">✏️</button>
                    <button class="btn-icon btn-danger" data-action="delete-enc" data-id="${enc.id}">🗑️</button>
                </div>
            </div>
        `;
    }, {
        containerClass: 'enc-grid',
        itemHeight: 120
    });
}

// ============================================================
// BATCH UPDATES
// ============================================================

/**
 * Sammelt mehrere DOM-Updates und führt sie gebatcht aus
 */
class BatchUpdater {
    constructor() {
        this.updates = [];
        this.scheduled = false;
    }
    
    /**
     * Fügt Update zur Queue hinzu
     */
    queue(fn) {
        this.updates.push(fn);
        
        if (!this.scheduled) {
            this.scheduled = true;
            requestAnimationFrame(() => this.flush());
        }
    }
    
    /**
     * Führt alle gesammelten Updates aus
     */
    flush() {
        const updates = this.updates;
        this.updates = [];
        this.scheduled = false;
        
        updates.forEach(fn => {
            try {
                fn();
            } catch (e) {
                console.error('[BatchUpdater] Update failed:', e);
            }
        });
    }
}

// Globale Instanz
const batchUpdater = new BatchUpdater();

// ============================================================
// EXPORTS (Global)
// ============================================================

if (typeof window !== 'undefined') {
    window.SafeRender = SafeRender;
    window.renderNPCListFast = renderNPCListFast;
    window.renderEncounterListFast = renderEncounterListFast;
    window.batchUpdater = batchUpdater;
}
