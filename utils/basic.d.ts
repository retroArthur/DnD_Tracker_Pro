declare function $$(sel: string): NodeListOf<Element>;
declare function stripHtml(s: string | null | undefined): string;
declare function updateSearchClear(input: HTMLInputElement): void;
interface StorageResult {
    success: boolean;
    error?: string;
    original?: Error;
}
interface StorageInfo {
    usedBytes: number;
    usedMB: string;
    estimatedLimitMB: string;
    percentUsed: string;
}
declare const StorageAPI: {
    get(key: string, fallback?: any): any;
    set(key: string, value: string): StorageResult;
    remove(key: string): StorageResult;
    isAvailable(): boolean;
    getStorageInfo(): StorageInfo | null;
    getJSON<T = any>(key: string, fallback?: T | null): T | null;
    setJSON(key: string, obj: any): StorageResult;
    has(key: string): boolean;
    clear(): StorageResult;
};
//# sourceMappingURL=basic.d.ts.map