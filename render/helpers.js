// [SECTION:RENDER_HELPERS]
// ============================================================
// RENDER HELPER FUNCTIONS - @render @helper @component
// Wiederverwendbare Komponenten für Render-Funktionen
// ============================================================

// ============================================================
// ERROR HANDLING UTILITIES
// ============================================================

/**
 * Error-Handler Konfiguration
 * @type {Object}
 */
const ErrorHandler = {
    /** @type {Array<{time: Date, fn: string, error: Error}>} Letzte Fehler */
    _errorLog: [],
    
    /** @type {number} Maximale Anzahl gespeicherter Fehler */
    _maxErrors: 50,
    
    /** @type {boolean} Ob Fehler in der Konsole geloggt werden */
    _consoleLog: true,
    
    /** @type {boolean} Ob Toast bei Fehlern angezeigt wird */
    _showToast: true,
    
    /** @type {boolean} Ob ins Debug-Log geschrieben wird */
    _debugLog: true,
    
    /**
     * Loggt einen Fehler
     * @param {string} fnName - Name der Funktion
     * @param {Error} error - Der Fehler
     * @param {string} [context] - Zusätzlicher Kontext
     */
    log(fnName, error, context = '') {
        const entry = {
            time: new Date(),
            fn: fnName,
            error: error,
            context: context,
            message: error?.message || String(error),
            stack: error?.stack || ''
        };
        
        this._errorLog.unshift(entry);
        if (this._errorLog.length > this._maxErrors) {
            this._errorLog.pop();
        }
        
        if (this._consoleLog) {
            console.error(`[${fnName}]${context ? ` (${context})` : ''}:`, error);
        }
        
        // Ins Debug-Log schreiben wenn verfügbar
        if (this._debugLog && typeof debugLogAdd === 'function') {
            debugLogAdd(`⚠️ [${fnName}] ${context ? `(${context}) ` : ''}${entry.message}`);
        }
    },
    
    /**
     * Zeigt einen Fehler-Toast an (mit Debouncing)
     * @param {string} message - Fehlermeldung
     */
    _lastToastTime: 0,
    showError(message) {
        if (!this._showToast) return;
        
        // Debounce: Maximal ein Toast alle 2 Sekunden
        const now = Date.now();
        if (now - this._lastToastTime < 2000) return;
        this._lastToastTime = now;
        
        if (typeof showToast === 'function') {
            showToast(`⚠️ ${message}`, 'error');
        }
    },
    
    /**
     * Gibt die letzten Fehler zurück
     * @param {number} [count=10] - Anzahl
     * @returns {Array}
     */
    getRecentErrors(count = 10) {
        return this._errorLog.slice(0, count);
    },
    
    /**
     * Leert das Error-Log
     */
    clearLog() {
        this._errorLog = [];
    }
};

/**
 * Wrapper für sichere Funktionsausführung
 * @param {Function} fn - Die auszuführende Funktion
 * @param {string} fnName - Name der Funktion (für Logging)
 * @param {Object} [options] - Optionen
 * @param {*} [options.fallback=null] - Rückgabewert bei Fehler
 * @param {boolean} [options.showToast=false] - Toast bei Fehler anzeigen
 * @param {string} [options.toastMessage] - Custom Toast-Nachricht
 * @param {Function} [options.onError] - Callback bei Fehler
 * @returns {*} Ergebnis der Funktion oder Fallback
 */
function safeExecute(fn, fnName, options = {}) {
    const {
        fallback = null,
        showToast = false,
        toastMessage = null,
        onError = null
    } = options;
    
    try {
        return fn();
    } catch (error) {
        ErrorHandler.log(fnName, error);
        
        if (showToast) {
            ErrorHandler.showError(toastMessage || `Fehler in ${fnName}`);
        }
        
        if (onError) {
            try {
                onError(error);
            } catch (e) {
                console.error('Error in onError callback:', e);
            }
        }
        
        return fallback;
    }
}

/**
 * Wrapper für sichere Render-Funktionen
 * Zeigt einen Fehler-State im Container bei Fehlern
 * @param {Function} fn - Die Render-Funktion
 * @param {string} fnName - Name der Funktion
 * @param {string|HTMLElement} [containerId] - Container für Fehler-Anzeige
 * @returns {*} Ergebnis oder undefined
 */
