/**
 * D&D Tracker - Data Module (TypeScript)
 * Zentrale Datenstruktur und Typen
 * @module core/data
 * @version 2.7.0
 */

import type { AppData } from '../../types/entities';
import { APP_CONFIG } from './config';

// ============================================================
// CONSTANTS (Aliases für Rückwärtskompatibilität)
// ============================================================

export const STORAGE_KEY = APP_CONFIG.STORAGE_KEY;
export const BACKUP_KEY = APP_CONFIG.BACKUP_KEY;
export const CAMPAIGN_INDEX_KEY = APP_CONFIG.CAMPAIGN_INDEX_KEY;

// ============================================================
// DEFAULT DATA
// ============================================================

/**
 * Erstellt eine leere Datenstruktur
 */
export function createEmptyData(): AppData {
    return {
        characters: [],
        npcs: [],
        locations: [],
        quests: [],
        encounters: [],
        loot: [],
        spells: [],
        wiki: [],
        links: [],
        shops: [],
        mindmap: { nodes: [], connections: [] },
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        calendar: { day: 1, month: 0, year: 1492, events: [] },
        sessionNotes: [],
        quickNotes: '',
        tags: [],
        filters: [],
        settings: { theme: 'dark', lastView: 'dashboard' },
        _nextId: {}
    };
}

// ============================================================
// DATA VALIDATION
// ============================================================

/**
 * Validiert und repariert Datenstruktur
 */
export function validateData(data: Partial<AppData>): AppData {
    const defaults = createEmptyData();

    return {
        characters: Array.isArray(data.characters) ? data.characters : defaults.characters,
        npcs: Array.isArray(data.npcs) ? data.npcs : defaults.npcs,
        locations: Array.isArray(data.locations) ? data.locations : defaults.locations,
        quests: Array.isArray(data.quests) ? data.quests : defaults.quests,
        encounters: Array.isArray(data.encounters) ? data.encounters : defaults.encounters,
        loot: Array.isArray(data.loot) ? data.loot : defaults.loot,
        spells: Array.isArray(data.spells) ? data.spells : defaults.spells,
        wiki: Array.isArray(data.wiki) ? data.wiki : defaults.wiki,
        links: Array.isArray(data.links) ? data.links : defaults.links,
        shops: Array.isArray(data.shops) ? data.shops : defaults.shops,
        mindmap: data.mindmap ?? defaults.mindmap,
        initiative: data.initiative ?? defaults.initiative,
        calendar: data.calendar ?? defaults.calendar,
        sessionNotes: Array.isArray(data.sessionNotes) ? data.sessionNotes : defaults.sessionNotes,
        quickNotes: data.quickNotes ?? defaults.quickNotes,
        tags: Array.isArray(data.tags) ? data.tags : defaults.tags,
        filters: Array.isArray(data.filters) ? data.filters : defaults.filters,
        settings: data.settings ?? defaults.settings,
        _nextId: data._nextId ?? defaults._nextId
    };
}

// ============================================================
// DATA STATISTICS
// ============================================================

export interface DataStats {
    characters: number;
    npcs: number;
    locations: number;
    quests: number;
    encounters: number;
    loot: number;
    spells: number;
    wiki: number;
    total: number;
}

/**
 * Berechnet Statistiken über die Daten
 */
export function getDataStats(data: AppData): DataStats {
    const stats = {
        characters: data.characters?.length ?? 0,
        npcs: data.npcs?.length ?? 0,
        locations: data.locations?.length ?? 0,
        quests: data.quests?.length ?? 0,
        encounters: data.encounters?.length ?? 0,
        loot: data.loot?.length ?? 0,
        spells: data.spells?.length ?? 0,
        wiki: data.wiki?.length ?? 0,
        total: 0
    };

    stats.total =
        stats.characters +
        stats.npcs +
        stats.locations +
        stats.quests +
        stats.encounters +
        stats.loot +
        stats.spells +
        stats.wiki;

    return stats;
}

// ============================================================
// DATA SIZE
// ============================================================

/**
 * Berechnet die Größe der Daten in Bytes
 */
export function getDataSize(data: AppData): number {
    try {
        return JSON.stringify(data).length;
    } catch {
        return 0;
    }
}

/**
 * Formatiert Bytes als lesbare Größe
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
    STORAGE_KEY,
    BACKUP_KEY,
    CAMPAIGN_INDEX_KEY,
    createEmptyData,
    validateData,
    getDataStats,
    getDataSize,
    formatBytes
};
