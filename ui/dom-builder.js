// [SECTION:DOM_BUILDER]
// ============================================================
// DOM BUILDER - @dom @fragment @render
// ============================================================

/**
 * Erstellt ein DOM-Element mit Attributen und Kindern
 * @param {string} tag - Tag-Name
 * @param {Object} attrs - Attribute (className, id, data-*, style, events)
 * @param {...(Node|string)} children - Kind-Elemente oder Text
 * @returns {HTMLElement}
 */
function createElement(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);

    // Attribute setzen
    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'className') {
            el.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            // Event-Handler: onClick -> click
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, value);
        } else if (key.startsWith('data-')) {
            el.setAttribute(key, value);
        } else if (value !== undefined && value !== null && value !== false) {
            el.setAttribute(key, value);
        }
    }

    // Kinder hinzufügen
    for (const child of children) {
        if (child === null || child === undefined) continue;

        if (typeof child === 'string' || typeof child === 'number') {
            el.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof Node) {
            el.appendChild(child);
        } else if (Array.isArray(child)) {
            child.forEach(c => {
                if (c instanceof Node) el.appendChild(c);
                else if (c !== null && c !== undefined) {
                    el.appendChild(document.createTextNode(String(c)));
                }
            });
        }
    }

    return el;
}

/**
 * Kurzform für createElement
 */
const el = createElement;

/**
 * Erstellt ein DocumentFragment aus mehreren Elementen
 * @param {...Node} children - Kind-Elemente
 * @returns {DocumentFragment}
 */
function createFragment(...children) {
    const fragment = document.createDocumentFragment();

    for (const child of children) {
        if (child === null || child === undefined) continue;

        if (Array.isArray(child)) {
            child.forEach(c => {
                if (c instanceof Node) fragment.appendChild(c);
            });
        } else if (child instanceof Node) {
            fragment.appendChild(child);
        }
    }

    return fragment;
}

// ============================================================
// BATCH DOM UPDATES
// ============================================================

/**
 * Führt DOM-Updates gebatcht aus für bessere Performance
 * @param {Function} updateFn - Funktion mit DOM-Updates
 */
function batchDOMUpdate(updateFn) {
    // requestAnimationFrame für nächsten Frame
    requestAnimationFrame(() => {
        updateFn();
    });
}

/**
 * Ersetzt Inhalt eines Containers effizient
 * @param {HTMLElement} container - Ziel-Container
 * @param {Node|Node[]|DocumentFragment} content - Neuer Inhalt
 */
function replaceContent(container, content) {
    // Leeren
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    // Neuen Inhalt hinzufügen
    if (content instanceof DocumentFragment || content instanceof Node) {
        container.appendChild(content);
    } else if (Array.isArray(content)) {
        const fragment = createFragment(...content);
        container.appendChild(fragment);
    }
}

/**
 * Aktualisiert eine Liste effizient (Diff-basiert)
 * @param {HTMLElement} container - Container-Element
 * @param {Array} items - Daten-Array
 * @param {string} keyAttr - Attribut für eindeutige ID
 * @param {Function} renderItem - Funktion zum Rendern eines Items
 */
function updateList(container, items, keyAttr, renderItem) {
    const existingMap = new Map();

    // Bestehende Elemente indexieren
    for (const child of container.children) {
        const key = child.getAttribute(keyAttr);
        if (key) existingMap.set(key, child);
    }

    const fragment = document.createDocumentFragment();
    const newKeys = new Set();

    // Items rendern
    for (const item of items) {
        const key = String(item.id);
        newKeys.add(key);

        if (existingMap.has(key)) {
            // Bestehendes Element wiederverwenden
            fragment.appendChild(existingMap.get(key));
        } else {
            // Neues Element erstellen
            const el = renderItem(item);
            if (el) {
                el.setAttribute(keyAttr, key);
                fragment.appendChild(el);
            }
        }
    }

    // Container aktualisieren
    replaceContent(container, fragment);
}

// ============================================================
// VIRTUAL RENDERING
// ============================================================

/**
 * Virtuelle Liste für große Datenmengen
 * (Umbenannt zu DOMVirtualList um Konflikt mit systems/spellslots/virtual-list.js zu vermeiden)
 */
class DOMVirtualList {
    constructor(container, options = {}) {
        this.container = container;
        this.items = [];
        this.itemHeight = options.itemHeight || 80;
        this.bufferSize = options.bufferSize || 5;
        this.renderItem = options.renderItem || (() => null);

        this.scrollTop = 0;
        this.visibleStart = 0;
        this.visibleEnd = 0;

        this._setupScroll();
    }

    _setupScroll() {
        // Scroll-Container
        this.scrollContainer = createElement('div', {
            className: 'virtual-scroll-container',
            style: { overflow: 'auto', height: '100%' }
        });

        // Spacer für korrektes Scrolling
        this.spacer = createElement('div', {
            className: 'virtual-scroll-spacer'
        });

        // Content-Container
        this.content = createElement('div', {
            className: 'virtual-scroll-content'
        });

        this.scrollContainer.appendChild(this.spacer);
        this.scrollContainer.appendChild(this.content);
        this.container.appendChild(this.scrollContainer);

        // Scroll-Handler with stored reference for cleanup
        this._scrollHandler = throttle(() => this._onScroll(), 16);
        this.scrollContainer.addEventListener('scroll', this._scrollHandler);
    }

    /**
     * Cleanup method to remove event listeners and prevent memory leaks
     */
    destroy() {
        if (this.scrollContainer && this._scrollHandler) {
            this.scrollContainer.removeEventListener('scroll', this._scrollHandler);
        }
        if (this.scrollContainer && this.scrollContainer.parentNode) {
            this.scrollContainer.parentNode.removeChild(this.scrollContainer);
        }
        this.container = null;
        this.scrollContainer = null;
        this.content = null;
        this.spacer = null;
        this.items = [];
        this._scrollHandler = null;
    }

