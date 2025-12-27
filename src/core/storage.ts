/**
 * D&D Tracker - Storage Service (TypeScript)
 * @module core/storage
 * @version 2.7.0
 */

import { APP_CONFIG } from './config';
import type { AppData } from '../../types/entities';

// ============================================================
// TYPES
// ============================================================

export interface StorageResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface BackupInfo {
    id: number;
    timestamp: string;
    size: number;
    characterCount: number;
    npcCount: number;
}

// ============================================================
// STORAGE SERVICE
// ============================================================

export class StorageService {
    private static undoStack: string[] = [];
    private static redoStack: string[] = [];

    // ============================================================
    // BASIC OPERATIONS
    // ============================================================

    /**
     * Save data to localStorage
     */
    static save(data: AppData): StorageResult<void> {
        try {
            const json = JSON.stringify(data);
            localStorage.setItem(APP_CONFIG.STORAGE_KEY, json);

            return { success: true };
        } catch (error) {
            console.error('[Storage] Save failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Load data from localStorage
     */
    static load(): StorageResult<AppData> {
        try {
            const json = localStorage.getItem(APP_CONFIG.STORAGE_KEY);

            if (!json) {
                return {
                    success: true,
                    data: this.getDefaultData()
                };
            }

            const data = JSON.parse(json) as AppData;
            const migrated = this.migrateData(data);

            return { success: true, data: migrated };
        } catch (error) {
            console.error('[Storage] Load failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Clear all data
     */
    static clear(): void {
        localStorage.removeItem(APP_CONFIG.STORAGE_KEY);
        this.undoStack = [];
        this.redoStack = [];
    }

    // ============================================================
    // UNDO / REDO
    // ============================================================

    /**
     * Push current state to undo stack
     */
    static pushUndo(data: AppData): void {
        const json = JSON.stringify(data);

        this.undoStack.push(json);
        this.redoStack = []; // Clear redo on new action

        // Limit stack size
        if (this.undoStack.length > APP_CONFIG.UNDO_LIMIT) {
            this.undoStack.shift();
        }
    }

    /**
     * Undo last action
     */
    static undo(currentData: AppData): StorageResult<AppData> {
        if (this.undoStack.length === 0) {
            return { success: false, error: 'Nothing to undo' };
        }

        // Save current state to redo
        this.redoStack.push(JSON.stringify(currentData));

        // Pop and restore
        const previousState = this.undoStack.pop()!;
        const data = JSON.parse(previousState) as AppData;

        return { success: true, data };
    }

    /**
     * Redo last undone action
     */
    static redo(currentData: AppData): StorageResult<AppData> {
        if (this.redoStack.length === 0) {
            return { success: false, error: 'Nothing to redo' };
        }

        // Save current state to undo
        this.undoStack.push(JSON.stringify(currentData));

        // Pop and restore
        const nextState = this.redoStack.pop()!;
        const data = JSON.parse(nextState) as AppData;

        return { success: true, data };
    }

    /**
     * Check if undo is available
     */
    static canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    /**
     * Check if redo is available
     */
    static canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    // ============================================================
    // BACKUPS
    // ============================================================

    /**
     * Create backup
     */
    static createBackup(data: AppData): StorageResult<BackupInfo> {
        try {
            const backupsJson = localStorage.getItem(APP_CONFIG.BACKUP_KEY);
            const backups: Array<{ id: number; timestamp: string; data: string }> = backupsJson
                ? JSON.parse(backupsJson)
                : [];

            const dataJson = JSON.stringify(data);
            const newBackup = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                data: dataJson
            };

            backups.unshift(newBackup);

            // Limit backups
            while (backups.length > APP_CONFIG.MAX_BACKUPS) {
                backups.pop();
            }

            localStorage.setItem(APP_CONFIG.BACKUP_KEY, JSON.stringify(backups));

            return {
                success: true,
                data: {
                    id: newBackup.id,
                    timestamp: newBackup.timestamp,
                    size: dataJson.length,
                    characterCount: data.characters?.length ?? 0,
                    npcCount: data.npcs?.length ?? 0
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Get all backups
     */
    static getBackups(): BackupInfo[] {
        try {
            const backupsJson = localStorage.getItem(APP_CONFIG.BACKUP_KEY);
            if (!backupsJson) return [];

            const backups = JSON.parse(backupsJson) as Array<{
                id: number;
                timestamp: string;
                data: string;
            }>;

            return backups.map(b => {
                const data = JSON.parse(b.data) as AppData;
                return {
                    id: b.id,
                    timestamp: b.timestamp,
                    size: b.data.length,
                    characterCount: data.characters?.length ?? 0,
                    npcCount: data.npcs?.length ?? 0
                };
            });
        } catch {
            return [];
        }
    }

    /**
     * Restore backup
     */
    static restoreBackup(id: number): StorageResult<AppData> {
        try {
            const backupsJson = localStorage.getItem(APP_CONFIG.BACKUP_KEY);
            if (!backupsJson) {
                return { success: false, error: 'No backups found' };
            }

            const backups = JSON.parse(backupsJson) as Array<{
                id: number;
                data: string;
            }>;

            const backup = backups.find(b => b.id === id);
            if (!backup) {
                return { success: false, error: 'Backup not found' };
            }

            const data = JSON.parse(backup.data) as AppData;
            return { success: true, data };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Delete backup
     */
    static deleteBackup(id: number): boolean {
        try {
            const backupsJson = localStorage.getItem(APP_CONFIG.BACKUP_KEY);
            if (!backupsJson) return false;

            const backups = JSON.parse(backupsJson) as Array<{ id: number }>;
            const filtered = backups.filter(b => b.id !== id);

            localStorage.setItem(APP_CONFIG.BACKUP_KEY, JSON.stringify(filtered));
            return true;
        } catch {
            return false;
        }
    }

    // ============================================================
    // EXPORT / IMPORT
    // ============================================================

    /**
     * Export data as JSON string
     */
    static exportJSON(data: AppData): string {
        return JSON.stringify(data, null, 2);
    }

    /**
     * Import data from JSON string
     */
    static importJSON(json: string): StorageResult<AppData> {
        try {
            const data = JSON.parse(json) as AppData;
            const migrated = this.migrateData(data);

            return { success: true, data: migrated };
        } catch {
            return {
                success: false,
                error: 'Invalid JSON format'
            };
        }
    }

    /**
     * Export data as downloadable file
     */
    static downloadExport(data: AppData, filename: string = 'dnd-tracker-export.json'): void {
        const json = this.exportJSON(data);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ============================================================
    // DATA MIGRATION
    // ============================================================

    /**
     * Migrate data from older versions
     */
    private static migrateData(data: Partial<AppData>): AppData {
        const migrated = { ...this.getDefaultData(), ...data };

        // Ensure arrays exist
        migrated.characters = migrated.characters ?? [];
        migrated.npcs = migrated.npcs ?? [];
        migrated.locations = migrated.locations ?? [];
        migrated.quests = migrated.quests ?? [];
        migrated.encounters = migrated.encounters ?? [];
        migrated.loot = migrated.loot ?? [];
        migrated.spells = migrated.spells ?? [];
        migrated.wiki = migrated.wiki ?? [];
        migrated.links = migrated.links ?? [];
        migrated.tags = migrated.tags ?? [];
        migrated.filters = migrated.filters ?? [];
        migrated.sessionNotes = migrated.sessionNotes ?? [];

        // Ensure objects exist
        migrated.mindmap = migrated.mindmap ?? { nodes: [], connections: [] };
        migrated.initiative = migrated.initiative ?? { combatants: [], currentTurn: 0, round: 1 };
        migrated.calendar = migrated.calendar ?? { day: 1, month: 0, year: 1492, events: [] };
        migrated.settings = migrated.settings ?? { theme: 'dark', lastView: 'dashboard' };
        migrated._nextId = migrated._nextId ?? {};

        return migrated;
    }

    // ============================================================
    // DEFAULT DATA
    // ============================================================

    /**
     * Get default empty data structure
     */
    static getDefaultData(): AppData {
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
    // STORAGE INFO
    // ============================================================

    /**
     * Get storage usage info
     */
    static getStorageInfo(): {
        used: number;
        available: number;
        percentage: number;
    } {
        let used = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key);
                if (value) {
                    used += key.length + value.length;
                }
            }
        }

        // Estimate available (typically 5-10 MB)
        const available = 5 * 1024 * 1024; // 5 MB

        return {
            used,
            available,
            percentage: Math.round((used / available) * 100)
        };
    }
}

// ============================================================
// EXPORT
// ============================================================

export default StorageService;