function safeRender(fn, fnName, containerId = null) {
    try {
        return fn();
    } catch (error) {
        ErrorHandler.log(fnName, error);
        
        // Versuche Fehler im Container anzuzeigen
        if (containerId) {
            const container = typeof containerId === 'string' ? $(containerId) : containerId;
            if (container) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1/-1;">
                        <div class="empty-state-icon">⚠️</div>
                        <div class="empty-state-title">Anzeigefehler</div>
                        <div class="empty-state-desc">Die Daten konnten nicht angezeigt werden.<br><small style="color:var(--text-dim);">${esc(error.message || 'Unbekannter Fehler')}</small></div>
                        <button class="btn" data-action="reload-page">🔄 Seite neu laden</button>
                    </div>
                `;
            }
        }
        
        return undefined;
    }
}

/**
 * Validiert und repariert Entity-Daten
 * @param {Object} entity - Die Entity
 * @param {Object} schema - Schema mit Defaults
 * @returns {Object} Reparierte Entity
 */
function validateEntity(entity, schema) {
    if (!entity || typeof entity !== 'object') {
        return { ...schema };
    }
    
    const result = { ...entity };
    
    for (const [key, defaultValue] of Object.entries(schema)) {
        if (result[key] === undefined || result[key] === null) {
            result[key] = defaultValue;
        } else if (Array.isArray(defaultValue) && !Array.isArray(result[key])) {
            // Sollte Array sein, ist aber keins
            result[key] = defaultValue;
        } else if (typeof defaultValue === 'number' && typeof result[key] !== 'number') {
            // Sollte Nummer sein
            result[key] = parseInt(result[key]) || defaultValue;
        }
    }
    
    return result;
}

/**
 * Entity-Schemas für Validierung
 */
const ENTITY_SCHEMAS = {
    character: {
        id: 0,
        name: 'Unbenannt',
        level: 1,
        hpMax: 10,
        hpCurrent: 10,
        ac: 10,
        spells: [],
        items: [],
        attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
    },
    npc: {
        id: 0,
        name: 'Unbenannt',
        role: '',
        description: '',
        dialogs: [],
        triggers: []
    },
    location: {
        id: 0,
        name: 'Unbenannt',
        description: ''
    },
    quest: {
        id: 0,
        title: 'Unbenannt',
        description: '',
        completed: false,
        tracked: false
    },
    spell: {
        id: 0,
        name: 'Unbenannt',
        level: 0,
        school: ''
    },
    loot: {
        id: 0,
        name: 'Unbenannt',
        quantity: 1,
        value: 0,
        category: 'misc'
    },
    shop: {
        id: 0,
        name: 'Unbenannt',
        type: 'general',
        items: []
    },
    encounter: {
        id: 0,
        name: 'Unbenannt',
        hp: 10,
        ac: 10
    }
};

/**
 * Validiert das gesamte Daten-Objekt D
 * Repariert korrupte Daten wo möglich
 * @returns {{valid: boolean, repairs: Array<string>}}
 */
function validateDataIntegrity() {
    const repairs = [];
    
    // Stelle sicher, dass D existiert
    if (typeof D !== 'object' || D === null) {
        console.error('Kritischer Fehler: D ist nicht definiert');
        return { valid: false, repairs: ['D war nicht definiert'] };
    }
    
    // Prüfe und initialisiere Arrays
    const requiredArrays = [
        'characters', 'npcs', 'locations', 'quests', 'spells', 
        'loot', 'shops', 'encounters', 'sessionNotes', 'wiki', 
        'links', 'filters', 'maps', 'timers'
    ];
    
    for (const key of requiredArrays) {
        if (!Array.isArray(D[key])) {
            D[key] = [];
            repairs.push(`${key} war kein Array, wurde initialisiert`);
        }
    }
    
    // Prüfe und initialisiere Objekte
    const requiredObjects = ['settings', 'campaign'];
    for (const key of requiredObjects) {
        if (typeof D[key] !== 'object' || D[key] === null) {
            D[key] = {};
            repairs.push(`${key} war kein Objekt, wurde initialisiert`);
        }
    }
    
    // Prüfe auf Entities ohne ID
    for (const [collection, schema] of [
        ['characters', ENTITY_SCHEMAS.character],
        ['npcs', ENTITY_SCHEMAS.npc],
        ['locations', ENTITY_SCHEMAS.location],
        ['quests', ENTITY_SCHEMAS.quest],
        ['spells', ENTITY_SCHEMAS.spell],
        ['loot', ENTITY_SCHEMAS.loot],
        ['shops', ENTITY_SCHEMAS.shop],
        ['encounters', ENTITY_SCHEMAS.encounter]
    ]) {
        if (!Array.isArray(D[collection])) continue;
        
        D[collection] = D[collection].filter((item, idx) => {
            if (!item || typeof item !== 'object') {
                repairs.push(`${collection}[${idx}] war ungültig, wurde entfernt`);
                return false;
            }
            
            // ID prüfen und ggf. generieren
            if (typeof item.id !== 'number' || isNaN(item.id)) {
                item.id = nextId(collection);
                repairs.push(`${collection}: ID für "${item.name || 'Unbenannt'}" generiert`);
            }
            
            return true;
        });
    }
    
    // Prüfe auf doppelte IDs
    for (const collection of requiredArrays) {
        if (!Array.isArray(D[collection])) continue;
        
        const ids = new Set();
        const duplicates = [];
        
        D[collection].forEach((item, idx) => {
            if (item && typeof item.id === 'number') {
                if (ids.has(item.id)) {
                    duplicates.push({ idx, id: item.id });
                }
                ids.add(item.id);
            }
        });
        
        // Korrigiere doppelte IDs
        for (const dup of duplicates) {
            const newId = nextId(collection);
            D[collection][dup.idx].id = newId;
            repairs.push(`${collection}: Doppelte ID ${dup.id} zu ${newId} geändert`);
        }
    }
    
    if (repairs.length > 0) {
        console.warn('Daten-Reparaturen durchgeführt:', repairs);
    }
    
    return { valid: repairs.length === 0, repairs };
}

/**
 * Repariert korrupte Daten-Arrays (aufrufbar vom UI)
 * Wird verwendet wenn Render-Funktionen korrupte Daten erkennen
 */
function repairDataArrays() {
    const result = validateDataIntegrity();
    
    if (result.repairs.length > 0) {
        showToast(`🔧 ${result.repairs.length} Reparaturen durchgeführt`, 'success');
        save();
        renderAll();
    } else {
        showToast('✅ Keine Reparaturen nötig', 'info');
    }
    
    return result;
}

/**
 * Repariert spezifisch D.characters (Legacy-Funktion)
 */
function repairCharactersData() {
    if (!Array.isArray(D.characters)) {
        D.characters = [];
        showToast('🔧 D.characters repariert', 'success');
        save();
        renderAll();
    }
}

/**
 * Sichere JSON-Parse-Funktion
 * @param {string} jsonString - JSON-String
 * @param {*} [fallback=null] - Fallback bei Fehler
 * @returns {*} Geparster Wert oder Fallback
 */
function safeJSONParse(jsonString, fallback = null) {
    if (!jsonString || typeof jsonString !== 'string') {
        return fallback;
    }
    
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        ErrorHandler.log('safeJSONParse', error, jsonString.substring(0, 100));
        return fallback;
    }
}

/**
 * Sichere JSON-Stringify-Funktion
 * @param {*} value - Zu stringifizierender Wert
 * @param {string} [fallback='{}'] - Fallback bei Fehler
 * @returns {string} JSON-String oder Fallback
 */
function safeJSONStringify(value, fallback = '{}') {
    try {
        return JSON.stringify(value);
    } catch (error) {
        ErrorHandler.log('safeJSONStringify', error);
        return fallback;
    }
}

/**
 * Rendert einen Empty-State für leere Listen
 * @param {Object} config - Konfiguration
 * @param {string} config.icon - Emoji-Icon (z.B. '🎭')
 * @param {string} config.titleEmpty - Titel wenn leer
 * @param {string} config.titleFiltered - Titel wenn gefiltert (optional)
 * @param {string} config.descEmpty - Beschreibung wenn leer
 * @param {string} config.descFiltered - Beschreibung wenn gefiltert (optional)
 * @param {string} [config.buttonText] - Button-Text (optional)
 * @param {string} [config.buttonAction] - data-action Wert
 * @param {string} [config.buttonValue] - data-value Wert
 * @param {boolean} [config.isFiltered=false] - Ob Filter aktiv sind
 * @param {string} [config.gridSpan='1/-1'] - CSS grid-column Wert
 * @returns {string} HTML-String
 */
function renderEmptyState(config) {
    const {
        icon = '📭',
        titleEmpty = 'Keine Einträge',
        titleFiltered = 'Keine Einträge gefunden',
        descEmpty = 'Erstelle einen neuen Eintrag.',
        descFiltered = 'Versuche andere Filteroptionen.',
        buttonText = null,
        buttonAction = null,
        buttonValue = null,
        isFiltered = false,
        gridSpan = '1/-1'
    } = config;
    
    const title = isFiltered ? titleFiltered : titleEmpty;
    const desc = isFiltered ? descFiltered : descEmpty;
    const showButton = !isFiltered && buttonText && buttonAction;
    
    return `
        <div class="empty-state" style="grid-column: ${gridSpan};">
            <div class="empty-state-icon">${icon}</div>
            <div class="empty-state-title">${title}</div>
            <div class="empty-state-desc">${desc}</div>
            ${showButton ? `
                <button class="btn btn-success" 
                    data-action="${buttonAction}" 
                    ${buttonValue ? `data-value="${buttonValue}"` : ''}
                    style="font-size: 1.1em; padding: 12px 24px;">
                    ${buttonText}
                </button>
            ` : ''}
        </div>
    `;
}

/**
 * Aktualisiert mehrere Counter-Elemente
 * @param {Object.<string, number|string>} counters - Map von Element-ID zu Wert
 * @example updateCounters({ 'npc-count': 42, 'quest-count': '5/10' })
 */
function updateCounters(counters) {
    for (const [id, value] of Object.entries(counters)) {
        const el = $(id);
        if (el) el.textContent = value;
    }
}

/**
 * Befüllt ein Filter-Dropdown mit Optionen
 * @param {string} selectId - ID des Select-Elements
 * @param {Array} items - Array von Objekten
 * @param {Object} [config] - Konfiguration
 * @param {string} [config.allLabel='Alle'] - Label für "Alle"-Option
 * @param {string} [config.valueField='id'] - Feld für option value
 * @param {string} [config.labelField='name'] - Feld für option label
 * @param {Function} [config.labelFn] - Custom Label-Funktion (item) => string
 * @param {boolean} [config.preserveValue=true] - Aktuellen Wert beibehalten
 * @returns {boolean} true wenn erfolgreich
 */
function populateFilterDropdown(selectId, items, config = {}) {
    const select = $(selectId);
    if (!select) return false;
    
    const {
        allLabel = 'Alle',
        valueField = 'id',
        labelField = 'name',
        labelFn = null,
        preserveValue = true
    } = config;
    
    const currentValue = preserveValue ? select.value : '';
    
    select.innerHTML = `<option value="">${allLabel}</option>` + 
        (items || []).map(item => {
            const value = item[valueField];
            const label = labelFn ? labelFn(item) : esc(item[labelField] || '');
            return `<option value="${value}">${label}</option>`;
        }).join('');
    
    if (preserveValue && currentValue) {
        select.value = currentValue;
    }
    
    return true;
}

/**
 * Zentrales Entity-Lookup-System mit optionalem Caching
 * Vermeidet redundante Array.find()-Aufrufe
 * @namespace EntityLookup
 */
const EntityLookup = {
    /** @type {Map<string, any>} Cache für Entity-Lookups */
    _cache: new Map(),
    
    /** @type {boolean} Ob Caching aktiviert ist */
    _cacheEnabled: false,
    
    /**
     * Aktiviert Caching für Performance bei vielen Lookups
     * Sollte vor Batch-Operationen aktiviert und danach deaktiviert werden
     */
    enableCache() {
        this._cacheEnabled = true;
    },
    
    /**
     * Deaktiviert und leert den Cache
     * Sollte nach Datenänderungen aufgerufen werden
     */
    clearCache() {
        this._cache.clear();
        this._cacheEnabled = false;
    },
    
    /**
     * Holt eine Entity aus der entsprechenden Collection
     * @param {string} type - Entity-Typ (npcs, locations, characters, quests, spells, loot, encounters, shops, wiki, sessionNotes, filters)
     * @param {number|string} id - Entity-ID
     * @returns {Object|null} Die gefundene Entity oder null
     */
    get(type, id) {
        if (id === null || id === undefined) return null;
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
        if (isNaN(numId)) return null;
        
        const key = `${type}-${numId}`;
        
        if (this._cacheEnabled && this._cache.has(key)) {
            return this._cache.get(key);
        }
        
        const collection = D[type];
        if (!Array.isArray(collection)) return null;
        
        const entity = collection.find(item => item.id === numId) || null;
        
        if (this._cacheEnabled) {
            this._cache.set(key, entity);
        }
        
        return entity;
    },
    
    /**
     * Holt den Namen einer Entity
     * @param {string} type - Entity-Typ
     * @param {number|string} id - Entity-ID
     * @param {string} [fallback='—'] - Fallback wenn nicht gefunden
     * @returns {string} Der Name oder Fallback
     */
    getName(type, id, fallback = '—') {
        const entity = this.get(type, id);
        return entity?.name || entity?.title || fallback;
    },
    
    /**
     * Prüft ob eine Entity existiert
     * @param {string} type - Entity-Typ
     * @param {number|string} id - Entity-ID
     * @returns {boolean}
     */
    exists(type, id) {
        return this.get(type, id) !== null;
    },
    
    /**
     * Sucht Entity nach Name (case-insensitive)
     * @param {string} type - Entity-Typ
     * @param {string} name - Zu suchender Name
     * @param {string} [nameField='name'] - Feldname für den Namen (z.B. 'title' für Quests)
     * @returns {Object|null} Die gefundene Entity oder null
     */
    findByName(type, name, nameField = 'name') {
        if (!name || typeof name !== 'string') return null;
        const collection = D[type];
        if (!Array.isArray(collection)) return null;
        
        const lowerName = name.toLowerCase();
        return collection.find(item => {
            const itemName = item[nameField];
            return itemName && itemName.toLowerCase() === lowerName;
        }) || null;
    },
    
    // Convenience-Methoden für häufige Entity-Typen
    location: function(id) { return this.get('locations', id); },
    npc: function(id) { return this.get('npcs', id); },
    character: function(id) { return this.get('characters', id); },
    quest: function(id) { return this.get('quests', id); },
    spell: function(id) { return this.get('spells', id); },
    lootItem: function(id) { return this.get('loot', id); },
    encounter: function(id) { return this.get('encounters', id); },
    shop: function(id) { return this.get('shops', id); },
    wiki: function(id) { return this.get('wiki', id); },
    sessionNote: function(id) { return this.get('sessionNotes', id); },
    filter: function(id) { return this.get('filters', id); },
    link: function(id) { return this.get('links', id); }
};

/**
 * Entity-Typ-Konfiguration für Links
 * @type {Object.<string, {icon: string, label: string}>}
 */
const ENTITY_TYPE_CONFIG = {
    npcs: { icon: '🎭', label: 'NPC' },
    locations: { icon: '📍', label: 'Ort' },
    characters: { icon: '👤', label: 'Charakter' },
    quests: { icon: '📜', label: 'Quest' },
    spells: { icon: '✨', label: 'Zauber' },
    loot: { icon: '📦', label: 'Gegenstand' },
    encounters: { icon: '👹', label: 'Gegner' },
    shops: { icon: '🏪', label: 'Shop' },
    wiki: { icon: '📖', label: 'Wiki' }
};

/**
 * Rendert einen klickbaren Entity-Link
 * @param {string} type - Entity-Typ (npcs, locations, etc.)
 * @param {number|string|null} id - Entity-ID (null = kein Link)
 * @param {string} label - Anzeigetext
 * @param {Object} [options] - Optionen
 * @param {string} [options.icon] - Custom Icon (sonst aus ENTITY_TYPE_CONFIG)
 * @param {boolean} [options.showIcon=true] - Icon anzeigen
 * @param {string} [options.fallbackColor='var(--gold)'] - Farbe wenn kein Link
 * @param {string} [options.className=''] - Zusätzliche CSS-Klasse
 * @returns {string} HTML-String
 */
function renderEntityLink(type, id, label, options = {}) {
    const {
        icon = ENTITY_TYPE_CONFIG[type]?.icon || '',
        showIcon = true,
        fallbackColor = 'var(--gold)',
        className = ''
    } = options;
    
    const iconHtml = showIcon && icon ? `${icon} ` : '';
    const escapedLabel = esc(label || '—');
    
    // Kein Link wenn keine ID
    if (!id) {
        return `<span style="color: ${fallbackColor};">${iconHtml}${escapedLabel}</span>`;
    }
    
    // Verwende data-action System für korrekte Event-Propagation
    return `<span class="entity-link clickable ${className}" 
        data-action="navigate-entity" 
        data-type="${type}" 
        data-id="${id}"
        title="Klicken für Details" 
        style="cursor: pointer;">
        ${iconHtml}${escapedLabel}
    </span>`;
}

/**
 * Rendert mehrere Entity-Links als Badges/Tags
 * @param {string} type - Entity-Typ
 * @param {Array<number>} ids - Array von Entity-IDs
 * @param {Object} [options] - Optionen für renderEntityLink
 * @param {number} [maxShow=5] - Maximale Anzahl angezeigter Links
 * @returns {string} HTML-String
 */
function renderEntityLinkList(type, ids, options = {}, maxShow = 5) {
    if (!ids?.length) return '';
    
    const visibleIds = ids.slice(0, maxShow);
    const hiddenCount = ids.length - maxShow;
    
    const links = visibleIds.map(id => {
        const entity = EntityLookup.get(type, id);
        const name = entity?.name || entity?.title || `#${id}`;
        return renderEntityLink(type, id, name, options);
    }).join(' ');
    
    const moreIndicator = hiddenCount > 0 
        ? `<span class="entity-link-more" style="color: var(--text-dim);">+${hiddenCount}</span>` 
        : '';
    
    return links + moreIndicator;
}