    _onScroll() {
        this.scrollTop = this.scrollContainer.scrollTop;
        this._updateVisibleItems();
    }

    _updateVisibleItems() {
        const containerHeight = this.scrollContainer.clientHeight;
        const totalHeight = this.items.length * this.itemHeight;

        // Spacer-Höhe setzen
        this.spacer.style.height = `${totalHeight}px`;

        // Sichtbaren Bereich berechnen
        const start = Math.floor(this.scrollTop / this.itemHeight);
        const visibleCount = Math.ceil(containerHeight / this.itemHeight);

        this.visibleStart = Math.max(0, start - this.bufferSize);
        this.visibleEnd = Math.min(this.items.length, start + visibleCount + this.bufferSize);

        // Content positionieren
        this.content.style.transform = `translateY(${this.visibleStart * this.itemHeight}px)`;

        // Sichtbare Items rendern
        this._renderVisibleItems();
    }

    _renderVisibleItems() {
        const visibleItems = this.items.slice(this.visibleStart, this.visibleEnd);
        const fragment = createFragment(...visibleItems.map(item => this.renderItem(item)));
        replaceContent(this.content, fragment);
    }

    setItems(items) {
        this.items = items;
        this._updateVisibleItems();
    }

    refresh() {
        this._updateVisibleItems();
    }
}

// ============================================================
// NPC LIST RENDERER (OPTIMIERT)
// ============================================================

/**
 * Rendert eine NPC-Karte als DOM-Element
 * @param {Object} npc - NPC-Daten
 * @returns {HTMLElement}
 */
function renderNPCCard(npc) {
    const locationName =
        typeof EntityLookup !== 'undefined'
            ? EntityLookup.getName('locations', npc.locationId)
            : '—';

    const dialogCount = (npc.dialogs || []).length;
    const triggerCount = (npc.triggers || []).length;

    // Avatar
    const avatarContent = npc.avatar
        ? el('img', { src: npc.avatar, alt: '' })
        : document.createTextNode(npc.name ? npc.name.charAt(0).toUpperCase() : '?');

    const avatar = el('div', { className: 'npc-avatar' }, avatarContent);

    // Header
    const header = el(
        'div',
        { className: 'npc-header' },
        el('div', { className: 'npc-name' }, npc.name || 'Unbenannt'),
        el('div', { className: 'npc-role' }, npc.role || '')
    );

    // Meta-Info
    const meta = el(
        'div',
        { className: 'npc-meta' },
        locationName !== '—' ? el('span', {}, `📍 ${locationName}`) : null,
        dialogCount ? el('span', { title: 'Dialoge' }, `💬 ${dialogCount}`) : null,
        triggerCount ? el('span', { title: 'Trigger' }, `🔔 ${triggerCount}`) : null
    );

    // Actions
    const actions = el(
        'div',
        {
            className: 'npc-actions',
            'data-stop-propagation': 'true'
        },
        el(
            'button',
            {
                className: 'btn-icon',
                'data-action': 'edit-npc',
                'data-id': npc.id,
                title: 'Bearbeiten'
            },
            '✏️'
        ),
        el(
            'button',
            {
                className: 'btn-icon btn-danger',
                'data-action': 'delete-npc',
                'data-id': npc.id,
                title: 'Löschen'
            },
            '🗑️'
        )
    );

    // Karte zusammenbauen
    const card = el(
        'div',
        {
            className: 'npc-card',
            'data-action': 'toggle-npc-card',
            'data-id': npc.id
        },
        avatar,
        el('div', { className: 'npc-content' }, header, meta),
        actions
    );

    return card;
}

/**
 * Rendert NPC-Liste mit DocumentFragment
 * @param {HTMLElement} container - Container-Element
 * @param {Array} npcs - NPC-Array
 * @param {Object} options - Optionen
 */
function renderNPCListOptimized(container, npcs, options = {}) {
    if (!container) return;

    // Leere Liste
    if (!npcs || npcs.length === 0) {
        container.innerHTML =
            typeof renderEmptyState === 'function'
                ? renderEmptyState({
                      icon: '🎭',
                      titleEmpty: 'Keine NPCs',
                      descEmpty: 'Erstelle Nicht-Spieler-Charaktere für deine Welt.',
                      buttonText: '➕ NPC erstellen',
                      buttonAction: 'show-modal',
                      buttonValue: 'npc-modal'
                  })
                : '<p>Keine NPCs vorhanden</p>';
        return;
    }

    // Virtual List für viele NPCs
    if (npcs.length > 50 && options.useVirtualList !== false) {
        const virtualList = new DOMVirtualList(container, {
            itemHeight: 120,
            renderItem: renderNPCCard
        });
        virtualList.setItems(npcs);
        return;
    }

    // Standard-Rendering mit DocumentFragment
    const fragment = createFragment(...npcs.map(npc => renderNPCCard(npc)));

    // Container-Klasse setzen
    container.className = options.viewMode === 'list' ? 'list-view-container' : 'npc-grid';

    // Effizient ersetzen
    replaceContent(container, fragment);
}

// ============================================================
// EXPORTS (Global)
// ============================================================

// Für globalen Zugriff
if (typeof window !== 'undefined') {
    window.DOMBuilder = {
        createElement,
        el,
        createFragment,
        batchDOMUpdate,
        replaceContent,
        updateList,
        VirtualList: DOMVirtualList, // Alias für Kompatibilität
        DOMVirtualList,
        renderNPCCard,
        renderNPCListOptimized
    };
}
