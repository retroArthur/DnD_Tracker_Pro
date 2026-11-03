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
    /** Warum "Ersetzen" mit dieser Datei nicht geht (R6), sonst null. */
    idFehler?: string | null;
}
declare function showImportModal(dataType: string, vorbereitung: ReiterImportVorbereitung): void;
/** Undo-Hook des Reiter-Imports (R7): verwirft nach Strg+Z/Strg+Y ein Bearbeiten des Typs. */
declare function reiterImportNachUndo(info?: { action?: string; direction?: string; kennungen?: unknown[] }): void;
/** R3: was an der Form der Listen- und Objektfelder eines Eintrags nicht stimmt (REITER_FORMFELDER), sonst null. */
declare function reiterFormFehler(eintrag: Record<string, any>, dataType: string): string | null;
/** `text.replace(/\[\[(\w+):(\d+):([^\]]+)\]\]/g, ersetzen)` mit denselben Treffern in linearer Zeit. */
declare function reiterTextverweiseErsetzen(text: string, ersetzen: (ganz: string, typWort: string, idText: string, name: string) => string): string;
/** Ein Text aus der Datei, gekuerzt fuer eine Meldung (REITER_MELDUNG_TEXT_MAX). */
declare function reiterZitat(text: string): string;
/** R3: die Stelle eines Eintrags, dessen Eltern-Kette (REITER_ELTERNFELD) in der Datei im Kreis laeuft, sonst -1. */
declare function reiterElternKreis(eintraege: Record<string, any>[], feld: string): number;
/** R6: wohin die Verweise der Datei auf andere Bereiche nach dem Ersetzen zeigen — je Feld auf einen vorhandenen Eintrag, oder ins Leere. */
declare function reiterVerweiseDerDatei(typ: string, items: Record<string, any>[]): { treffer: { wort: string; n: number }[]; insLeere: number };
declare function updateIOCounts(): void;
declare function exportSpells(): void;
declare function importDataGlobal(): void;
declare function copyData(): void;
declare function clearStorage(): void;
//# sourceMappingURL=import-export.d.ts.map