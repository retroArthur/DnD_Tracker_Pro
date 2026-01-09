declare let selectedEncounterId: number | null;
declare let currentEncFilter: string;
declare const ENC_ICONS: Record<string, string>;
interface SpeedParts {
    icon: string;
    label: string;
    value: string;
}
declare function formatEncSpeed(speed: any, html?: boolean): string;
declare function getEncounterIcon(enc: any): string;
declare function parseCR(cr: any): number;
interface DifficultyResult {
    level: string;
    label: string;
}
declare function getEncounterDifficulty(cr: any): DifficultyResult | null;
declare function renderEncounterItem(enc: any): string;
declare function selectEncounter(id: number | string, scroll?: boolean): void;
declare function showEncounterDetail(id: number | string): void;
declare function clearEncounterDetail(): void;
declare function setEncFilter(f: any): void;
declare function toggleEncounter(id: number | string): void;
declare function toggleEncounterCard(id: number | string): void;
declare function showEncForm(): void;
//# sourceMappingURL=encounters-render.d.ts.map