declare const ErrorHandler: any;
declare const APP_CONFIG: any;
declare const EntityLookup: any;
interface XPThreshold {
    easy: number;
    medium: number;
    hard: number;
    deadly: number;
}
interface PartyMember {
    level: number;
    count: number;
}
interface Monster {
    cr: string;
    count: number;
    name: string;
}
interface MonsterFavorite {
    id: number;
    name: string;
    monsters: Monster[];
}
interface EncounterMultiplier {
    min: number;
    max: number;
    multiplier: number;
    label: string;
}
interface TerrainModifier {
    id: string;
    label: string;
    multiplier: number;
    icon: string;
    desc: string;
}
interface PartyThresholds {
    easy: number;
    medium: number;
    hard: number;
    deadly: number;
    totalPCs: number;
}
interface MonsterXP {
    baseXP: number;
    adjustedXP: number;
    finalXP: number;
    multiplier: number;
    totalMonsters: number;
    terrainMod: number;
    lairMod?: number;
    hasLair: boolean;
}
interface Difficulty {
    level: string;
    label: string;
    color: string;
    percentage: number;
}
declare const XP_THRESHOLDS: {
    [level: number]: XPThreshold;
};
declare const CR_TO_XP: {
    [cr: string]: number;
};
declare const ENCOUNTER_MULTIPLIERS: EncounterMultiplier[];
declare const TERRAIN_MODIFIERS: TerrainModifier[];
declare let calculatorParty: PartyMember[];
declare let calculatorMonsters: Monster[];
declare let calculatorTerrain: string;
declare let calculatorLairActions: boolean;
declare let calculatorTargetDifficulty: number;
declare const DIFFICULTY_LEVELS: string[];
declare const DIFFICULTY_LABELS: string[];
declare let monsterPreviewTimer: number | null;
declare function onBudgetSliderChange(value: string): void;
declare function updateBudgetDisplay(): void;
declare function applyBudgetTarget(): void;
declare function saveMonsterFavorite(): void;
declare function loadMonsterFavorite(id: number): void;
declare function deleteMonsterFavorite(id: number): void;
declare function toggleFavoritesDropdown(): void;
declare function closeFavoritesDropdown(): void;
declare function renderFavoritesDropdown(): void;
declare function addPartyLevel(): void;
declare function removePartyLevel(index: number): void;
declare function loadPartyFromCharacters(): void;
declare function clearParty(): void;
declare function addMonster(): void;
declare function removeMonster(index: number): void;
declare function clearMonsters(): void;
declare function updateMonsterPreview(): void;
declare function clearMonsterPreview(): void;
declare function scheduleMonsterPreview(): void;
declare function calculatePartyThresholds(): PartyThresholds;
declare function calculateMonsterXP(): MonsterXP;
declare function getDifficulty(adjustedXP: number, thresholds: PartyThresholds): Difficulty;
declare function getMultiplierExplanation(totalMonsters: number, partySize: number, multiplier: number): string;
declare function recalculateEncounter(): void;
declare function quickAdjustDifficulty(direction: string): void;
declare function calculateOptimalMonsterCount(targetDifficultyLevel: string): void;
declare function showDifficultySelector(): void;
declare function saveAsEncounter(): void;
declare function addCalculatorToInitiative(): void;
declare function getDefaultHPForCR(cr: string): number;
declare function renderCalculator(): void;
declare function showCalculatorModal(): void;
declare function hideCalculatorModal(): void;
declare function renderCalculatorModal(): void;
declare function setCalculatorTerrain(terrainId: string): void;
declare function toggleCalculatorLair(): void;
declare function showEncounterImport(): void;
declare function importEncounterMonsters(encId: number): void;
declare function renderEncounterCalculator(): void;
//# sourceMappingURL=encounter-calculator.d.ts.map