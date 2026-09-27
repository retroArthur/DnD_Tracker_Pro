interface BackupData {
    timestamp: number;
    campaignKey: string;
    data: string;
    id?: string;
    kind?: 'auto' | 'safety';
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
declare const MAX_LS_BACKUPS_PER_CAMPAIGN: number;
declare const LS_BACKUP_BUDGET_CHARS: number;
declare const STORAGE_KEY: any;
declare function createAutoBackup(options?: {
    reason?: 'safety' | 'auto';
}): Promise<'written' | 'unchanged' | 'skipped-empty' | 'failed'>;
declare function saveBackupToIndexedDB(backup: BackupData): Promise<'written' | 'unchanged'>;
declare function knownBackupCampaignKeys(): Set<string> | null;
declare function pickLocalBackupEviction(
    list: BackupData[],
    backup: BackupData,
    known: Set<string> | null
): number;
declare function capOwnLocalBackups(list: BackupData[], backup: BackupData): BackupData[];
declare function writeLocalBackup(backup: BackupData): 'written' | 'unchanged' | 'failed';
declare function reportSafetyBackup(statusOrPromise: string | Promise<string>): Promise<string>;
declare function purgeCampaignBackups(key: string): Promise<{ success: boolean; error?: any }>;
declare function isBackupOfCampaign(b: any, key: string): boolean;
declare function isValidBackupRecord(b: any): b is BackupData;
declare function readLocalBackups(): BackupData[];
declare function readIndexedDbBackups(key: string): Promise<BackupData[]>;
declare function sortAndLimitBackups(list: BackupData[]): BackupData[];
declare function getBackups(): Promise<BackupData[]>;
declare function findBackupForRestore(
    backups: BackupData[],
    backupId: number | string,
    key: string
): { status: 'ok' | 'missing' | 'foreign'; backup: BackupData | null };
declare function reviveReferencedSoundBlobs(
    data: any
): Promise<{ missing: number; failed: number }>;
declare function applyRestoredCampaign(data: any, source: string): Promise<boolean>;
declare function restoreBackup(backupId: number): Promise<void>;
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