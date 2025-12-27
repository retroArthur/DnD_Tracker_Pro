/**
 * Testable Utilities (TypeScript)
 * Exportierbare Utility-Funktionen für Tests und Module
 * @module utils/testable-utils
 * @version 2.7.0
 */

// ============================================================
// TYPES
// ============================================================

export interface DiceNotation {
    count: number;
    sides: number;
    modifier: number;
}

export interface DataStore {
    _nextId: Record<string, number>;
    [key: string]: unknown;
}

// ============================================================
// HTML ESCAPING
// ============================================================

/**
 * Escaped HTML-Sonderzeichen
 * @param s - Zu escapender Wert
 * @returns Escapeter String
 */
export function esc(s: unknown): string {
    if (s === null || s === undefined) return '';
    if (s === 0) return '0';
    if (!s) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============================================================
// SANITIZATION
// ============================================================

/**
 * Entfernt gefährliche HTML-Elemente und Attribute
 * @param html - Zu bereinigendes HTML
 * @returns Bereinigtes HTML
 */
export function sanitizeHTML(html: string | null | undefined): string {
    if (!html) return '';

    // Entferne Script-Tags
    let clean = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

    // Entferne Event-Handler
    clean = clean.replace(/\s*on\w+\s*=\s*(['"])[^'"]*\1/gi, '');
    clean = clean.replace(/\s*on\w+\s*=[^\s>]*/gi, '');

    return clean;
}

// ============================================================
// ID GENERATION
// ============================================================

/**
 * Generiert eine neue ID für einen Entity-Typ
 * @param type - Entity-Typ
 * @param dataStore - Datenspeicher mit _nextId
 * @returns Neue ID
 */
export function nextId(type: string, dataStore: DataStore): number {
    if (!dataStore._nextId) dataStore._nextId = {};
    if (!dataStore._nextId[type]) {
        dataStore._nextId[type] = 0;
    }
    return ++dataStore._nextId[type];
}

// ============================================================
// D&D CALCULATIONS
// ============================================================

/**
 * Berechnet den Modifikator für einen Attributwert
 * @param score - Attributwert (1-30)
 * @returns Modifikator
 */
export function getModifier(score: number): number {
    return Math.floor((score - 10) / 2);
}

/**
 * Berechnet den Übungsbonus für eine Stufe
 * @param level - Charakterstufe (1-20)
 * @returns Übungsbonus (2-6)
 */
export function getProficiencyBonus(level: number): number {
    return Math.ceil(level / 4) + 1;
}

/**
 * Formatiert einen Modifikator mit Vorzeichen
 * @param mod - Modifikator
 * @returns Formatierter String (z.B. "+2", "-1")
 */
export function formatMod(mod: number): string {
    return mod >= 0 ? `+${mod}` : String(mod);
}

// ============================================================
// DICE PARSING
// ============================================================

/**
 * Parst eine Würfelnotation (z.B. "2d6+3")
 * @param notation - Würfelnotation
 * @returns Geparstes Ergebnis oder null
 */
export function parseDiceNotation(notation: string | null | undefined): DiceNotation | null {
    if (!notation) return null;
    const match = notation.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
    if (!match) return null;

    return {
        count: parseInt(match[1]) || 1,
        sides: parseInt(match[2]),
        modifier: parseInt(match[3]) || 0
    };
}

// ============================================================
// TIMING FUNCTIONS
// ============================================================

type AnyFunction = (...args: unknown[]) => unknown;

/**
 * Debounce - Verzögert Ausführung
 * @param fn - Funktion
 * @param delay - Verzögerung in ms
 * @returns Debounced Funktion
 */
export function debounce<T extends AnyFunction>(fn: T, delay: number = 300): T {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return function debounced(this: unknown, ...args: Parameters<T>) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    } as T;
}

/**
 * Throttle - Begrenzt Ausführungsrate
 * @param fn - Funktion
 * @param limit - Limit in ms
 * @returns Throttled Funktion
 */
export function throttle<T extends AnyFunction>(fn: T, limit: number = 100): T {
    let inThrottle = false;
    return function throttled(this: unknown, ...args: Parameters<T>) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    } as T;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Prüft ob ein Wert leer ist
 * @param value - Zu prüfender Wert
 * @returns true wenn leer
 */
export function isEmpty(value: unknown): boolean {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * Klemmt einen Wert zwischen min und max
 * @param value - Wert
 * @param min - Minimum
 * @param max - Maximum
 * @returns Geklemmter Wert
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Erstellt eine tiefe Kopie eines Objekts
 * @param obj - Zu klonendes Objekt
 * @returns Tiefe Kopie
 */
export function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
}

// ============================================================
// ADDITIONAL UTILITIES
// ============================================================

/**
 * Generiert eine UUID v4
 * @returns UUID String
 */
export function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Wartet eine bestimmte Zeit
 * @param ms - Wartezeit in Millisekunden
 * @returns Promise
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Formatiert ein Datum
 * @param date - Datum
 * @param locale - Locale (Standard: de-DE)
 * @returns Formatiertes Datum
 */
export function formatDate(date: Date | string | number, locale: string = 'de-DE'): string {
    try {
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return String(date);
    }
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
    esc,
    sanitizeHTML,
    nextId,
    getModifier,
    getProficiencyBonus,
    formatMod,
    parseDiceNotation,
    debounce,
    throttle,
    isEmpty,
    clamp,
    deepClone,
    generateUUID,
    sleep,
    formatDate
};
