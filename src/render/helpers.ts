// [SECTION:RENDER_HELPERS]
// ============================================================
// RENDER HELPER FUNCTIONS - @render @helper @component
// Wiederverwendbare Komponenten für Render-Funktionen
// ============================================================

import { $, esc } from '@utils/basic';
import { showToast, parseEntityId } from '@utils/utilities';

// ============================================================
// ERROR HANDLING UTILITIES
// ============================================================

/**
 * Error Log Entry
 */
interface ErrorLogEntry {
    time: Date;
    fn: string;
    error: Error;
    context: string;
    message: string;
    stack: string;
}

/**
 * Error-Handler Konfiguration
 */
const ErrorHandler = {
    /** Letzte Fehler */
    _errorLog: [] as ErrorLogEntry[],

    /** Maximale Anzahl gespeicherter Fehler */
    _maxErrors: 50,

    /** Ob Fehler in der Konsole geloggt werden */
    _consoleLog: true,

    /** Ob Toast bei Fehlern angezeigt wird */
    _showToast: true,

    /** Ob ins Debug-Log geschrieben wird */
    _debugLog: true,

    /**
     * Loggt einen Fehler
     */
    log(fnName: string, error: Error | unknown, context: string = ''): void {
        const err = error instanceof Error ? error : new Error(String(error));

        const entry: ErrorLogEntry = {
            time: new Date(),
            fn: fnName,
            error: err,
            context: context,
            message: err.message || String(error),
            stack: err.stack || ''
        };

        this._errorLog.unshift(entry);
        if (this._errorLog.length > this._maxErrors) {
            this._errorLog.pop();
        }

        if (this._consoleLog) {
            console.error(`[${fnName}]${context ? ` (${context})` : ''}:`, error);
        }

        // Ins Debug-Log schreiben wenn verfügbar
        const debugLogAdd = (window as any).debugLogAdd;
        if (this._debugLog && typeof debugLogAdd === 'function') {
            debugLogAdd(`⚠️ [${fnName}] ${context ? `(${context}) ` : ''}${entry.message}`);
        }
    },

    /**
     * Zeigt einen Fehler-Toast an (mit Debouncing)
     */
    _lastToastTime: 0,
    showError(message: string): void {
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
     */
    getRecentErrors(count: number = 10): ErrorLogEntry[] {
        return this._errorLog.slice(0, count);
    },

    /**
     * Leert das Error-Log
     */
    clearLog(): void {
        this._errorLog = [];
    }
};

/**
 * Safe Execute Options
 */
interface SafeExecuteOptions<T = any> {
    fallback?: T;
    showToast?: boolean;
    toastMessage?: string;
    onError?: (error: Error) => void;
}

/**
 * Wrapper für sichere Funktionsausführung
 */
export function safeExecute<T = any>(
    fn: () => T,
    fnName: string,
    options: SafeExecuteOptions<T> = {}
): T | null {
    const {
        fallback = null,
        showToast = false,
        toastMessage = null,
        onError = null
    } = options;

    try {
        return fn();
    } catch (error) {
        ErrorHandler.log(fnName, error as Error);

        if (showToast) {
            ErrorHandler.showError(toastMessage || `Fehler in ${fnName}`);
        }

        if (onError) {
            try {
                onError(error as Error);
            } catch (e) {
                console.error('Error in onError callback:', e);
            }
        }

        return fallback as T;
    }
}

/**
 * Safe Render Options
 */
interface SafeRenderOptions {
    showToastOnError?: boolean;
    toastMessage?: string;
    fallbackRender?: () => void;
    rethrowInDebug?: boolean;
}

/**
 * Wrapper für sichere Render-Funktionen
 * Zeigt einen Fehler-State im Container bei Fehlern
 */
export function safeRender(
    fn: () => any,
    fnName: string,
    containerId: string | HTMLElement | null = null,
    options: SafeRenderOptions = {}
): any {
    const {
        showToastOnError = false,
        toastMessage = 'Anzeige konnte nicht aktualisiert werden',
        fallbackRender = null,
        rethrowInDebug = true
    } = options;

    const APP_CONFIG = (window as any).APP_CONFIG;

    try {
        return fn();
    } catch (error) {
        ErrorHandler.log(fnName, error as Error, 'Render failure');

        // Show toast notification if requested
        if (showToastOnError) {
            showToast(`⚠️ ${toastMessage}`, 'error');
        }

        // Try fallback render function
        if (fallbackRender) {
            try {
                fallbackRender();
            } catch (fallbackError) {
                ErrorHandler.log(fnName, fallbackError as Error, 'Fallback render failed');
            }
        }

        // Versuche Fehler im Container anzuzeigen
        if (containerId) {
            const container = typeof containerId === 'string' ? $(containerId) : containerId;
            if (container) {
                const err = error as Error;
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1/-1;">
                        <div class="empty-state-icon">⚠️</div>
                        <div class="empty-state-title">Anzeigefehler</div>
                        <div class="empty-state-desc">Die Daten konnten nicht angezeigt werden.<br><small style="color:var(--text-dim);">${esc(err.message || 'Unbekannter Fehler')}</small></div>
                        <button class="btn" data-action="reload-page">🔄 Seite neu laden</button>
                    </div>
                `;
            }
        }

        // Re-throw in development mode for debugging
        if (rethrowInDebug && APP_CONFIG?.DEBUG_MODE) {
            throw error;
        }

        return undefined;
    }
}

// ============================================================
// ENTITY VALIDATION
// ============================================================

/**
 * Entity Schema Definition
 */
type EntitySchema = Record<string, any>;

/**
 * Validiert und repariert Entity-Daten
 */
export function validateEntity(entity: any, schema: EntitySchema): any {
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
export const ENTITY_SCHEMAS: Record<string, EntitySchema> = {
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
 * Data Integrity Validation Result
 */
interface ValidationResult {
    valid: boolean;
    repairs: string[];
}

/**
 * Validiert das gesamte Daten-Objekt D
 * Repariert korrupte Daten wo möglich
 */
export function validateDataIntegrity(): ValidationResult {
    const D = (window as any).D;
    const repairs: string[] = [];

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
    const nextId = (window as any).nextId;

    for (const [collection, schema] of [
        ['characters', ENTITY_SCHEMAS.character],
        ['npcs', ENTITY_SCHEMAS.npc],
        ['locations', ENTITY_SCHEMAS.location],
        ['quests', ENTITY_SCHEMAS.quest],
        ['spells', ENTITY_SCHEMAS.spell],
        ['loot', ENTITY_SCHEMAS.loot],
        ['shops', ENTITY_SCHEMAS.shop],
        ['encounters', ENTITY_SCHEMAS.encounter]
    ] as const) {
        if (!Array.isArray(D[collection])) continue;

        D[collection] = D[collection].filter((item: any, idx: number) => {
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

        const ids = new Set<number>();
        const duplicates: { idx: number; id: number }[] = [];

        D[collection].forEach((item: any, idx: number) => {
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

    // Validate _nextId consistency
    const validateAndRepairNextId = (window as any).validateAndRepairNextId;
    if (validateAndRepairNextId) {
        const nextIdValidation = validateAndRepairNextId();
        if (!nextIdValidation.valid) {
            repairs.push(...nextIdValidation.repairs);
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
export function repairDataArrays(): ValidationResult {
    const save = (window as any).save;
    const renderAll = (window as any).renderAll;

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
export function repairCharactersData(): void {
    const D = (window as any).D;
    const save = (window as any).save;
    const renderAll = (window as any).renderAll;

    if (!Array.isArray(D.characters)) {
        D.characters = [];
        showToast('🔧 D.characters repariert', 'success');
        save();
        renderAll();
    }
}

/**
 * Sichere JSON-Parse-Funktion
 */
export function safeJSONParse<T = any>(jsonString: string, fallback: T | null = null): T | null {
    if (!jsonString || typeof jsonString !== 'string') {
        return fallback;
    }

    try {
        return JSON.parse(jsonString) as T;
    } catch (error) {
        ErrorHandler.log('safeJSONParse', error as Error, jsonString.substring(0, 100));
        return fallback;
    }
}

/**
 * Sichere JSON-Stringify-Funktion
 */
export function safeJSONStringify(value: any, fallback: string = '{}'): string {
    try {
        return JSON.stringify(value);
    } catch (error) {
        ErrorHandler.log('safeJSONStringify', error as Error);
        return fallback;
    }
}

// ============================================================
// RENDER HELPERS
// ============================================================

/**
 * Empty State Config
 */
interface EmptyStateConfig {
    icon?: string;
    titleEmpty?: string;
    titleFiltered?: string;
    descEmpty?: string;
    descFiltered?: string;
    buttonText?: string | null;
    buttonAction?: string | null;
    buttonValue?: string | null;
    isFiltered?: boolean;
    gridSpan?: string;
}

/**
 * Rendert einen Empty-State für leere Listen
 */
export function renderEmptyState(config: EmptyStateConfig): string {
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
 */
export function updateCounters(counters: Record<string, number | string>): void {
    for (const [id, value] of Object.entries(counters)) {
        const el = $(id);
        if (el) el.textContent = String(value);
    }
}

/**
 * Filter Dropdown Config
 */
interface FilterDropdownConfig<T = any> {
    allLabel?: string;
    valueField?: string;
    labelField?: string;
    labelFn?: ((item: T) => string) | null;
    preserveValue?: boolean;
}

/**
 * Befüllt ein Filter-Dropdown mit Optionen
 */
export function populateFilterDropdown<T = any>(
    selectId: string,
    items: T[],
    config: FilterDropdownConfig<T> = {}
): boolean {
    const select = $(selectId) as HTMLSelectElement | null;
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
            const value = (item as any)[valueField];
            const label = labelFn ? labelFn(item) : esc((item as any)[labelField] || '');
            return `<option value="${value}">${label}</option>`;
        }).join('');

    if (preserveValue && currentValue) {
        select.value = currentValue;
    }

    return true;
}

// ============================================================
// ENTITY LOOKUP SYSTEM
// ============================================================

/**
 * Entity Type Union
 */
type EntityType = 'characters' | 'npcs' | 'locations' | 'quests' | 'spells' | 'loot' |
                  'encounters' | 'shops' | 'wiki' | 'sessionNotes' | 'filters' | 'links';

/**
 * Zentrales Entity-Lookup-System mit optionalem Caching
 * Vermeidet redundante Array.find()-Aufrufe
 */
export const EntityLookup = {
    /** Cache für Entity-Lookups */
    _cache: new Map<string, any>(),

    /** Ob Caching aktiviert ist */
    _cacheEnabled: false,

    /**
     * Aktiviert Caching für Performance bei vielen Lookups
     * Sollte vor Batch-Operationen aktiviert und danach deaktiviert werden
     */
    enableCache(): void {
        this._cacheEnabled = true;
    },

    /**
     * Deaktiviert und leert den Cache
     * Sollte nach Datenänderungen aufgerufen werden
     */
    clearCache(): void {
        this._cache.clear();
        this._cacheEnabled = false;
    },

    /**
     * Holt eine Entity aus der entsprechenden Collection
     */
    get(type: EntityType, id: number | string): any | null {
        const D = (window as any).D;
        const numId = parseEntityId(id);
        if (numId === null) return null;

        const key = `${type}-${numId}`;

        if (this._cacheEnabled && this._cache.has(key)) {
            return this._cache.get(key);
        }

        const collection = D[type];
        if (!Array.isArray(collection)) return null;

        const entity = collection.find((item: any) => item.id === numId) || null;

        if (this._cacheEnabled) {
            this._cache.set(key, entity);
        }

        return entity;
    },

    /**
     * Holt den Namen einer Entity
     */
    getName(type: EntityType, id: number | string, fallback: string = '—'): string {
        const entity = this.get(type, id);
        return entity?.name || entity?.title || fallback;
    },

    /**
     * Prüft ob eine Entity existiert
     */
    exists(type: EntityType, id: number | string): boolean {
        return this.get(type, id) !== null;
    },

    /**
     * Sucht Entity nach Name (case-insensitive)
     */
    findByName(type: EntityType, name: string, nameField: string = 'name'): any | null {
        const D = (window as any).D;

        if (!name || typeof name !== 'string') return null;
        const collection = D[type];
        if (!Array.isArray(collection)) return null;

        const lowerName = name.toLowerCase();
        return collection.find((item: any) => {
            const itemName = item[nameField];
            return itemName && itemName.toLowerCase() === lowerName;
        }) || null;
    },

    // Convenience-Methoden für häufige Entity-Typen
    location(id: number | string): any | null { return this.get('locations', id); },
    npc(id: number | string): any | null { return this.get('npcs', id); },
    character(id: number | string): any | null { return this.get('characters', id); },
    quest(id: number | string): any | null { return this.get('quests', id); },
    spell(id: number | string): any | null { return this.get('spells', id); },
    lootItem(id: number | string): any | null { return this.get('loot', id); },
    encounter(id: number | string): any | null { return this.get('encounters', id); },
    shop(id: number | string): any | null { return this.get('shops', id); },
    wiki(id: number | string): any | null { return this.get('wiki', id); },
    sessionNote(id: number | string): any | null { return this.get('sessionNotes', id); },
    filter(id: number | string): any | null { return this.get('filters', id); },
    link(id: number | string): any | null { return this.get('links', id); }
};

/**
 * Combat Entity Result
 */
interface CombatEntityResult {
    entity: any | null;
    ac: number | string;
    type: EntityType | null;
    id: number | null;
    notFound: boolean;
}

/**
 * Get comprehensive entity details for combat/display
 * Centralizes entity lookup pattern used across combat and rendering
 */
export function getEntityForCombat(
    entityType: string,
    entityName: string
): CombatEntityResult {
    let entity: any | null = null;
    let ac: number | string = '?';
    let type: EntityType | null = null;
    let id: number | null = null;

    if (entityType === 'player') {
        entity = EntityLookup.findByName('characters', entityName);
        if (entity) {
            ac = entity.ac || entity.armorClass || 10;
            type = 'characters';
            id = entity.id;
        }
    } else if (entityType === 'enemy') {
        // Check encounters first, then NPCs
        entity = EntityLookup.findByName('encounters', entityName);
        if (entity) {
            ac = entity.ac || entity.armorClass || 10;
            type = 'encounters';
            id = entity.id;
        } else {
            entity = EntityLookup.findByName('npcs', entityName);
            if (entity) {
                ac = entity.ac || 10;
                type = 'npcs';
                id = entity.id;
            }
        }
    } else if (entityType === 'ally') {
        entity = EntityLookup.findByName('npcs', entityName);
        if (entity) {
            ac = entity.ac || 10;
            type = 'npcs';
            id = entity.id;
        }
    }

    return {
        entity,
        ac,
        type,
        id,
        notFound: entity === null
    };
}

// ============================================================
// ENTITY LINKS
// ============================================================

/**
 * Entity Type Icon/Label Config
 */
interface EntityTypeInfo {
    icon: string;
    label: string;
}

/**
 * Entity-Typ-Konfiguration für Links
 */
export const ENTITY_TYPE_CONFIG: Record<string, EntityTypeInfo> = {
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
 * Entity Link Options
 */
interface EntityLinkOptions {
    icon?: string;
    showIcon?: boolean;
    fallbackColor?: string;
    className?: string;
}

/**
 * Rendert einen klickbaren Entity-Link
 */
export function renderEntityLink(
    type: string,
    id: number | string | null,
    label: string,
    options: EntityLinkOptions = {}
): string {
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
 */
export function renderEntityLinkList(
    type: string,
    ids: number[],
    options: EntityLinkOptions = {},
    maxShow: number = 5
): string {
    if (!ids?.length) return '';

    const visibleIds = ids.slice(0, maxShow);
    const hiddenCount = ids.length - maxShow;

    const links = visibleIds.map(id => {
        const entity = EntityLookup.get(type as EntityType, id);
        const name = entity?.name || entity?.title || `#${id}`;
        return renderEntityLink(type, id, name, options);
    }).join(' ');

    const moreIndicator = hiddenCount > 0
        ? `<span class="entity-link-more" style="color: var(--text-dim);">+${hiddenCount}</span>`
        : '';

    return links + moreIndicator;
}

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================

// Export to window for backward compatibility
(window as any).ErrorHandler = ErrorHandler;
(window as any).safeExecute = safeExecute;
(window as any).safeRender = safeRender;
(window as any).validateEntity = validateEntity;
(window as any).ENTITY_SCHEMAS = ENTITY_SCHEMAS;
(window as any).validateDataIntegrity = validateDataIntegrity;
(window as any).repairDataArrays = repairDataArrays;
(window as any).repairCharactersData = repairCharactersData;
(window as any).safeJSONParse = safeJSONParse;
(window as any).safeJSONStringify = safeJSONStringify;
(window as any).renderEmptyState = renderEmptyState;
(window as any).updateCounters = updateCounters;
(window as any).populateFilterDropdown = populateFilterDropdown;
(window as any).EntityLookup = EntityLookup;
(window as any).getEntityForCombat = getEntityForCombat;
(window as any).ENTITY_TYPE_CONFIG = ENTITY_TYPE_CONFIG;
(window as any).renderEntityLink = renderEntityLink;
(window as any).renderEntityLinkList = renderEntityLinkList;
