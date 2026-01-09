interface BackupData {
    timestamp: number;
    campaignKey: string;
    data: string;
    id?: string;
}
interface PerformanceMetrics {
    renderTimes: Array<{
        function: string;
        duration: number;
        timestamp: number;
    }>;
    saveTimes: number[];
    entityCounts: Record<string, number>;
    lastCheck: number;
}
interface PerformanceReport {
    entities: Record<string, number>;
    totalEntities: number;
    avgRenderTime: number;
    slowestRenders: Array<{
        function: string;
        duration: number;
        timestamp: number;
    }>;
}
declare const BACKUP_KEY: any;
declare const BACKUP_INTERVAL: any;
declare const MAX_BACKUPS: any;
declare const MAX_BACKUP_SIZE_MB: any;
declare const STORAGE_KEY: any;
declare function createAutoBackup(): Promise<void>;
declare function saveBackupToIndexedDB(backup: BackupData): Promise<void>;
declare function getBackups(): Promise<BackupData[]>;
/**
 * Validiert und bereinigt Backup-Daten gegen ein Standardschema
 * @param parsed - Die geparsten Backup-Daten
 * @param defaultSchema - Das Standardschema mit Defaultwerten
 * @returns Bereinigte Daten
 */
declare function sanitizeBackupData(parsed: any, defaultSchema: any): any;
declare function showBackupsModal(): Promise<void>;
declare let backupInterval: number | null;
declare function startAutoBackup(): void;
declare const performanceMetrics: PerformanceMetrics;
declare function initPerformanceMonitoring(): void;
declare function updateEntityCounts(): void;
declare function trackRenderTime(functionName: string, startTime: number): void;
declare function checkPerformance(): void;
declare function getPerformanceReport(): PerformanceReport;
//# sourceMappingURL=backups.d.ts.map