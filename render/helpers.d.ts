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
declare const ErrorHandler: {
    /** Letzte Fehler */
    _errorLog: ErrorLogEntry[];
    /** Maximale Anzahl gespeicherter Fehler */
    _maxErrors: number;
    /** Ob Fehler in der Konsole geloggt werden */
    _consoleLog: boolean;
    /** Ob Toast bei Fehlern angezeigt wird */
    _showToast: boolean;
    /** Ob ins Debug-Log geschrieben wird */
    _debugLog: boolean;
    /**
     * Loggt einen Fehler
     */
    log(fnName: string, error: Error | unknown, context?: string): void;
    /**
     * Zeigt einen Fehler-Toast an (mit Debouncing)
     */
    _lastToastTime: number;
    showError(message: string): void;
    /**
     * Gibt die letzten Fehler zurück
     */
    getRecentErrors(count?: number): ErrorLogEntry[];
    /**
     * Leert das Error-Log
     */
    clearLog(): void;
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
declare function safeExecute<T = any>(fn: () => T, fnName: string, options?: SafeExecuteOptions<T>): T | null;
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
declare function safeRender(fn: () => any, fnName: string, containerId?: string | HTMLElement | null, options?: SafeRenderOptions): any;
/**
 * Entity Schema Definition
 */
type EntitySchema = Record<string, any>;
/**
 * Validiert und repariert Entity-Daten
 */
declare function validateEntity(entity: any, schema: EntitySchema): any;
/**
 * Entity-Schemas für Validierung
 */
declare const ENTITY_SCHEMAS: Record<string, EntitySchema>;
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
declare function validateDataIntegrity(): ValidationResult;
/**
 * Repariert korrupte Daten-Arrays (aufrufbar vom UI)
 * Wird verwendet wenn Render-Funktionen korrupte Daten erkennen
 */
declare function repairDataArrays(): ValidationResult;
/**
 * Repariert spezifisch D.characters (Legacy-Funktion)
 */
declare function repairCharactersData(): void;
/**
 * Sichere JSON-Parse-Funktion
 */
declare function safeJSONParse<T = any>(jsonString: string, fallback?: T | null): T | null;
/**
 * Sichere JSON-Stringify-Funktion
 */
declare function safeJSONStringify(value: any, fallback?: string): string;
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
declare function renderEmptyState(config: EmptyStateConfig): string;
/**
 * Aktualisiert mehrere Counter-Elemente
 */
declare function updateCounters(counters: Record<string, number | string>): void;
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
declare function populateFilterDropdown<T = any>(selectId: string, items: T[], config?: FilterDropdownConfig<T>): boolean;
/**
 * Entity Type Union
 */
type EntityType = 'characters' | 'npcs' | 'locations' | 'quests' | 'spells' | 'loot' | 'encounters' | 'shops' | 'wiki' | 'sessionNotes' | 'filters' | 'links';
/**
 * Zentrales Entity-Lookup-System mit optionalem Caching
 * Vermeidet redundante Array.find()-Aufrufe
 */
declare const EntityLookup: {
    /** Cache für Entity-Lookups */
    _cache: Map<string, any>;
    /** Ob Caching aktiviert ist */
    _cacheEnabled: boolean;
    /**
     * Aktiviert Caching für Performance bei vielen Lookups
     * Sollte vor Batch-Operationen aktiviert und danach deaktiviert werden
     */
    enableCache(): void;
    /**
     * Deaktiviert und leert den Cache
     * Sollte nach Datenänderungen aufgerufen werden
     */
    clearCache(): void;
    /**
     * Holt eine Entity aus der entsprechenden Collection
     */
    get(type: EntityType, id: number | string): any | null;
    /**
     * Holt den Namen einer Entity
     */
    getName(type: EntityType, id: number | string, fallback?: string): string;
    /**
     * Prüft ob eine Entity existiert
     */
    exists(type: EntityType, id: number | string): boolean;
    /**
     * Sucht Entity nach Name (case-insensitive)
     */
    findByName(type: EntityType, name: string, nameField?: string): any | null;
    location(id: number | string): any | null;
    npc(id: number | string): any | null;
    character(id: number | string): any | null;
    quest(id: number | string): any | null;
    spell(id: number | string): any | null;
    lootItem(id: number | string): any | null;
    encounter(id: number | string): any | null;
    shop(id: number | string): any | null;
    wiki(id: number | string): any | null;
    sessionNote(id: number | string): any | null;
    filter(id: number | string): any | null;
    link(id: number | string): any | null;
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
declare function getEntityForCombat(entityType: string, entityName: string): CombatEntityResult;
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
declare const ENTITY_TYPE_CONFIG: Record<string, EntityTypeInfo>;
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
declare function renderEntityLink(type: string, id: number | string | null, label: string, options?: EntityLinkOptions): string;
/**
 * Rendert mehrere Entity-Links als Badges/Tags
 */
declare function renderEntityLinkList(type: string, ids: number[], options?: EntityLinkOptions, maxShow?: number): string;
//# sourceMappingURL=helpers.d.ts.map