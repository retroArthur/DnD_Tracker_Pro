/**
 * Loot Distribution System
 * - Fair gold distribution across party
 * - Item assignment to characters
 * - Party treasure overview
 */
declare function showLootDistributionModal(): void;
declare function calculatePartyGold(): number;
declare function renderGoldSplit(amount: number, characters: any[]): string;
declare function renderDistributionCharacters(characters: any[]): string;
declare function updateGoldSplit(): void;
declare function getIncludedCharacters(): any[];
declare function applyGoldSplit(): void;
declare function collectAllGold(): void;
//# sourceMappingURL=loot-distribution.d.ts.map