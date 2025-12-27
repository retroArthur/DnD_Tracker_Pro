/**
 * D&D Tracker - Application Configuration (TypeScript)
 * @module core/config
 * @version 2.7.0
 */

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface AppConfig {
    // Version
    readonly VERSION: string;

    // Debug & Performance
    readonly DEBUG_MODE: boolean;
    readonly PERF_MODE: boolean;

    // Storage Keys
    readonly STORAGE_KEY: string;
    readonly BACKUP_KEY: string;
    readonly CAMPAIGN_INDEX_KEY: string;
    readonly THEME_KEY: string;
    readonly LAYOUT_KEY: string;

    // Limits
    readonly UNDO_LIMIT: number;
    readonly MAX_BACKUPS: number;
    readonly MAX_BACKUP_SIZE_MB: number;

    // Timing (in Millisekunden)
    readonly BACKUP_INTERVAL: number;
    readonly AUTOSAVE_DELAY: number;
    readonly TOAST_DURATION: number;
    readonly DEBOUNCE_DELAY: number;
    readonly THROTTLE_DELAY: number;

    // Performance
    readonly VIRTUAL_SCROLL_THRESHOLD: number;
    readonly LAZY_LOAD_THRESHOLD: string;

    // D&D Spezifisch
    readonly MAX_LEVEL: number;
    readonly ATTRIBUTE_MIN: number;
    readonly ATTRIBUTE_MAX: number;
}

// ============================================================
// CONFIGURATION
// ============================================================

/**
 * Zentrale Anwendungskonfiguration
 * Alle Werte sind readonly und zur Compile-Zeit unveränderlich
 */
export const APP_CONFIG: AppConfig = Object.freeze({
    // Version
    VERSION: '2.7.0',

    // Debug & Performance
    DEBUG_MODE: false,
    PERF_MODE: true,

    // Storage Keys
    STORAGE_KEY: 'dnd-tracker-v4',
    BACKUP_KEY: 'dnd-tracker-backups',
    CAMPAIGN_INDEX_KEY: 'dnd-tracker-campaigns',
    THEME_KEY: 'dnd-tracker-theme',
    LAYOUT_KEY: 'dnd-tracker-layout',

    // Limits
    UNDO_LIMIT: 30,
    MAX_BACKUPS: 5,
    MAX_BACKUP_SIZE_MB: 2,

    // Timing (in Millisekunden)
    BACKUP_INTERVAL: 5 * 60 * 1000, // 5 Minuten
    AUTOSAVE_DELAY: 1500,
    TOAST_DURATION: 2000,
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100,

    // Performance
    VIRTUAL_SCROLL_THRESHOLD: 50,
    LAZY_LOAD_THRESHOLD: '200px',

    // D&D Spezifisch
    MAX_LEVEL: 20,
    ATTRIBUTE_MIN: 1,
    ATTRIBUTE_MAX: 30
});

// ============================================================
// ENVIRONMENT DETECTION
// ============================================================

/**
 * Erkennt ob wir im Browser oder Node.js sind
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Erkennt ob wir in einer Development-Umgebung sind
 */
export const isDevelopment =
    APP_CONFIG.DEBUG_MODE || (isBrowser && window.location.hostname === 'localhost');

// ============================================================
// STORAGE KEY HELPERS
// ============================================================

/**
 * Generiert einen kampagnen-spezifischen Storage-Key
 */
export function getCampaignStorageKey(campaignId: string): string {
    return `${APP_CONFIG.STORAGE_KEY}-${campaignId}`;
}

/**
 * Generiert einen Key für Kampagnen-spezifische Backups
 */
export function getCampaignBackupKey(campaignId: string): string {
    return `${APP_CONFIG.BACKUP_KEY}-${campaignId}`;
}

// ============================================================
// TIMING HELPERS
// ============================================================

/**
 * Konvertiert Millisekunden in lesbare Zeit
 */
export function msToReadable(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Validiert ob ein Level gültig ist
 */
export function isValidLevel(level: number): boolean {
    return Number.isInteger(level) && level >= 1 && level <= APP_CONFIG.MAX_LEVEL;
}

/**
 * Validiert ob ein Attributwert gültig ist
 */
export function isValidAttribute(value: number): boolean {
    return (
        Number.isInteger(value) &&
        value >= APP_CONFIG.ATTRIBUTE_MIN &&
        value <= APP_CONFIG.ATTRIBUTE_MAX
    );
}

/**
 * Clampt einen Level auf gültige Werte
 */
export function clampLevel(level: number): number {
    return Math.min(Math.max(Math.floor(level), 1), APP_CONFIG.MAX_LEVEL);
}

/**
 * Clampt einen Attributwert auf gültige Werte
 */
export function clampAttribute(value: number): number {
    return Math.min(
        Math.max(Math.floor(value), APP_CONFIG.ATTRIBUTE_MIN),
        APP_CONFIG.ATTRIBUTE_MAX
    );
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default APP_CONFIG;
