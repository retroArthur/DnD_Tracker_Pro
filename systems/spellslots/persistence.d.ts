declare let saveTimeout: number | null;
declare function saveToIndexedDBFallback(key: string, dataString: string): Promise<any>;
declare function loadFromIndexedDBFallback(key: string): Promise<string>;
declare const save: (showMessage?: boolean) => void;
//# sourceMappingURL=persistence.d.ts.map