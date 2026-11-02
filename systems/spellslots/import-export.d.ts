interface SchemaField {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    default?: any;
}
type IOSchema = Record<string, Record<string, SchemaField>>;
declare const IO_SCHEMA: IOSchema;
declare function exportToCSV(dataType: string): void;
/** Vorbereitete Datei des Reiter-Imports (REITERIMPORT), Inhalt des Fensters #import-modal. */
interface ReiterImportVorbereitung {
    dataType: string;
    items: Record<string, any>[];
    kampagne: string;
    exportDatum: string;
    hinweise: { text: string; warnung?: boolean }[];
}
declare function showImportModal(dataType: string, vorbereitung: ReiterImportVorbereitung): void;
declare function updateIOCounts(): void;
declare function exportSpells(): void;
declare function importDataGlobal(): void;
declare function copyData(): void;
declare function clearStorage(): void;
//# sourceMappingURL=import-export.d.ts.map